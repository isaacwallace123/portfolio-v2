'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCV } from '../hooks/useCV';
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
import type { CVLocale } from '../lib/types';

function CVSection({ locale, label }: { locale: CVLocale; label: string }) {
  const { cvData, uploading, upload, deleteCv, setVisibility } = useCV();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cv = cvData[locale];
  const isUploading = uploading === locale;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        return; // Error will be shown by hook
      }
      upload(file, locale);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    await deleteCv(locale);
    setDeleteDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{label}</h3>

      {cv ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cv.fileName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(cv.fileSize)} MB • Uploaded {formatDate(cv.uploadDate)}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${locale}-visible`}
                    checked={cv.visible}
                    onCheckedChange={(checked) => setVisibility(locale, checked)}
                  />
                  <Label htmlFor={`${locale}-visible`} className="text-xs cursor-pointer">
                    {cv.visible ? (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Visible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    asChild
                  >
                    <a href={cv.filePath} download={cv.fileName}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Replace
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isUploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isUploading
              ? 'pointer-events-none opacity-60'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="mb-2 rounded-full bg-muted p-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Click to upload {label}</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF only, max 10MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The CV file will be permanently deleted.
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

export function CVSettingsCard() {
  return (
    <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CV Management
        </CardTitle>
        <CardDescription>
          Upload and manage your CV/resume files for English and French visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CVSection locale="en" label="English CV" />
        <CVSection locale="fr" label="French CV" />
      </CardContent>
    </Card>
  );
}
