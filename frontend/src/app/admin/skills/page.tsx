"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useSkills } from "@/features/skills/hooks/useSkills";
import { useCategories } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/features/categories/lib/types";
import type { Skill } from "@/features/skills/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Sparkles,
  GripVertical,
  ImagePlus,
  Images,
  Loader2,
} from "lucide-react";
import { uploadsApi } from "@/features/uploads/api/uploadsApi";
import type { UploadedFile } from "@/features/uploads/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SkillFormState = {
  label: string;
  icon: string;
  categoryId: string;
};

function SortableCategorySection({
  cat,
  skills,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onEditCategory,
  onDeleteCategory,
}: {
  cat: Category;
  skills: Skill[];
  onAddSkill: (categoryId: string) => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/section ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-1 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {cat.name}
        </p>
        <span className="inline-flex gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onAddSkill(cat.id)}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onEditCategory(cat)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDeleteCategory(cat)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </span>
      </div>
      <div className="flex flex-wrap gap-2 pl-7">
        {skills
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
          .map((skill) => (
            <Badge
              key={skill.id}
              variant="secondary"
              className="rounded-full text-sm pl-2 pr-1 py-1 gap-2 inline-flex items-center group cursor-pointer hover:bg-secondary/80"
              onClick={() => onEditSkill(skill)}
            >
              <Image
                src={skill.icon}
                alt={skill.label}
                width={18}
                height={18}
                className="shrink-0 rounded-sm"
                unoptimized
              />
              {skill.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSkill(skill.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
      </div>
    </div>
  );
}

export default function AdminSkillsPage() {
  const { skills, loading, createSkill, updateSkill, deleteSkill } =
    useSkills();
  const {
    categories,
    setCategories,
    loading: catLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategories();

  // Skill dialog state
  const [skillForm, setSkillForm] = useState<SkillFormState>({
    label: "",
    icon: "",
    categoryId: "",
  });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);

  // Category edit dialog state
  const [catName, setCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  // Category delete confirmation
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  // New category inline input
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  // Icon upload state
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconFiles, setIconFiles] = useState<UploadedFile[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.categoryId] ??= []).push(s);
    return acc;
  }, {});

  // Skill handlers
  const handleSkillSubmit = async () => {
    if (
      !skillForm.label.trim() ||
      !skillForm.icon.trim() ||
      !skillForm.categoryId
    )
      return;

    if (editingSkillId) {
      await updateSkill(editingSkillId, skillForm);
    } else {
      await createSkill({ ...skillForm, order: skills.length });
    }

    setSkillForm({ label: "", icon: "", categoryId: "" });
    setEditingSkillId(null);
    setSkillDialogOpen(false);
  };

  const openAddSkillDialog = (categoryId: string) => {
    setSkillForm({ label: "", icon: "", categoryId });
    setEditingSkillId(null);
    setSkillDialogOpen(true);
  };

  const openEditSkillDialog = (skill: Skill) => {
    setSkillForm({
      label: skill.label,
      icon: skill.icon,
      categoryId: skill.categoryId,
    });
    setEditingSkillId(skill.id);
    setSkillDialogOpen(true);
  };

  // Category handlers
  const openEditCategoryDialog = (cat: Category) => {
    setCatName(cat.name);
    setEditingCatId(cat.id);
    setCatDialogOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!catName.trim() || !editingCatId) return;
    await updateCategory(editingCatId, { name: catName.trim() });
    setCatName("");
    setEditingCatId(null);
    setCatDialogOpen(false);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCat) return;
    await deleteCategory(deletingCat.id);
    setDeletingCat(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategory({
      name: newCatName.trim(),
      order: categories.length,
    });
    setNewCatName("");
    setShowNewCat(false);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (iconInputRef.current) iconInputRef.current.value = "";

    try {
      setUploadingIcon(true);
      const result = await uploadsApi.upload(file, "icons");
      setSkillForm((f) => ({ ...f, icon: result.url }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload icon";
      toast.error(msg);
    } finally {
      setUploadingIcon(false);
    }
  };

  const openIconPicker = async () => {
    setIconPickerOpen(true);
    setLoadingIcons(true);
    try {
      const files = await uploadsApi.list("icons");
      setIconFiles(files);
    } catch {
      toast.error("Failed to load icons");
    } finally {
      setLoadingIcons(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    setCategories(reordered);
    reorderCategories(reordered.map((c) => c.id));
  };

  const selectedCategoryName =
    categories.find((c) => c.id === skillForm.categoryId)?.name ?? "";

  const visibleCategories = categories.filter(
    (cat) => grouped[cat.id]?.length
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Skills
          </h1>
          <p className="text-muted-foreground">
            {skills.length} skill{skills.length !== 1 ? "s" : ""} across{" "}
            {Object.keys(grouped).length} categories
          </p>
        </div>

        {showNewCat ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") {
                  setShowNewCat(false);
                  setNewCatName("");
                }
              }}
              className="h-9 w-48"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewCat(false);
                setNewCatName("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowNewCat(true)} disabled={catLoading}>
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        )}
      </div>

      {/* Skills by Category */}
      {loading || catLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <Card className="bg-background/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No skills yet. Add a category, then add skills to it.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {visibleCategories.map((cat) => (
                <SortableCategorySection
                  key={cat.id}
                  cat={cat}
                  skills={grouped[cat.id]}
                  onAddSkill={openAddSkillDialog}
                  onEditSkill={openEditSkillDialog}
                  onDeleteSkill={deleteSkill}
                  onEditCategory={openEditCategoryDialog}
                  onDeleteCategory={setDeletingCat}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Skill Create/Edit Dialog */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkillId
                ? "Edit Skill"
                : `Add Skill to ${selectedCategoryName}`}
            </DialogTitle>
            <DialogDescription>
              {editingSkillId
                ? "Update the skill details below."
                : "Fill in the details for the new skill."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skill-label">Label</Label>
              <Input
                id="skill-label"
                placeholder="e.g. React"
                value={skillForm.label}
                onChange={(e) =>
                  setSkillForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              {skillForm.icon ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                  <Image
                    src={skillForm.icon}
                    alt="Icon preview"
                    width={28}
                    height={28}
                    className="rounded"
                    unoptimized
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    Selected
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setSkillForm((f) => ({ ...f, icon: "" }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start gap-2 text-muted-foreground"
                    disabled={uploadingIcon}
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {uploadingIcon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {uploadingIcon ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={openIconPicker}
                  >
                    <Images className="h-4 w-4" />
                    Browse
                  </Button>
                </div>
              )}
            </div>
          </div>
          {editingSkillId && (
            <div className="flex justify-start">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteSkill(editingSkillId);
                  setSkillDialogOpen(false);
                  setEditingSkillId(null);
                  setSkillForm({ label: "", icon: "", categoryId: "" });
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Skill
              </Button>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSkillSubmit}
              disabled={
                !skillForm.label.trim() ||
                !skillForm.icon.trim() ||
                !skillForm.categoryId
              }
            >
              {editingSkillId ? "Save Changes" : "Add Skill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Edit Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Rename this category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCategorySubmit();
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCategorySubmit}
              disabled={!catName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <AlertDialog
        open={!!deletingCat}
        onOpenChange={(open) => !open && setDeletingCat(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deletingCat?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category and all its skills.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteCategory}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Icon Picker Dialog */}
      <Dialog open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose an icon</DialogTitle>
          </DialogHeader>
          {loadingIcons ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : iconFiles.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No icons found. Upload one first.
            </p>
          ) : (
            <div className="grid max-h-96 grid-cols-6 gap-3 overflow-y-auto sm:grid-cols-8">
              {iconFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  className={cn(
                    "group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 p-2 transition-colors",
                    skillForm.icon === file.url
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                  onClick={() => {
                    setSkillForm((f) => ({ ...f, icon: file.url }));
                    setIconPickerOpen(false);
                  }}
                >
                  <Image
                    src={file.url}
                    alt={file.name}
                    width={32}
                    height={32}
                    className="rounded"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
