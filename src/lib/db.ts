import { mkdirSync } from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";
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

/*
 * Postgres bridge
 * ---------------
 * The data layer used to be node:sqlite, which is synchronous — every call
 * site in the app (pages, server actions, lib helpers) relies on that. The
 * Postgres driver is async, so queries run in a worker thread and the calling
 * thread blocks on Atomics.wait for the reply. `all` / `one` / `run` keep
 * their exact signatures while the rows come from Supabase Postgres.
 */

const BRIDGE_SRC = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const { createRequire } = require("node:module");
const requireFromProject = createRequire(workerData.cwd + "/");
const postgres = requireFromProject("postgres");

// idle_timeout 0 + max_lifetime null keep connections alive between requests:
// the TLS + auth handshake to Supabase costs ~7s, so reconnecting per request
// dominates every page render.
const sql = postgres(workerData.url, {
  ssl: "require",
  max: 6,
  idle_timeout: 0,
  max_lifetime: null,
  connect_timeout: 20,
  prepare: false,
});

function normalise(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

parentPort.on("message", async ({ text, params, ctrl, out }) => {
  const status = new Int32Array(ctrl);
  let payload;
  try {
    const rows = await sql.unsafe(text, params);
    const list = Array.isArray(rows)
      ? rows.map((row) => {
          const plain = {};
          for (const key of Object.keys(row)) plain[key] = normalise(row[key]);
          return plain;
        })
      : [];
    payload = { ok: true, rows: list, count: typeof rows.count === "number" ? rows.count : list.length };
  } catch (error) {
    payload = { ok: false, error: error && error.message ? error.message : String(error) };
  }
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  if (bytes.length + 4 > out.byteLength) {
    new DataView(out).setUint32(0, 0);
    Atomics.store(status, 0, 2);
    Atomics.notify(status, 0);
    return;
  }
  new Uint8Array(out, 4, bytes.length).set(bytes);
  new DataView(out).setUint32(0, bytes.length);
  Atomics.store(status, 0, 1);
  Atomics.notify(status, 0);
});
`;

type Param = string | number | bigint | null | Uint8Array | boolean | Date;

type QueryResult = { rows: Record<string, unknown>[]; count: number };

type BridgeReply =
  | ({ ok: true } & QueryResult)
  | { ok: false; error: string };

class PostgresBridge {
  private worker: Worker;
  private control: SharedArrayBuffer;
  private status: Int32Array;
  private capacity = 4 * 1024 * 1024;

  constructor(url: string) {
    this.control = new SharedArrayBuffer(4);
    this.status = new Int32Array(this.control);
    this.worker = new Worker(BRIDGE_SRC, {
      eval: true,
      workerData: { url, cwd: process.cwd() },
    });
    this.worker.unref();
    this.worker.on("error", (error: Error) => {
      console.error("[db] postgres worker error:", error.message);
    });
  }

  query(text: string, params: Param[]): QueryResult {
    for (;;) {
      const out = new SharedArrayBuffer(4 + this.capacity);
      Atomics.store(this.status, 0, 0);
      this.worker.postMessage({
        text,
        params: params.map((value) => (value === undefined ? null : value)),
        ctrl: this.control,
        out,
      });
      const settled = Atomics.wait(this.status, 0, 0, 30_000);
      if (settled === "timed-out") throw new Error("Postgres query timed out after 30s");
      const state = Atomics.load(this.status, 0);
      if (state === 2) {
        if (this.capacity >= 128 * 1024 * 1024) throw new Error("Postgres result set too large");
        this.capacity *= 4;
        continue;
      }
      const length = new DataView(out).getUint32(0);
      const reply = JSON.parse(
        new TextDecoder().decode(new Uint8Array(out, 4, length)),
      ) as BridgeReply;
      if (!reply.ok) throw new Error(reply.error);
      return { rows: reply.rows, count: reply.count };
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __vidhiPg: PostgresBridge | undefined;
}

function connect(): PostgresBridge {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — point it at the Supabase Postgres connection string.",
    );
  }
  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
  return new PostgresBridge(url);
}

const bridge: PostgresBridge = globalThis.__vidhiPg ?? (globalThis.__vidhiPg = connect());

/** Rewrites SQLite `?` placeholders into Postgres `$1..$n`, skipping literals. */
function toPostgres(sql: string): string {
  let out = "";
  let index = 0;
  let inString = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      inString = !inString;
      out += ch;
      continue;
    }
    if (ch === "?" && !inString) {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += ch;
  }
  return out;
}

export function all<T>(sql: string, ...params: Param[]): T[] {
  return bridge.query(toPostgres(sql), params).rows as T[];
}

export function one<T>(sql: string, ...params: Param[]): T | undefined {
  return (bridge.query(toPostgres(sql), params).rows as T[])[0];
}

export function run(sql: string, ...params: Param[]) {
  const reply = bridge.query(toPostgres(sql), params);
  return { changes: reply.count, rows: reply.rows };
}

export const nowIso = () => new Date().toISOString();

seedIfEmpty({ run, one });


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
  return one<UserRecord>("SELECT id, email, name, created_at as \"createdAt\" FROM users WHERE id = ?", input.id)!;
}

export function findUserByEmail(email: string) {
  return one<{ id: string; email: string; name: string; passwordHash: string; createdAt: string }>(
    "SELECT id, email, name, password_hash as \"passwordHash\", created_at as \"createdAt\" FROM users WHERE email = ?",
    email.toLowerCase(),
  );
}

export function findUserById(id: string): UserRecord | undefined {
  return one<UserRecord>(
    "SELECT id, email, name, created_at as \"createdAt\" FROM users WHERE id = ?",
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
    "SELECT user_id as \"userId\", course, year_label as \"yearLabel\", subjects, goal, daily_minutes as \"dailyMinutes\", onboarded_at as \"onboardedAt\" FROM profiles WHERE user_id = ?",
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

const DOC_COLUMNS = `id, owner_id as "ownerId", kind, title, subtitle, citation, court, year, subject,
  jurisdiction, doc_type as "docType", source_url as "sourceUrl", official_text as "officialText",
  explanation, brief, meta, verification, created_at as "createdAt"`;

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
    where.push("(title ILIKE ? OR citation ILIKE ? OR official_text ILIKE ? OR explanation ILIKE ? OR brief ILIKE ? OR meta ILIKE ?)");
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
    where.push("court ILIKE ?");
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
      lower(title) LIMIT ${limit}`,
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
    `SELECT d.id, d.owner_id as "ownerId", d.kind, d.title, d.subtitle, d.citation, d.court, d.year,
       d.subject, d.jurisdiction, d.doc_type as "docType", d.source_url as "sourceUrl",
       d.official_text as "officialText", d.explanation, d.brief, d.meta, d.verification,
       d.created_at as "createdAt", b.created_at as "bookmarkedAt"
     FROM bookmarks b JOIN documents d ON d.id = b.document_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    userId,
  );
}

/* ---------------------------------- notes --------------------------------- */

export function listNotes(userId: string, documentId: string) {
  return all<{ id: string; body: string; createdAt: string; updatedAt: string }>(
    "SELECT id, body, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM notes WHERE user_id = ? AND document_id = ? ORDER BY created_at DESC",
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
    "SELECT id, text, created_at as \"createdAt\" FROM highlights WHERE user_id = ? AND document_id = ? ORDER BY created_at DESC",
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
    `SELECT id, user_id as "userId", title, status, pages, raw_text as "rawText", error,
      document_id as "documentId", created_at as "createdAt", updated_at as "updatedAt"
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
    `SELECT id, user_id as "userId", title, status, pages, raw_text as "rawText", error,
      document_id as "documentId", created_at as "createdAt", updated_at as "updatedAt"
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
    "SELECT id, user_id as \"userId\", document_id as \"documentId\", title, subject, questions, created_at as \"createdAt\" FROM quizzes WHERE id = ? AND user_id = ?",
    id,
    userId,
  );
  if (!row) return undefined;
  return { ...row, questions: JSON.parse(row.questions as string) } as QuizRecord;
}

export function listQuizzes(userId: string): QuizRecord[] {
  return all<Record<string, unknown>>(
    "SELECT id, user_id as \"userId\", document_id as \"documentId\", title, subject, questions, created_at as \"createdAt\" FROM quizzes WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
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
    `SELECT a.id, a.quiz_id as "quizId", q.title, a.score, a.total, a.created_at as "createdAt"
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
    `SELECT id, user_id as "userId", title, document_id as "documentId", created_at as "createdAt", updated_at as "updatedAt"
     FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 40`,
    userId,
  );
}

export function getConversation(id: string, userId: string) {
  return one<ConversationRecord>(
    `SELECT id, user_id as "userId", title, document_id as "documentId", created_at as "createdAt", updated_at as "updatedAt"
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
    "SELECT id, role, content, citations, created_at as \"createdAt\" FROM messages WHERE conversation_id = ? ORDER BY created_at",
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
    "SELECT id, title, subject, due_at as \"dueAt\", notes, completed FROM deadlines WHERE user_id = ? ORDER BY due_at",
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
    "SELECT id, kind, label, ref_id as \"refId\", created_at as \"createdAt\" FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
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
    `SELECT * FROM (
       SELECT DISTINCT ON (a.ref_id) a.ref_id as id, d.title, d.kind, a.created_at as "viewedAt"
       FROM activities a JOIN documents d ON d.id = a.ref_id
       WHERE a.user_id = ? AND a.kind = 'view' AND a.ref_id IS NOT NULL
       ORDER BY a.ref_id, a.created_at DESC
     ) recent ORDER BY "viewedAt" DESC LIMIT ?`,
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
