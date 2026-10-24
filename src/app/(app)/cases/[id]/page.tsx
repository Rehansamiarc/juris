import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCaseSubjectAction } from "@/app/actions/cases";
import { BriefTabs } from "@/components/brief-tabs";
import { CaseTools } from "@/components/case-tools";
import { BookmarkButton } from "@/components/document-tools";
import { Icon } from "@/components/icons";
import { VerificationBadge } from "@/components/ui";
import { ViewLogger } from "@/components/view-logger";
import { requireSession } from "@/lib/auth";
import { BRIEF_SECTIONS, UNAVAILABLE } from "@/lib/casebrief";
import {
  getDocument,
  isBookmarked,
  listDocuments,
  listFlashcards,
  subjectsAvailable,
} from "@/lib/db";
import { briefModes, briefToMarkdown, mnemonicFromBrief } from "@/lib/modes";
import { formatDate, truncate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = getDocument(id);
  return { title: doc?.brief?.caseName ?? doc?.title ?? "Case brief" };
}

const IDENTITY_KEYS = new Set(["caseName", "citation", "court", "date", "bench"]);

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user } = await requireSession();
  const { id } = await params;
  const { saved } = await searchParams;
  const doc = getDocument(id);
  if (!doc || !doc.brief) notFound();
  if (doc.ownerId && doc.ownerId !== user.id) notFound();

  const brief = doc.brief;
  const modes = briefModes(brief);
  const sections = BRIEF_SECTIONS.filter((section) => !IDENTITY_KEYS.has(section.key)).map((section) => {
    const value = brief[section.key];
    return {
      label: section.label,
      value: Array.isArray(value) ? value : (value as string),
    };
  });
  const cards = listFlashcards(user.id, doc.id);
  const mnemonic = mnemonicFromBrief(brief);
  const related = listDocuments({ userId: user.id, subject: doc.subject ?? undefined, limit: 12 })
    .filter((item) => item.id !== doc.id && (item.kind === "judgment" || item.kind === "brief"))
    .slice(0, 4);
  const subjects = subjectsAvailable(user.id);
  const isOwner = doc.ownerId === user.id;
  const generatedLocally = brief.generatedBy === "local";
  const audioText = [
    `${brief.caseName}. ${brief.court}.`,
    ...modes.filter((mode) => mode.id !== "detailed").map((mode) => `${mode.label}. ${mode.body}`),
  ].join(" ");
  const markdown = briefToMarkdown(brief, {
    sourceUrl: doc.sourceUrl,
    verified: doc.verification,
  });

  return (
    <div>
      <ViewLogger documentId={doc.id} />
      <div className="mb-4 flex items-center gap-1.5 text-[11.5px] text-muted no-print">
        <Link href="/library" className="hover:text-gold">
          Law Library
        </Link>
        <Icon name="chevron" size={11} />
        <Link href="/library?kind=brief" className="hover:text-gold">
          Case briefs
        </Link>
        <Icon name="chevron" size={11} />
        <span className="truncate">{truncate(brief.caseName, 50)}</span>
      </div>

      {saved ? (
        <div role="status" className="mb-4 rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5 text-[12px] text-success">
          Brief saved. Missing fields were recalculated from your edits.
        </div>
      ) : null}

      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="chip">{doc.docType ?? "Case brief"}</span>
          <VerificationBadge value={doc.verification} />
          {doc.subject ? <span className="chip">{doc.subject}</span> : null}
          {doc.brief.generatedBy === "ai" ? <span className="chip chip-gold">AI-assisted</span> : null}
          {generatedLocally ? <span className="chip chip-danger">Local extraction</span> : null}
          {doc.brief.generatedBy === "curated" ? <span className="chip">Curated study brief</span> : null}
        </div>
        <h1 className="max-w-4xl text-[1.85rem] leading-[1.18] sm:text-[2.3rem]">{brief.caseName}</h1>
        <p className="mt-2 text-[12.5px] text-muted">
          {[brief.citation, brief.court, brief.date].filter((v) => v && v !== UNAVAILABLE).join(" · ") ||
            "Identity details unavailable"}
        </p>
        {brief.bench !== UNAVAILABLE ? (
          <p className="mt-1 text-[11.5px] text-muted">Bench: {brief.bench}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2 no-print">
          <BookmarkButton documentId={doc.id} initial={isBookmarked(user.id, doc.id)} path={`/cases/${doc.id}`} withLabel />
          <Link href={`/tutor?doc=${doc.id}`} className="btn btn-secondary h-9 px-3 text-xs">
            <Icon name="tutor" size={14} /> Ask about this case
          </Link>
          {isOwner ? (
            <Link href={`/cases/${doc.id}/edit`} className="btn btn-secondary h-9 px-3 text-xs">
              <Icon name="edit" size={14} /> Edit brief
            </Link>
          ) : null}
          <Link href={`/cases/compare?left=${doc.id}`} className="btn btn-ghost h-9 px-3 text-xs">
            <Icon name="compare" size={14} /> Compare
          </Link>
        </div>
      </header>

      {generatedLocally ? (
        <div className="mb-5 flex gap-3 rounded-xl border border-gold/40 bg-gold-soft/40 p-4">
          <Icon name="scan" size={18} className="mt-0.5 shrink-0 text-gold" />
          <div className="text-[12px] leading-relaxed">
            <p className="font-semibold text-ink">This brief was assembled locally, not generated by AI.</p>
            <p className="mt-0.5 text-ink-soft">
              Facts, issues and holdings below are sentences copied from the document you supplied — no
              analysis has been added, and nothing is filled in from memory. Anything the text does not
              support is marked unavailable. Add an AI provider for a synthesised brief, or edit by hand.
            </p>
            {isOwner ? (
              <Link href={`/cases/${doc.id}/edit`} className="mt-2 inline-flex text-[11.5px] font-medium text-gold hover:underline">
                Fill in the brief manually →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <BriefTabs modes={modes} sections={sections} />

          {doc.brief.missing.length ? (
            <section className="card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft text-gold">
                  <Icon name="clock" size={13} />
                </span>
                <h2 className="font-display text-lg">Gaps and verification</h2>
              </div>
              <p className="text-[12px] leading-relaxed text-muted">
                {doc.brief.missing.length} item{doc.brief.missing.length === 1 ? "" : "s"} could not be
                verified from the source. Nothing here has been guessed.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {doc.brief.missing.slice(0, 14).map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
                Confidence: <span className="font-medium capitalize text-ink-soft">{doc.brief.confidence}</span>
                {" · "}
                Always check a citation in the reporter before quoting it. {doc.meta.verificationNote}
              </p>
            </section>
          ) : null}

          {mnemonic ? (
            <section className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg">Mnemonic</h2>
                <span className="chip chip-gold">Built from the brief</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mnemonic.acronym.split("").map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold-soft font-display text-lg text-gold"
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5">
                {mnemonic.lines.map((line, index) => (
                  <li key={index} className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
                    <span className="w-4 font-semibold text-gold">{line.letter}</span>
                    {line.text}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted">
                Deterministic acronym from the points you have recorded — not an AI suggestion.
              </p>
            </section>
          ) : null}

          {doc.officialText ? (
            <details className="card group overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-2 bg-surface-2 px-5 py-3.5 text-[13px] font-medium">
                <span className="flex items-center gap-2">
                  <Icon name="file" size={14} className="text-gold" /> Extracted source text
                </span>
                <span className="text-[10.5px] text-muted">
                  {doc.officialText.trim().split(/\s+/).length.toLocaleString("en-IN")} words · show
                </span>
              </summary>
              <div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap px-5 py-4 font-mono text-[11.5px] leading-relaxed text-ink-soft">
                {doc.officialText}
              </div>
              <div className="border-t border-line px-5 py-2.5 text-[10px] text-muted">
                Extracted text is editable from the scanner workspace. It is stored with this brief for
                reference only.
              </div>
            </details>
          ) : null}

          <section className="card p-5">
            <h2 className="mb-1 font-display text-lg">Reading the full brief</h2>
            <p className="mb-3 text-[12px] text-muted">
              Switch to “Detailed case brief” above for every structured field. The sections below are the
              ones students most often quote in exams.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="eyebrow mb-1">Ratio decidendi</p>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">
                  {brief.ratio[0] ? truncate(brief.ratio[0], 240) : "Not available in this record."}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="eyebrow mb-1">Decision</p>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">
                  {brief.decision === UNAVAILABLE ? "Not available in this record." : truncate(brief.decision, 240)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start no-print">
          <CaseTools
            documentId={doc.id}
            title={doc.title}
            markdown={markdown}
            audioText={audioText}
            cardCount={cards.length}
          />

          <section className="card p-4">
            <p className="eyebrow mb-2">Record</p>
            <dl className="space-y-2 text-[11.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Added</dt>
                <dd>{formatDate(doc.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Origin</dt>
                <dd>{isOwner ? "Your upload" : "Vidhi library"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Cards</dt>
                <dd>{cards.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Confidence</dt>
                <dd className="capitalize">{brief.confidence}</dd>
              </div>
            </dl>
            {doc.sourceUrl ? (
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-secondary mt-3 h-8 w-full text-[11px]"
              >
                <Icon name="external" size={12} /> Official source
              </a>
            ) : null}
          </section>

          {isOwner ? (
            <section className="card p-4">
              <label htmlFor="case-subject" className="eyebrow mb-2 block">
                Subject folder
              </label>
              <form action={updateCaseSubjectAction} className="flex gap-2">
                <input type="hidden" name="documentId" value={doc.id} />
                <select id="case-subject" name="subject" defaultValue={doc.subject ?? "Uncategorised"} className="select py-2 text-xs">
                  {[...new Set([doc.subject ?? "Uncategorised", ...subjects])].map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-secondary shrink-0 px-2.5 text-[11px]">
                  File
                </button>
              </form>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                Filing a case updates its subject across the library.
              </p>
            </section>
          ) : null}

          {cards.length ? (
            <section className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">Flashcards</h2>
                <Link href="/revision" className="text-[10.5px] text-gold hover:underline">
                  Review
                </Link>
              </div>
              <ul className="space-y-2">
                {cards.slice(0, 4).map((card) => (
                  <li key={card.id} className="text-[11.5px] leading-snug text-ink-soft">
                    <span className="mr-1 text-gold">Q.</span>
                    {truncate(card.front, 80)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card p-4">
            <h2 className="mb-2 text-[13px] font-semibold">Related cases</h2>
            <ul className="space-y-2.5">
              {related.length ? (
                related.map((item) => (
                  <li key={item.id}>
                    <Link href={`/cases/${item.id}`} className="group block">
                      <p className="text-[11.5px] font-medium leading-snug group-hover:text-gold">
                        {truncate(item.title, 68)}
                      </p>
                      <p className="text-[9.5px] text-muted">{item.citation ?? item.subject}</p>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-muted">No related cases yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
