'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useProjectForm } from '@/features/projects/hooks';
import { generateSlug } from '@/features/projects/lib/utils';
import { RichTextEditor } from '@/features/projects/ui/RichTextEditor';
import { TagInput } from '@/components/ui/taginput';
import type { CreateProjectDto } from '@/features/projects/lib/types';
import { toast } from 'sonner';

export default function AdminProjectNewPage() {
  const router = useRouter();
  const { saving, createProject } = useProjectForm();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<Partial<CreateProjectDto>>({
    title: '',
    slug: '',
    description: '',
    content: '',
    excerpt: '',
    published: false,
    featured: false,
    thumbnail: '',
    liveUrl: '',
    githubUrl: '',
    tags: [],
    technologies: [],
    order: 0,
  });

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title?.trim()) {
        toast.error('Please enter a project title');
        return;
      }
      if (!formData.slug?.trim()) {
        toast.error('Please enter a project slug');
        return;
      }
    }
    
    if (step === 3) {
      if (!formData.content?.trim()) {
        toast.error('Please add content for the default page');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      const project = await createProject(formData as CreateProjectDto);
      
      if (project) {
        try {
          await fetch('/api/project-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              slug: 'overview',
              title: 'Overview',
              content: formData.content,
              order: 0,
              isStartPage: true,
            }),
          });
          
          toast.success('Project and default page created successfully!');
          router.push(`/admin/projects/${project.id}`);
        } catch (error) {
          console.error('Failed to create default page:', error);
          toast.warning('Project created but failed to create default page');
          router.push('/admin/projects');
        }
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const steps = [
    'Basic Info',
    'Project Details', 
    'Default Page Content',
    'Review & Create'
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-2xl mb-4 -ml-4">
          <Link href="/admin/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Step {step} of {steps.length}: {steps[step - 1]}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-2 rounded-full ${
              idx + 1 <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Form */}
      <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardHeader>
          <CardTitle>{steps[step - 1]}</CardTitle>
          <CardDescription>
            {step === 1 && 'Enter the basic information for your project'}
            {step === 2 && 'Add additional project details and metadata'}
            {step === 3 && 'Create the default overview page that users will see first'}
            {step === 4 && 'Review your project before creating'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="My Awesome Project"
                  className="h-11 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-base">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-awesome-project"
                  className="h-11 text-base"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  URL-friendly identifier (auto-generated from title)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief description of your project..."
                  rows={4}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-base">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short excerpt for project cards..."
                  rows={2}
                  className="text-base"
                />
              </div>
            </>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-base">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="h-11 text-base"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="liveUrl" className="text-base">Live URL</Label>
                  <Input
                    id="liveUrl"
                    type="url"
                    value={formData.liveUrl}
                    onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                    placeholder="https://myproject.com"
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubUrl" className="text-base">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/user/repo"
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Tags</Label>
                <TagInput
                  value={formData.tags || []}
                  onChange={(tags: any) => setFormData({ ...formData, tags })}
                  placeholder="Type a tag and press Enter"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Technologies</Label>
                <TagInput
                  value={formData.technologies || []}
                  onChange={(technologies: any) => setFormData({ ...formData, technologies })}
                  placeholder="Type a technology and press Enter"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 border rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="published" className="text-base font-medium">Published</Label>
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

                <div className="flex items-center justify-between p-4 border rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured" className="text-base font-medium">Featured</Label>
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
            </>
          )}

          {/* Step 3: Default Page Content */}
          {step === 3 && (
            <div className="space-y-2">
              <Label className="text-base">Overview Page Content *</Label>
              <p className="text-sm text-muted-foreground mb-4">
                This will be the first page visitors see when they view your project.
                Use the editor to format your content with headings, lists, links, and more.
                This page will be saved as the &quot;Overview&quot; page.
              </p>
              <RichTextEditor
                content={formData.content || ''}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Info</h3>
                <dl className="space-y-1 text-sm">
                  <div><strong>Title:</strong> {formData.title}</div>
                  <div><strong>Slug:</strong> {formData.slug}</div>
                  {formData.description && <div><strong>Description:</strong> {formData.description}</div>}
                </dl>
              </div>

              {(formData.tags?.length || formData.technologies?.length) ? (
                <div>
                  <h3 className="font-semibold mb-2">Tags & Technologies</h3>
                  <dl className="space-y-1 text-sm">
                    {formData.tags && formData.tags.length > 0 && (
                      <div><strong>Tags:</strong> {formData.tags.join(', ')}</div>
                    )}
                    {formData.technologies && formData.technologies.length > 0 && (
                      <div><strong>Technologies:</strong> {formData.technologies.join(', ')}</div>
                    )}
                  </dl>
                </div>
              ) : null}

              <div>
                <h3 className="font-semibold mb-2">Default Page</h3>
                <dl className="space-y-1 text-sm">
                  <div><strong>Page Name:</strong> Overview (start page)</div>
                  <div><strong>Content:</strong> {formData.content ? `${formData.content.length} characters` : 'No content'}</div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <dl className="space-y-1 text-sm">
                  <div><strong>Published:</strong> {formData.published ? 'Yes' : 'No'}</div>
                  <div><strong>Featured:</strong> {formData.featured ? 'Yes' : 'No'}</div>
                </dl>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="rounded-2xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {step < steps.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="rounded-2xl ml-auto"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-2xl ml-auto"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/admin/projects')}
              disabled={saving}
              className="rounded-2xl"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}