'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageTreeNode } from '@/features/projects/lib/buildPageTree';

interface PageTreeNavigationProps {
  pageTree: PageTreeNode[];
  currentPageId?: string;
  projectSlug: string;
}

export function PageTreeNavigation({ pageTree, currentPageId, projectSlug }: PageTreeNavigationProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Toggle chapter expansion
  const toggleChapter = (pageId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  // Group pages into chapters
  const overview = pageTree.find(node => node.page.isStartPage);
  const chapters = pageTree.filter(node => node.level === 1);

  // Build chapter structure with children
  const chapterStructure = chapters.map(chapter => {
    const children = pageTree.filter(node => {
      // Find children by checking if they're descendants of this chapter
      if (node.level <= 1) return false;
      
      // Check if this node is in the subtree of the chapter
      let currentNode = node;
      while (currentNode.level > 1) {
        const parent = pageTree.find(p => 
          p.page.outgoingConnections?.some(conn => conn.targetPageId === currentNode.page.id)
        );
        if (!parent) break;
        if (parent.page.id === chapter.page.id) return true;
        currentNode = parent;
      }
      return false;
    });
    
    return { chapter, children };
  });

  return (
    <nav className="space-y-0.5">
      {/* Overview - Always visible, no indent */}
      {overview && (
        <Link
          href={`/projects/${projectSlug}`}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors font-medium",
            currentPageId === overview.page.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          Overview
        </Link>
      )}

      {/* Chapters with collapsible children */}
      {chapterStructure.map(({ chapter, children }) => {
        const isExpanded = expandedChapters.has(chapter.page.id);
        const hasChildren = children.length > 0;
        const isActive = currentPageId === chapter.page.id;

        return (
          <div key={chapter.page.id}>
            {/* Chapter Header */}
            <div className="flex items-center gap-1">
              {/* Expand/Collapse button */}
              {hasChildren && (
                <button
                  onClick={() => toggleChapter(chapter.page.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              )}
              
              {/* Chapter Link */}
              <Link
                href={`/projects/${projectSlug}/${chapter.page.slug}`}
                className={cn(
                  "flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  !hasChildren && "ml-6"
                )}
              >
                {chapter.page.title}
              </Link>
            </div>

            {/* Chapter Children - Indented */}
            {hasChildren && isExpanded && (
              <div className="ml-6 space-y-0.5 mt-0.5">
                {children.map((node) => {
                  const isChildActive = currentPageId === node.page.id;
                  const indent = (node.level - 2) * 0.75; // Start from 0 for first child level
                  
                  return (
                    <Link
                      key={node.page.id}
                      href={`/projects/${projectSlug}/${node.page.slug}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isChildActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      style={{ paddingLeft: `${0.75 + indent}rem` }}
                    >
                      <span className={cn(
                        "text-muted-foreground",
                        isChildActive && "text-primary-foreground/70"
                      )}>└</span>
                      <span className="truncate">{node.page.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}