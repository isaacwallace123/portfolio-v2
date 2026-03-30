"use client";

import { useState } from "react";
import { useTestimonials } from "@/features/testimonials/hooks/useTestimonials";
import { StarRating } from "@/features/testimonials/ui/StarRating";
import type { Testimonial } from "@/features/testimonials/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check,
  X,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
      {children}
    </p>
  );
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export default function AdminTestimonialsPage() {
  const {
    testimonials,
    loading,
    approveTestimonial,
    rejectTestimonial,
    deleteTestimonial,
  } = useTestimonials();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pending = testimonials.filter((t) => t.status === "pending");
  const approved = testimonials.filter((t) => t.status === "approved");
  const rejected = testimonials.filter((t) => t.status === "rejected");

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteTestimonial(deletingId);
    setDeletingId(null);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const renderTestimonial = (t: Testimonial) => {
    const config = statusConfig[t.status];
    const StatusIcon = config.icon;

    return (
      <Card key={t.id} className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 mt-0.5 shrink-0">
              {t.avatar && <AvatarImage src={t.avatar} alt={t.name} />}
              <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.name}</p>
                  {t.role && (
                    <p className="truncate text-sm text-muted-foreground">
                      {t.role}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={config.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>

              <StarRating value={t.rating} readonly size={14} />

              <p className="text-sm leading-relaxed text-foreground/80">
                {t.message}
              </p>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="flex items-center gap-1 flex-wrap">
                  {t.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      onClick={() => approveTestimonial(t.id)}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                  )}
                  {t.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                      onClick={() => rejectTestimonial(t.id)}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(t.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-linear-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          <MessageSquare className="h-8 w-8 text-primary shrink-0" />
          Testimonials
        </h1>
        <p className="text-muted-foreground">
          {testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}{" "}
          &mdash; {pending.length} pending review
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-7 w-20 rounded-md" />
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardContent className="py-16 text-center space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/25 mx-auto" />
            <p className="text-muted-foreground">No testimonials yet.</p>
            <p className="text-sm text-muted-foreground/60">They&apos;ll show up here once someone submits one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Pending Review ({pending.length})</SectionLabel>
              <div className="space-y-3">
                {pending.map(renderTestimonial)}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Approved ({approved.length})</SectionLabel>
              <div className="space-y-3">
                {approved.map(renderTestimonial)}
              </div>
            </div>
          )}

          {rejected.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Rejected ({rejected.length})</SectionLabel>
              <div className="space-y-3">
                {rejected.map(renderTestimonial)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the testimonial. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
