'use client';

import { useRouter } from 'next/navigation';
import { useProjects } from '@/features/projects/hooks';
import { ProjectsTable } from '@/features/projects/ui';
import { Button } from '@/components/ui/button';

export default function AdminProjectsPage() {
  const router = useRouter();
  
  const { projects, loading, error, deleteProject, togglePublish, toggleFeature } = useProjects();

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
          <p className="text-destructive">Failed to fetch projects</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <ProjectsTable
        projects={projects}
        loading={loading}
        onEdit={(id) => router.push(`/admin/projects/${id}`)}
        onDelete={deleteProject}
        onTogglePublish={togglePublish}
        onToggleFeatured={toggleFeature}
      />
    </div>
  );
}