'use client';

import { useState } from 'react';
import { useContacts } from '@/features/contacts/hooks/useContacts';
import type { ContactMessage } from '@/features/contacts/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

const statusConfig = {
  unread: {
    label: 'Unread',
    variant: 'default' as const,
    icon: Clock,
  },
  read: {
    label: 'Read',
    variant: 'outline' as const,
    icon: CheckCircle2,
  },
  archived: {
    label: 'Archived',
    variant: 'secondary' as const,
    icon: ArchiveIcon,
  },
};

export default function AdminContactsPage() {
  const { contacts, loading, updateStatus, deleteContact } = useContacts();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unread = contacts.filter((c) => c.status === 'unread');
  const read = contacts.filter((c) => c.status === 'read');
  const archived = contacts.filter((c) => c.status === 'archived');

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteContact(deletingId);
    setDeletingId(null);
  };

  const renderContact = (contact: ContactMessage) => {
    const config = statusConfig[contact.status];
    const StatusIcon = config.icon;
    const isExpanded = expandedId === contact.id;

    return (
      <Card
        key={contact.id}
        className={`bg-background/80 ${contact.status === 'unread' ? 'border-primary/30' : ''}`}
      >
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : contact.id)}
              >
                <div className="flex items-center gap-2">
                  <p className={`truncate font-medium ${contact.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {contact.name}
                  </p>
                  <Badge variant={config.variant} className="gap-1 shrink-0">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{contact.email}</p>
                <p className={`truncate text-sm mt-1 ${contact.status === 'unread' ? 'font-medium' : 'text-muted-foreground'}`}>
                  {contact.subject}
                </p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {new Date(contact.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Expanded message */}
            {isExpanded && (
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pt-1">
              {contact.status === 'unread' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => updateStatus(contact.id, 'read')}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Mark Read
                </Button>
              )}
              {contact.status === 'read' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => updateStatus(contact.id, 'unread')}
                >
                  <MailOpen className="mr-1 h-3.5 w-3.5" />
                  Mark Unread
                </Button>
              )}
              {contact.status !== 'archived' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => updateStatus(contact.id, 'archived')}
                >
                  <Archive className="mr-1 h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              {contact.status === 'archived' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => updateStatus(contact.id, 'read')}
                >
                  <MailOpen className="mr-1 h-3.5 w-3.5" />
                  Unarchive
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() => setDeletingId(contact.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          Contacts
        </h1>
        <p className="text-muted-foreground">
          {contacts.length} message{contacts.length !== 1 ? 's' : ''}
          {unread.length > 0 && ` — ${unread.length} unread`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading messages...
        </div>
      ) : contacts.length === 0 ? (
        <Card className="bg-background/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No messages yet. They&apos;ll show up here when someone uses the contact form.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {unread.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Unread ({unread.length})
              </p>
              <div className="space-y-3">{unread.map(renderContact)}</div>
            </div>
          )}

          {read.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Read ({read.length})
              </p>
              <div className="space-y-3">{read.map(renderContact)}</div>
            </div>
          )}

          {archived.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Archived ({archived.length})
              </p>
              <div className="space-y-3">{archived.map(renderContact)}</div>
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
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact message. This action cannot be undone.
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
