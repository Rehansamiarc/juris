"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { BRIEF_SECTIONS, UNAVAILABLE } from "@/lib/casebrief";
import {
  addFlashcard,
  createQuiz,
  deleteDocument,
  getDocument,
  listFlashcards,
  logActivity,
  updateDocumentBrief,
  updateDocumentSubject,
} from "@/lib/db";
import { flashcardsFromBrief } from "@/lib/modes";
import { generateQuiz } from "@/lib/quizgen";
import type { CaseBrief } from "@/lib/types";

export interface CaseActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  count?: number;
}

function ownDocument(documentId: string, userId: string) {
  const doc = getDocument(documentId);
  if (!doc || doc.ownerId !== userId) return null;
  return doc;
}

export async function saveCaseBriefAction(
  _prev: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") ?? "");
  const doc = ownDocument(documentId, user.id);
  if (!doc || !doc.brief) return { error: "You can only edit briefs you created." };

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const list = (key: string) =>
    String(formData.get(key) ?? "")
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 30);

  const confidenceRaw = String(formData.get("confidence") ?? doc.brief.confidence);
  const confidence: CaseBrief["confidence"] =
    confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
      ? confidenceRaw
      : doc.brief.confidence;

  const brief: CaseBrief = {
    ...doc.brief,
    caseName: text("caseName") || UNAVAILABLE,
    citation: text("citation") || UNAVAILABLE,
    court: text("court") || UNAVAILABLE,
    date: text("date") || UNAVAILABLE,
    bench: text("bench") || UNAVAILABLE,
    facts: text("facts") || UNAVAILABLE,
    proceduralHistory: text("proceduralHistory") || UNAVAILABLE,
    issues: list("issues"),
    petitionerArguments: text("petitionerArguments") || UNAVAILABLE,
    respondentArguments: text("respondentArguments") || UNAVAILABLE,
    statutes: list("statutes"),
    precedents: list("precedents"),
    reasoning: text("reasoning") || UNAVAILABLE,
    decision: text("decision") || UNAVAILABLE,
    ratio: list("ratio"),
    obiter: list("obiter"),
    principles: list("principles"),
    examSummary: text("examSummary") || UNAVAILABLE,
    pointsToRemember: list("pointsToRemember"),
    thirtySecond: text("thirtySecond") || UNAVAILABLE,
    oneMinute: text("oneMinute") || UNAVAILABLE,
    beginner: text("beginner") || UNAVAILABLE,
    examOutline: list("examOutline"),
    confidence,
  };

  const extras = list("missing").filter(
    (line) => !BRIEF_SECTIONS.some((section) => section.label === line),
  );
  const missing: string[] = [];
  for (const section of BRIEF_SECTIONS) {
    const value = brief[section.key];
    if (typeof value === "string" && value === UNAVAILABLE) missing.push(section.label);
    if (Array.isArray(value) && value.length === 0) missing.push(section.label);
  }
  brief.missing = [...missing, ...extras];

  updateDocumentBrief(documentId, brief);
  logActivity(user.id, "brief", `Updated the brief for ${doc.title}`, documentId);
  revalidatePath(`/cases/${documentId}`);
  revalidatePath("/home");
  redirect(`/cases/${documentId}?saved=1`);
}

export async function createCaseFlashcardsAction(documentId: string): Promise<CaseActionState> {
  const user = await requireUser();
  const doc = getDocument(documentId);
  if (!doc || (doc.ownerId && doc.ownerId !== user.id)) return { error: "Document not found." };
  if (!doc.brief) return { error: "This document does not have a case brief." };

  const candidates = flashcardsFromBrief(doc.brief);
  if (!candidates.length) {
    return { error: "There is not enough content yet. Fill in a few sections of the brief first." };
  }
  const existing = new Set(listFlashcards(user.id, doc.id).map((card) => card.front.toLowerCase()));
  let created = 0;
  for (const card of candidates) {
    if (existing.has(card.front.toLowerCase())) continue;
    addFlashcard(user.id, {
      documentId: doc.id,
      front: card.front,
      back: card.back,
      source: doc.title,
    });
    created += 1;
  }
  logActivity(user.id, "flashcards", `Created ${created} flashcard(s) from ${doc.title}`, doc.id);
  revalidatePath("/revision");
  revalidatePath("/home");
  revalidatePath(`/cases/${documentId}`);
  return created
    ? { ok: true, count: created, message: `${created} flashcard${created === 1 ? "" : "s"} added to your revision queue.` }
    : { ok: true, count: 0, message: "Those flashcards are already in your queue." };
}

export async function createCaseQuizAction(documentId: string) {
  const user = await requireUser();
  const doc = getDocument(documentId);
  if (!doc || (doc.ownerId && doc.ownerId !== user.id)) redirect("/library");
  const quiz = await generateQuiz(user.id, { documentId });
  if (!quiz.questions.length) {
    redirect(`/cases/${documentId}?quiz=empty`);
  }
  const created = createQuiz(user.id, {
    title: quiz.title,
    subject: quiz.subject ?? doc.subject ?? undefined,
    documentId,
    questions: quiz.questions,
  });
  logActivity(user.id, "quiz", `Generated a practice set for ${doc.title}`, created.id);
  redirect(`/practice/${created.id}`);
}

export async function updateCaseSubjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 60);
  const doc = getDocument(documentId);
  if (!doc || doc.ownerId !== user.id || !subject) return;
  updateDocumentSubject(documentId, subject);
  logActivity(user.id, "folder", `Filed ${doc.title} under ${subject}`, documentId);
  revalidatePath(`/cases/${documentId}`);
  revalidatePath("/library");
}

export async function deleteCaseAction(documentId: string) {
  const user = await requireUser();
  const doc = getDocument(documentId);
  if (!doc || doc.ownerId !== user.id) return;
  deleteDocument(documentId, user.id);
  revalidatePath("/library");
  revalidatePath("/home");
  redirect("/library");
}
