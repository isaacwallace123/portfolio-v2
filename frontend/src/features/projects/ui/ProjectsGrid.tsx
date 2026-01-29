import { Star } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../lib/types';

interface ProjectsGridProps {
  projects: Project[];
  showFeaturedSection?: boolean;
}

export function ProjectsGrid({ projects, showFeaturedSection = true }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Projects</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          No projects available yet. Check back soon!
        </p>
      </div>
    );
  }

  const featuredProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

  return (
    <>
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Featured Work
            </h1>
            <p className="text-lg text-muted-foreground">
              A collection of projects showcasing my skills in full-stack development, system design, and problem-solving.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {showFeaturedSection && featuredProjects.length > 0 && (
        <section className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="flex items-center gap-2 mb-8">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-semibold tracking-tight">Featured Projects</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Projects */}
      {otherProjects.length > 0 && (
        <section className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="text-2xl font-semibold tracking-tight mb-8">
              {featuredProjects.length > 0 ? 'More Projects' : 'All Projects'}
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
