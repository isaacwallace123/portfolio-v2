"use server";

import bcrypt from "bcrypt";
import { createSession, destroySession } from "./session";
import type { LoginActionState, User } from "@/entities/user";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? "";

function invalid(): LoginActionState {
  return { success: false, error: "Invalid email or password" };
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return invalid();
  if (!ADMIN_PASSWORD_HASH) {
    return { success: false, error: "Missing ADMIN_PASSWORD_HASH in env" };
  }

  if (email !== ADMIN_EMAIL.toLowerCase()) return invalid();

  const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!ok) return invalid();

  const user: User = {
    id: "admin-1",
    email: ADMIN_EMAIL,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  await createSession(user);
  return { success: true };
}

export async function logoutAction() {
  await destroySession();
}
