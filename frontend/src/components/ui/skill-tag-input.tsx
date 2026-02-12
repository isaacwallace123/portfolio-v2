'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { X, Check, Plus } from 'lucide-react';
import { skillsApi } from '@/features/skills/api/skillsApi';
import type { Skill } from '@/features/skills/lib/types';
import Image from 'next/image';
import { toast } from 'sonner';

interface SkillTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function SkillTagInput({ value, onChange, placeholder }: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await skillsApi.getAll();
      setSkills(data);
    } catch {
      // Silently fail — skills dropdown will be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Build a label→icon lookup map
  const skillMap = new Map(skills.map((s) => [s.label.toLowerCase(), s]));

  // Group skills by category for the dropdown
  const search = inputValue.trim().toLowerCase();
  const filtered = search
    ? skills.filter((s) => s.label.toLowerCase().includes(search))
    : skills;

  const grouped = filtered.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category.name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  // Check if the typed text exactly matches an existing skill (case-insensitive)
  const exactMatch = search ? skills.some((s) => s.label.toLowerCase() === search) : true;

  const addTag = (label: string) => {
    if (!value.includes(label)) {
      onChange([...value, label]);
    }
    setInputValue('');
  };

  const removeTag = (label: string) => {
    onChange(value.filter((t) => t !== label));
  };

  const toggleTag = (label: string) => {
    if (value.includes(label)) {
      removeTag(label);
    } else {
      addTag(label);
    }
  };

  const handleCreate = async () => {
    const label = inputValue.trim();
    if (!label) return;

    // Find the "Tools & Other" category, or fallback to last category
    const toolsCategory = skills.find((s) =>
      s.category.name.toLowerCase().includes('tools') ||
      s.category.name.toLowerCase().includes('other')
    );
    const fallbackCategory = skills.length > 0
      ? skills.reduce((a, b) => (a.category.order > b.category.order ? a : b))
      : null;
    const categoryId = toolsCategory?.categoryId || fallbackCategory?.categoryId;

    if (!categoryId) {
      toast.error('No categories found. Please create a skill category first.');
      return;
    }

    try {
      await skillsApi.create({
        label,
        icon: '/uploads/icons/placeholder.png',
        categoryId,
      });
      toast.success(`Created skill "${label}"`);
      await fetchSkills();
      addTag(label);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create skill');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      // If exact match exists, add it directly
      if (exactMatch) {
        const match = skills.find((s) => s.label.toLowerCase() === search);
        if (match && !value.includes(match.label)) {
          addTag(match.label);
        }
      } else {
        // Create new skill
        handleCreate();
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const getSkillIcon = (label: string): string | null => {
    const skill = skillMap.get(label.toLowerCase());
    return skill?.icon || null;
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            className="flex flex-wrap gap-2 p-2 border rounded-md min-h-11 cursor-text bg-background"
            onClick={() => inputRef.current?.focus()}
          >
            {value.map((tag) => {
              const icon = getSkillIcon(tag);
              return (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pl-2 pr-1 py-1.5 text-sm gap-1.5 shrink-0"
                >
                  {icon && (
                    <Image
                      src={icon}
                      alt=""
                      width={16}
                      height={16}
                      className="rounded-sm"
                      unoptimized
                    />
                  )}
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="ml-0.5 rounded-full hover:bg-background/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? (placeholder || 'Search skills or type to add...') : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-1"
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading skills...</div>
              ) : filtered.length === 0 && !inputValue.trim() ? (
                <CommandEmpty>No skills found.</CommandEmpty>
              ) : (
                <>
                  {Object.entries(grouped).map(([categoryName, categorySkills]) => (
                    <CommandGroup key={categoryName} heading={categoryName}>
                      {categorySkills.map((skill) => {
                        const selected = value.includes(skill.label);
                        return (
                          <CommandItem
                            key={skill.id}
                            value={skill.label}
                            onSelect={() => toggleTag(skill.label)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Image
                              src={skill.icon}
                              alt=""
                              width={16}
                              height={16}
                              className="rounded-sm shrink-0"
                              unoptimized
                            />
                            <span className="flex-1">{skill.label}</span>
                            {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}

                  {!exactMatch && inputValue.trim() && (
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreate}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Create &ldquo;{inputValue.trim()}&rdquo;</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        Select from existing skills or type to create new ones.
      </p>
    </div>
  );
}
