'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Star } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ProjectPage } from '../lib/types';

interface PageNodeData {
  page: ProjectPage;
  onEdit: () => void;
  onDelete: () => void;
}

export const PageNode = memo(({ data }: NodeProps<PageNodeData>) => {
  const { page, onEdit, onDelete } = data;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    if (page.isStartPage) {
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="bg-primary!" />
      
      <Card className="min-w-50 max-w-75 shadow-lg border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-sm line-clamp-2">{page.title}</CardTitle>
            {page.isStartPage && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-3">
            <Badge variant="outline" className="text-xs">
              /{page.slug}
            </Badge>
          </div>

          <div className="flex gap-1">
            <Button
              onClick={onEdit}
              size="sm"
              variant="outline"
              className="h-7 text-xs flex-1"
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
            <Button
              onClick={handleDeleteClick}
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              disabled={page.isStartPage}
              title={page.isStartPage ? "Cannot delete start page" : "Delete page"}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Handle type="source" position={Position.Bottom} className="bg-primary!" />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Page"
        description={`Are you sure you want to delete "${page.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
});

PageNode.displayName = 'PageNode';