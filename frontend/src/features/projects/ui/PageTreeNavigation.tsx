'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { PageTreeNode } from '@/features/projects/lib/buildPageTree';

interface PageTreeNavigationProps {
  pageTree: PageTreeNode[];
  currentPageId?: string;
  projectSlug: string;
  projectTitle: string;
}

function TreeNode({
  node,
  currentPageId,
  projectSlug,
  depth = 0,
}: {
  node: PageTreeNode;
  currentPageId?: string;
  projectSlug: string;
  depth?: number;
}) {
  const isActive = currentPageId === node.page.id;
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  const href = node.page.isStartPage
    ? `/projects/${projectSlug}`
    : `/projects/${projectSlug}/${node.page.slug}`;

  return (
    <div>
      <div className="flex items-center gap-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={cn(
            'shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground transition-colors',
            hasChildren ? 'hover:text-foreground cursor-pointer' : 'cursor-default opacity-0 pointer-events-none'
          )}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren && (expanded
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />
          )}
        </button>

        <Link
          href={href}
          className={cn(
            'flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-sm transition-colors truncate',
            isActive
              ? 'bg-background text-foreground font-medium shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          {node.page.title}
        </Link>
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.page.id}
              node={child}
              currentPageId={currentPageId}
              projectSlug={projectSlug}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageTreeNavigation({ pageTree, currentPageId, projectSlug, projectTitle }: PageTreeNavigationProps) {
  // Only render root-level nodes — their children are recursively rendered
  const roots = pageTree.filter((n) => n.level === 0);

  return (
    <nav>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
        Pages
      </p>
      <div className="space-y-0.5">
        {roots.map((node) => (
          <TreeNode
            key={node.page.id}
            node={node}
            currentPageId={currentPageId}
            projectSlug={projectSlug}
          />
        ))}
      </div>
    </nav>
  );
}
