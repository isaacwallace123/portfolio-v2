'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseBlocks,
  serializeBlocks,
  migrateHtmlToBlocks,
  createBlock,
  type Block,
  type BlockType,
  type BlockProps,
} from '../../lib/blocks';
import { ComponentPicker } from './ComponentPicker';
import { BlockCanvas } from './BlockCanvas';
import { PropertiesPanel } from './PropertiesPanel';

interface PageBuilderProps {
  projectId: string;
  pageId: string;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  isStartPage: boolean;
  projectId: string;
}

interface ProjectData {
  id: string;
  pages?: { id: string; isStartPage: boolean }[];
}

export function PageBuilder({ projectId, pageId }: PageBuilderProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isStartPage, setIsStartPage] = useState(false);
  const [hasOtherStartPage, setHasOtherStartPage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedBlocks, setSavedBlocks] = useState('');

  // Load page data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [pageRes, projectRes] = await Promise.all([
          fetch(`/api/project-pages?pageId=${pageId}`),
          fetch(`/api/projects?id=${projectId}`),
        ]);

        if (!pageRes.ok) throw new Error('Page not found');
        const page: PageData = await pageRes.json();
        const project: ProjectData = projectRes.ok ? await projectRes.json() : { id: projectId };

        const parsed = parseBlocks(page.content);
        const loadedBlocks = parsed ?? migrateHtmlToBlocks(page.content || '<p></p>');

        setTitle(page.title);
        setSlug(page.slug);
        setIsStartPage(page.isStartPage);
        setBlocks(loadedBlocks);
        setSavedBlocks(serializeBlocks(loadedBlocks));

        // Check if another page is the start page
        const otherStart = project.pages?.some(
          (p) => p.isStartPage && p.id !== pageId
        ) ?? false;
        setHasOtherStartPage(otherStart);
      } catch (err) {
        toast.error('Failed to load page');
        router.push(`/admin/projects/${projectId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageId, projectId, router]);

  // Track unsaved changes
  useEffect(() => {
    if (!loading) {
      setHasChanges(serializeBlocks(blocks) !== savedBlocks);
    }
  }, [blocks, savedBlocks, loading]);

  const handleAddBlock = useCallback((type: BlockType) => {
    const block = createBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
  }, []);

  const handleBlockChange = useCallback((id: string, props: BlockProps) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props } : b)));
  }, []);

  const handleReorder = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBlockId((prev) => (prev === id ? null : prev));
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const original = prev[index];
      const clone: Block = {
        ...original,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        props: structuredClone(original.props),
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/project-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          title,
          slug,
          isStartPage,
          content: serializeBlocks(blocks),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Save failed');
      }

      const serial = serializeBlocks(blocks);
      setSavedBlocks(serial);
      setHasChanges(false);
      toast.success('Page saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b bg-background/95 backdrop-blur shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-2xl gap-2 shrink-0"
          onClick={() => router.push(`/admin/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Flowchart</span>
        </Button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            className="text-base font-semibold bg-transparent border-none outline-none focus:ring-0 min-w-0 flex-1 truncate"
            placeholder="Page title..."
          />
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setHasChanges(true); }}
            className="text-xs text-muted-foreground bg-transparent border-none outline-none focus:ring-0 font-mono hidden sm:block"
            placeholder="slug"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl gap-2"
            onClick={() => setPreviewMode((v) => !v)}
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Edit' : 'Preview'}</span>
          </Button>

          <Button
            size="sm"
            className="rounded-2xl gap-2"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 min-h-0">
        {!previewMode && (
          <div className="w-60 shrink-0">
            <ComponentPicker onAdd={handleAddBlock} />
          </div>
        )}

        <BlockCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          previewMode={previewMode}
          onSelect={setSelectedBlockId}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onBlockChange={handleBlockChange}
        />

        {!previewMode && (
          <div className="w-72 shrink-0">
            <PropertiesPanel
              selectedBlock={selectedBlock}
              pageSettings={{ title, slug, isStartPage, hasOtherStartPage }}
              onBlockChange={handleBlockChange}
              onPageSettingsChange={(s) => {
                if (s.title !== undefined) setTitle(s.title);
                if (s.slug !== undefined) setSlug(s.slug);
                if (s.isStartPage !== undefined) setIsStartPage(s.isStartPage);
                setHasChanges(true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
