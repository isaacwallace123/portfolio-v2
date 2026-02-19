'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { SortableBlockItem } from './SortableBlockItem';
import { BlockRenderer } from '../BlockRenderer';
import type { Block, BlockProps } from '../../lib/blocks';
import { Layers } from 'lucide-react';

interface BlockCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  previewMode: boolean;
  onSelect: (id: string | null) => void;
  onReorder: (blocks: Block[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBlockChange: (id: string, props: BlockProps) => void;
}

export function BlockCanvas({
  blocks,
  selectedBlockId,
  previewMode,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
  onBlockChange,
}: BlockCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBlock = blocks.find((b) => b.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  };

  if (previewMode) {
    return (
      <div className="flex-1 overflow-y-auto bg-muted/20">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {blocks.length === 0 ? (
            <EmptyState />
          ) : (
            <BlockRenderer blocks={blocks} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-muted/10"
      onClick={() => onSelect(null)}
    >
      <div className="max-w-3xl mx-auto px-8 py-8">
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <SortableBlockItem
                    key={block.id}
                    block={block}
                    isSelected={block.id === selectedBlockId}
                    onSelect={() => onSelect(block.id)}
                    onDelete={() => onDelete(block.id)}
                    onDuplicate={() => onDuplicate(block.id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeBlock && (
                <div className="rounded-xl border bg-background shadow-xl opacity-90 px-10 py-3">
                  <BlockRenderer blocks={[activeBlock]} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
      <Layers className="h-10 w-10 mb-3 opacity-30" />
      <p className="font-medium">No blocks yet</p>
      <p className="text-sm mt-1 opacity-70">Click a component on the left to add it</p>
    </div>
  );
}
