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
import { generateSlug } from '../lib/utils';
import type { ProjectPage } from '../lib/types';

interface PageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: ProjectPage;
  pages?: ProjectPage[];
  onSave: (data: Partial<ProjectPage>) => Promise<void>;
}

export function PageEditorDialog({ open, onOpenChange, page, pages = [], onSave }: PageEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isStartPage, setIsStartPage] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if there's already a start page (excluding current page if editing)
  const hasStartPage = pages.some(p => p.isStartPage && p.id !== page?.id);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setIsStartPage(page.isStartPage);
      setSlugEdited(true);
    } else {
      setTitle('');
      setSlug('');
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
    if (!title.trim() || !slug.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title,
        slug,
        content: '<p></p>', // placeholder — builder sets real content
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{page ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          <DialogDescription>
            {page
              ? 'Update the page details and content.'
              : 'Add a new page to your project.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Page Title"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-base">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-page-slug"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                URL: /projects/[project-slug]/{slug || 'page-slug'}
              </p>
            </div>
          </div>

          {/* Start page controls */}
          {page?.isStartPage ? (
            <div className="flex items-center space-x-2 p-4 rounded-xl border bg-muted/30">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span className="text-sm font-medium">This is the start page (cannot be changed)</span>
            </div>
          ) : !hasStartPage && !page ? (
            <div className="flex items-center space-x-2 p-4 rounded-xl border bg-muted/30">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span className="text-sm font-medium">This will be the start page (first page in project)</span>
            </div>
          ) : hasStartPage ? (
            <div className="flex items-center space-x-2 opacity-50 p-4 rounded-xl border">
              <Checkbox id="isStartPage" checked={false} disabled={true} />
              <Label htmlFor="isStartPage" className="cursor-not-allowed text-sm">
                Set as start page (already have a start page)
              </Label>
            </div>
          ) : (
            <div className="flex items-center space-x-2 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
              <Checkbox
                id="isStartPage"
                checked={isStartPage}
                onCheckedChange={(checked) => setIsStartPage(checked as boolean)}
              />
              <Label htmlFor="isStartPage" className="cursor-pointer text-sm">
                Set as start page (default entry point)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !slug.trim() || saving}
            className="rounded-2xl"
          >
            {saving ? 'Saving...' : page ? 'Update Page' : 'Create Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}