'use client';

import { useState } from 'react';
import { useExperience } from '@/features/experience/hooks/useExperience';
import type { Experience, ExperienceType, CreateExperienceDto } from '@/features/experience/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageUploadField } from '@/features/uploads/ui/ImageUploadField';
import { TagInput } from '@/components/ui/taginput';
import {
  Briefcase,
  GraduationCap,
  Award,
  Heart,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Images,
  X,
} from 'lucide-react';

const TYPE_CONFIG: Record<ExperienceType, {
  icon: typeof Briefcase;
  label: string;
  titleLabel: string;
  orgLabel: string;
}> = {
  WORK: { icon: Briefcase, label: 'Work', titleLabel: 'Role', orgLabel: 'Company' },
  EDUCATION: { icon: GraduationCap, label: 'Education', titleLabel: 'Degree', orgLabel: 'School' },
  CERTIFICATION: { icon: Award, label: 'Certifications', titleLabel: 'Title', orgLabel: 'Issuer' },
  VOLUNTEER: { icon: Heart, label: 'Volunteer', titleLabel: 'Role', orgLabel: 'Organization' },
};

const EMPTY_FORM: CreateExperienceDto = {
  type: 'WORK',
  title: '',
  organization: '',
  description: '',
  location: '',
  jobType: '',
  cause: '',
  startDate: '',
  endDate: '',
  credentialId: '',
  credentialUrl: '',
  skills: [],
  logo: '',
  order: 0,
  media: [],
};

function formatDate(date: string | null) {
  if (!date) return 'Present';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function toInputDate(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export default function AdminExperiencePage() {
  const { experiences, loading, createExperience, updateExperience, deleteExperience } = useExperience();
  const [activeType, setActiveType] = useState<ExperienceType>('WORK');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateExperienceDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const grouped: Record<ExperienceType, Experience[]> = {
    WORK: experiences.filter(e => e.type === 'WORK'),
    EDUCATION: experiences.filter(e => e.type === 'EDUCATION'),
    CERTIFICATION: experiences.filter(e => e.type === 'CERTIFICATION'),
    VOLUNTEER: experiences.filter(e => e.type === 'VOLUNTEER'),
  };

  function openCreate(type: ExperienceType) {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, type });
    setDialogOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditingId(exp.id);
    setFormData({
      type: exp.type,
      title: exp.title,
      organization: exp.organization,
      description: exp.description || '',
      location: exp.location || '',
      jobType: exp.jobType || '',
      cause: exp.cause || '',
      startDate: toInputDate(exp.startDate),
      endDate: toInputDate(exp.endDate),
      credentialId: exp.credentialId || '',
      credentialUrl: exp.credentialUrl || '',
      skills: exp.skills,
      logo: exp.logo || '',
      order: exp.order,
      media: exp.media.map(m => ({
        url: m.url,
        caption: m.caption || '',
        order: m.order,
      })),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await updateExperience(editingId, formData);
      } else {
        await createExperience(formData);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteExperience(deleteId);
    setDeleteId(null);
  }

  function addMediaItem(url: string) {
    setFormData(prev => ({
      ...prev,
      media: [...(prev.media || []), { url, caption: '', order: prev.media?.length || 0 }],
    }));
  }

  function removeMediaItem(index: number) {
    setFormData(prev => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index),
    }));
  }

  function updateMediaCaption(index: number, caption: string) {
    setFormData(prev => ({
      ...prev,
      media: (prev.media || []).map((m, i) => i === index ? { ...m, caption } : m),
    }));
  }

  const type = formData.type;
  const showLocation = type === 'WORK' || type === 'EDUCATION';
  const showJobType = type === 'WORK';
  const showCause = type === 'VOLUNTEER';
  const showEndDate = type !== 'CERTIFICATION';
  const showCredential = type === 'CERTIFICATION';
  const showSkills = type === 'CERTIFICATION';
  const showLogo = type === 'WORK' || type === 'EDUCATION';
  const showDescription = type !== 'CERTIFICATION';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          Experience
        </h1>
        <p className="text-muted-foreground">
          {experiences.length} entries across 4 categories
        </p>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as ExperienceType)}>
        {/* Mobile: dropdown selector */}
        <div className="sm:hidden">
          <Select value={activeType} onValueChange={(v) => setActiveType(v as ExperienceType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TYPE_CONFIG) as [ExperienceType, typeof TYPE_CONFIG.WORK][]).map(([t, config]) => {
                const Icon = config.icon;
                return (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {config.label} ({grouped[t].length})
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: horizontal tabs */}
        <TabsList className="hidden sm:flex">
          {(Object.entries(TYPE_CONFIG) as [ExperienceType, typeof TYPE_CONFIG.WORK][]).map(([t, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={t} value={t} className="gap-2">
                <Icon className="h-4 w-4" />
                {config.label} ({grouped[t].length})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(TYPE_CONFIG) as ExperienceType[]).map((t) => (
          <TabsContent key={t} value={t} className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openCreate(t)}>
                <Plus className="h-4 w-4 mr-2" />
                Add {TYPE_CONFIG[t].label}
              </Button>
            </div>

            {grouped[t].length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No {TYPE_CONFIG[t].label.toLowerCase()} entries yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {grouped[t].map((exp) => (
                  <Card key={exp.id} className="p-4">
                    <div className="flex items-start gap-4">
                      {exp.logo ? (
                        <img src={exp.logo} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold">
                          {exp.organization.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{exp.title}</h3>
                          {!exp.endDate && exp.startDate && (
                            <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500">
                              Active
                            </Badge>
                          )}
                          {exp.media.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Images className="h-3 w-3" />
                              {exp.media.length}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{exp.organization}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.startDate ? formatDate(exp.startDate) : ''}
                          {exp.startDate ? ` — ${formatDate(exp.endDate)}` : ''}
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(exp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Add'} {TYPE_CONFIG[formData.type].label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>{TYPE_CONFIG[formData.type].titleLabel}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={TYPE_CONFIG[formData.type].titleLabel}
              />
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label>{TYPE_CONFIG[formData.type].orgLabel}</Label>
              <Input
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder={TYPE_CONFIG[formData.type].orgLabel}
              />
            </div>

            {/* Description */}
            {showDescription && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  rows={4}
                />
              </div>
            )}

            {/* Location */}
            {showLocation && (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Montreal, Quebec, Canada · Hybrid"
                />
              </div>
            )}

            {/* Job Type */}
            {showJobType && (
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Input
                  value={formData.jobType || ''}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  placeholder="e.g. Full-time, Part-time, Self-employed"
                />
              </div>
            )}

            {/* Cause (Volunteer) */}
            {showCause && (
              <div className="space-y-2">
                <Label>Cause</Label>
                <Input
                  value={formData.cause || ''}
                  onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  placeholder="e.g. Children, Education, Environment"
                />
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{showCredential ? 'Issue Date' : 'Start Date'}</Label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              {showEndDate && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for active/present</p>
                </div>
              )}
            </div>

            {/* Credential fields */}
            {showCredential && (
              <>
                <div className="space-y-2">
                  <Label>Credential ID</Label>
                  <Input
                    value={formData.credentialId || ''}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    placeholder="e.g. 6-1C6-V4QAX8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credential URL</Label>
                  <Input
                    value={formData.credentialUrl || ''}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* Skills (Certification) */}
            {showSkills && (
              <div className="space-y-2">
                <Label>Skills</Label>
                <TagInput
                  value={formData.skills || []}
                  onChange={(skills) => setFormData({ ...formData, skills })}
                  placeholder="Type a skill and press Enter"
                />
              </div>
            )}

            {/* Logo */}
            {showLogo && (
              <ImageUploadField
                label="Logo"
                value={formData.logo || ''}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                hint="Company or school logo"
                aspect="square"
              />
            )}

            {/* Order */}
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={formData.order ?? 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Media Gallery */}
            <div className="space-y-3">
              <Label>Media Gallery</Label>
              {(formData.media || []).length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {(formData.media || []).map((m, i) => (
                    <div key={i} className="relative space-y-2 rounded-lg border p-2">
                      <div className="aspect-video overflow-hidden rounded bg-muted">
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                      </div>
                      <Input
                        value={m.caption || ''}
                        onChange={(e) => updateMediaCaption(i, e.target.value)}
                        placeholder="Caption (optional)"
                        className="text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
                        onClick={() => removeMediaItem(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUploadField
                label="Add Image"
                value=""
                onChange={(url) => { if (url) addMediaItem(url); }}
                hint="Upload images from this experience"
                aspect="video"
              />
            </div>

            {/* Save */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formData.title || !formData.organization}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry and all its media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
