'use client';

import { useState, useEffect } from 'react';
import { contactsApi } from '../api/contactsApi';
import type { ContactMessage } from '../lib/types';
import { toast } from 'sonner';

export function useContacts() {
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsApi.getAll();
      setContacts(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const updateStatus = async (id: string, status: 'unread' | 'read' | 'archived') => {
    try {
      await contactsApi.update(id, { status });
      toast.success(`Marked as ${status}`);
      await fetchContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact';
      toast.error(message);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactsApi.delete(id);
      toast.success('Message deleted');
      await fetchContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact';
      toast.error(message);
    }
  };

  return {
    contacts,
    loading,
    error,
    refresh: fetchContacts,
    updateStatus,
    deleteContact,
  };
}
