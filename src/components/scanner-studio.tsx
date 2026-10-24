"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import {
  deleteScanAction,
  extractScanAction,
  generateCaseFromScanAction,
  removePageAction,
  renameScanAction,
  reorderPageAction,
  saveExtractedTextAction,
  type ScanState,
} from "@/app/actions/scanner";
import type { ScanPage } from "@/lib/types";

type Transform = { rotation: number; crop: { top: number; right: number; bottom: number; left: number } };

const EMPTY_CROP = { top: 0, right: 0, bottom: 0, left: 0 };

function keyFor(pageId: string) {
  return pageId;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScannerStudio({
  job,
  subjects,
  defaultSubject,
  aiReady,
}: {
  job: { id: string; title: string; status: string; pages: ScanPage[]; rawText: string; error: string | null };
  subjects: string[];
  defaultSubject: string;
  aiReady: boolean;
}) {
  const router = useRouter();
  const [transforms, setTransforms] = useState<Record<string, Transform>>(() =>
    Object.fromEntries(
      job.pages.map((page) => [keyFor(page.id), { rotation: page.rotation, crop: page.crop }]),
    ),
  );
  const [title, setTitle] = useState(job.title);
  const [titleSaving, setTitleSaving] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "warn" | "error"; message: string } | null>(
    job.error ? { type: "error", message: job.error } : null,
  );
  const [extracting, startExtract] = useTransition();
  const [workingPage, setWorkingPage] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState<string | null>(null);
  const [text, setText] = useState(job.rawText);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [savingText, startSaveText] = useTransition();
  const [generateState, generateAction, generating] = useActionState(
    generateCaseFromScanAction,
    {} as ScanState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTransforms(
      Object.fromEntries(
        job.pages.map((page) => [keyFor(page.id), { rotation: page.rotation, crop: page.crop }]),
      ),
    );
  }, [job.pages]);

  useEffect(() => {
    if (!dirtyRef.current) setText(job.rawText);
  }, [job.rawText]);

  const pendingEdits = Object.values(transforms).some(
    (t) => t.rotation !== 0 || t.crop.top || t.crop.right || t.crop.bottom || t.crop.left,
  );

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploadError("");
    for (const file of files) {
      if (uploading.length >= 25) break;
      setUploading((prev) => [...prev, file.name]);
      try {
        const body = new FormData();
        body.append("jobId", job.id);
        body.append("file", file);
        const res = await fetch("/api/scan/upload", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { error?: string; title?: string };
        if (!res.ok) {
          setUploadError(data.error ?? `Could not upload ${file.name}.`);
        } else if (data.title) {
          setTitle(data.title);
        }
      } catch {
        setUploadError(`Could not upload ${file.name}. Check your connection and try again.`);
      } finally {
        setUploading((prev) => prev.filter((name) => name !== file.name));
      }
    }
    router.refresh();
  }

  function updateTransform(pageId: string, patch: Partial<Transform>) {
    setTransforms((prev) => ({
      ...prev,
      [pageId]: { ...(prev[pageId] ?? { rotation: 0, crop: EMPTY_CROP }), ...patch },
    }));
  }

  function updateCrop(pageId: string, edge: keyof Transform["crop"], value: number) {
    const current = transforms[pageId] ?? { rotation: 0, crop: EMPTY_CROP };
    updateTransform(pageId, { crop: { ...current.crop, [edge]: value } });
  }

  async function saveTitle() {
    setTitleSaving(true);
    const result = await renameScanAction(job.id, title);
    setTitleSaving(false);
    if (result.ok) {
      setNotice({ type: "ok", message: "Scan title updated." });
      router.refresh();
    } else {
      setNotice({ type: "error", message: result.error ?? "Could not rename the scan." });
    }
  }

  async function applyEdits(page: ScanPage) {
    const transform = transforms[page.id] ?? { rotation: 0, crop: EMPTY_CROP };
    if (
      transform.rotation === 0 &&
      !transform.crop.top &&
      !transform.crop.right &&
      !transform.crop.bottom &&
      !transform.crop.left
    ) {
      return;
    }
    setWorkingPage(page.id);
    setNotice(null);
    try {
      const img = new Image();
      img.src = `/api/scan/file/${job.id}/${page.id}`;
      await img.decode();
      const rotation = ((transform.rotation % 360) + 360) % 360;
      const rotatedWidth = rotation % 180 === 0 ? img.naturalWidth : img.naturalHeight;
      const rotatedHeight = rotation % 180 === 0 ? img.naturalHeight : img.naturalWidth;
      const base = document.createElement("canvas");
      base.width = rotatedWidth;
      base.height = rotatedHeight;
      const ctx = base.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const left = Math.round((transform.crop.left / 100) * rotatedWidth);
      const right = Math.round((transform.crop.right / 100) * rotatedWidth);
      const top = Math.round((transform.crop.top / 100) * rotatedHeight);
      const bottom = Math.round((transform.crop.bottom / 100) * rotatedHeight);
      const cropWidth = Math.max(20, rotatedWidth - left - right);
      const cropHeight = Math.max(20, rotatedHeight - top - bottom);
      const output = document.createElement("canvas");
      output.width = cropWidth;
      output.height = cropHeight;
      output.getContext("2d")?.drawImage(base, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not render the edited page.");
      const body = new FormData();
      body.append("jobId", job.id);
      body.append("pageId", page.id);
      body.append("file", new File([blob], page.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/scan/upload", { method: "POST", body });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Upload failed.");
      }
      setTransforms((prev) => ({ ...prev, [page.id]: { rotation: 0, crop: EMPTY_CROP } }));
      setCropOpen(null);
      setNotice({ type: "ok", message: "Page edits applied. The edited image is what will be read." });
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Could not apply the edits.",
      });
    } finally {
      setWorkingPage(null);
    }
  }

  function extract() {
    setNotice(null);
    startExtract(async () => {
      const result = await extractScanAction(job.id);
      if (result.error) setNotice({ type: "error", message: result.error });
      else if (result.message)
        setNotice({ type: result.warning ? "warn" : "ok", message: result.message });
      router.refresh();
    });
  }

  function saveText() {
    startSaveText(async () => {
      const result = await saveExtractedTextAction(job.id, text);
      if (result.ok) {
        dirtyRef.current = false;
        setDirty(false);
        setNotice({ type: "ok", message: result.message ?? "Text saved." });
        router.refresh();
      } else {
        setNotice({ type: "error", message: result.error ?? "Could not save the text." });
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="scan-title" className="eyebrow mb-1 block">
            Scan title
          </label>
          <div className="flex gap-2">
            <input
              id="scan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input max-w-md font-display text-lg"
              maxLength={120}
            />
            <button
              type="button"
              className="btn btn-secondary shrink-0"
              onClick={saveTitle}
              disabled={titleSaving || title.trim() === job.title}
            >
              {titleSaving ? "Saving…" : "Rename"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">{job.pages.length} page{job.pages.length === 1 ? "" : "s"}</span>
          <span className={`chip ${job.status === "ready" || job.status === "saved" ? "chip-success" : "chip-gold"}`}>
            {job.status === "saved" ? "Brief created" : job.status === "ready" ? "Text ready" : "Editing"}
          </span>
        </div>
      </div>

      {notice ? (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={`mb-4 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed ${
            notice.type === "error"
              ? "border-danger/30 bg-danger/5 text-danger"
              : notice.type === "warn"
                ? "border-gold/40 bg-gold-soft/40 text-ink-soft"
                : "border-success/30 bg-success/5 text-success"
          }`}
        >
          {notice.message}
        </div>
      ) : null}
      {generateState.error ? (
        <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 text-[12.5px] text-danger">
          {generateState.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg">Pages</h2>
                <p className="text-[11.5px] text-muted">
                  Rotate and trim each page, then apply the edits before extraction.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary h-9 px-3 text-xs" onClick={() => cameraInputRef.current?.click()}>
                  <Icon name="camera" size={14} /> Take photo
                </button>
                <button type="button" className="btn btn-primary h-9 px-3 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="upload" size={14} /> Upload
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              multiple
              className="sr-only"
              aria-label="Upload pages"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void uploadFiles(files);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-label="Take a photo of a page"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void uploadFiles(files);
              }}
            />

            {job.pages.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void uploadFiles(Array.from(e.dataTransfer.files));
                }}
                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2 px-4 py-12 text-center transition hover:border-gold"
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold-soft text-gold">
                  <Icon name="camera" size={20} />
                </span>
                <span className="text-sm font-semibold">Add the first page</span>
                <span className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">
                  Photograph a printed judgment, a textbook case study or handwritten notes. Or drop a PDF
                  here. You can add up to 25 pages.
                </span>
              </button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {job.pages.map((page, index) => {
                  const transform = transforms[page.id] ?? { rotation: 0, crop: EMPTY_CROP };
                  const edited =
                    transform.rotation !== 0 ||
                    transform.crop.top ||
                    transform.crop.right ||
                    transform.crop.bottom ||
                    transform.crop.left;
                  return (
                    <div key={page.id} className="overflow-hidden rounded-xl border border-line bg-surface-2">
                      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-paper-deep">
                        {page.kind === "pdf" ? (
                          <div className="text-center">
                            <Icon name="file" size={26} className="mx-auto text-gold" />
                            <p className="mt-1 px-2 text-[10.5px] text-muted">PDF · {formatBytes(page.size)}</p>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/scan/file/${job.id}/${page.id}`}
                            alt={`Page ${index + 1}: ${page.name}`}
                            className="max-h-full max-w-full object-contain transition-transform"
                            style={{
                              transform: `rotate(${transform.rotation}deg)`,
                              clipPath: `inset(${transform.crop.top}% ${transform.crop.right}% ${transform.crop.bottom}% ${transform.crop.left}%)`,
                            }}
                          />
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {index + 1}
                        </span>
                        {edited ? (
                          <span className="absolute right-2 top-2 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-semibold text-[#1c1403]">
                            edited
                          </span>
                        ) : null}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-[11px] font-medium" title={page.name}>
                          {page.name}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-gold disabled:opacity-40"
                            onClick={() => reorderPageAction(job.id, page.id, "up").then(() => router.refresh())}
                            disabled={index === 0}
                            aria-label={`Move page ${index + 1} up`}
                          >
                            <Icon name="chevron" size={12} className="-rotate-90" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-gold disabled:opacity-40"
                            onClick={() => reorderPageAction(job.id, page.id, "down").then(() => router.refresh())}
                            disabled={index === job.pages.length - 1}
                            aria-label={`Move page ${index + 1} down`}
                          >
                            <Icon name="chevron" size={12} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-gold"
                            onClick={() =>
                              updateTransform(page.id, { rotation: (transform.rotation + 90) % 360 })
                            }
                            aria-label={`Rotate page ${index + 1}`}
                            title="Rotate 90°"
                          >
                            <Icon name="rotate" size={12} />
                          </button>
                          <button
                            type="button"
                            className={`rounded-lg border border-line bg-surface p-1.5 ${
                              cropOpen === page.id ? "text-gold" : "text-muted"
                            } hover:text-gold`}
                            onClick={() => setCropOpen(cropOpen === page.id ? null : page.id)}
                            aria-expanded={cropOpen === page.id}
                            aria-label={`Crop page ${index + 1}`}
                            title="Trim edges"
                          >
                            <Icon name="grid" size={12} />
                          </button>
                          <button
                            type="button"
                            className="ml-auto rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-danger"
                            onClick={() => {
                              if (window.confirm(`Remove page ${index + 1}?`)) {
                                removePageAction(job.id, page.id).then(() => router.refresh());
                              }
                            }}
                            aria-label={`Remove page ${index + 1}`}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>

                        {cropOpen === page.id ? (
                          <div className="mt-2 rounded-lg border border-line bg-surface p-2">
                            <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                              Trim edges (%)
                            </p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              {(["top", "right", "bottom", "left"] as const).map((edge) => (
                                <label key={edge} className="flex items-center gap-1.5 text-[9.5px] text-muted">
                                  <span className="w-8 capitalize">{edge}</span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={30}
                                    value={transform.crop[edge]}
                                    onChange={(e) => updateCrop(page.id, edge, Number(e.target.value))}
                                    className="w-full accent-[var(--gold)]"
                                    aria-label={`Crop ${edge} of page ${index + 1}`}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {edited ? (
                          <button
                            type="button"
                            className="btn btn-gold mt-2 h-7 w-full text-[10.5px]"
                            onClick={() => applyEdits(page)}
                            disabled={workingPage === page.id || page.kind === "pdf"}
                          >
                            {workingPage === page.id
                              ? "Applying…"
                              : page.kind === "pdf"
                                ? "Rotate/crop images only"
                                : "Apply image edits"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {job.pages.length ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void uploadFiles(Array.from(e.dataTransfer.files));
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-3 py-3 text-[11.5px] text-muted transition hover:border-gold hover:text-gold"
              >
                <Icon name="plus" size={13} /> Add more pages, or drop them here
              </button>
            ) : null}

            {uploading.length ? (
              <div className="mt-3 space-y-1.5">
                {uploading.map((name) => (
                  <div key={name} className="flex items-center gap-2 text-[11px] text-muted">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    Uploading {name}…
                  </div>
                ))}
              </div>
            ) : null}
            {uploadError ? <p className="mt-2 text-[11.5px] text-danger">{uploadError}</p> : null}
          </section>

          <section className="card mt-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-3">
              <div>
                <h2 className="font-display text-lg">Extracted text</h2>
                <p className="text-[11px] text-muted">
                  {text.trim().length.toLocaleString("en-IN")} characters · edit before generating
                </p>
              </div>
              <div className="flex items-center gap-2">
                {dirty ? <span className="chip chip-gold">Unsaved</span> : null}
                <button
                  type="button"
                  className="btn btn-secondary h-8 px-3 text-[11px]"
                  onClick={saveText}
                  disabled={savingText || !dirty}
                >
                  {savingText ? "Saving…" : "Save text"}
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                dirtyRef.current = true;
                setDirty(true);
              }}
              rows={18}
              placeholder="Extracted text will appear here. You can also paste or type a case note directly."
              className="w-full resize-y border-0 bg-surface px-4 py-4 font-mono text-[12px] leading-relaxed text-ink focus:outline-none sm:px-5"
              spellCheck={false}
              aria-label="Extracted document text"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10.5px] text-muted">
              <span>OCR is a draft. Fix names, citations and section numbers before you rely on them.</span>
              <span>{text.trim().split(/\s+/).filter(Boolean).length.toLocaleString("en-IN")} words</span>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-4">
            <p className="eyebrow mb-3">Workflow</p>
            <ol className="space-y-3 text-[11.5px]">
              <li className="flex gap-2.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${job.pages.length ? "bg-success/15 text-success" : "bg-gold-soft text-gold"}`}>
                  {job.pages.length ? <Icon name="check" size={11} /> : "1"}
                </span>
                <div>
                  <p className="font-medium">Add and edit pages</p>
                  <p className="text-muted">{job.pages.length} page(s) attached</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${text.trim().length > 80 ? "bg-success/15 text-success" : "bg-gold-soft text-gold"}`}>
                  {text.trim().length > 80 ? <Icon name="check" size={11} /> : "2"}
                </span>
                <div>
                  <p className="font-medium">Extract text</p>
                  <p className="text-muted">
                    {aiReady ? "PDF parser + vision model" : "PDF parser only — add AI for photos"}
                  </p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${text.trim().length > 80 ? "bg-gold-soft text-gold" : "bg-surface-2 text-muted"}`}>
                  3
                </span>
                <div>
                  <p className="font-medium">Correct the text</p>
                  <p className="text-muted">Edits are saved to this scan</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
                  4
                </span>
                <div>
                  <p className="font-medium">Generate the brief</p>
                  <p className="text-muted">Saved to your library</p>
                </div>
              </li>
            </ol>

            {pendingEdits ? (
              <p className="mt-3 rounded-lg border border-gold/30 bg-gold-soft/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-soft">
                You have unapplied page edits. Apply them first, or extraction will read the original image.
              </p>
            ) : null}

            <button
              type="button"
              className="btn btn-primary mt-4 w-full"
              onClick={extract}
              disabled={extracting || !job.pages.length || pendingEdits}
            >
              {extracting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading pages…
                </>
              ) : (
                <>
                  <Icon name="scan" size={15} /> Extract text
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
              {aiReady
                ? "Pages are processed one at a time. Photos are sent to your configured AI provider."
                : "Images need an AI vision provider. Text-based PDFs work without one."}
            </p>
          </section>

          <section className="card p-4">
            <p className="eyebrow mb-2">Generate study material</p>
            <form
              ref={formRef}
              action={generateAction}
              onSubmit={async (event) => {
                if (dirtyRef.current) {
                  event.preventDefault();
                  const result = await saveExtractedTextAction(job.id, text);
                  if (!result.ok) {
                    setNotice({ type: "error", message: result.error ?? "Could not save the text." });
                    return;
                  }
                  dirtyRef.current = false;
                  setDirty(false);
                  window.setTimeout(() => formRef.current?.requestSubmit(), 0);
                }
              }}
            >
              <input type="hidden" name="jobId" value={job.id} />
              <label htmlFor="case-subject" className="label">
                Subject
              </label>
              <select id="case-subject" name="subject" defaultValue={defaultSubject} className="select mb-3 text-xs">
                {(subjects.length ? subjects : ["Constitutional Law", "Criminal Law", "Contract Law", "Family Law", "Criminal Procedure"]).map(
                  (subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ),
                )}
                <option value="Uncategorised">Uncategorised</option>
              </select>
              <label htmlFor="case-title" className="label">
                Title (optional)
              </label>
              <input
                id="case-title"
                name="title"
                placeholder="Leave blank to use the detected case name"
                className="input mb-3 text-xs"
                maxLength={180}
              />
              <button
                type="submit"
                className="btn btn-gold w-full"
                disabled={generating || text.trim().length < 80}
              >
                {generating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Building the brief…
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" size={15} /> Generate case brief
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
                {text.trim().length < 80
                  ? "Add or extract at least 80 characters of text first."
                  : "Sections without support are marked “not available”."}
              </p>
            </form>
          </section>

          <section className="card p-4">
            <p className="eyebrow mb-2">Page guidance</p>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-muted">
              <li>• Keep the page number and header in the frame — metadata lives there.</li>
              <li>• Crop out desk edges, not the citation line.</li>
              <li>• Handwriting works better with even lighting and no shadow across the page.</li>
              <li>• Fix “l”/“1” and “O”/“0” errors in statutes before generating.</li>
            </ul>
            <form
              action={deleteScanAction.bind(null, job.id)}
              className="mt-3 border-t border-line pt-3"
            >
              <button type="submit" className="btn btn-ghost h-8 px-2 text-[10.5px] text-muted hover:text-danger">
                <Icon name="trash" size={12} /> Delete this scan
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
