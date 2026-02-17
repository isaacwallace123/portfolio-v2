export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type CreateContactDto = {
  name: string;
  email: string;
  subject: string;
  message: string;
  _hp_field?: string;
  _timestamp?: number;
};

export type UpdateContactDto = {
  status?: 'unread' | 'read' | 'archived';
};
