import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { redirect } from "next/navigation";
import type { SessionData, User } from "@/entities/user";

export const sessionOptions: SessionOptions = {
  cookieName: "portfolio_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

function assertSessionPassword() {
  const pwd = process.env.SESSION_PASSWORD;
  if (!pwd || pwd.length < 32) {
    throw new Error("SESSION_PASSWORD must be set and at least 32 characters long.");
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
