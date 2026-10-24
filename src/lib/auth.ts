import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { findUserByEmail, findUserById, getProfile, one, run, nowIso } from "./db";
import type { ProfileRecord, UserRecord } from "./types";
import { hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };

const COOKIE_NAME = "vidhi_session";
const SESSION_DAYS = 30;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  run(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    digest(token),
    userId,
    expires.toISOString(),
    nowIso(),
  );
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) run("DELETE FROM sessions WHERE id = ?", digest(token));
  jar.delete(COOKIE_NAME);
}

export const currentUser = cache(async (): Promise<UserRecord | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = one<{ userId: string; expiresAt: string }>(
    "SELECT user_id as \"userId\", expires_at as \"expiresAt\" FROM sessions WHERE id = ?",
    digest(token),
  );
  if (!row) return null;
  if (row.expiresAt < nowIso()) {
    run("DELETE FROM sessions WHERE id = ?", digest(token));
    return null;
  }
  return findUserById(row.userId) ?? null;
});

export async function requireUser(): Promise<UserRecord> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export type SessionContext = { user: UserRecord; profile: ProfileRecord | undefined };

export async function requireSession(): Promise<SessionContext> {
  const user = await requireUser();
  const profile = getProfile(user.id);
  if (!profile || !profile.onboardedAt) redirect("/onboarding");
  return { user, profile };
}

export async function requireOnboarding(): Promise<SessionContext> {
  const user = await requireUser();
  return { user, profile: getProfile(user.id) };
}

/* ----------------------------- password recovery ---------------------------- */

export function createResetToken(email: string): string | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  run(
    "INSERT INTO reset_tokens (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    digest(token),
    user.id,
    expires,
    nowIso(),
  );
  return token;
}

export function consumeResetToken(token: string): string | null {
  const row = one<{ userId: string; expiresAt: string; usedAt: string | null }>(
    "SELECT user_id as \"userId\", expires_at as \"expiresAt\", used_at as \"usedAt\" FROM reset_tokens WHERE id = ?",
    digest(token),
  );
  if (!row || row.usedAt || row.expiresAt < nowIso()) return null;
  run("UPDATE reset_tokens SET used_at = ? WHERE id = ?", nowIso(), digest(token));
  return row.userId;
}

/* -------------------------------- validation ------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(name: string, email: string, password: string): string | null {
  if (name.trim().length < 2) return "Please enter your full name.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Use at least one letter and one number in your password.";
  return null;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new Error("Cross-origin request blocked");
  } catch {
    throw new Error("Cross-origin request blocked");
  }
}
