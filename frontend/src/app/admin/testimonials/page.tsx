"use client";

import { useState } from "react";
import Link from "next/link";
import { useTestimonials } from "@/features/testimonials/hooks/useTestimonials";
import { StarRating } from "@/features/testimonials/ui/StarRating";
import type { Testimonial } from "@/features/testimonials/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Check,
  X,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

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
      <Card key={t.id} className="bg-background/80">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar size="lg" className="mt-0.5 shrink-0">
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

              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.message}
              </p>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Testimonials
        </h1>
        <p className="text-muted-foreground">
          {testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}{" "}
          &mdash; {pending.length} pending review
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading testimonials...
        </div>
      ) : testimonials.length === 0 ? (
        <Card className="bg-background/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No testimonials yet. They&apos;ll show up here once someone submits one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Pending Review ({pending.length})
              </p>
              <div className="space-y-3">
                {pending.map(renderTestimonial)}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Approved ({approved.length})
              </p>
              <div className="space-y-3">
                {approved.map(renderTestimonial)}
              </div>
            </div>
          )}

          {rejected.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Rejected ({rejected.length})
              </p>
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
