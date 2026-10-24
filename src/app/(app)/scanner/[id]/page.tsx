import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ScannerStudio } from "@/components/scanner-studio";
import { aiConfigured } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { getScanJob, subjectsAvailable } from "@/lib/db";

export const metadata: Metadata = { title: "Scan workspace" };

export default async function ScanWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await requireSession();
  const { id } = await params;
  const job = getScanJob(id, user.id);
  if (!job) notFound();

  const available = subjectsAvailable(user.id);
  const subjects = [...new Set([...(profile?.subjects ?? []), ...available])].slice(0, 20);
  const defaultSubject = profile?.subjects?.[0] ?? available[0] ?? "Constitutional Law";

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-[11.5px] text-muted no-print">
        <Link href="/scanner" className="hover:text-gold">
          Case Scanner
        </Link>
        <Icon name="chevron" size={11} />
        <span className="truncate">{job.title}</span>
      </div>

      <div className="mb-5 max-w-3xl">
        <p className="eyebrow mb-1.5">Scan workspace</p>
        <h1 className="text-[1.7rem] leading-tight sm:text-[2rem]">Read the page, then build the brief.</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          Add pages, correct the OCR, and only then generate. Every extracted field is editable, and anything
          the document does not support is marked unavailable.
        </p>
      </div>

      {job.status === "saved" && job.documentId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5 text-[12px] text-success">
          <span>This scan has already been turned into a case brief.</span>
          <Link href={`/cases/${job.documentId}`} className="font-medium underline">
            Open the brief
          </Link>
        </div>
      ) : null}

      <ScannerStudio
        job={{
          id: job.id,
          title: job.title,
          status: job.status,
          pages: job.pages,
          rawText: job.rawText,
          error: job.error,
        }}
        subjects={subjects}
        defaultSubject={defaultSubject}
        aiReady={aiConfigured()}
      />
    </div>
  );
}
