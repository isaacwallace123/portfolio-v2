'use client';

import { parseBlocks } from '../lib/blocks';
import { BlockRenderer } from './BlockRenderer';

interface ProjectContentProps {
  content: string;
}

export function ProjectContent({ content }: ProjectContentProps) {
  const blocks = parseBlocks(content);
  if (blocks) {
    return <BlockRenderer blocks={blocks} />;
  }

  return (
    <>
      <style jsx global>{`
        .project-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        
        .project-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }
        
        .project-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }
        
        .project-content p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        .project-content ul,
        .project-content ol {
          padding-left: 1.5em;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        .project-content ul {
          list-style-type: disc;
        }
        
        .project-content ol {
          list-style-type: decimal;
        }
        
        .project-content li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        
        .project-content li p {
          margin: 0;
        }
        
        .project-content blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1em;
          margin-left: 0;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        
        .project-content code {
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: monospace;
        }
        
        .project-content pre {
          background-color: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 1em;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .project-content pre code {
          background: none;
          padding: 0;
        }
        
        .project-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }
        
        .project-content a:hover {
          text-decoration: none;
        }
        
        .project-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          margin: 1em 0;
        }
        
        .project-content strong {
          font-weight: bold;
        }
        
        .project-content em {
          font-style: italic;
        }
        
        .project-content u {
          text-decoration: underline;
        }
        
        .project-content s {
          text-decoration: line-through;
        }
      `}</style>
      
      <div
        className="project-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}