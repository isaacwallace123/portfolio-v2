'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/features/projects/ui';
import { useProjectForm } from '@/features/projects/hooks';
import { projectsApi } from '@/features/projects/api';
import { generateSlug } from '@/features/projects/lib';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  excerpt: string;
  published: boolean;
  featured: boolean;
  thumbnail: string;
  tags: string[];
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
  order: number;
}

export default function ProjectEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const projectId = isNew ? null : (params.id as string);

  const [loading, setLoading] = useState(!isNew);
  const [tagInput, setTagInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const { saving, saveProject } = useProjectForm();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    slug: '',
    description: '',
    content: '',
    excerpt: '',
    published: false,
    featured: false,
    thumbnail: '',
    tags: [],
    technologies: [],
    liveUrl: '',
    githubUrl: '',
    startDate: '',
    endDate: '',
    order: 0,
  });

  useEffect(() => {
    if (!isNew && projectId) {
      loadProject();
    }
  }, [projectId, isNew]);

  const loadProject = async () => {
    try {
      const project = await projectsApi.getById(projectId!);
      setFormData({
        title: project.title || '',
        slug: project.slug || '',
        description: project.description || '',
        content: project.content || '',
        excerpt: project.excerpt || '',
        published: project.published || false,
        featured: project.featured || false,
        thumbnail: project.thumbnail || '',
        tags: project.tags || [],
        technologies: project.technologies || [],
        liveUrl: project.liveUrl || '',
        githubUrl: project.githubUrl || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        order: project.order || 0,
      });
    } catch (error) {
      toast.error('Failed to load project');
      router.push('/admin/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: isNew ? generateSlug(newTitle) : prev.slug,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddTechnology = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()],
      }));
      setTechInput('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech),
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const data = isNew ? formData : { id: projectId, ...formData };
      await saveProject(data as any);
      router.push('/admin/projects');
    } catch (error) {
      // Error already handled by useProjectForm hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading project...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/projects')}
            className="rounded-2xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? 'New Project' : 'Edit Project'}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Create a new project for your portfolio' : 'Update your project details'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && formData.slug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/projects/${formData.slug}`, '_blank')}
              className="rounded-2xl"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="rounded-2xl">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Project title, slug, and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="My Awesome Project"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="my-awesome-project"
                  className="rounded-2xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /projects/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A comprehensive description of your project"
                  rows={3}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief summary for project cards"
                  rows={3}
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Project Content *</CardTitle>
              <CardDescription>Write your project details using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>External project links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input
                  id="liveUrl"
                  type="url"
                  value={formData.liveUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, liveUrl: e.target.value }))}
                  placeholder="https://example.com"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                  placeholder="https://github.com/username/repo"
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardDescription>Control visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Project thumbnail</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="rounded-2xl"
                />
                {formData.thumbnail && (
                  <div className="mt-3">
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full aspect-video object-cover rounded-2xl border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Project duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Project categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                  className="rounded-2xl"
                />
                <Button type="button" onClick={handleAddTag} className="rounded-2xl">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technologies */}
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader>
              <CardTitle>Technologies</CardTitle>
              <CardDescription>Tech stack used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnology())}
                  placeholder="Add technology"
                  className="rounded-2xl"
                />
                <Button type="button" onClick={handleAddTechnology} className="rounded-2xl">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTechnology(tech)}
                  >
                    {tech} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
