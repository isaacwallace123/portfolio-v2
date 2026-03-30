'use client';

import { useState } from 'react';
import { useContacts } from '@/features/contacts/hooks/useContacts';
import type { ContactMessage } from '@/features/contacts/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Mail,
  Trash2,
  Eye,
  Archive,
  MailOpen,
  Clock,
  CheckCircle2,
  ArchiveIcon,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  unread: { label: 'Unread', variant: 'default' as const, icon: Clock },
  read:   { label: 'Read',   variant: 'outline' as const, icon: CheckCircle2 },
  archived: { label: 'Archived', variant: 'secondary' as const, icon: ArchiveIcon },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
      {children}
    </p>
  );
}

export default function AdminContactsPage() {
  const { contacts, loading, updateStatus, deleteContact } = useContacts();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unread    = contacts.filter((c) => c.status === 'unread');
  const read      = contacts.filter((c) => c.status === 'read');
  const archived  = contacts.filter((c) => c.status === 'archived');

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteContact(deletingId);
    setDeletingId(null);
  };

  const renderContact = (contact: ContactMessage) => {
    const config = statusConfig[contact.status];
    const StatusIcon = config.icon;
    const isExpanded = expandedId === contact.id;
    const isUnread = contact.status === 'unread';

    return (
      <Card
        key={contact.id}
        className={cn(
          'transition-colors',
          isUnread
            ? 'border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.05] backdrop-blur'
            : 'bg-background/80'
        )}
      >
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header row — clickable to expand */}
            <button
              className="w-full text-left"
              onClick={() => setExpandedId(isExpanded ? null : contact.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <p className={cn('truncate font-medium', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                      {contact.name}
                    </p>
                    <Badge variant={config.variant} className="gap-1 shrink-0 text-[10px]">
                      <StatusIcon className="h-2.5 w-2.5" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{contact.email}</p>
                  <p className={cn('truncate text-sm mt-0.5', isUnread ? 'font-medium text-foreground/90' : 'text-muted-foreground')}>
                    {contact.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')} />
                </div>
              </div>
            </button>

            {/* Expanded message */}
            {isExpanded && (
              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 flex-wrap">
              {contact.status === 'unread' && (
                <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => updateStatus(contact.id, 'read')}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Mark Read
                </Button>
              )}
              {contact.status === 'read' && (
                <Button variant="ghost" size="sm" className="h-8"
                  onClick={() => updateStatus(contact.id, 'unread')}>
                  <MailOpen className="mr-1 h-3.5 w-3.5" /> Mark Unread
                </Button>
              )}
              {contact.status !== 'archived' && (
                <Button variant="ghost" size="sm" className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => updateStatus(contact.id, 'archived')}>
                  <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                </Button>
              )}
              {contact.status === 'archived' && (
                <Button variant="ghost" size="sm" className="h-8"
                  onClick={() => updateStatus(contact.id, 'read')}>
                  <MailOpen className="mr-1 h-3.5 w-3.5" /> Unarchive
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeletingId(contact.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
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
          <Mail className="h-8 w-8 text-primary shrink-0" />
          Contacts
        </h1>
        <p className="text-muted-foreground">
          {contacts.length} message{contacts.length !== 1 ? 's' : ''}
          {unread.length > 0 && (
            <span className="ml-1 inline-flex items-center gap-1 text-primary font-medium">
              — {unread.length} unread
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardContent className="py-16 text-center space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/25 mx-auto" />
            <p className="text-muted-foreground">No messages yet.</p>
            <p className="text-sm text-muted-foreground/60">They&apos;ll show up here when someone uses the contact form.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {unread.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Unread ({unread.length})</SectionLabel>
              <div className="space-y-3">{unread.map(renderContact)}</div>
            </div>
          )}
          {read.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Read ({read.length})</SectionLabel>
              <div className="space-y-3">{read.map(renderContact)}</div>
            </div>
          )}
          {archived.length > 0 && (
            <div className="space-y-3">
              <SectionLabel>Archived ({archived.length})</SectionLabel>
              <div className="space-y-3">{archived.map(renderContact)}</div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
