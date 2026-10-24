"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  addHighlight as dbAddHighlight,
  addNote as dbAddNote,
  deleteDocument as dbDeleteDocument,
  deleteHighlight as dbDeleteHighlight,
  deleteNote as dbDeleteNote,
  getDocument,
  isBookmarked,
  logActivity,
  toggleBookmark,
} from "@/lib/db";

async function accessibleDoc(documentId: string, userId: string) {
  const doc = getDocument(documentId);
  if (!doc) return null;
  if (doc.ownerId && doc.ownerId !== userId) return null;
  return doc;
}

export async function toggleBookmarkAction(documentId: string, path: string) {
  const user = await requireUser();
  const doc = await accessibleDoc(documentId, user.id);
  if (!doc) return { ok: false, error: "Document not found." };
  const bookmarked = toggleBookmark(user.id, documentId);
  if (bookmarked) logActivity(user.id, "bookmark", `Bookmarked ${doc.title}`, documentId);
  revalidatePath(path);
  revalidatePath("/library");
  revalidatePath(`/library/${documentId}`);
  return { ok: true, bookmarked };
}

export async function createNoteAction(documentId: string, body: string) {
  const user = await requireUser();
  const doc = await accessibleDoc(documentId, user.id);
  if (!doc) return { ok: false, error: "Document not found." };
  const clean = body.trim();
  if (!clean) return { ok: false, error: "Write a note before saving." };
  if (clean.length > 4000) return { ok: false, error: "Keep notes under 4000 characters." };
  dbAddNote(user.id, documentId, clean);
  logActivity(user.id, "note", `Saved a note on ${doc.title}`, documentId);
  revalidatePath(`/library/${documentId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function deleteNoteAction(documentId: string, noteId: string) {
  const user = await requireUser();
  dbDeleteNote(user.id, noteId);
  revalidatePath(`/library/${documentId}`);
  return { ok: true };
}

export async function saveHighlightAction(documentId: string, text: string) {
  const user = await requireUser();
  const doc = await accessibleDoc(documentId, user.id);
  if (!doc) return { ok: false, error: "Document not found." };
  const clean = text.trim();
  if (clean.length < 4) return { ok: false, error: "Select a longer passage." };
  dbAddHighlight(user.id, documentId, clean);
  logActivity(user.id, "highlight", `Highlighted a passage in ${doc.title}`, documentId);
  revalidatePath(`/library/${documentId}`);
  return { ok: true };
}

export async function deleteHighlightAction(documentId: string, highlightId: string) {
  const user = await requireUser();
  dbDeleteHighlight(user.id, highlightId);
  revalidatePath(`/library/${documentId}`);
  return { ok: true };
}

export async function deleteUserDocumentAction(documentId: string) {
  const user = await requireUser();
  const doc = getDocument(documentId);
  if (!doc || doc.ownerId !== user.id) return { ok: false, error: "You can only delete documents you added." };
  dbDeleteDocument(documentId, user.id);
  return { ok: true };
}

export async function bookmarkStatus(documentId: string) {
  const user = await requireUser();
  return isBookmarked(user.id, documentId);
}
