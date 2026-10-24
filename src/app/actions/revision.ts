"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  addFlashcard,
  deleteFlashcard,
  getDocument,
  getFlashcard,
  listFlashcards,
  logActivity,
  scheduleFlashcard,
} from "@/lib/db";
import { schedule, type Rating } from "@/lib/srs";

export interface RevisionState {
  ok?: boolean;
  error?: string;
  message?: string;
  dueAt?: string;
}

export async function reviewCardAction(cardId: string, rating: number): Promise<RevisionState> {
  const user = await requireUser();
  if (![0, 1, 2, 3].includes(rating)) return { error: "Invalid rating." };
  const card = getFlashcard(cardId, user.id);
  if (!card) return { error: "Card not found." };

  const next = schedule(card, rating as Rating);
  scheduleFlashcard(user.id, card.id, {
    ...next,
    rating,
  });
  logActivity(user.id, "flashcards", "Reviewed a flashcard", card.documentId ?? undefined);
  revalidatePath("/revision");
  revalidatePath("/home");
  return { ok: true, dueAt: next.dueAt, message: next.intervalDays ? `Next review in ${next.intervalDays} day(s).` : "Back in 10 minutes." };
}

export async function createCardAction(input: {
  front: string;
  back: string;
  documentId?: string;
}): Promise<RevisionState> {
  const user = await requireUser();
  const front = input.front.trim();
  const back = input.back.trim();
  if (front.length < 5) return { error: "Write a fuller question on the front." };
  if (back.length < 3) return { error: "Add an answer on the back." };
  if (front.length > 500 || back.length > 2000) return { error: "Keep the card under 500/2000 characters." };

  let source: string | undefined;
  if (input.documentId) {
    const doc = getDocument(input.documentId);
    if (!doc || (doc.ownerId && doc.ownerId !== user.id)) return { error: "Source document not found." };
    source = doc.title;
  }

  addFlashcard(user.id, { front, back, documentId: input.documentId, source });
  logActivity(user.id, "flashcards", "Added a flashcard", input.documentId);
  revalidatePath("/revision");
  revalidatePath("/home");
  return { ok: true, message: "Card added to today’s queue." };
}

export async function deleteCardAction(cardId: string): Promise<RevisionState> {
  const user = await requireUser();
  const card = getFlashcard(cardId, user.id);
  if (!card) return { error: "Card not found." };
  deleteFlashcard(user.id, cardId);
  revalidatePath("/revision");
  revalidatePath("/home");
  return { ok: true };
}

export async function suspendDueCardsAction(): Promise<RevisionState> {
  const user = await requireUser();
  const cards = listFlashcards(user.id);
  const due = cards.filter((card) => card.dueAt <= new Date().toISOString());
  if (!due.length) return { message: "Nothing is due." };
  for (const card of due) {
    const next = new Date(Date.now() + (1 + card.reps) * 86_400_000).toISOString();
    scheduleFlashcard(user.id, card.id, {
      ease: card.ease,
      intervalDays: card.intervalDays,
      dueAt: next,
      reps: card.reps,
      lapses: card.lapses,
      rating: 1,
    });
  }
  revalidatePath("/revision");
  return { ok: true, message: `${due.length} card(s) moved to tomorrow.` };
}
