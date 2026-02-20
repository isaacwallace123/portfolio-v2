'use client';

import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, ExternalLink, Calendar, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Project } from '../lib/types';
import { TechStackBadges } from './TechStackBadges';

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

export function ProjectCard({ project, featured }: ProjectCardProps) {
  const t = useTranslations('projects');

  return (
    <Card className="group relative overflow-hidden bg-background/80 dark:bg-background/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
      {project.icon && (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={project.icon}
            alt={project.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold line-clamp-1">{project.title}</h3>
          {featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />}
        </div>

        {project.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.excerpt}</p>
        )}

        <TechStackBadges technologies={project.technologies ?? []} max={4} />

        {project.startDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(project.startDate).getFullYear()}
              {project.endDate
                ? ` - ${new Date(project.endDate).getFullYear()}`
                : ` - ${t('present')}`
              }
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild variant="default" size="sm" className="flex-1 rounded-2xl">
            <Link href={`/projects/${project.slug}`}>
              {t('viewDetails')}
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>

          <div className="flex gap-1">
            {project.githubUrl && (
              <Button asChild variant="outline" size="sm" className="rounded-2xl h-8 w-8 p-0">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" title="GitHub">
                  <Github className="h-3 w-3" />
                </a>
              </Button>
            )}
            {project.liveUrl && (
              <Button asChild variant="outline" size="sm" className="rounded-2xl h-8 w-8 p-0">
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" title="Live Demo">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
