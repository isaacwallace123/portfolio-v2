import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PageTreeNode } from '@/features/projects/lib/buildPageTree';

interface PagePaginationProps {
  pageTree: PageTreeNode[];
  currentPageId?: string;
  projectSlug: string;
}

function nodeHref(node: PageTreeNode, projectSlug: string) {
  return node.page.isStartPage
    ? `/projects/${projectSlug}`
    : `/projects/${projectSlug}/${node.page.slug}`;
}

export function PagePagination({ pageTree, currentPageId, projectSlug }: PagePaginationProps) {
  if (pageTree.length <= 1) return null;

  const currentIndex = pageTree.findIndex((n) => n.page.id === currentPageId);
  if (currentIndex === -1) return null;

  const prev = currentIndex > 0 ? pageTree[currentIndex - 1] : null;
  const next = currentIndex < pageTree.length - 1 ? pageTree[currentIndex + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-between border-t pt-6 mt-8">
      {prev ? (
        <Link
          href={nodeHref(prev, projectSlug)}
          className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5">Previous</p>
            <p className="font-medium text-foreground">{prev.page.title}</p>
          </div>
        </Link>
      ) : <span />}

      {next ? (
        <Link
          href={nodeHref(next, projectSlug)}
          className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
        >
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5">Next</p>
            <p className="font-medium text-foreground">{next.page.title}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : <span />}
    </div>
  );
}
