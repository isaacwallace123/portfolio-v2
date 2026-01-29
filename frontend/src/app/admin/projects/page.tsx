'use client';

import { useRouter } from 'next/navigation';
import { useProjects } from '@/features/projects/hooks';
import { ProjectsTable } from '@/features/projects/ui';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="rounded-2xl -ml-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
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