"use client";

import { useState, useMemo } from "react";
import { useUploads } from "@/features/uploads/hooks/useUploads";
import { FileUpload } from "@/features/uploads/ui/FileUpload";
import type { UploadedFile } from "@/features/uploads/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  HardDrive,
  Trash2,
  Copy,
  FileIcon,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

function isImage(name: string) {
  return IMAGE_EXTS.some((ext) => name.toLowerCase().endsWith(ext));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FOLDERS = [
  { value: "all", label: "All" },
  { value: "icons", label: "Icons" },
  { value: "cv_en", label: "CV (EN)" },
  { value: "cv_fr", label: "CV (FR)" },
  { value: "testimonials", label: "Testimonials" },
];

export default function AdminUploadsPage() {
  const { files, loading, uploading, uploadFile, deleteFile, refresh } =
    useUploads();
  const [deletingFile, setDeletingFile] = useState<UploadedFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState("all");
  const [search, setSearch] = useState("");

  const handleDelete = async () => {
    if (!deletingFile) return;
    await deleteFile(deletingFile.key);
    setDeletingFile(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filtered = useMemo(() => {
    let result = files;
    if (activeFolder !== "all") {
      result = result.filter((f) => f.folder === activeFolder);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result;
  }, [files, activeFolder, search]);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HardDrive className="h-8 w-8 text-primary" />
          Uploads
        </h1>
        <p className="text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""} &mdash;{" "}
          {formatSize(totalSize)} total
        </p>
      </div>

      {/* Upload Zone */}
      <FileUpload
        onUploaded={() => refresh()}
        className="max-w-lg"
      />

      {/* Folder Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFolder(f.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                activeFolder === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading files...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-background/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            {files.length === 0
              ? "No files uploaded yet. Drag and drop or click above to upload."
              : "No files match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((file) => (
            <Card
              key={file.key}
              className="group relative overflow-hidden bg-background/80"
            >
              <div className="aspect-square relative">
                {isImage(file.name) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => copyUrl(file.url)}
                  >
                    {copiedUrl === file.url ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setDeletingFile(file)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-3">
                <p className="truncate text-xs font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.folder && (
                    <span className="mr-1.5 rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                      {file.folder}
                    </span>
                  )}
                  {formatSize(file.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deletingFile?.name}&rdquo;.
              Any references to this file will break. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
