import { ProjectsGrid } from '@/features/projects/ui';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProjects() {
  return await prisma.project.findMany({
    where: { published: true },
    orderBy: [
      { featured: 'desc' },
      { order: 'asc' },
      { publishedAt: 'desc' },
    ],
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="relative flex-1">
      <ProjectsGrid projects={projects} />
    </main>
  );
}
