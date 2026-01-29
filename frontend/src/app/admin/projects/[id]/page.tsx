'use client';

import { useState, use, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Network, FileText, Settings as SettingsIcon, Save } from 'lucide-react';
import Link from 'next/link';
import { ProjectFlowchart } from '@/features/projects/ui/ProjectFlowchart';
import { PageEditorDialog } from '@/features/projects/ui/PageEditorDialog';
import { TagInput } from '@/components/ui/taginput';
import { useProjectPages } from '@/features/projects/hooks/useProjectPages';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectForm } from '@/features/projects/hooks';
import type { ProjectPage } from '@/features/projects/lib/types';
import { toast } from 'sonner';

interface AdminProjectEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = use(params);
  const { project, loading: projectLoading, refetch } = useProject(id);
  const { saving, updateProject } = useProjectForm();
  const {
    pages,
    connections,
    loading: pagesLoading,
    createPage,
    updatePage,
    deletePage,
    savePositions,
    createConnection,
    deleteConnection,
  } = useProjectPages({ projectId: id });

  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ProjectPage | undefined>();
  const [activeTab, setActiveTab] = useState('pages');
  
  // Unified change tracking
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingPositions, setPendingPositions] = useState<{ id: string; position: { x: number; y: number } }[] | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    thumbnail: '',
    liveUrl: '',
    githubUrl: '',
    tags: [] as string[],
    technologies: [] as string[],
    startDate: '',
    endDate: '',
    published: false,
    featured: false,
  });

  const [originalFormData, setOriginalFormData] = useState(formData);

  useEffect(() => {
    if (project) {
      const data = {
        title: project.title,
        slug: project.slug,
        description: project.description || '',
        excerpt: project.excerpt || '',
        thumbnail: project.thumbnail || '',
        liveUrl: project.liveUrl || '',
        githubUrl: project.githubUrl || '',
        tags: project.tags || [],
        technologies: project.technologies || [],
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        published: project.published,
        featured: project.featured,
      };
      setFormData(data);
      setOriginalFormData(data);
    }
  }, [project]);

  // Check if form data has changed
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasChanges(formChanged || pendingPositions !== null);
  }, [formData, originalFormData, pendingPositions]);

  const handlePageCreate = () => {
    setEditingPage(undefined);
    setPageDialogOpen(true);
  };

  const handlePageEdit = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    setEditingPage(page);
    setPageDialogOpen(true);
  };

  const handlePageSave = async (data: Partial<ProjectPage>) => {
    if (editingPage) {
      await updatePage(editingPage.id, data);
    } else {
      await createPage(data);
    }
    setPageDialogOpen(false);
  };

  // Unified save handler
  const handleSave = async () => {
    try {
      // Save positions if they changed
      if (pendingPositions) {
        await savePositions(pendingPositions);
        setPendingPositions(null);
      }
      
      // Save form data if it changed
      const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      if (formChanged) {
        await updateProject(id, {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          excerpt: formData.excerpt,
          thumbnail: formData.thumbnail,
          liveUrl: formData.liveUrl,
          githubUrl: formData.githubUrl,
          tags: formData.tags,
          technologies: formData.technologies,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          published: formData.published,
          featured: formData.featured,
        });
        await refetch();
        setOriginalFormData(formData);
      }
      
      toast.success('Changes saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save changes');
    }
  };

  // Store positions but don't save yet
  const handlePositionChange = useCallback((positions: { id: string; position: { x: number; y: number } }[]) => {
    setPendingPositions(positions);
  }, []);

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="rounded-2xl">
              <Link href="/admin/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
              <p className="text-sm text-muted-foreground">Edit Project</p>
            </div>
          </div>
          
          {/* Unified Save button - shows on ALL tabs when there are changes */}
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="rounded-2xl"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="border-b px-6 shrink-0">
          <TabsList>
            <TabsTrigger value="pages" className="gap-2">
              <Network className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="basic" className="gap-2">
              <FileText className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pages Tab - TRUE FULLSCREEN NO SCROLL */}
        <TabsContent value="pages" className="flex-1 m-0 p-0 data-[state=active]:flex overflow-hidden">
          {pagesLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading pages...
            </div>
          ) : (
            <div className="flex-1 w-full h-full overflow-hidden">
              <ProjectFlowchart
                projectId={id}
                pages={pages}
                connections={connections}
                onPageCreate={handlePageCreate}
                onPageEdit={handlePageEdit}
                onPageDelete={deletePage}
                onSavePositions={handlePositionChange}
                onConnectionCreate={createConnection}
                onConnectionDelete={deleteConnection}
              />
            </div>
          )}
        </TabsContent>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="flex-1 overflow-auto m-0 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-base h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-base">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="text-base h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-base">Short Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="text-base resize-none"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-base">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="text-base h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-base">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="text-base h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-base">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="text-base h-11"
              />
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="liveUrl" className="text-base">Live Demo URL</Label>
                <Input
                  id="liveUrl"
                  type="url"
                  value={formData.liveUrl}
                  onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                  className="text-base h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="text-base">GitHub Repository</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  className="text-base h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Tags</Label>
              <TagInput
                value={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Type a tag and press Enter"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Technologies</Label>
              <TagInput
                value={formData.technologies}
                onChange={(technologies) => setFormData({ ...formData, technologies })}
                placeholder="Type a technology and press Enter"
              />
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between p-6 border rounded-2xl">
                <div className="space-y-1">
                  <Label htmlFor="published" className="text-base font-semibold">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this project visible to the public
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-6 border rounded-2xl">
                <div className="space-y-1">
                  <Label htmlFor="featured" className="text-base font-semibold">Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight on homepage
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PageEditorDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        page={editingPage}
        pages={pages}
        onSave={handlePageSave}
      />
    </div>
  );
}