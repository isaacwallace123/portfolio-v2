'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ProjectPage, PageConnection } from '../lib/types';
import { PageNode } from './PageNode';

interface ProjectFlowchartProps {
  projectId: string;
  pages: ProjectPage[];
  connections: PageConnection[];
  onPageCreate: () => void;
  onPageEdit: (pageId: string) => void;
  onPageDelete: (pageId: string) => void;
  onSavePositions: (pages: { id: string; position: { x: number; y: number } }[]) => void;
  onConnectionCreate: (sourceId: string, targetId: string) => void;
  onConnectionDelete: (connectionId: string) => void;
}

const BOUNDS: [[number, number], [number, number]] = [
  [-1500, -1500],
  [1500, 1500],
];

const nodeTypes: NodeTypes = {
  pageNode: PageNode,
};

export function ProjectFlowchart({
  pages,
  connections,
  onPageCreate,
  onPageEdit,
  onPageDelete,
  onSavePositions,
  onConnectionCreate,
  onConnectionDelete,
}: ProjectFlowchartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesState] = useEdgesState([]);
  const initializedRef = useRef(false);

  // Convert pages to nodes - only on initial load or when pages array length changes
  useEffect(() => {
    // Only reinitialize if:
    // 1. First time loading (not initialized)
    // 2. Number of pages changed (page added/deleted)
    const shouldReinitialize = !initializedRef.current || nodes.length !== pages.length;
    
    if (shouldReinitialize) {
      const flowNodes: Node[] = pages.map((page) => {
        // Check if we already have this node with a position
        const existingNode = nodes.find(n => n.id === page.id);
        
        let position = { x: Math.random() * 400, y: Math.random() * 400 };
        
        // Priority: 1. Existing node position (user moved it), 2. Saved position, 3. Random
        if (existingNode && existingNode.position) {
          position = existingNode.position;
        } else if (page.position && typeof page.position === 'object' && 'x' in page.position && 'y' in page.position) {
          position = page.position as { x: number; y: number };
        }
        
        return {
          id: page.id,
          type: 'pageNode',
          position,
          data: {
            page,
            onEdit: () => onPageEdit(page.id),
            onDelete: () => onPageDelete(page.id),
          },
        };
      });

      setNodes(flowNodes);
      initializedRef.current = true;
    } else {
      // Just update the data (page content changed, but not position)
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const page = pages.find((p) => p.id === node.id);
          if (page) {
            return {
              ...node,
              data: {
                ...node.data,
                page,
                onEdit: () => onPageEdit(page.id),
                onDelete: () => onPageDelete(page.id),
              },
            };
          }
          return node;
        })
      );
    }
  }, [pages.length]); // Only re-run when number of pages changes

  // Convert connections to edges
  useEffect(() => {
    const flowEdges: Edge[] = connections.map((conn) => ({
      id: conn.id,
      source: conn.sourcePageId,
      target: conn.targetPageId,
      label: conn.label || undefined,
      type: 'smoothstep',
      animated: true,
    }));

    setEdges(flowEdges);
  }, [connections, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onConnectionCreate(params.source, params.target);
      }
    },
    [onConnectionCreate]
  );

  // When node drag stops, send positions to parent
  const handleNodeDragStop = useCallback(() => {
    const updates = nodes.map((node) => ({
      id: node.id,
      position: { x: node.position.x, y: node.position.y },
    }));
    
    onSavePositions(updates);
  }, [nodes, onSavePositions]);

  // Delete connection immediately without confirmation
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const connection = connections.find((c) => c.id === edge.id);
      if (connection) {
        onConnectionDelete(connection.id);
      }
    },
    [connections, onConnectionDelete]
  );

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden">
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesState}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        translateExtent={BOUNDS}
        nodeExtent={BOUNDS}
        minZoom={0.3}
        maxZoom={1}
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="space-x-2">
          <Button
            onClick={onPageCreate}
            size="sm"
            className="rounded-2xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Button>
        </Panel>

        <Panel position="bottom-left">
          <div className="bg-background/95 backdrop-blur border rounded-lg p-3 space-y-2 text-sm">
            <div className="font-medium">Instructions:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Drag nodes to arrange them</li>
              <li>• Drag from one node to another to create connections</li>
              <li>• Click a connection to delete it</li>
              <li>• Click "Edit" on a node to edit the page</li>
            </ul>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}