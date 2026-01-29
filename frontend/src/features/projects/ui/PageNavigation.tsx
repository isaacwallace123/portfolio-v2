'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import type { ProjectPage } from '../lib/types';

interface PageNavigationProps {
  projectSlug: string;
  currentPage: ProjectPage;
  connectedPages: ProjectPage[];
}

export function PageNavigation({ projectSlug, currentPage, connectedPages }: PageNavigationProps) {
  if (connectedPages.length === 0) {
    return null;
  }

  return (
    <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Continue Reading</h3>
            {!currentPage.isStartPage && (
              <Button asChild variant="ghost" size="sm" className="rounded-2xl">
                <Link href={`/projects/${projectSlug}`}>
                  <Home className="mr-2 h-3 w-3" />
                  Start Page
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {connectedPages.map((page) => (
              <Link
                key={page.id}
                href={`/projects/${projectSlug}/${page.slug}`}
                className="group"
              >
                <Card className="transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {page.title}
                        </h4>
                        <Badge variant="outline" className="mt-2 text-xs">
                          /{page.slug}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}