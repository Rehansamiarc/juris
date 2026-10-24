"use server";

import { readFile, rm } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { aiConfigured, aiConfig, aiVision, FABRICATION_RULES } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { generateBrief, UNAVAILABLE } from "@/lib/casebrief";
import {
  createDocument,
  createScanJob,
  deleteScanJob,
  getScanJob,
  logActivity,
  updateScanJob,
} from "@/lib/db";
import { pageFilePath, scanDir } from "@/lib/storage";
import type { ScanPage } from "@/lib/types";

export interface ScanState {
  ok?: boolean;
  error?: string;
  message?: string;
  warning?: boolean;
}

const OCR_SYSTEM = `${FABRICATION_RULES}

You are transcribing a photographed page of a legal document or handwritten note.
Transcribe what is visible. Never summarise, complete or correct the substance.
- Preserve headings, paragraph breaks, case names, citations, section numbers and dates.
- Mark genuinely unreadable words as [illegible] and uncertain readings as [perhaps: word].
- If the page is blank, reply exactly [blank page].
- Return only the transcription, with no commentary.`;

export async function startScanAction() {
  const user = await requireUser();
  const job = createScanJob(user.id, "Untitled scan");
  redirect(`/scanner/${job.id}`);
}

export async function renameScanAction(jobId: string, title: string) {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { ok: false, error: "Scan not found." };
  updateScanJob(jobId, user.id, { title: title.trim().slice(0, 120) || "Untitled scan" });
  revalidatePath(`/scanner/${jobId}`);
  return { ok: true };
}

export async function reorderPageAction(jobId: string, pageId: string, direction: "up" | "down") {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { ok: false, error: "Scan not found." };
  const index = job.pages.findIndex((page) => page.id === pageId);
  if (index < 0) return { ok: false, error: "Page not found." };
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= job.pages.length) return { ok: false };
  const pages = [...job.pages];
  [pages[index], pages[target]] = [pages[target], pages[index]];
  updateScanJob(jobId, user.id, { pages });
  revalidatePath(`/scanner/${jobId}`);
  return { ok: true };
}

export async function removePageAction(jobId: string, pageId: string) {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { ok: false, error: "Scan not found." };
  const page = job.pages.find((item) => item.id === pageId);
  if (!page) return { ok: false, error: "Page not found." };
  await rm(pageFilePath(jobId, page.path), { force: true }).catch(() => undefined);
  const pages = job.pages.filter((item) => item.id !== pageId);
  updateScanJob(jobId, user.id, { pages, status: "draft" });
  revalidatePath(`/scanner/${jobId}`);
  return { ok: true };
}

export async function updatePageTransformAction(
  jobId: string,
  pageId: string,
  rotation: number,
  crop: ScanPage["crop"],
) {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { ok: false, error: "Scan not found." };
  const clamp = (n: number) => Math.max(0, Math.min(35, Math.round(n)));
  const pages = job.pages.map((page) =>
    page.id === pageId
      ? {
          ...page,
          rotation: ((rotation % 360) + 360) % 360,
          crop: {
            top: clamp(crop.top),
            right: clamp(crop.right),
            bottom: clamp(crop.bottom),
            left: clamp(crop.left),
          },
        }
      : page,
  );
  updateScanJob(jobId, user.id, { pages });
  revalidatePath(`/scanner/${jobId}`);
  return { ok: true };
}

export async function extractScanAction(jobId: string): Promise<ScanState> {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { error: "Scan not found." };
  if (!job.pages.length) return { error: "Add at least one page first." };

  const pendingEdits = job.pages.some(
    (page) =>
      page.rotation !== 0 ||
      page.crop.top || page.crop.right || page.crop.bottom || page.crop.left,
  );
  if (pendingEdits) {
    return { error: "Apply your rotate and crop edits before extracting text." };
  }

  const { extractText } = await import("unpdf");
  const chunks: string[] = [];
  const warnings: string[] = [];
  const failures: string[] = [];

  for (const page of job.pages) {
    try {
      const data = await readFile(pageFilePath(job.id, page.path));
      if (page.kind === "pdf") {
        const result = await extractText(new Uint8Array(data), { mergePages: true });
        const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
        if (text.trim().length < 20) {
          warnings.push(
            `“${page.name}” has no readable text layer. Scanned PDFs need to be exported as images or photographed.`,
          );
          continue;
        }
        chunks.push(`--- ${page.name} ---\n${text.trim()}`);
      } else {
        if (!aiConfigured()) {
          warnings.push(
            `“${page.name}” is an image. Add an AI provider (AI_API_KEY) to transcribe photos, or type the text below.`,
          );
          continue;
        }
        const dataUrl = `data:${page.mime};base64,${data.toString("base64")}`;
        const transcript = await aiVision(
          OCR_SYSTEM,
          "Transcribe this page exactly. Preserve paragraph breaks and line breaks where they carry meaning.",
          [dataUrl],
          { model: aiConfig.visionModel, maxTokens: 3200 },
        );
        if (transcript.trim()) {
          chunks.push(`--- ${page.name} ---\n${transcript.trim()}`);
        } else {
          failures.push(page.name);
        }
      }
    } catch (error) {
      failures.push(page.name);
      warnings.push(
        `Could not read “${page.name}”: ${error instanceof Error ? error.message : "unknown error"}.`,
      );
    }
  }

  const rawText = chunks.join("\n\n").trim();
  if (!rawText) {
    updateScanJob(job.id, user.id, {
      status: "failed",
      error: warnings.join(" ") || "No text could be extracted.",
    });
    revalidatePath(`/scanner/${jobId}`);
    return {
      error:
        warnings[0] ??
        "No text was extracted. Check the page images, or type the text into the editor below.",
    };
  }

  updateScanJob(job.id, user.id, {
    rawText,
    status: "ready",
    error: warnings.length ? warnings.join(" ") : null,
  });
  logActivity(user.id, "scan", `Extracted text from ${job.title}`, job.id);
  revalidatePath(`/scanner/${jobId}`);
  return {
    ok: true,
    warning: warnings.length > 0,
    message: warnings.length
      ? `Text extracted from ${chunks.length} page(s), with notes: ${warnings.join(" ")}`
      : `Text extracted from ${chunks.length} page(s). Review it carefully before generating the brief.`,
  };
}

export async function saveExtractedTextAction(jobId: string, text: string): Promise<ScanState> {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return { error: "Scan not found." };
  updateScanJob(jobId, user.id, {
    rawText: text.slice(0, 200_000),
    status: text.trim().length > 80 ? "ready" : "draft",
  });
  revalidatePath(`/scanner/${jobId}`);
  return { ok: true, message: "Extracted text saved. You can edit it as often as you like." };
}

export async function generateCaseFromScanAction(
  _prev: ScanState,
  formData: FormData,
): Promise<ScanState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const job = getScanJob(jobId, user.id);
  if (!job) return { error: "Scan not found." };
  const subject = String(formData.get("subject") ?? "").trim();
  const customTitle = String(formData.get("title") ?? "").trim();

  if (job.rawText.trim().length < 80) {
    return { error: "There is not enough text yet. Extract the pages or paste the text first." };
  }

  const { brief, warning } = await generateBrief(job.rawText);
  const title =
    customTitle ||
    (brief.caseName !== UNAVAILABLE ? brief.caseName : job.title) ||
    "Scanned case";
  const yearMatch = brief.date.match(/\b(19|20)\d{2}\b/);

  const doc = createDocument({
    ownerId: user.id,
    kind: "brief",
    title: title.slice(0, 200),
    subtitle: "Scanned and structured with Juris",
    citation: brief.citation !== UNAVAILABLE ? brief.citation : undefined,
    court: brief.court !== UNAVAILABLE ? brief.court : undefined,
    year: yearMatch ? Number(yearMatch[0]) : undefined,
    subject: subject || "Uncategorised",
    docType: "Case brief",
    officialText: job.rawText.slice(0, 200_000),
    brief,
    meta: {
      tags: ["scanned"],
      bench: brief.bench !== UNAVAILABLE ? brief.bench : undefined,
      verificationNote:
        "Official text was extracted from a document you uploaded. The brief is a study aid — verify every citation and holding against the original.",
    },
    verification: brief.generatedBy === "ai" ? "ai-generated" : "unverified",
  });

  updateScanJob(jobId, user.id, { status: "saved", documentId: doc.id, error: warning ?? null });
  logActivity(user.id, "brief", `Created a case brief for ${doc.title}`, doc.id);
  revalidatePath("/home");
  revalidatePath("/library");
  redirect(`/cases/${doc.id}`);
}

export async function deleteScanAction(jobId: string) {
  const user = await requireUser();
  const job = getScanJob(jobId, user.id);
  if (!job) return;
  await rm(scanDir(job.id), { recursive: true, force: true }).catch(() => undefined);
  deleteScanJob(job.id, user.id);
  revalidatePath("/scanner");
  redirect("/scanner");
}
