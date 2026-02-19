'use client';

import { useState, use, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UrlInput } from '@/components/ui/url-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Network, FileText, Settings as SettingsIcon, Save, Languages } from 'lucide-react';
import Link from 'next/link';
import { ProjectFlowchart } from '@/features/projects/ui/ProjectFlowchart';
import { PageEditorDialog } from '@/features/projects/ui/PageEditorDialog';
import { TagInput } from '@/components/ui/taginput';
import { SkillTagInput } from '@/components/ui/skill-tag-input';
import { useProjectPages } from '@/features/projects/hooks/useProjectPages';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectForm } from '@/features/projects/hooks';
import { ImageUploadField } from '@/features/uploads/ui/ImageUploadField';
import type { ProjectPage } from '@/features/projects/lib/types';
import { toast } from 'sonner';

interface AdminProjectEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

const CHAR_LIMITS = {
  title: 100,
  slug: 100,
  description: 500,
  excerpt: 200,
};

export default function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = use(params);
  const router = useRouter();
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

  const [translating, setTranslating] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ProjectPage | undefined>();
  const [activeTab, setActiveTab] = useState('pages');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingPositions, setPendingPositions] = useState<{ id: string; position: { x: number; y: number } }[] | null>(null);
  const [pendingConnectionChanges, setPendingConnectionChanges] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    thumbnail: '',
    icon: '',
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
        icon: project.icon || '',
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

  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasChanges(formChanged || pendingPositions !== null || pendingConnectionChanges);
  }, [formData, originalFormData, pendingPositions, pendingConnectionChanges]);

  const handlePageCreate = () => {
    setEditingPage(undefined);
    setPageDialogOpen(true);
  };

  // Edit navigates directly to the full-page builder
  const handlePageEdit = (pageId: string) => {
    router.push(`/admin/projects/${id}/pages/${pageId}`);
  };

  const handlePageSave = async (data: Partial<ProjectPage>) => {
    // CREATE only — after creating, navigate to the builder for content editing
    const newPage = await createPage(data);
    setPageDialogOpen(false);
    if (newPage?.id) {
      router.push(`/admin/projects/${id}/pages/${newPage.id}`);
    }
  };

  const handleSave = async () => {
    try {
      if (pendingPositions) {
        await savePositions(pendingPositions);
        setPendingPositions(null);
      }
      
      const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      if (formChanged) {
        await updateProject(id, {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          excerpt: formData.excerpt,
          thumbnail: formData.thumbnail,
          icon: formData.icon,
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

  const handlePositionChange = useCallback((positions: { id: string; position: { x: number; y: number } }[]) => {
    setPendingPositions(positions);
  }, []);

  const handleTitleChange = (value: string) => {
    if (value.length <= CHAR_LIMITS.title) {
      setFormData({ ...formData, title: value });
    }
  };

  const handleSlugChange = (value: string) => {
    if (value.length <= CHAR_LIMITS.slug) {
      setFormData({ ...formData, slug: value });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (value.length <= CHAR_LIMITS.description) {
      setFormData({ ...formData, description: value });
    }
  };

  const handleExcerptChange = (value: string) => {
    if (value.length <= CHAR_LIMITS.excerpt) {
      setFormData({ ...formData, excerpt: value });
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      const { fieldsTranslated, pagesTranslated } = data;
      if (fieldsTranslated === 0 && pagesTranslated === 0) {
        toast.info('Everything is already translated.');
      } else {
        toast.success(`Translated ${fieldsTranslated} field(s) and ${pagesTranslated} page(s).`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur shrink-0">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <Button asChild variant="ghost" size="sm" className="rounded-2xl shrink-0">
                <Link href="/admin/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate sm:text-xl">{project.title}</h1>
                <p className="text-xs text-muted-foreground">Edit Project</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0 sm:order-last">
              <Button
                onClick={handleTranslate}
                disabled={translating}
                variant="outline"
                size="sm"
                className="rounded-2xl"
                title="Translate missing French content with DeepL"
              >
                <Languages className="mr-2 h-4 w-4" />
                {translating ? 'Translating...' : 'Translate FR'}
              </Button>
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="rounded-2xl"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>

            <TabsList className="order-last w-full h-10 items-center justify-center rounded-xl bg-muted/50 p-1 shadow-sm border border-border/50 sm:order-0 sm:w-auto sm:h-11 sm:mx-auto">
              <TabsTrigger
                value="pages"
                className="flex-1 gap-2 rounded-lg text-xs sm:flex-initial sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Network className="h-4 w-4" />
                Pages
              </TabsTrigger>
              <TabsTrigger
                value="basic"
                className="flex-1 gap-2 rounded-lg text-xs sm:flex-initial sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex-1 gap-2 rounded-lg text-xs sm:flex-initial sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="pages" className="flex-1 m-0 p-0 data-[state=active]:flex min-h-0">
          {pagesLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading pages...
            </div>
          ) : (
            <div className="flex-1 w-full h-full">
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

        <TabsContent value="basic" className="flex-1 overflow-auto m-0 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6 pb-8 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-base">Project Title *</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.title.length}/{CHAR_LIMITS.title}
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-base h-11"
                    placeholder="My Awesome Project"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug" className="text-base">URL Slug *</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.slug.length}/{CHAR_LIMITS.slug}
                    </span>
                  </div>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="text-base h-11"
                    placeholder="my-awesome-project"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-base">Description</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.description.length}/{CHAR_LIMITS.description}
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={5}
                  className="text-base resize-none"
                  placeholder="Detailed description of your project..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt" className="text-base">Short Excerpt</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.excerpt.length}/{CHAR_LIMITS.excerpt}
                  </span>
                </div>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleExcerptChange(e.target.value)}
                  rows={3}
                  className="text-base resize-none"
                  placeholder="A brief summary for cards and previews..."
                />
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-6 pb-8 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Images</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <ImageUploadField
                  label="Icon"
                  value={formData.icon}
                  onChange={(url) => setFormData({ ...formData, icon: url })}
                  hint="Displayed on project list/cards (recommended: small square image)"
                  aspect="square"
                />
                <ImageUploadField
                  label="Thumbnail"
                  value={formData.thumbnail}
                  onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                  hint="Displayed on project overview/detail pages (recommended: larger banner image)"
                  aspect="banner"
                />
              </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Timeline</h3>

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
                  <p className="text-xs text-muted-foreground">
                    Leave empty if project is ongoing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Links Section */}
            <div className="space-y-6 pb-8 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Links</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="liveUrl" className="text-base">Live Demo URL</Label>
                  <UrlInput
                    id="liveUrl"
                    value={formData.liveUrl}
                    onChange={(url) => setFormData({ ...formData, liveUrl: url })}
                    className="text-base h-11"
                    placeholder="example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to the live version of your project
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubUrl" className="text-base">GitHub Repository</Label>
                  <UrlInput
                    id="githubUrl"
                    value={formData.githubUrl}
                    onChange={(url) => setFormData({ ...formData, githubUrl: url })}
                    className="text-base h-11"
                    placeholder="github.com/username/repo"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your project's source code
                  </p>
                </div>
              </div>
            </div>

            {/* Categorization Section */}
            <div className="space-y-6 pb-8 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categorization</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">Tags</Label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    placeholder="Type a tag and press Enter"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add tags to categorize your project
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Technologies</Label>
                  <SkillTagInput
                    value={formData.technologies}
                    onChange={(technologies) => setFormData({ ...formData, technologies })}
                    placeholder="Search skills or type to add..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Technologies and tools used in this project
                  </p>
                </div>
              </div>
            </div>

            {/* Visibility Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Visibility Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 border rounded-2xl hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <Label htmlFor="published" className="text-base font-semibold cursor-pointer">Published</Label>
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

                <div className="flex items-center justify-between p-6 border rounded-2xl hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <Label htmlFor="featured" className="text-base font-semibold cursor-pointer">Featured</Label>
                    <p className="text-sm text-muted-foreground">
                      Highlight this project on the homepage
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