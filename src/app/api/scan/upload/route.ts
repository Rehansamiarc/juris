import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { assertSameOrigin, currentUser } from "@/lib/auth";
import { getScanJob, updateScanJob } from "@/lib/db";
import { ensureScanDir, extensionFor, pageFilePath } from "@/lib/storage";
import type { ScanPage } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Cross-origin upload blocked." }, { status: 403 });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });

  const jobId = String(form.get("jobId") ?? "");
  const job = getScanJob(jobId, user.id);
  if (!job) return NextResponse.json({ error: "Scan not found." }, { status: 404 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Each page must be under 15 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WEBP, HEIC or PDF files." },
      { status: 415 },
    );
  }
  if (job.pages.length >= 25) {
    return NextResponse.json({ error: "A single scan supports up to 25 pages." }, { status: 400 });
  }

  const kind: ScanPage["kind"] = file.type === "application/pdf" ? "pdf" : "image";
  const requestedId = String(form.get("pageId") ?? "");
  const existing = requestedId ? job.pages.find((page) => page.id === requestedId) : undefined;
  const pageId = existing?.id ?? crypto.randomUUID();
  const storedName = `${pageId}${extensionFor(file.type)}`;

  const dir = await ensureScanDir(job.id);
  if (existing && existing.path !== storedName) {
    await unlink(pageFilePath(job.id, existing.path)).catch(() => undefined);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { writeFile } = await import("node:fs/promises");
  await writeFile(pageFilePath(job.id, storedName), buffer);

  const page: ScanPage = {
    id: pageId,
    name: file.name || (kind === "pdf" ? "Document.pdf" : "Page"),
    kind,
    mime: file.type,
    path: storedName,
    size: file.size,
    rotation: 0,
    crop: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  const pages = existing
    ? job.pages.map((p) => (p.id === pageId ? page : p))
    : [...job.pages, page];

  let title = job.title;
  if (!existing && job.pages.length === 0 && (!title || title === "Untitled scan")) {
    title = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").slice(0, 90) || "Untitled scan";
  }

  updateScanJob(job.id, user.id, { pages, title, status: "draft", error: null });
  return NextResponse.json({ page, title, dir: Boolean(dir) });
}
