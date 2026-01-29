'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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

function FlowchartContent({
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
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    const shouldReinitialize = !initializedRef.current || nodes.length !== pages.length;
    
    if (shouldReinitialize) {
      const flowNodes: Node[] = pages.map((page) => {
        const existingNode = nodes.find(n => n.id === page.id);
        
        let position = { x: Math.random() * 400, y: Math.random() * 400 };
        
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
  }, [pages.length]);

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

  const handleNodeDragStop = useCallback(() => {
    const updates = nodes.map((node) => ({
      id: node.id,
      position: { x: node.position.x, y: node.position.y },
    }));
    
    onSavePositions(updates);
  }, [nodes, onSavePositions]);

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
        
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <Button
            onClick={() => zoomIn()}
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-background shadow-md hover:bg-accent"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => zoomOut()}
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-background shadow-md hover:bg-accent"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => fitView()}
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-background shadow-md hover:bg-accent"
            title="Fit View"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          
          <div className="h-px bg-border my-1" />
          
          <Button
            onClick={onPageCreate}
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-background shadow-md hover:bg-accent"
            title="Add Page"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </ReactFlow>
    </div>
  );
}

export function ProjectFlowchart(props: ProjectFlowchartProps) {
  return (
    <ReactFlowProvider>
      <FlowchartContent {...props} />
    </ReactFlowProvider>
  );
}