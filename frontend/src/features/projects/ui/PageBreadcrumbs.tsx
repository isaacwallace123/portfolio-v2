'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Project, ProjectPage } from '../lib/types';

interface PageBreadcrumbsProps {
  project: Project;
  currentPage?: ProjectPage;
}

export function PageBreadcrumbs({ project, currentPage }: PageBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link
        href="/projects"
        className="hover:text-foreground transition-colors"
      >
        Projects
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <Link
        href={`/projects/${project.slug}`}
        className="hover:text-foreground transition-colors"
      >
        {project.title}
      </Link>
      
      {currentPage && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{currentPage.title}</span>
        </>
      )}
    </nav>
  );
}