import { PageBuilder } from '@/features/projects/ui/builder/PageBuilder';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string; pageId: string }>;
}

export default async function PageEditorRoute({ params }: Props) {
  const { id, pageId } = await params;
  return <PageBuilder projectId={id} pageId={pageId} />;
}
