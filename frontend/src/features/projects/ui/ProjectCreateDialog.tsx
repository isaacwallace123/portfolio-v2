'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperNav,
  StepperContent,
  StepperPanel,
} from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { TagInput } from '@/components/ui/taginput';
import { RichTextEditor } from '@/features/projects/ui/RichTextEditor';
import { toast } from 'sonner';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHAR_LIMITS = {
  title: 100,
  slug: 100,
  description: 500,
  excerpt: 200,
};

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Enter the basic information for your project' },
  { id: 2, name: 'Content', description: 'Add the main content for your project' },
  { id: 3, name: 'Images & Links', description: 'Add project images and links' },
  { id: 4, name: 'Details', description: 'Add tags, technologies, and dates' },
  { id: 5, name: 'Settings', description: 'Configure project visibility' },
];

export function ProjectCreateDialog({ open, onOpenChange }: ProjectCreateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    content: '',
    icon: '',
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

  const handleTitleChange = (title: string) => {
    if (title.length > CHAR_LIMITS.title) return;
    
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, CHAR_LIMITS.slug),
    });
  };

  const handleSlugChange = (slug: string) => {
    if (slug.length > CHAR_LIMITS.slug) return;
    setFormData({ ...formData, slug });
  };

  const handleDescriptionChange = (description: string) => {
    if (description.length > CHAR_LIMITS.description) return;
    setFormData({ ...formData, description });
  };

  const handleExcerptChange = (excerpt: string) => {
    if (excerpt.length > CHAR_LIMITS.excerpt) return;
    setFormData({ ...formData, excerpt });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.slug) {
        toast.error('Title and slug are required');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.content) {
        toast.error('Content is required');
        return;
      }
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Title, slug, and content are required');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!projectResponse.ok) {
        const error = await projectResponse.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const project = await projectResponse.json();
      console.log('Project created:', project);

      // Step 2: Create the default start page with the content
      try {
        console.log('Creating default page for project:', project.id);
        const pageResponse = await fetch(`/api/project-pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            title: 'Overview',
            slug: 'overview',
            content: formData.content,
            isStartPage: true,
            order: 0,
          }),
        });

        if (!pageResponse.ok) {
          const pageError = await pageResponse.json();
          console.error('Failed to create start page:', pageError);
          toast.error('Project created but failed to create start page. You can add it manually.');
        } else {
          const page = await pageResponse.json();
          console.log('Start page created:', page);
        }
      } catch (pageError) {
        console.error('Error creating start page:', pageError);
        toast.error('Project created but failed to create start page. You can add it manually.');
      }

      toast.success('Project created successfully!');
      
      // Reset form and close dialog
      onOpenChange(false);
      setCurrentStep(1);
      setFormData({
        title: '',
        slug: '',
        description: '',
        excerpt: '',
        content: '',
        icon: '',
        thumbnail: '',
        liveUrl: '',
        githubUrl: '',
        tags: [],
        technologies: [],
        startDate: '',
        endDate: '',
        published: false,
        featured: false,
      });
      
      // Navigate to edit page
      router.push(`/admin/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCurrentStep(1);
    setFormData({
      title: '',
      slug: '',
      description: '',
      excerpt: '',
      content: '',
      icon: '',
      thumbnail: '',
      liveUrl: '',
      githubUrl: '',
      tags: [],
      technologies: [],
      startDate: '',
      endDate: '',
      published: false,
      featured: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-225">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        <Stepper value={currentStep} onValueChange={setCurrentStep} className="mb-6">
          <StepperNav>
            {STEPS.map((step, index) => (
              <StepperItem key={step.id} step={step.id} completed={step.id < currentStep} disabled>
                <StepperTrigger asChild>
                  <div className="cursor-default">
                    <StepperIndicator>{step.id}</StepperIndicator>
                  </div>
                </StepperTrigger>
                {index < STEPS.length - 1 && (
                  <StepperSeparator 
                    className={step.id < currentStep ? 'bg-primary' : 'bg-muted'}
                  />
                )}
              </StepperItem>
            ))}
          </StepperNav>

          <StepperPanel>
            {/* Step 1: Basic Info */}
            <StepperContent value={1}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Project Title *</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.title.length}/{CHAR_LIMITS.title}
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="My Awesome Project"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.slug.length}/{CHAR_LIMITS.slug}
                    </span>
                  </div>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-awesome-project"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier (auto-generated from title)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.description.length}/{CHAR_LIMITS.description}
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="A brief description of your project..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excerpt">Short Excerpt</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.excerpt.length}/{CHAR_LIMITS.excerpt}
                    </span>
                  </div>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleExcerptChange(e.target.value)}
                    placeholder="Short excerpt for project cards..."
                    rows={2}
                  />
                </div>
              </div>
            </StepperContent>

            {/* Step 2: Content */}
            <StepperContent value={2}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Content *</Label>
                  <p className="text-sm text-muted-foreground">
                    Add the main content for your project using the rich text editor
                  </p>
                  <div className="max-h-100 overflow-y-auto">
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content: string) => setFormData({ ...formData, content })}
                      placeholder="Start writing your project content..."
                    />
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 3: Images & Links */}
            <StepperContent value={3}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon URL</Label>
                  <Input
                    id="icon"
                    type="url"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="https://example.com/icon.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Small square image for project cards (recommended: 64x64 or 128x128)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/thumbnail.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Banner image for project detail page (recommended: 1200x630)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liveUrl">Live Demo URL</Label>
                  <Input
                    id="liveUrl"
                    type="url"
                    value={formData.liveUrl}
                    onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub Repository</Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
            </StepperContent>

            {/* Step 4: Details */}
            <StepperContent value={4}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    placeholder="Type a tag and press Enter"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Technologies</Label>
                  <TagInput
                    value={formData.technologies}
                    onChange={(technologies) => setFormData({ ...formData, technologies })}
                    placeholder="Type a technology and press Enter"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 5: Settings */}
            <StepperContent value={5}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
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

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="featured" className="text-base font-semibold">Featured</Label>
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

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Title:</dt>
                      <dd className="font-medium">{formData.title || 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Slug:</dt>
                      <dd className="font-medium">/{formData.slug || 'not-set'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Has Content:</dt>
                      <dd className="font-medium">{formData.content ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-medium">{formData.published ? 'Published' : 'Draft'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Featured:</dt>
                      <dd className="font-medium">{formData.featured ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </StepperContent>
          </StepperPanel>
        </Stepper>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}