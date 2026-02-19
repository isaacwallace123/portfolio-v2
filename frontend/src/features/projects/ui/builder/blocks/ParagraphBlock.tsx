'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, Strikethrough, Code,
  List, ListOrdered, Quote,
  Link2, Undo, Redo,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import type { ParagraphProps } from '../../../lib/blocks';

interface PreviewProps { props: ParagraphProps }
interface InlineEditorProps { props: ParagraphProps; onChange: (props: ParagraphProps) => void }

export function ParagraphBlockPreview({ props }: PreviewProps) {
  if (!props.html || props.html === '<p></p>') {
    return <p className="text-muted-foreground/40 italic py-1">Paragraph text...</p>;
  }
  return (
    <div
      className="project-content max-w-none py-1"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}

const Btn = ({ onClick, isActive, disabled, children, title }: {
  onClick: () => void; isActive?: boolean; disabled?: boolean;
  children: React.ReactNode; title: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    className={cn('h-7 w-7 p-0 shrink-0', isActive && 'bg-primary/15 text-primary')}
  >
    {children}
  </Button>
);

const Sep = () => <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;

export function ParagraphInlineEditor({ props, onChange }: InlineEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Underline,
    ],
    content: props.html,
    editorProps: {
      attributes: { class: 'focus:outline-none min-h-[60px] py-2 text-sm leading-relaxed' },
    },
    onUpdate: ({ editor }) => onChange({ ...props, html: editor.getHTML() }),
  });

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 items-center border-b border-border/60 pb-1.5 mb-2">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </Btn>
        <Sep />
        <Btn
          onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkOpen((v) => !v); }}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </Btn>
      </div>

      {/* Inline link input */}
      {linkOpen && (
        <div className="flex gap-1.5 items-center mb-2" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            className="flex-1 text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
          />
          <Button size="sm" className="h-7 text-xs px-2" onClick={applyLink}>
            {linkUrl ? 'Set' : 'Remove'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setLinkOpen(false)}>
            ✕
          </Button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

