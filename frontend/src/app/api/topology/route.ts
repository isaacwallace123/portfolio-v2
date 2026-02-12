import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saveSchema = z.object({
  server: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
  nodes: z.array(z.object({
    id: z.string().optional(),
    containerId: z.string().min(1),
    containerName: z.string().min(1),
    icon: z.string().nullable().optional(),
    positionX: z.number(),
    positionY: z.number(),
    visible: z.boolean(),
    order: z.number(),
    nodeType: z.string().default('container'),
    infrastructureType: z.string().nullable().optional(),
  })),
  connections: z.array(z.object({
    id: z.string().optional(),
    sourceId: z.string().min(1),
    targetId: z.string().min(1),
    label: z.string().nullable().optional(),
    animated: z.boolean().optional(),
  })),
});

// GET - Public: fetch topology for the homelab page
export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      include: {
        nodes: {
          where: { visible: true },
          include: {
            outgoing: true,
            incoming: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error fetching topology:', error);
    return NextResponse.json({ error: 'Failed to fetch topology' }, { status: 500 });
  }
}

// POST - Admin: save full topology (server + nodes + connections)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = saveSchema.parse(body);

    // Upsert server
    const server = data.server.id
      ? await prisma.server.update({
          where: { id: data.server.id },
          data: {
            name: data.server.name,
            type: data.server.type,
            description: data.server.description || null,
            icon: data.server.icon || null,
          },
        })
      : await prisma.server.create({
          data: {
            name: data.server.name,
            type: data.server.type,
            description: data.server.description || null,
            icon: data.server.icon || null,
          },
        });

    // Delete existing nodes & connections for this server (cascade)
    await prisma.topologyNode.deleteMany({ where: { serverId: server.id } });

    // Create nodes
    const nodeIdMap = new Map<string, string>(); // temp ID → real ID
    for (const node of data.nodes) {
      const created = await prisma.topologyNode.create({
        data: {
          serverId: server.id,
          containerId: node.containerId,
          containerName: node.containerName,
          icon: node.icon || null,
          positionX: node.positionX,
          positionY: node.positionY,
          visible: node.visible,
          order: node.order,
          nodeType: node.nodeType || 'container',
          infrastructureType: node.infrastructureType || null,
        },
      });
      nodeIdMap.set(node.id || node.containerId, created.id);
      nodeIdMap.set(node.containerName, created.id);
    }

    // Create connections (resolve temp IDs)
    for (const conn of data.connections) {
      const sourceId = nodeIdMap.get(conn.sourceId) || conn.sourceId;
      const targetId = nodeIdMap.get(conn.targetId) || conn.targetId;

      // Verify both nodes exist
      const sourceExists = await prisma.topologyNode.findUnique({ where: { id: sourceId } });
      const targetExists = await prisma.topologyNode.findUnique({ where: { id: targetId } });
      if (!sourceExists || !targetExists) continue;

      await prisma.topologyConnection.create({
        data: {
          sourceId,
          targetId,
          label: conn.label || null,
          animated: conn.animated ?? true,
        },
      });
    }

    // Return full updated topology
    const result = await prisma.server.findUnique({
      where: { id: server.id },
      include: {
        nodes: {
          include: { outgoing: true, incoming: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error saving topology:', error);
    return NextResponse.json({ error: 'Failed to save topology' }, { status: 500 });
  }
}

// DELETE - Admin: delete a server (cascades nodes + connections)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    await prisma.server.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 });
  }
}
