"use client";

import { useState } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Sparkles,
  GripVertical,
} from "lucide-react";

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
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
              </Link>
            </Button>
          </div>
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
              <Label htmlFor="skill-icon">Icon Path</Label>
              <Input
                id="skill-icon"
                placeholder="/icons/react.png"
                value={skillForm.icon}
                onChange={(e) =>
                  setSkillForm((f) => ({ ...f, icon: e.target.value }))
                }
              />
              {skillForm.icon && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Image
                    src={skillForm.icon}
                    alt="preview"
                    width={20}
                    height={20}
                    className="rounded"
                    unoptimized
                  />
                  Preview
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
    </div>
  );
}
