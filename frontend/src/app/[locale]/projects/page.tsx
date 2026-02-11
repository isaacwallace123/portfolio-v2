import { ProjectsGrid } from '@/features/projects/ui';
import { prisma } from '@/lib/prisma';
import { setRequestLocale } from 'next-intl/server';
import { localizeProject } from '@/lib/localize';

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

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = (await getProjects()).map((p) => localizeProject(p, locale));

  return (
    <main className="relative flex-1">
      <ProjectsGrid projects={projects} />
    </main>
  );
}
