"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSkills } from "@/features/skills/hooks/useSkills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const CATEGORIES = [
  "Languages",
  "Frontend",
  "Backend",
  "Databases",
  "DevOps & Infra",
  "Observability",
  "Cloud & OS",
  "Tools & Other",
];

type FormState = {
  label: string;
  icon: string;
  category: string;
};

const emptyForm: FormState = { label: "", icon: "", category: CATEGORIES[0] };

export default function AdminSkillsPage() {
  const { skills, loading, createSkill, updateSkill, deleteSkill } = useSkills();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const grouped = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const handleSubmit = async () => {
    if (!form.label.trim() || !form.icon.trim()) return;

    if (editingId) {
      await updateSkill(editingId, form);
    } else {
      await createSkill({ ...form, order: skills.length });
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (skill: (typeof skills)[number]) => {
    setForm({ label: skill.label, icon: skill.icon, category: skill.category });
    setEditingId(skill.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

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

        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" /> Add Skill
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {editingId ? "Edit Skill" : "Add Skill"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g. React"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon Path</Label>
                <Input
                  id="icon"
                  placeholder="/icons/react.png"
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                />
                {form.icon && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Image
                      src={form.icon}
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="category"
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {form.category}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuRadioGroup
                      value={form.category}
                      onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <DropdownMenuRadioItem key={c} value={c}>
                          {c}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelForm}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!form.label.trim() || !form.icon.trim()}
              >
                {editingId ? "Save Changes" : "Add Skill"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills by Category */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <Card className="bg-background/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No skills yet. Click &quot;Add Skill&quot; to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[
            ...CATEGORIES.filter((cat) => grouped[cat]?.length),
            ...Object.keys(grouped).filter((cat) => !CATEGORIES.includes(cat)),
          ].map((cat) => (
            <div key={cat}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                {cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {grouped[cat]
                  .sort(
                    (a, b) =>
                      a.order - b.order || a.label.localeCompare(b.label)
                  )
                  .map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="rounded-full text-sm pl-2 pr-1 py-1 gap-2 inline-flex items-center group"
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
                      <span className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(skill)}
                          className="p-0.5 rounded hover:bg-muted"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
