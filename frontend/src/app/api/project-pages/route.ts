import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const pageSchema = z.object({
  projectId: z.string(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  content: z.string(),
  order: z.number().optional(),
  isStartPage: z.boolean().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const pageId = searchParams.get('pageId');
    const slug = searchParams.get('slug');

    if (pageId) {
      const page = await prisma.projectPage.findUnique({
        where: { id: pageId },
        include: {
          outgoingConnections: {
            include: {
              targetPage: true,
            },
          },
          incomingConnections: {
            include: {
              sourcePage: true,
            },
          },
        },
      });

      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      return NextResponse.json(page);
    }

    if (projectId && slug) {
      const page = await prisma.projectPage.findUnique({
        where: {
          projectId_slug: {
            projectId,
            slug,
          },
        },
        include: {
          outgoingConnections: {
            include: {
              targetPage: true,
            },
          },
          incomingConnections: {
            include: {
              sourcePage: true,
            },
          },
        },
      });

      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      return NextResponse.json(page);
    }

    if (projectId) {
      const pages = await prisma.projectPage.findMany({
        where: { projectId },
        include: {
          outgoingConnections: {
            include: {
              targetPage: true,
            },
          },
          incomingConnections: {
            include: {
              sourcePage: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return NextResponse.json(pages);
    }

    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validatedData = pageSchema.parse(body);

    const existing = await prisma.projectPage.findUnique({
      where: {
        projectId_slug: {
          projectId: validatedData.projectId,
          slug: validatedData.slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A page with this slug already exists in this project' },
        { status: 400 }
      );
    }

    const pageCount = await prisma.projectPage.count({
      where: { projectId: validatedData.projectId },
    });

    const page = await prisma.projectPage.create({
      data: {
        ...validatedData,
        isStartPage: pageCount === 0 ? true : validatedData.isStartPage || false,
      },
      include: {
        outgoingConnections: {
          include: {
            targetPage: true,
          },
        },
        incomingConnections: {
          include: {
            sourcePage: true,
          },
        },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const validatedData = pageSchema.partial().parse(data);

    if (validatedData.isStartPage) {
      const page = await prisma.projectPage.findUnique({ where: { id } });
      if (page) {
        await prisma.projectPage.updateMany({
          where: {
            projectId: page.projectId,
            isStartPage: true,
            id: { not: id },
          },
          data: { isStartPage: false },
        });
      }
    }

    const updatedPage = await prisma.projectPage.update({
      where: { id },
      data: validatedData,
      include: {
        outgoingConnections: {
          include: {
            targetPage: true,
          },
        },
        incomingConnections: {
          include: {
            sourcePage: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const page = await prisma.projectPage.findUnique({ where: { id } });
    
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.isStartPage) {
      return NextResponse.json(
        { error: 'Cannot delete the start page' },
        { status: 400 }
      );
    }

    await prisma.projectPage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}