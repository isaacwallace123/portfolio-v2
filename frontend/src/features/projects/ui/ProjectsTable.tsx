'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Star,
  StarOff,
  Search,
  Filter
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import type { Project } from '../lib/types';

interface ProjectsTableProps {
  projects: Project[];
  loading?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onRefresh?: () => void;
}

type FilterStatus = 'all' | 'published' | 'draft' | 'featured';

export function ProjectsTable({
  projects,
  loading = false,
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
  onRefresh,
}: ProjectsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');

  // Get all unique technologies
  const allTechnologies = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((project) => {
      project.technologies?.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort();
  }, [projects]);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.slug.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'published') {
        matchesStatus = project.published;
      } else if (statusFilter === 'draft') {
        matchesStatus = !project.published;
      } else if (statusFilter === 'featured') {
        matchesStatus = project.featured;
      }

      // Technology filter
      const matchesTech =
        selectedTech === 'all' || project.technologies?.includes(selectedTech);

      return matchesSearch && matchesStatus && matchesTech;
    });
  }, [projects, searchQuery, statusFilter, selectedTech]);

  const handleDeleteClick = (id: string, title: string) => {
    setProjectToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDelete(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleCreateDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open && onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage your portfolio projects</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter((p) => p.published).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter((p) => !p.published).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter((p) => p.featured).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="rounded-2xl"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('published')}
              className="rounded-2xl"
            >
              Published
            </Button>
            <Button
              variant={statusFilter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('draft')}
              className="rounded-2xl"
            >
              Drafts
            </Button>
            <Button
              variant={statusFilter === 'featured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('featured')}
              className="rounded-2xl"
            >
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Button>

            {allTechnologies.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-2xl">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedTech === 'all' ? 'Technology' : selectedTech}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Technology</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedTech('all')}>
                    All Technologies
                  </DropdownMenuItem>
                  {allTechnologies.map((tech) => (
                    <DropdownMenuItem key={tech} onClick={() => setSelectedTech(tech)}>
                      {tech}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => setCreateDialogOpen(true)} className="rounded-2xl">
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No projects match your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {project.featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                        <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">/{project.slug}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuItem onClick={() => onEdit(project.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onTogglePublish(project.id, !project.published)}
                        >
                          {project.published ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onToggleFeatured(project.id, !project.featured)}
                        >
                          {project.featured ? (
                            <>
                              <StarOff className="mr-2 h-4 w-4" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              Feature
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(project.id, project.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={project.published ? 'default' : 'secondary'} className="text-xs">
                      {project.published ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs px-2 py-0.5">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 4 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{project.technologies.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(project.id)}
                      className="flex-1 rounded-2xl"
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
                      className="flex-1 rounded-2xl"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectCreateDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogClose}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.title}"? This will also delete all pages and connections associated with this project. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}