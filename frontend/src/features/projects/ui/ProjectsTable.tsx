'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  StarOff
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
      // Refresh the projects list when dialog closes after successful creation
      onRefresh();
    }
  };

  return (
    <>
      <div className="space-y-6">
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

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>View and manage all your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setCreateDialogOpen(true)} className="rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first project
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Technologies</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {project.featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <div>
                              <div className="font-medium">{project.title}</div>
                              <div className="text-sm text-muted-foreground">/{project.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.published ? 'default' : 'secondary'}>
                            {project.published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies?.slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {project.technologies && project.technologies.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.technologies.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              
                              <DropdownMenuItem asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start font-normal"
                                  onClick={() => onEdit(project.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start font-normal"
                                  onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start font-normal"
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
                                </Button>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start font-normal"
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
                                </Button>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start font-normal text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(project.id, project.title)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
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