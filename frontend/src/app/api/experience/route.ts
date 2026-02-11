import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { translateFields } from '@/lib/deepl';

const experienceSchema = z.object({
  type: z.enum(['WORK', 'EDUCATION', 'CERTIFICATION', 'VOLUNTEER']),
  title: z.string().min(1, 'Title is required'),
  organization: z.string().min(1, 'Organization is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  cause: z.string().optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  logo: z.string().optional().or(z.literal('')),
  order: z.number().optional(),
  media: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    order: z.number().optional(),
  })).optional(),
});

const includeMedia = { media: { orderBy: { order: 'asc' as const } } };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (id) {
      const experience = await prisma.experience.findUnique({
        where: { id },
        include: includeMedia,
      });

      if (!experience) {
        return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
      }

      return NextResponse.json(experience);
    }

    const where = type ? { type: type as 'WORK' | 'EDUCATION' | 'CERTIFICATION' | 'VOLUNTEER' } : {};

    const experiences = await prisma.experience.findMany({
      where,
      include: includeMedia,
      orderBy: [{ order: 'asc' }, { startDate: 'desc' }],
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error('Error fetching experience:', error);
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validatedData = experienceSchema.parse(body);

    const experience = await prisma.experience.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        organization: validatedData.organization,
        description: validatedData.description || null,
        location: validatedData.location || null,
        jobType: validatedData.jobType || null,
        cause: validatedData.cause || null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        credentialId: validatedData.credentialId || null,
        credentialUrl: validatedData.credentialUrl || null,
        skills: validatedData.skills || [],
        logo: validatedData.logo || null,
        order: validatedData.order ?? 0,
        media: validatedData.media ? {
          create: validatedData.media.map((m, i) => ({
            url: m.url,
            caption: m.caption || null,
            order: m.order ?? i,
          })),
        } : undefined,
      },
      include: includeMedia,
    });

    // Auto-translate text fields to French
    try {
      const translated = await translateFields({
        title: validatedData.title,
        organization: validatedData.organization,
        description: validatedData.description,
        location: validatedData.location,
        jobType: validatedData.jobType,
        cause: validatedData.cause,
      });
      if (Object.keys(translated).length > 0) {
        await prisma.experience.update({
          where: { id: experience.id },
          data: translated,
        });
      }
    } catch {}

    // Translate media captions
    try {
      for (const media of experience.media) {
        if (media.caption) {
          const captionTranslated = await translateFields({ caption: media.caption });
          if (captionTranslated.captionFr) {
            await prisma.experienceMedia.update({
              where: { id: media.id },
              data: { captionFr: captionTranslated.captionFr },
            });
          }
        }
      }
    } catch {}

    // Re-fetch with translations applied
    const result = await prisma.experience.findUnique({
      where: { id: experience.id },
      include: includeMedia,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating experience:', error);
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 });
    }

    const validatedData = experienceSchema.partial().parse(data);

    const existing = await prisma.experience.findUnique({
      where: { id },
      include: includeMedia,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Update main record
    const experience = await prisma.experience.update({
      where: { id },
      data: {
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.organization !== undefined && { organization: validatedData.organization }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.location !== undefined && { location: validatedData.location || null }),
        ...(validatedData.jobType !== undefined && { jobType: validatedData.jobType || null }),
        ...(validatedData.cause !== undefined && { cause: validatedData.cause || null }),
        ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate ? new Date(validatedData.startDate) : null }),
        ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate ? new Date(validatedData.endDate) : null }),
        ...(validatedData.credentialId !== undefined && { credentialId: validatedData.credentialId || null }),
        ...(validatedData.credentialUrl !== undefined && { credentialUrl: validatedData.credentialUrl || null }),
        ...(validatedData.skills !== undefined && { skills: validatedData.skills }),
        ...(validatedData.logo !== undefined && { logo: validatedData.logo || null }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
      },
      include: includeMedia,
    });

    // Replace media if provided
    if (validatedData.media !== undefined) {
      await prisma.experienceMedia.deleteMany({ where: { experienceId: id } });

      if (validatedData.media.length > 0) {
        await prisma.experienceMedia.createMany({
          data: validatedData.media.map((m, i) => ({
            experienceId: id,
            url: m.url,
            caption: m.caption || null,
            order: m.order ?? i,
          })),
        });

        // Translate new captions
        try {
          const newMedia = await prisma.experienceMedia.findMany({
            where: { experienceId: id },
            orderBy: { order: 'asc' },
          });
          for (const media of newMedia) {
            if (media.caption) {
              const captionTranslated = await translateFields({ caption: media.caption });
              if (captionTranslated.captionFr) {
                await prisma.experienceMedia.update({
                  where: { id: media.id },
                  data: { captionFr: captionTranslated.captionFr },
                });
              }
            }
          }
        } catch {}
      }
    }

    // Only translate fields that actually changed
    const fieldsToTranslate: Record<string, string | null | undefined> = {};
    if (validatedData.title && validatedData.title !== existing.title) fieldsToTranslate.title = validatedData.title;
    if (validatedData.organization && validatedData.organization !== existing.organization) fieldsToTranslate.organization = validatedData.organization;
    if (validatedData.description !== undefined && validatedData.description !== (existing.description ?? '')) fieldsToTranslate.description = validatedData.description;
    if (validatedData.location !== undefined && validatedData.location !== (existing.location ?? '')) fieldsToTranslate.location = validatedData.location;
    if (validatedData.jobType !== undefined && validatedData.jobType !== (existing.jobType ?? '')) fieldsToTranslate.jobType = validatedData.jobType;
    if (validatedData.cause !== undefined && validatedData.cause !== (existing.cause ?? '')) fieldsToTranslate.cause = validatedData.cause;

    if (Object.keys(fieldsToTranslate).length > 0) {
      try {
        const translated = await translateFields(fieldsToTranslate);
        if (Object.keys(translated).length > 0) {
          await prisma.experience.update({
            where: { id },
            data: translated,
          });
        }
      } catch {}
    }

    // Re-fetch final state
    const result = await prisma.experience.findUnique({
      where: { id },
      include: includeMedia,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating experience:', error);
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 });
    }

    const existing = await prisma.experience.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    await prisma.experience.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
