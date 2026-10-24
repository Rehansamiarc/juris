"use server";

import { redirect } from "next/navigation";
import {
  consumeResetToken,
  createResetToken,
  endSession,
  hashPassword,
  startSession,
  validateSignup,
  verifyPassword,
} from "@/lib/auth";
import { createUser, findUserByEmail, findUserById, getProfile, saveProfile, updatePassword } from "@/lib/db";
import type { Course } from "@/lib/types";

export interface AuthState {
  error?: string;
  info?: string;
  resetUrl?: string;
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const problem = validateSignup(name, email, password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "The two passwords do not match." };
  if (findUserByEmail(email)) return { error: "An account with this email already exists. Try signing in." };

  const user = createUser({
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    name,
  });
  await startSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Those credentials do not match an account. Check the email and password." };
  }
  await startSession(user.id);
  const profile = getProfile(user.id);
  redirect(profile?.onboardedAt ? "/home" : "/onboarding");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

/** The landing page's demo entrance: opens the seeded account without typing credentials. */
export async function enterDemoAction(_formData?: FormData) {
  const user = findUserByEmail("demo@vidhi.app");
  if (!user) redirect("/login");
  await startSession(user.id);
  const profile = getProfile(user.id);
  redirect(profile?.onboardedAt ? "/home" : "/onboarding");
}

export async function requestResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter the email address on your account." };
  const token = createResetToken(email);
  if (!token) {
    return {
      info: "If an account exists for that address, a one-time reset link has been created. No email provider is configured in this workspace.",
    };
  }
  return {
    info: "A one-time reset link has been created. No email service is configured in this workspace, so the link is shown below — in production this would be emailed.",
    resetUrl: `/reset-password/${token}`,
  };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "Use at least one letter and one number in your password." };
  }
  if (password !== confirm) return { error: "The two passwords do not match." };

  const userId = consumeResetToken(token);
  if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };
  updatePassword(userId, hashPassword(password));
  redirect("/login?reset=1");
}

const COURSES: Course[] = ["LLB", "BA LLB", "BBA LLB", "Judiciary preparation", "Other"];
const GOALS = [
  "Score well in semester exams",
  "Prepare for judiciary services",
  "Build strong conceptual foundations",
  "Improve recall and revision",
  "Prepare for moot court and arguments",
];

export async function completeOnboardingAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const userId = String(formData.get("userId") ?? "");
  if (!userId || !findUserById(userId)) return { error: "Your session expired. Please sign in again." };

  const course = String(formData.get("course") ?? "") as Course;
  if (!COURSES.includes(course)) return { error: "Choose your course." };

  const yearLabel = String(formData.get("yearLabel") ?? "").trim();
  if (!yearLabel) return { error: "Tell us your year or semester." };

  const subjects = formData.getAll("subjects").map(String).filter(Boolean);
  if (subjects.length < 1) return { error: "Pick at least one subject of interest." };

  const goal = String(formData.get("goal") ?? "");
  if (!GOALS.includes(goal)) return { error: "Choose a study goal." };

  const dailyMinutes = Number(formData.get("dailyMinutes") ?? 45);
  if (!Number.isFinite(dailyMinutes) || dailyMinutes < 15 || dailyMinutes > 480) {
    return { error: "Daily study time should be between 15 and 480 minutes." };
  }

  saveProfile(userId, {
    course,
    yearLabel: yearLabel.slice(0, 60),
    subjects,
    goal,
    dailyMinutes: Math.round(dailyMinutes),
  });
  redirect("/home");
}
