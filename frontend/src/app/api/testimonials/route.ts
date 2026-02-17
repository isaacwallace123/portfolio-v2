import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/shared/lib/rate-limiter';
import { checkSpam, stripSpamFields } from '@/shared/lib/spam-prevention';

const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  avatar: z.string().min(1).optional().or(z.literal('')),
  linkedin: z
    .string()
    .url('Must be a valid URL')
    .refine((v) => /^https?:\/\/(www\.)?linkedin\.com\//.test(v), 'Must be a LinkedIn URL')
    .optional()
    .or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5')
    .refine((v) => v % 0.5 === 0, 'Rating must be in 0.5 increments'),
});

const updateSchema = testimonialSchema.partial().extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// GET is public — fetches approved testimonials for homepage
// Admin can pass ?all=true to fetch all testimonials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    if (all === 'true') {
      await requireAdmin();
      const testimonials = await prisma.testimonial.findMany({
        orderBy: [{ createdAt: 'desc' }],
      });
      return NextResponse.json(testimonials);
    }

    const testimonials = await prisma.testimonial.findMany({
      where: { status: 'approved' },
      orderBy: [{ createdAt: 'desc' }],
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// POST is public — anyone can submit a testimonial
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.TESTIMONIAL, 'testimonial');
    if (rateLimit.limited) return rateLimit.response;

    const body = await request.json();

    // Spam checks
    const spamCheck = checkSpam(body);
    if (spamCheck.isSpam) return spamCheck.response;

    // Clean spam fields
    const cleanedBody = stripSpamFields(body);

    const data = testimonialSchema.parse(cleanedBody);

    const testimonial = await prisma.testimonial.create({
      data: {
        ...data,
        avatar: data.avatar || null,
        linkedin: data.linkedin || null,
        status: 'pending',
      },
    });
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}

// PUT is admin-only — approve/reject/edit testimonials
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    const validated = updateSchema.parse(data);

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

// DELETE is admin-only
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}
