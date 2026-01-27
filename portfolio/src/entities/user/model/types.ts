export type Role = "admin";

export type User = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type SessionData = {
  user?: User;
};

export type LoginActionState =
  | null
  | { success: true }
  | { success: false; error: string };
