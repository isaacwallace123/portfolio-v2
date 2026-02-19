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
import { UrlInput } from '@/components/ui/url-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, ArrowLeft, Github, Check, Star, GitFork } from 'lucide-react';
import { TagInput } from '@/components/ui/taginput';
import { SkillTagInput } from '@/components/ui/skill-tag-input';
import { ImageUploadField } from '@/features/uploads/ui/ImageUploadField';
import { Badge } from '@/components/ui/badge';
import { githubApi } from '@/features/github/api/githubApi';
import type { GithubRepo } from '@/features/github/lib/types';
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
  { id: 2, name: 'Images & Links', description: 'Add project images and links' },
  { id: 3, name: 'Details', description: 'Add tags, technologies, and dates' },
  { id: 4, name: 'Settings', description: 'Configure project visibility' },
];

export function ProjectCreateDialog({ open, onOpenChange }: ProjectCreateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [repoPickerOpen, setRepoPickerOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposFetched, setReposFetched] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
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

  const openRepoPicker = async () => {
    setRepoPickerOpen(true);
    if (!reposFetched) {
      try {
        setLoadingRepos(true);
        const data = await githubApi.getStats();
        setGithubRepos(data.repos);
        setReposFetched(true);
      } catch {
        toast.error('Failed to load GitHub repositories');
      } finally {
        setLoadingRepos(false);
      }
    }
  };

  const importFromRepo = (repo: GithubRepo) => {
    setSelectedRepo(repo.name);

    const title = repo.name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: slug.slice(0, CHAR_LIMITS.slug),
      description: repo.description || '',
      excerpt: repo.description?.slice(0, CHAR_LIMITS.excerpt) || '',
      githubUrl: repo.html_url,
      technologies: repo.languages.length > 0 ? repo.languages : prev.technologies,
      tags: repo.language ? [repo.language] : prev.tags,
    }));

    setRepoPickerOpen(false);
    toast.success(`Imported from ${repo.name} — you can edit any field`);
  };

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
    if (!formData.title || !formData.slug) {
      toast.error('Title and slug are required');
      return;
    }

    setLoading(true);

    // Generate default overview content using the block system
    const defaultContent = JSON.stringify([
      { id: crypto.randomUUID(), type: 'heading', props: { level: 2, text: formData.title } },
      { id: crypto.randomUUID(), type: 'paragraph', props: { html: '<p>Add your project overview here...</p>' } },
    ]);

    try {
      // Step 1: Create the project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, content: defaultContent }),
      });

      if (!projectResponse.ok) {
        const error = await projectResponse.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const project = await projectResponse.json();

      // Step 2: Create the default start page with generated content
      try {
        const pageResponse = await fetch(`/api/project-pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            title: 'Overview',
            slug: 'overview',
            content: defaultContent,
            isStartPage: true,
            order: 0,
          }),
        });

        if (!pageResponse.ok) {
          toast.error('Project created but failed to create overview page. You can add it manually.');
        }
      } catch {
        toast.error('Project created but failed to create overview page. You can add it manually.');
      }

      toast.success('Project created successfully!');

      // Reset form and close dialog
      onOpenChange(false);
      resetForm();

      // Navigate to edit page
      router.push(`/admin/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedRepo(null);
    setGithubRepos([]);
    setReposFetched(false);
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

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <>
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
                  {/* Import from GitHub button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openRepoPicker}
                    className="w-full gap-2 border-dashed"
                  >
                    <Github className="h-4 w-4" />
                    {selectedRepo ? `Imported: ${selectedRepo}` : 'Import from GitHub'}
                  </Button>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
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
                      rows={3}
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

              {/* Step 2: Images & Links */}
              <StepperContent value={2}>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ImageUploadField
                      label="Icon"
                      value={formData.icon}
                      onChange={(url) => setFormData({ ...formData, icon: url })}
                      hint="Small square image for project cards (64x64 or 128x128)"
                      aspect="square"
                    />
                    <ImageUploadField
                      label="Thumbnail"
                      value={formData.thumbnail}
                      onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                      hint="Banner image for project detail page (1200x630)"
                      aspect="banner"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liveUrl">Live Demo URL</Label>
                    <UrlInput
                      id="liveUrl"
                      value={formData.liveUrl}
                      onChange={(url) => setFormData({ ...formData, liveUrl: url })}
                      placeholder="example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub Repository</Label>
                    <UrlInput
                      id="githubUrl"
                      value={formData.githubUrl}
                      onChange={(url) => setFormData({ ...formData, githubUrl: url })}
                      placeholder="github.com/username/repo"
                    />
                  </div>
                </div>
              </StepperContent>

              {/* Step 3: Details */}
              <StepperContent value={3}>
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
                    <SkillTagInput
                      value={formData.technologies}
                      onChange={(technologies) => setFormData({ ...formData, technologies })}
                      placeholder="Search skills or type to add..."
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

              {/* Step 4: Settings */}
              <StepperContent value={4}>
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

      {/* GitHub Repo Picker — separate modal on top */}
      <Dialog open={repoPickerOpen} onOpenChange={setRepoPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Select Repository
            </DialogTitle>
            <DialogDescription>
              Choose a repository to import project details from.
            </DialogDescription>
          </DialogHeader>

          {loadingRepos ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : githubRepos.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {githubRepos.map((repo) => (
                <Button
                  key={repo.name}
                  type="button"
                  variant="outline"
                  onClick={() => importFromRepo(repo)}
                  className={`w-full h-auto flex items-center justify-between p-3 text-left ${
                    selectedRepo === repo.name ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-sm">{repo.name}</span>
                      {repo.language && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5 font-normal">
                        {repo.description}
                      </p>
                    )}
                    {repo.languages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {repo.languages.slice(0, 5).map((lang) => (
                          <span key={lang} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-normal">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-normal">
                        <Star className="h-3 w-3" />
                        {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-normal">
                        <GitFork className="h-3 w-3" />
                        {repo.forks}
                      </span>
                    )}
                    {selectedRepo === repo.name && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No repositories found. Configure your GitHub username in Settings first.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
