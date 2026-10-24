import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  ActivityRecord,
  CaseBrief,
  ChatMessage,
  Citation,
  ConversationRecord,
  DeadlineRecord,
  DocumentKind,
  DocumentMeta,
  DocumentRecord,
  FlashcardRecord,
  ProfileRecord,
  QuizRecord,
  ScanJobRecord,
  UserRecord,
} from "./types";
import { seedIfEmpty } from "./seed";

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  year_label TEXT NOT NULL,
  subjects TEXT NOT NULL,
  goal TEXT NOT NULL,
  daily_minutes INTEGER NOT NULL,
  onboarded_at TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  citation TEXT,
  court TEXT,
  year INTEGER,
  subject TEXT,
  jurisdiction TEXT,
  doc_type TEXT,
  source_url TEXT,
  official_text TEXT,
  explanation TEXT,
  brief TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  verification TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, document_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scan_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  pages TEXT NOT NULL DEFAULT '[]',
  raw_text TEXT NOT NULL DEFAULT '',
  error TEXT,
  document_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  source TEXT,
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  due_at TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  prev_interval INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT,
  title TEXT NOT NULL,
  subject TEXT,
  questions TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  citations TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  due_at TEXT NOT NULL,
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  ref_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_kind ON documents(kind);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_user ON scan_jobs(user_id);
`;

type Param = string | number | bigint | null | Uint8Array;

declare global {
  // eslint-disable-next-line no-var
  var __vidhiDb: DatabaseSync | undefined;
}

function open() {
  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "vidhi.db"));
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}

export const db: DatabaseSync = globalThis.__vidhiDb ?? (globalThis.__vidhiDb = open());

/**
 * node:sqlite returns null-prototype rows, which React refuses to serialise
 * across the server/client boundary. Normalise every row to a plain object.
 */
export function all<T>(sql: string, ...params: Param[]): T[] {
  const rows = db.prepare(sql).all(...params) as unknown as Record<string, unknown>[];
  return rows.map((row) => ({ ...row })) as T[];
}

export function one<T>(sql: string, ...params: Param[]): T | undefined {
  const row = db.prepare(sql).get(...params) as unknown as Record<string, unknown> | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: Param[]) {
  return db.prepare(sql).run(...params);
}

export const nowIso = () => new Date().toISOString();

/* ---------------------------------- users --------------------------------- */

export function createUser(input: {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}): UserRecord {
  run(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
    input.id,
    input.email.toLowerCase(),
    input.passwordHash,
    input.name,
    nowIso(),
  );
  return one<UserRecord>("SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?", input.id)!;
}

export function findUserByEmail(email: string) {
  return one<{ id: string; email: string; name: string; passwordHash: string; createdAt: string }>(
    "SELECT id, email, name, password_hash as passwordHash, created_at as createdAt FROM users WHERE email = ?",
    email.toLowerCase(),
  );
}

export function findUserById(id: string): UserRecord | undefined {
  return one<UserRecord>(
    "SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?",
    id,
  );
}

export function getProfile(userId: string): ProfileRecord | undefined {
  const row = one<{
    userId: string;
    course: ProfileRecord["course"];
    yearLabel: string;
    subjects: string;
    goal: string;
    dailyMinutes: number;
    onboardedAt: string | null;
  }>(
    "SELECT user_id as userId, course, year_label as yearLabel, subjects, goal, daily_minutes as dailyMinutes, onboarded_at as onboardedAt FROM profiles WHERE user_id = ?",
    userId,
  );
  if (!row) return undefined;
  return { ...row, subjects: JSON.parse(row.subjects) as string[] };
}

export function saveProfile(
  userId: string,
  input: Omit<ProfileRecord, "userId" | "onboardedAt">,
) {
  run(
    `INSERT INTO profiles (user_id, course, year_label, subjects, goal, daily_minutes, onboarded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET course=excluded.course, year_label=excluded.year_label,
       subjects=excluded.subjects, goal=excluded.goal, daily_minutes=excluded.daily_minutes,
       onboarded_at=excluded.onboarded_at`,
    userId,
    input.course,
    input.yearLabel,
    JSON.stringify(input.subjects),
    input.goal,
    input.dailyMinutes,
    nowIso(),
  );
  logActivity(userId, "profile", "Updated study preferences");
}

export function updateUserName(userId: string, name: string) {
  run("UPDATE users SET name = ? WHERE id = ?", name, userId);
}

export function updatePassword(userId: string, passwordHash: string) {
  run("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, userId);
  run("DELETE FROM sessions WHERE user_id = ?", userId);
}

/* --------------------------------- helpers -------------------------------- */

export function logActivity(userId: string, kind: string, label: string, refId?: string) {
  run(
    "INSERT INTO activities (id, user_id, kind, label, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    crypto.randomUUID(),
    userId,
    kind,
    label,
    refId ?? null,
    nowIso(),
  );
}

function rowToDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: row.id as string,
    ownerId: (row.ownerId as string | null) ?? null,
    kind: row.kind as DocumentKind,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    citation: (row.citation as string | null) ?? null,
    court: (row.court as string | null) ?? null,
    year: (row.year as number | null) ?? null,
    subject: (row.subject as string | null) ?? null,
    jurisdiction: (row.jurisdiction as string | null) ?? null,
    docType: (row.docType as string | null) ?? null,
    sourceUrl: (row.sourceUrl as string | null) ?? null,
    officialText: (row.officialText as string | null) ?? null,
    explanation: (row.explanation as string | null) ?? null,
    brief: row.brief ? (JSON.parse(row.brief as string) as CaseBrief) : null,
    meta: row.meta ? (JSON.parse(row.meta as string) as DocumentMeta) : {},
    verification: row.verification as DocumentRecord["verification"],
    createdAt: row.createdAt as string,
  };
}

const DOC_COLUMNS = `id, owner_id as ownerId, kind, title, subtitle, citation, court, year, subject,
  jurisdiction, doc_type as docType, source_url as sourceUrl, official_text as officialText,
  explanation, brief, meta, verification, created_at as createdAt`;

/* -------------------------------- documents ------------------------------- */

export function listDocuments(opts: {
  userId: string;
  q?: string;
  subject?: string;
  kind?: string;
  court?: string;
  year?: string;
  bookmarkedOnly?: boolean;
  limit?: number;
}): DocumentRecord[] {
  const where: string[] = ["(owner_id IS NULL OR owner_id = ?)"];
  const params: Param[] = [opts.userId];
  if (opts.q) {
    where.push("(title LIKE ? OR citation LIKE ? OR official_text LIKE ? OR explanation LIKE ? OR brief LIKE ? OR meta LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like, like, like);
  }
  if (opts.subject) {
    where.push("subject = ?");
    params.push(opts.subject);
  }
  if (opts.kind) {
    where.push("kind = ?");
    params.push(opts.kind);
  }
  if (opts.court) {
    where.push("court LIKE ?");
    params.push(`%${opts.court}%`);
  }
  if (opts.year) {
    where.push("CAST(year AS TEXT) = ?");
    params.push(opts.year);
  }
  if (opts.bookmarkedOnly) {
    where.push("id IN (SELECT document_id FROM bookmarks WHERE user_id = ?)");
    params.push(opts.userId);
  }
  const limit = Math.min(opts.limit ?? 200, 500);
  const rows = all<Record<string, unknown>>(
    `SELECT ${DOC_COLUMNS} FROM documents WHERE ${where.join(" AND ")} ORDER BY
      CASE kind WHEN 'statute' THEN 0 WHEN 'judgment' THEN 1 WHEN 'brief' THEN 2 WHEN 'article' THEN 3 ELSE 4 END,
      title COLLATE NOCASE LIMIT ${limit}`,
    ...params,
  );
  return rows.map(rowToDocument);
}

export function getDocument(id: string): DocumentRecord | undefined {
  const row = one<Record<string, unknown>>(`SELECT ${DOC_COLUMNS} FROM documents WHERE id = ?`, id);
  return row ? rowToDocument(row) : undefined;
}

export function createDocument(input: {
  ownerId: string | null;
  kind: DocumentKind;
  title: string;
  subtitle?: string;
  citation?: string;
  court?: string;
  year?: number;
  subject?: string;
  jurisdiction?: string;
  docType?: string;
  sourceUrl?: string;
  officialText?: string;
  explanation?: string;
  brief?: CaseBrief;
  meta?: DocumentMeta;
  verification: DocumentRecord["verification"];
  id?: string;
}): DocumentRecord {
  const id = input.id ?? crypto.randomUUID();
  run(
    `INSERT INTO documents (id, owner_id, kind, title, subtitle, citation, court, year, subject, jurisdiction,
      doc_type, source_url, official_text, explanation, brief, meta, verification, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.ownerId,
    input.kind,
    input.title,
    input.subtitle ?? null,
    input.citation ?? null,
    input.court ?? null,
    input.year ?? null,
    input.subject ?? null,
    input.jurisdiction ?? "India",
    input.docType ?? null,
    input.sourceUrl ?? null,
    input.officialText ?? null,
    input.explanation ?? null,
    input.brief ? JSON.stringify(input.brief) : null,
    JSON.stringify(input.meta ?? {}),
    input.verification,
    nowIso(),
  );
  return getDocument(id)!;
}

export function updateDocumentBrief(id: string, brief: CaseBrief) {
  run("UPDATE documents SET brief = ? WHERE id = ?", JSON.stringify(brief), id);
}

export function updateDocumentSubject(id: string, subject: string) {
  run("UPDATE documents SET subject = ? WHERE id = ?", subject, id);
}

export function updateDocumentText(id: string, text: string) {
  run("UPDATE documents SET official_text = ? WHERE id = ?", text, id);
}

export function deleteDocument(id: string, userId: string) {
  run("DELETE FROM documents WHERE id = ? AND owner_id = ?", id, userId);
}

export function subjectsAvailable(userId: string): string[] {
  return all<{ subject: string }>(
    `SELECT DISTINCT subject FROM documents WHERE subject IS NOT NULL AND (owner_id IS NULL OR owner_id = ?) ORDER BY subject`,
    userId,
  ).map((r) => r.subject);
}

export function courtsAvailable(userId: string): string[] {
  return all<{ court: string }>(
    `SELECT DISTINCT court FROM documents WHERE court IS NOT NULL AND (owner_id IS NULL OR owner_id = ?) ORDER BY court`,
    userId,
  ).map((r) => r.court);
}

export function yearsAvailable(userId: string): number[] {
  return all<{ year: number }>(
    `SELECT DISTINCT year FROM documents WHERE year IS NOT NULL AND (owner_id IS NULL OR owner_id = ?) ORDER BY year DESC`,
    userId,
  ).map((r) => r.year);
}

/* ------------------------------- bookmarks -------------------------------- */

export function isBookmarked(userId: string, documentId: string) {
  return !!one("SELECT 1 FROM bookmarks WHERE user_id = ? AND document_id = ?", userId, documentId);
}

export function toggleBookmark(userId: string, documentId: string) {
  if (isBookmarked(userId, documentId)) {
    run("DELETE FROM bookmarks WHERE user_id = ? AND document_id = ?", userId, documentId);
    return false;
  }
  run("INSERT INTO bookmarks (user_id, document_id, created_at) VALUES (?, ?, ?)", userId, documentId, nowIso());
  return true;
}

export function listBookmarks(userId: string) {
  return all<DocumentRecord & { bookmarkedAt: string }>(
    `SELECT d.id, d.owner_id as ownerId, d.kind, d.title, d.subtitle, d.citation, d.court, d.year,
       d.subject, d.jurisdiction, d.doc_type as docType, d.source_url as sourceUrl,
       d.official_text as officialText, d.explanation, d.brief, d.meta, d.verification,
       d.created_at as createdAt, b.created_at as bookmarkedAt
     FROM bookmarks b JOIN documents d ON d.id = b.document_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    userId,
  );
}

/* ---------------------------------- notes --------------------------------- */

export function listNotes(userId: string, documentId: string) {
  return all<{ id: string; body: string; createdAt: string; updatedAt: string }>(
    "SELECT id, body, created_at as createdAt, updated_at as updatedAt FROM notes WHERE user_id = ? AND document_id = ? ORDER BY created_at DESC",
    userId,
    documentId,
  );
}

export function addNote(userId: string, documentId: string, body: string) {
  run(
    "INSERT INTO notes (id, user_id, document_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    crypto.randomUUID(),
    userId,
    documentId,
    body.trim(),
    nowIso(),
    nowIso(),
  );
}

export function deleteNote(userId: string, noteId: string) {
  run("DELETE FROM notes WHERE id = ? AND user_id = ?", noteId, userId);
}

export function listHighlights(userId: string, documentId: string) {
  return all<{ id: string; text: string; createdAt: string }>(
    "SELECT id, text, created_at as createdAt FROM highlights WHERE user_id = ? AND document_id = ? ORDER BY created_at DESC",
    userId,
    documentId,
  );
}

export function addHighlight(userId: string, documentId: string, text: string) {
  const clean = text.trim().slice(0, 600);
  if (!clean) return;
  run(
    "INSERT INTO highlights (id, user_id, document_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
    crypto.randomUUID(),
    userId,
    documentId,
    clean,
    nowIso(),
  );
}

export function deleteHighlight(userId: string, id: string) {
  run("DELETE FROM highlights WHERE id = ? AND user_id = ?", id, userId);
}

/* -------------------------------- scan jobs ------------------------------- */

function rowToScanJob(row: Record<string, unknown>): ScanJobRecord {
  return {
    id: row.id as string,
    userId: row.userId as string,
    title: row.title as string,
    status: row.status as ScanJobRecord["status"],
    pages: JSON.parse(row.pages as string) as ScanJobRecord["pages"],
    rawText: row.rawText as string,
    error: (row.error as string | null) ?? null,
    documentId: (row.documentId as string | null) ?? null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export function createScanJob(userId: string, title: string): ScanJobRecord {
  const id = crypto.randomUUID();
  run(
    "INSERT INTO scan_jobs (id, user_id, title, status, created_at, updated_at) VALUES (?, ?, ?, 'draft', ?, ?)",
    id,
    userId,
    title,
    nowIso(),
    nowIso(),
  );
  return getScanJob(id, userId)!;
}

export function getScanJob(id: string, userId: string): ScanJobRecord | undefined {
  const row = one<Record<string, unknown>>(
    `SELECT id, user_id as userId, title, status, pages, raw_text as rawText, error,
      document_id as documentId, created_at as createdAt, updated_at as updatedAt
     FROM scan_jobs WHERE id = ? AND user_id = ?`,
    id,
    userId,
  );
  return row ? rowToScanJob(row) : undefined;
}

export function updateScanJob(
  id: string,
  userId: string,
  patch: Partial<Pick<ScanJobRecord, "title" | "status" | "pages" | "rawText" | "error" | "documentId">>,
) {
  const job = getScanJob(id, userId);
  if (!job) return;
  run(
    `UPDATE scan_jobs SET title = ?, status = ?, pages = ?, raw_text = ?, error = ?, document_id = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    patch.title ?? job.title,
    patch.status ?? job.status,
    JSON.stringify(patch.pages ?? job.pages),
    patch.rawText ?? job.rawText,
    patch.error === undefined ? job.error : patch.error,
    patch.documentId === undefined ? job.documentId : patch.documentId,
    nowIso(),
    id,
    userId,
  );
}

export function deleteScanJob(id: string, userId: string) {
  run("DELETE FROM scan_jobs WHERE id = ? AND user_id = ?", id, userId);
}

export function listScanJobs(userId: string) {
  return all<Record<string, unknown>>(
    `SELECT id, user_id as userId, title, status, pages, raw_text as rawText, error,
      document_id as documentId, created_at as createdAt, updated_at as updatedAt
     FROM scan_jobs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30`,
    userId,
  ).map(rowToScanJob);
}

/* -------------------------------- flashcards ------------------------------ */

export function getFlashcard(id: string, userId: string): FlashcardRecord | undefined {
  const r = one<Record<string, unknown>>(
    "SELECT * FROM flashcards WHERE id = ? AND user_id = ?",
    id,
    userId,
  );
  if (!r) return undefined;
  return {
    id: r.id as string,
    userId: r.user_id as string,
    documentId: (r.document_id as string | null) ?? null,
    front: r.front as string,
    back: r.back as string,
    source: (r.source as string | null) ?? null,
    ease: r.ease as number,
    intervalDays: r.interval_days as number,
    dueAt: r.due_at as string,
    reps: r.reps as number,
    lapses: r.lapses as number,
    createdAt: r.created_at as string,
  };
}

export function listFlashcards(userId: string, documentId?: string): FlashcardRecord[] {
  const rows = documentId
    ? all<Record<string, unknown>>(
        "SELECT * FROM flashcards WHERE user_id = ? AND document_id = ? ORDER BY created_at",
        userId,
        documentId,
      )
    : all<Record<string, unknown>>("SELECT * FROM flashcards WHERE user_id = ? ORDER BY due_at", userId);
  return rows.map((r) => ({
    id: r.id as string,
    userId: r.user_id as string,
    documentId: (r.document_id as string | null) ?? null,
    front: r.front as string,
    back: r.back as string,
    source: (r.source as string | null) ?? null,
    ease: r.ease as number,
    intervalDays: r.interval_days as number,
    dueAt: r.due_at as string,
    reps: r.reps as number,
    lapses: r.lapses as number,
    createdAt: r.created_at as string,
  }));
}

export function addFlashcard(
  userId: string,
  card: { documentId?: string | null; front: string; back: string; source?: string },
) {
  const id = crypto.randomUUID();
  run(
    "INSERT INTO flashcards (id, user_id, document_id, front, back, source, due_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    userId,
    card.documentId ?? null,
    card.front,
    card.back,
    card.source ?? null,
    nowIso(),
    nowIso(),
  );
  return id;
}

export function deleteFlashcard(userId: string, id: string) {
  run("DELETE FROM flashcards WHERE id = ? AND user_id = ?", id, userId);
}

export function dueFlashcards(userId: string, limit = 40): FlashcardRecord[] {
  return listFlashcards(userId)
    .filter((c) => c.dueAt <= nowIso())
    .slice(0, limit);
}

export function scheduleFlashcard(
  userId: string,
  cardId: string,
  patch: { ease: number; intervalDays: number; dueAt: string; reps: number; lapses: number; rating: number },
) {
  run(
    "UPDATE flashcards SET ease = ?, interval_days = ?, due_at = ?, reps = ?, lapses = ? WHERE id = ? AND user_id = ?",
    patch.ease,
    patch.intervalDays,
    patch.dueAt,
    patch.reps,
    patch.lapses,
    cardId,
    userId,
  );
  run(
    "INSERT INTO review_logs (id, user_id, card_id, rating, prev_interval, reviewed_at) VALUES (?, ?, ?, ?, ?, ?)",
    crypto.randomUUID(),
    userId,
    cardId,
    patch.rating,
    patch.intervalDays,
    nowIso(),
  );
}

export function reviewStats(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const row = one<{ reviews: number; cards: number; due: number }>(
    `SELECT
      (SELECT COUNT(*) FROM review_logs WHERE user_id = ? AND reviewed_at LIKE ?) as reviews,
      (SELECT COUNT(*) FROM flashcards WHERE user_id = ?) as cards,
      (SELECT COUNT(*) FROM flashcards WHERE user_id = ? AND due_at <= ?) as due`,
    userId,
    `${today}%`,
    userId,
    userId,
    nowIso(),
  );
  return row ?? { reviews: 0, cards: 0, due: 0 };
}

/* ---------------------------------- quizzes -------------------------------- */

export function createQuiz(
  userId: string,
  input: { title: string; subject?: string; documentId?: string; questions: QuizRecord["questions"] },
): QuizRecord {
  const id = crypto.randomUUID();
  run(
    "INSERT INTO quizzes (id, user_id, document_id, title, subject, questions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    id,
    userId,
    input.documentId ?? null,
    input.title,
    input.subject ?? null,
    JSON.stringify(input.questions),
    nowIso(),
  );
  return getQuiz(id, userId)!;
}

export function getQuiz(id: string, userId: string): QuizRecord | undefined {
  const row = one<Record<string, unknown>>(
    "SELECT id, user_id as userId, document_id as documentId, title, subject, questions, created_at as createdAt FROM quizzes WHERE id = ? AND user_id = ?",
    id,
    userId,
  );
  if (!row) return undefined;
  return { ...row, questions: JSON.parse(row.questions as string) } as QuizRecord;
}

export function listQuizzes(userId: string): QuizRecord[] {
  return all<Record<string, unknown>>(
    "SELECT id, user_id as userId, document_id as documentId, title, subject, questions, created_at as createdAt FROM quizzes WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    userId,
  ).map((row) => ({ ...row, questions: JSON.parse(row.questions as string) }) as QuizRecord);
}

export function recordQuizAttempt(
  quizId: string,
  userId: string,
  answers: Record<string, number>,
  score: number,
  total: number,
) {
  run(
    "INSERT INTO quiz_attempts (id, quiz_id, user_id, answers, score, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    crypto.randomUUID(),
    quizId,
    userId,
    JSON.stringify(answers),
    score,
    total,
    nowIso(),
  );
}

export function quizAttempts(userId: string) {
  return all<{ id: string; quizId: string; title: string; score: number; total: number; createdAt: string }>(
    `SELECT a.id, a.quiz_id as quizId, q.title, a.score, a.total, a.created_at as createdAt
     FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 20`,
    userId,
  );
}

/* ------------------------------- conversations ----------------------------- */

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    role: row.role as ChatMessage["role"],
    content: row.content as string,
    citations: JSON.parse((row.citations as string) || "[]") as Citation[],
    createdAt: row.createdAt as string,
  };
}

export function listConversations(userId: string): ConversationRecord[] {
  return all<ConversationRecord>(
    `SELECT id, user_id as userId, title, document_id as documentId, created_at as createdAt, updated_at as updatedAt
     FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 40`,
    userId,
  );
}

export function getConversation(id: string, userId: string) {
  return one<ConversationRecord>(
    `SELECT id, user_id as userId, title, document_id as documentId, created_at as createdAt, updated_at as updatedAt
     FROM conversations WHERE id = ? AND user_id = ?`,
    id,
    userId,
  );
}

export function createConversation(userId: string, title: string, documentId?: string) {
  const id = crypto.randomUUID();
  run(
    "INSERT INTO conversations (id, user_id, title, document_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    userId,
    title.slice(0, 90),
    documentId ?? null,
    nowIso(),
    nowIso(),
  );
  return getConversation(id, userId)!;
}

export function listMessages(conversationId: string): ChatMessage[] {
  return all<Record<string, unknown>>(
    "SELECT id, role, content, citations, created_at as createdAt FROM messages WHERE conversation_id = ? ORDER BY created_at",
    conversationId,
  ).map(rowToMessage);
}

export function addMessage(
  conversationId: string,
  role: ChatMessage["role"],
  content: string,
  citations: Citation[] = [],
) {
  const id = crypto.randomUUID();
  run(
    "INSERT INTO messages (id, conversation_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    conversationId,
    role,
    content,
    JSON.stringify(citations),
    nowIso(),
  );
  run("UPDATE conversations SET updated_at = ? WHERE id = ?", nowIso(), conversationId);
  return id;
}

export function deleteConversation(id: string, userId: string) {
  run("DELETE FROM conversations WHERE id = ? AND user_id = ?", id, userId);
}

/* -------------------------------- deadlines -------------------------------- */

export function listDeadlines(userId: string): DeadlineRecord[] {
  return all<Record<string, unknown>>(
    "SELECT id, title, subject, due_at as dueAt, notes, completed FROM deadlines WHERE user_id = ? ORDER BY due_at",
    userId,
  ).map((r) => ({
    ...r,
    completed: Boolean(r.completed),
  })) as DeadlineRecord[];
}

export function addDeadline(
  userId: string,
  input: { title: string; subject?: string; dueAt: string; notes?: string },
) {
  run(
    "INSERT INTO deadlines (id, user_id, title, subject, due_at, notes, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
    crypto.randomUUID(),
    userId,
    input.title,
    input.subject ?? null,
    input.dueAt,
    input.notes ?? null,
    nowIso(),
  );
}

export function toggleDeadline(userId: string, id: string, completed: boolean) {
  run("UPDATE deadlines SET completed = ? WHERE id = ? AND user_id = ?", completed ? 1 : 0, id, userId);
}

export function deleteDeadline(userId: string, id: string) {
  run("DELETE FROM deadlines WHERE id = ? AND user_id = ?", id, userId);
}

/* -------------------------------- activities ------------------------------ */

export function recentActivity(userId: string, limit = 8): ActivityRecord[] {
  return all<Record<string, unknown>>(
    "SELECT id, kind, label, ref_id as refId, created_at as createdAt FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId,
    limit,
  ).map((r) => ({ ...r, refId: r.refId ?? null })) as ActivityRecord[];
}

export function activityDates(userId: string): string[] {
  return all<{ day: string }>(
    "SELECT DISTINCT substr(created_at, 1, 10) as day FROM activities WHERE user_id = ? ORDER BY day DESC",
    userId,
  ).map((r) => r.day);
}

export function studyStreak(userId: string): number {
  const days = new Set(activityDates(userId));
  const cursor = new Date();
  // Allow the streak to survive until the end of today even if nothing logged yet.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function dailyActivityCounts(userId: string, days = 7) {
  const rows = all<{ day: string; n: number }>(
    `SELECT substr(created_at, 1, 10) as day, COUNT(*) as n FROM activities
     WHERE user_id = ? AND created_at >= ? GROUP BY day ORDER BY day`,
    userId,
    new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10),
  );
  const map = new Map(rows.map((r) => [r.day, r.n]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    return { day: key, label: d.toLocaleDateString("en-IN", { weekday: "short" }), count: map.get(key) ?? 0 };
  });
}

export function recentlyViewed(userId: string, limit = 5) {
  return all<{ id: string; title: string; kind: DocumentKind; viewedAt: string }>(
    `SELECT a.ref_id as id, d.title, d.kind, a.created_at as viewedAt
     FROM activities a JOIN documents d ON d.id = a.ref_id
     WHERE a.user_id = ? AND a.kind = 'view' AND a.ref_id IS NOT NULL
     GROUP BY a.ref_id ORDER BY MAX(a.created_at) DESC LIMIT ?`,
    userId,
    limit,
  );
}

export function todayActivities(userId: string) {
  return all<{ kind: string }>(
    "SELECT kind FROM activities WHERE user_id = ? AND substr(created_at, 1, 10) = ?",
    userId,
    new Date().toISOString().slice(0, 10),
  );
}

export function countDocuments(userId: string) {
  return (
    one<{ n: number }>(
      "SELECT COUNT(*) as n FROM documents WHERE owner_id IS NULL OR owner_id = ?",
      userId,
    )?.n ?? 0
  );
}

export function countUserCards(userId: string) {
  return one<{ n: number }>("SELECT COUNT(*) as n FROM flashcards WHERE user_id = ?", userId)?.n ?? 0;
}

export function studyMinutesLast7Days(userId: string) {
  const row = one<{ n: number }>(
    "SELECT COUNT(*) as n FROM activities WHERE user_id = ? AND created_at >= ?",
    userId,
    new Date(Date.now() - 7 * 86_400_000).toISOString(),
  );
  return Math.min(600, (row?.n ?? 0) * 4);
}

export function findDocumentByTitle(title: string) {
  return one<{ id: string }>("SELECT id FROM documents WHERE title = ? LIMIT 1", title);
}
