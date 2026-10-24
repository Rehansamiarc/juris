"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  addDeadline,
  deleteDeadline,
  saveProfile,
  toggleDeadline,
  updateUserName,
} from "@/lib/db";
import type { Course } from "@/lib/types";

export interface ProfileState {
  ok?: boolean;
  error?: string;
  message?: string;
}

const COURSES: Course[] = ["LLB", "BA LLB", "BBA LLB", "Judiciary preparation", "Other"];
const GOALS = [
  "Score well in semester exams",
  "Prepare for judiciary services",
  "Build strong conceptual foundations",
  "Improve recall and revision",
  "Prepare for moot court and arguments",
];

export async function saveProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const course = String(formData.get("course") ?? "") as Course;
  const yearLabel = String(formData.get("yearLabel") ?? "").trim();
  const goal = String(formData.get("goal") ?? "");
  const subjects = formData.getAll("subjects").map(String).filter(Boolean);
  const dailyMinutes = Number(formData.get("dailyMinutes") ?? 45);

  if (name.length < 2) return { error: "Please enter your name." };
  if (!COURSES.includes(course)) return { error: "Choose a valid course." };
  if (!yearLabel) return { error: "Add your year or semester." };
  if (subjects.length < 1) return { error: "Keep at least one subject of interest." };
  if (!GOALS.includes(goal)) return { error: "Choose a study goal." };
  if (!Number.isFinite(dailyMinutes) || dailyMinutes < 15 || dailyMinutes > 480) {
    return { error: "Daily study time should be between 15 and 480 minutes." };
  }

  updateUserName(user.id, name.slice(0, 80));
  saveProfile(user.id, {
    course,
    yearLabel: yearLabel.slice(0, 60),
    subjects: subjects.slice(0, 8),
    goal,
    dailyMinutes: Math.round(dailyMinutes),
  });
  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferences saved. Your dashboard and plan have been updated." };
}

export async function addDeadlineAction(input: {
  title: string;
  subject?: string;
  dueAt: string;
  notes?: string;
}): Promise<ProfileState> {
  const user = await requireUser();
  const title = input.title.trim();
  if (title.length < 3) return { error: "Give the deadline a clear title." };
  const due = new Date(input.dueAt);
  if (Number.isNaN(due.getTime())) return { error: "Choose a valid date." };
  if (due.getTime() < Date.now() - 86_400_000) return { error: "Choose a future date." };
  addDeadline(user.id, {
    title: title.slice(0, 120),
    subject: input.subject?.slice(0, 60),
    dueAt: due.toISOString(),
    notes: input.notes?.slice(0, 500),
  });
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true, message: "Deadline added." };
}

export async function toggleDeadlineAction(id: string, completed: boolean): Promise<ProfileState> {
  const user = await requireUser();
  toggleDeadline(user.id, id, completed);
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true };
}

export async function removeDeadlineAction(id: string): Promise<ProfileState> {
  const user = await requireUser();
  deleteDeadline(user.id, id);
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true };
}
