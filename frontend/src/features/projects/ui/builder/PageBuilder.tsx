'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, Save, Loader2, Code2, Upload } from 'lucide-react';
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
import { parseMdxToBlocks } from '../../lib/mdxParser';
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

type EditorMode = 'visual' | 'mdx' | 'preview';

export function PageBuilder({ projectId, pageId }: PageBuilderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<EditorMode>('visual');

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rawMdx, setRawMdx] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isStartPage, setIsStartPage] = useState(false);
  const [hasOtherStartPage, setHasOtherStartPage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedContent, setSavedContent] = useState('');

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
        const mdx = serializeBlocks(loadedBlocks);

        setTitle(page.title);
        setSlug(page.slug);
        setIsStartPage(page.isStartPage);
        setBlocks(loadedBlocks);
        setRawMdx(mdx);
        setSavedContent(page.content); // compare against original DB content

        const otherStart = project.pages?.some((p) => p.isStartPage && p.id !== pageId) ?? false;
        setHasOtherStartPage(otherStart);
      } catch {
        toast.error('Failed to load page');
        router.push(`/admin/projects/${projectId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageId, projectId, router]);

  // Track unsaved changes (compare serialized MDX against what's in DB)
  useEffect(() => {
    if (!loading) {
      setHasChanges(serializeBlocks(blocks) !== savedContent);
    }
  }, [blocks, savedContent, loading]);

  // Sync blocks → rawMdx whenever blocks change (only in visual mode)
  useEffect(() => {
    if (mode === 'visual') {
      setRawMdx(serializeBlocks(blocks));
    }
  }, [blocks, mode]);

  // Switch into MDX mode: ensure rawMdx is up to date
  const handleSwitchToMdx = useCallback(() => {
    setRawMdx(serializeBlocks(blocks));
    setMode('mdx');
  }, [blocks]);

  // Switch out of MDX mode: parse rawMdx back to blocks
  const handleSwitchToVisual = useCallback(() => {
    const parsed = parseMdxToBlocks(rawMdx);
    setBlocks(parsed);
    setSelectedBlockId(null);
    setMode('visual');
  }, [rawMdx]);

  const handleModeToggle = useCallback(() => {
    if (mode === 'visual') handleSwitchToMdx();
    else if (mode === 'mdx') handleSwitchToVisual();
  }, [mode, handleSwitchToMdx, handleSwitchToVisual]);

  // File upload: read .mdx file and load into builder
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseMdxToBlocks(text);
      setBlocks(parsed);
      setRawMdx(text);
      setSelectedBlockId(null);
      setMode('visual');
      setHasChanges(true);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  }, []);

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
    // If saving from MDX mode, parse first to ensure blocks are in sync
    let blocksToSave = blocks;
    if (mode === 'mdx') {
      blocksToSave = parseMdxToBlocks(rawMdx);
      setBlocks(blocksToSave);
    }

    try {
      setSaving(true);
      const content = serializeBlocks(blocksToSave);
      const response = await fetch('/api/project-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId, title, slug, isStartPage, content }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Save failed');
      }

      setSavedContent(content);
      setHasChanges(false);
      toast.success('Page saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;
  const previewMode = mode === 'preview';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
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
          {/* Upload .mdx file */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mdx,.md"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-2xl gap-2"
            onClick={() => fileInputRef.current?.click()}
            title="Upload .mdx file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          {/* MDX / Visual toggle */}
          <Button
            variant={mode === 'mdx' ? 'secondary' : 'outline'}
            size="sm"
            className="rounded-2xl gap-2"
            onClick={handleModeToggle}
            disabled={mode === 'preview'}
            title={mode === 'mdx' ? 'Switch to visual editor' : 'Edit raw MDX'}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{mode === 'mdx' ? 'Visual' : 'MDX'}</span>
          </Button>

          {/* Preview toggle */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl gap-2"
            onClick={() => {
              if (mode === 'preview') setMode('visual');
              else {
                if (mode === 'mdx') handleSwitchToVisual();
                setMode('preview');
              }
            }}
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
        {mode === 'visual' && (
          <div className="w-60 shrink-0">
            <ComponentPicker onAdd={handleAddBlock} />
          </div>
        )}

        {mode === 'mdx' ? (
          /* Raw MDX editor */
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <textarea
              value={rawMdx}
              onChange={(e) => {
                setRawMdx(e.target.value);
                setHasChanges(true);
              }}
              className="flex-1 w-full resize-none font-mono text-sm bg-muted/30 border border-border rounded-lg p-4 outline-none focus:ring-1 focus:ring-ring"
              spellCheck={false}
              placeholder="Write MDX here..."
            />
          </div>
        ) : (
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
        )}

        {mode === 'visual' && (
          <div className="w-96 shrink-0">
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
