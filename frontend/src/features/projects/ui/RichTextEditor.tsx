'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline as UnderlineIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive, 
  disabled, 
  children,
  title 
}: { 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-primary/10 text-primary"
    )}
  >
    {children}
  </Button>
);

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-2xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </MenuButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>
        </div>

        {/* Links & Images */}
        <div className="flex gap-1 border-r pr-2">
          <MenuButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <Link2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={addImage}
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </MenuButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor - Custom CSS for proper styling */}
      <style jsx global>{`
        .ProseMirror {
          padding: 1rem;
          min-height: 300px;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        /* Headings */
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }
        
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }
        
        /* Paragraphs */
        .ProseMirror p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        /* Lists */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        .ProseMirror ul {
          list-style-type: disc;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
        }
        
        .ProseMirror li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        
        .ProseMirror li p {
          margin: 0;
        }
        
        /* Blockquote */
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1em;
          margin-left: 0;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        
        /* Code */
        .ProseMirror code {
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: monospace;
        }
        
        /* Links */
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }
        
        /* Images */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
      `}</style>
      <EditorContent editor={editor} className="bg-background" />
    </div>
  );
}
