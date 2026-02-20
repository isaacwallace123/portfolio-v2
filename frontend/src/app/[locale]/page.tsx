import { setRequestLocale, getTranslations } from 'next-intl/server';
import { HomePageClient } from './HomePageClient';
import { prisma } from '@/lib/prisma';
import { ensureSkillIcons } from '@/features/skills/lib/ensureSkillIcons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Pre-seed local icons for all published project technologies so the client
  // never pulls from an external CDN.
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { technologies: true },
    });
    const allTechs = [...new Set(projects.flatMap((p) => p.technologies))];
    await ensureSkillIcons(allTechs);
  } catch {
    // Non-fatal — icons fall back to colored dots on first render
  }

  return <HomePageClient locale={locale} />;
}
