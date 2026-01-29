'use client';

import { useRouter } from 'next/navigation';
import { useProjects } from '@/features/projects/hooks';
import { ProjectsTable } from '@/features/projects/ui';

export default function AdminProjectsPage() {
  const router = useRouter();
  const { projects, loading, deleteProject, togglePublish, toggleFeature } = useProjects();

  return (
    <ProjectsTable
      projects={projects}
      loading={loading}
      onEdit={(id) => router.push(`/admin/projects/${id}`)}
      onCreate={() => router.push('/admin/projects/new')}
      onDelete={deleteProject}
      onTogglePublish={togglePublish}
      onToggleFeatured={toggleFeature}
    />
  );
}
