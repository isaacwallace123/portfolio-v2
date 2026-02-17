'use client';

import { useState } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  Upload,
  Gamepad2,
  Camera,
  Music,
  Book,
  Plane,
  Coffee,
  Palette,
  Code,
  Dumbbell,
  Film,
  Guitar,
  Bike,
  Mountain,
  Tv,
  Utensils,
  Wine,
  Sparkles,
  Heart,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHobbies } from '@/features/hobbies/hooks/useHobbies';
import { FileUpload } from '@/features/uploads/ui/FileUpload';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import Image from 'next/image';

// Popular hobby icons
const HOBBY_ICONS: { icon: LucideIcon; name: string; category: string }[] = [
  { icon: Gamepad2, name: 'Gaming', category: 'Entertainment' },
  { icon: Camera, name: 'Photography', category: 'Creative' },
  { icon: Music, name: 'Music', category: 'Creative' },
  { icon: Book, name: 'Reading', category: 'Learning' },
  { icon: Plane, name: 'Travel', category: 'Adventure' },
  { icon: Coffee, name: 'Coffee', category: 'Food & Drink' },
  { icon: Palette, name: 'Art', category: 'Creative' },
  { icon: Code, name: 'Coding', category: 'Tech' },
  { icon: Dumbbell, name: 'Fitness', category: 'Sports' },
  { icon: Film, name: 'Movies', category: 'Entertainment' },
  { icon: Guitar, name: 'Instruments', category: 'Creative' },
  { icon: Bike, name: 'Cycling', category: 'Sports' },
  { icon: Mountain, name: 'Hiking', category: 'Adventure' },
  { icon: Tv, name: 'TV Shows', category: 'Entertainment' },
  { icon: Utensils, name: 'Cooking', category: 'Food & Drink' },
  { icon: Wine, name: 'Wine Tasting', category: 'Food & Drink' },
  { icon: Sparkles, name: 'Other', category: 'Other' },
  { icon: Heart, name: 'Passion', category: 'Other' },
  { icon: Star, name: 'Favorites', category: 'Other' },
  { icon: Zap, name: 'Energy', category: 'Other' },
];

type HobbyFormState = {
  label: string;
  labelFr: string;
  icon: string;
  iconType: 'lucide' | 'custom';
  lucideIcon: string;
};

function SortableHobbyItem({ hobby, onEdit, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: hobby.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if icon is a lucide icon name or a URL
  const isLucideIcon = hobby.icon && !hobby.icon.startsWith('http') && !hobby.icon.startsWith('/');
  const LucideIconComponent = isLucideIcon
    ? HOBBY_ICONS.find((i) => (i.icon.displayName || i.icon.name) === hobby.icon)?.icon
    : null;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1">
      <button
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer"
        onClick={onEdit}
      >
        {hobby.icon && (
          <>
            {LucideIconComponent ? (
              <LucideIconComponent className="h-4 w-4" />
            ) : (
              <Image
                src={hobby.icon}
                alt={hobby.label}
                width={18}
                height={18}
                className="rounded"
                unoptimized
              />
            )}
          </>
        )}
        <span>{hobby.label}</span>
        {hobby.labelFr && (
          <span className="text-xs text-muted-foreground">({hobby.labelFr})</span>
        )}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-auto"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function HobbiesAdminPage() {
  const { hobbies, loading, createHobby, updateHobby, deleteHobby, reorderHobbies } = useHobbies();

  // Dialog states
  const [hobbyDialogOpen, setHobbyDialogOpen] = useState(false);
  const [editingHobbyId, setEditingHobbyId] = useState<string | null>(null);
  const [hobbyForm, setHobbyForm] = useState<HobbyFormState>({
    label: '',
    labelFr: '',
    icon: '',
    iconType: 'lucide',
    lucideIcon: 'Gamepad2',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hobbyToDelete, setHobbyToDelete] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = hobbies.findIndex((h) => h.id === active.id);
    const newIndex = hobbies.findIndex((h) => h.id === over.id);

    const reordered = arrayMove(hobbies, oldIndex, newIndex);
    const ids = reordered.map((h) => h.id);
    reorderHobbies(ids);
  };

  const openCreateDialog = () => {
    setEditingHobbyId(null);
    setHobbyForm({
      label: '',
      labelFr: '',
      icon: '',
      iconType: 'lucide',
      lucideIcon: 'Gamepad2',
    });
    setHobbyDialogOpen(true);
  };

  const openEditDialog = (hobby: any) => {
    setEditingHobbyId(hobby.id);
    // Detect if icon is a lucide icon name or a URL
    const isLucideIcon = hobby.icon && !hobby.icon.startsWith('http') && !hobby.icon.startsWith('/');
    setHobbyForm({
      label: hobby.label,
      labelFr: hobby.labelFr || '',
      icon: !isLucideIcon ? hobby.icon || '' : '',
      iconType: isLucideIcon ? 'lucide' : 'custom',
      lucideIcon: isLucideIcon ? hobby.icon : 'Gamepad2',
    });
    setHobbyDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!hobbyForm.label.trim()) {
      toast.error('Label is required');
      return;
    }

    try {
      // Determine final icon value based on iconType
      const finalIcon = hobbyForm.iconType === 'lucide' ? hobbyForm.lucideIcon : hobbyForm.icon;

      const payload = {
        label: hobbyForm.label,
        labelFr: hobbyForm.labelFr || undefined,
        icon: finalIcon || undefined,
      };

      if (editingHobbyId) {
        await updateHobby(editingHobbyId, payload);
      } else {
        await createHobby(payload);
      }
      setHobbyDialogOpen(false);
    } catch {
      // Error handled in hook
    }
  };

  const confirmDelete = (id: string) => {
    setHobbyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!hobbyToDelete) return;
    try {
      await deleteHobby(hobbyToDelete);
      setDeleteDialogOpen(false);
      setHobbyToDelete(null);
    } catch {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading hobbies...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hobbies & Interests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal hobbies and interests
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Hobby
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hobbies ({hobbies.length})</CardTitle>
          <CardDescription>Drag to reorder, click to edit</CardDescription>
        </CardHeader>
        <CardContent>
          {hobbies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hobbies yet. Click &quot;Add Hobby&quot; to get started.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={hobbies.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {hobbies.map((hobby) => (
                    <SortableHobbyItem
                      key={hobby.id}
                      hobby={hobby}
                      onEdit={() => openEditDialog(hobby)}
                      onDelete={() => confirmDelete(hobby.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={hobbyDialogOpen} onOpenChange={setHobbyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHobbyId ? 'Edit Hobby' : 'Add Hobby'}</DialogTitle>
            <DialogDescription>
              {editingHobbyId ? 'Update hobby information' : 'Create a new hobby entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (English) *</Label>
              <Input
                id="label"
                placeholder="Gaming"
                value={hobbyForm.label}
                onChange={(e) => setHobbyForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labelFr">Label (French)</Label>
              <Input
                id="labelFr"
                placeholder="Jeux vidéo"
                value={hobbyForm.labelFr}
                onChange={(e) => setHobbyForm((prev) => ({ ...prev, labelFr: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Tabs
                value={hobbyForm.iconType}
                onValueChange={(value) =>
                  setHobbyForm((prev) => ({ ...prev, iconType: value as 'lucide' | 'custom' }))
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lucide">Lucide Icons</TabsTrigger>
                  <TabsTrigger value="custom">Custom Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="lucide" className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {HOBBY_ICONS.map(({ icon: Icon, name }) => {
                      const iconName = Icon.displayName || Icon.name;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() =>
                            setHobbyForm((prev) => ({ ...prev, lucideIcon: iconName }))
                          }
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                            hobbyForm.lucideIcon === iconName
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-[10px] text-center">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {hobbyForm.lucideIcon && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Selected:</span>
                      <Badge variant="secondary" className="gap-1">
                        {(() => {
                          const selected = HOBBY_ICONS.find(
                            (i) => (i.icon.displayName || i.icon.name) === hobbyForm.lucideIcon
                          );
                          const SelectedIcon = selected?.icon;
                          return SelectedIcon ? <SelectedIcon className="h-3 w-3" /> : null;
                        })()}
                        {hobbyForm.lucideIcon}
                      </Badge>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="space-y-3">
                  <FileUpload
                    accept="image/*"
                    maxSize={2 * 1024 * 1024}
                    onUploaded={(result) => {
                      setHobbyForm((prev) => ({ ...prev, icon: result.url }));
                    }}
                  />
                  {hobbyForm.icon && (
                    <div className="flex items-center gap-2 p-2 border rounded-lg">
                      <Image
                        src={hobbyForm.icon}
                        alt="Icon preview"
                        width={32}
                        height={32}
                        className="rounded"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Custom icon</p>
                        <p className="text-xs text-muted-foreground truncate">{hobbyForm.icon}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={!hobbyForm.label.trim()}>
              {editingHobbyId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hobby?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The hobby will be permanently removed.
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
