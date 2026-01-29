'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { generateSlug } from '../lib/utils';
import type { ProjectPage } from '../lib/types';

interface PageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: ProjectPage;
  pages?: ProjectPage[]; // All pages to check if start page exists
  onSave: (data: Partial<ProjectPage>) => Promise<void>;
}

export function PageEditorDialog({ open, onOpenChange, page, pages = [], onSave }: PageEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isStartPage, setIsStartPage] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if there's already a start page (excluding current page if editing)
  const hasStartPage = pages.some(p => p.isStartPage && p.id !== page?.id);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setContent(page.content);
      setIsStartPage(page.isStartPage);
      setSlugEdited(true);
    } else {
      setTitle('');
      setSlug('');
      setContent('');
      // Auto-set as start page if this is the first page
      setIsStartPage(!hasStartPage);
      setSlugEdited(false);
    }
  }, [page, open, hasStartPage]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited && !page) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugEdited(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title,
        slug,
        content,
        isStartPage,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          <DialogDescription>
            {page
              ? 'Update the page details and content.'
              : 'Add a new page to your project.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="My Page Title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-page-slug"
            />
            <p className="text-xs text-muted-foreground">
              URL: /projects/[project-slug]/{slug || 'page-slug'}
            </p>
          </div>

          {/* Show start page controls */}
          {page?.isStartPage ? (
            // Editing the start page - show as locked
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/30">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">This is the start page (cannot be changed)</span>
            </div>
          ) : !hasStartPage && !page ? (
            // Creating first page - show as auto-enabled and locked
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/30">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">This will be the start page (first page in project)</span>
            </div>
          ) : hasStartPage ? (
            // Already have a start page - show disabled checkbox
            <div className="space-y-2">
              <div className="flex items-center space-x-2 opacity-50">
                <Checkbox
                  id="isStartPage"
                  checked={false}
                  disabled={true}
                />
                <Label htmlFor="isStartPage" className="cursor-not-allowed">
                  Set as start page (already have a start page)
                </Label>
              </div>
            </div>
          ) : (
            // Can set as start page
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStartPage"
                checked={isStartPage}
                onCheckedChange={(checked) => setIsStartPage(checked as boolean)}
              />
              <Label htmlFor="isStartPage" className="cursor-pointer">
                Set as start page (default entry point)
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your page content here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !slug.trim() || !content.trim() || saving}
          >
            {saving ? 'Saving...' : page ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}