import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader, VerificationBadge } from "@/components/ui";
import { startScanAction } from "@/app/actions/scanner";
import { aiStatus } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { listDocuments, listScanJobs } from "@/lib/db";
import { formatDate, relativeTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Case Scanner" };

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "chip" },
  ready: { label: "Text ready", className: "chip chip-gold" },
  saved: { label: "Brief created", className: "chip chip-success" },
  failed: { label: "Needs attention", className: "chip chip-danger" },
};

export default async function ScannerPage() {
  const { user } = await requireSession();
  const jobs = listScanJobs(user.id);
  const briefs = listDocuments({ userId: user.id, kind: "brief", limit: 20 });
  const ai = aiStatus();

  return (
    <div>
      <PageHeader
        eyebrow="AI case study scanner"
        title="Turn a judgment into a study brief you can trust."
        description="Photograph printed pages or handwritten notes, or upload a PDF. Review the extracted text, correct it, then generate facts, issues, ratio, obiter and an exam outline — with every gap marked."
        actions={
          <form action={startScanAction}>
            <button type="submit" className="btn btn-primary">
              <Icon name="plus" size={15} /> New scan
            </button>
          </form>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold">
              <Icon name="camera" size={15} />
            </span>
            <p className="text-sm font-semibold">Photos & handwriting</p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            {ai.configured
              ? `Transcribed by ${ai.visionModel}. Multi-page, rotated and cropped before processing.`
              : "Add an AI vision model to transcribe photos. Without one, PDFs with a text layer still work and you can type corrections."}
          </p>
          <span className={`chip mt-2 ${ai.configured ? "chip-success" : "chip-gold"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {ai.configured ? "Vision ready" : "Local extraction only"}
          </span>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold">
              <Icon name="file" size={15} />
            </span>
            <p className="text-sm font-semibold">PDF judgments</p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Text-based PDFs are parsed locally on the server. Scanned PDFs without a text layer should be
            photographed or exported as images.
          </p>
          <span className="chip mt-2">Up to 25 pages · 15 MB each</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold">
              <Icon name="gavel" size={15} />
            </span>
            <p className="text-sm font-semibold">Never invented</p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            If a field is not supported by the page text, Vidhi writes “not available” and lists it under
            missing. Nothing is filled in from memory.
          </p>
          <span className="chip chip-gold mt-2">Edit before you trust</span>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg">Your scans</h2>
          <span className="text-[11px] text-muted">{jobs.length} saved</span>
        </div>
        {jobs.length ? (
          <div className="card divide-y divide-line">
            {jobs.map((job) => {
              const status = STATUS[job.status] ?? STATUS.draft;
              return (
                <Link
                  key={job.id}
                  href={`/scanner/${job.id}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-gold">
                    <Icon name={job.status === "saved" ? "check" : "scan"} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{job.title}</p>
                    <p className="text-[11px] text-muted">
                      {job.pages.length} page{job.pages.length === 1 ? "" : "s"} · updated {relativeTime(job.updatedAt)}
                    </p>
                  </div>
                  <span className={status.className}>{status.label}</span>
                  <Icon name="chevron" size={14} className="text-muted" />
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="scan"
            title="No scans yet"
            description="Start with a landmark judgment from the library, or scan tonight’s case study pages. Your first brief takes about two minutes."
            action={
              <form action={startScanAction}>
                <button type="submit" className="btn btn-primary">
                  <Icon name="camera" size={15} /> Start your first scan
                </button>
              </form>
            }
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg">Case briefs from your scans</h2>
          <Link href="/library?kind=brief" className="text-xs text-gold hover:underline">
            View in library
          </Link>
        </div>
        {briefs.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {briefs.map((doc) => (
              <Link key={doc.id} href={`/cases/${doc.id}`} className="card p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="chip">Case brief</span>
                  <VerificationBadge value={doc.verification} />
                </div>
                <p className="text-[14px] font-medium leading-snug">{doc.title}</p>
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                  {truncate(doc.brief?.ratio?.[0] ?? doc.brief?.decision ?? "Open the brief", 150)}
                </p>
                <p className="mt-2 text-[10.5px] text-muted">
                  {doc.subject} · {formatDate(doc.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card px-4 py-5 text-center text-[12.5px] text-muted">
            Briefs you generate will appear here and in your library.
          </div>
        )}
      </section>

      <div className="mt-8 rounded-2xl border border-line bg-surface-2 p-4 text-[11px] leading-relaxed text-muted">
        <strong className="text-ink">What the scanner does not do.</strong> It does not verify a judgment
        against the court record, and it cannot read a page it was not given. Missing pages, illegible words
        and absent metadata are flagged. Treat every generated brief as a draft and check it against the
        reporter before quoting it in an answer, memo or court filing.
      </div>
    </div>
  );
}
