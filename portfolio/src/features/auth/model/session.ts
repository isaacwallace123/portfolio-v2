import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { redirect } from "next/navigation";
import type { SessionData, User } from "@/features/auth/user";

export const sessionOptions: SessionOptions = {
  cookieName: "portfolio_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, 
  },
};

function assertSessionPassword() {
  const pwd = process.env.SESSION_PASSWORD;
  if (!pwd) {
    throw new Error(
      "SESSION_PASSWORD environment variable is not set. " +
      "Please run 'node generate-auth-secrets.js' to generate one."
    );
  }
  if (pwd.length < 32) {
    throw new Error(
      "SESSION_PASSWORD must be at least 32 characters long. " +
      "Please run 'node generate-auth-secrets.js' to generate a secure one."
    );
  }
}

export async function getSession() {
  assertSessionPassword();
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(user: User) {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

export async function requireAdmin(): Promise<User> {
  const session = await getSession();

  if (!session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return session.user;
}