import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkButton, ExportButtons, ListenButton } from "@/components/document-tools";
import { Icon } from "@/components/icons";
import { MarkdownLite } from "@/components/markdown";
import { HighlightList, Highlighter, NotesPanel } from "@/components/notes-panel";
import { VerificationBadge } from "@/components/ui";
import { ViewLogger } from "@/components/view-logger";
import { requireSession } from "@/lib/auth";
import {
  getDocument,
  isBookmarked,
  listDocuments,
  listHighlights,
  listNotes,
} from "@/lib/db";
import { documentToMarkdown } from "@/lib/modes";
import { formatDate, readingTime, truncate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = getDocument(id);
  return { title: doc?.title ?? "Document" };
}

function renderMarks(text: string, highlights: string[]) {
  const usable = highlights.filter((h) => h.trim().length > 3);
  if (!usable.length) return text;
  const escaped = usable
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const lower = new Set(usable.map((h) => h.toLowerCase()));
  return text.split(pattern).map((part, index) =>
    lower.has(part.toLowerCase()) ? (
      <mark key={index} className="rounded bg-gold-soft px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default async function DocumentReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || (doc.ownerId && doc.ownerId !== user.id)) notFound();

  const path = `/library/${id}`;
  const bookmarked = isBookmarked(user.id, id);
  const notes = listNotes(user.id, id);
  const highlights = listHighlights(user.id, id);
  const related = listDocuments({ userId: user.id, subject: doc.subject ?? undefined, limit: 8 })
    .filter((d) => d.id !== doc.id)
    .slice(0, 4);
  const markdown = documentToMarkdown(doc);
  const isCase = Boolean(doc.brief);

  return (
    <div>
      <ViewLogger documentId={doc.id} />
      <div className="mb-4 flex items-center gap-1.5 text-[11.5px] text-muted no-print">
        <Link href="/library" className="hover:text-gold">
          Law Library
        </Link>
        <Icon name="chevron" size={11} />
        <span className="capitalize">{doc.kind}</span>
        {doc.subject ? (
          <>
            <Icon name="chevron" size={11} />
            <span>{doc.subject}</span>
          </>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_316px]">
        <article className="min-w-0">
          <header className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="chip">{doc.docType ?? doc.kind}</span>
              <VerificationBadge value={doc.verification} />
              {doc.jurisdiction ? <span className="chip">{doc.jurisdiction}</span> : null}
              {doc.subject ? <Link href={`/library?subject=${encodeURIComponent(doc.subject)}`} className="chip hover:border-gold">{doc.subject}</Link> : null}
            </div>
            <h1 className="max-w-3xl text-[1.9rem] leading-[1.18] sm:text-[2.35rem]">{doc.title}</h1>
            <p className="mt-2 text-[12.5px] text-muted">
              {[doc.citation, doc.court, doc.year ? String(doc.year) : null]
                .filter(Boolean)
                .join(" · ")}
              {doc.citation || doc.court ? " · " : ""}
              {readingTime(doc.officialText ?? doc.explanation)} min read
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 no-print">
              <BookmarkButton documentId={doc.id} initial={bookmarked} path={path} withLabel />
              <ExportButtons
                filename={`${doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60)}.md`}
                markdown={markdown}
              />
              <ListenButton
                text={`${doc.title}. ${doc.explanation ?? doc.officialText ?? ""}`}
                label="Audio recap"
              />
              {isCase ? (
                <Link href={`/cases/${doc.id}`} className="btn btn-primary h-9 px-3 text-xs">
                  <Icon name="sparkles" size={14} /> Structured case brief
                </Link>
              ) : null}
            </div>
          </header>

          {isCase && doc.brief ? (
            <div className="card-quiet mb-5 grid gap-3 p-4 sm:grid-cols-3">
              <div>
                <p className="eyebrow mb-1">Court</p>
                <p className="text-[12.5px]">{doc.brief.court}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Decided</p>
                <p className="text-[12.5px]">{doc.brief.date}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Verification</p>
                <p className="text-[12.5px]">Curated summary · check the reporter</p>
              </div>
            </div>
          ) : null}

          <Highlighter documentId={doc.id}>
            {doc.officialText ? (
              <section aria-labelledby="official-text" className="card mb-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-5 py-3">
                  <div>
                    <p className="eyebrow">Official text</p>
                    <h2 id="official-text" className="mt-0.5 font-display text-lg">
                      {doc.docType === "Bare Act" || doc.docType?.startsWith("Bare Act")
                        ? "Statutory provision"
                        : "Source text"}
                    </h2>
                  </div>
                  {doc.sourceUrl ? (
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                    >
                      Official source <Icon name="external" size={11} />
                    </a>
                  ) : null}
                </div>
                <div className="bg-surface px-5 py-6 sm:px-7">
                  <div className="whitespace-pre-wrap font-display text-[1.04rem] leading-[1.85] text-ink">
                    {renderMarks(doc.officialText, highlights.map((h) => h.text))}
                  </div>
                </div>
                <div className="border-t border-line px-5 py-3 text-[10.5px] leading-relaxed text-muted">
                  {doc.meta.verificationNote ??
                    "Text is provided for study. Verify the current amended wording on the official source before quoting."}
                </div>
              </section>
            ) : null}

            {doc.explanation ? (
              <section aria-labelledby="explanation" className="card mb-5 p-5 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="eyebrow">Study explanation</p>
                    <h2 id="explanation" className="mt-0.5 font-display text-lg">
                      What this means, and how to use it
                    </h2>
                  </div>
                  <span className="chip">Educational commentary</span>
                </div>
                <MarkdownLite text={doc.explanation} />
                <p className="mt-5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
                  This commentary is written for learning and is not the statutory text. It is not legal
                  advice. Cross-check every case reference and section number before relying on it.
                </p>
              </section>
            ) : null}
          </Highlighter>

          {isCase && doc.brief ? (
            <section className="card mb-5 p-5 sm:p-7">
              <p className="eyebrow mb-2">At a glance</p>
              <h2 className="font-display text-lg">Ratio decidendi</h2>
              <ul className="mt-2 space-y-2">
                {doc.brief.ratio.length ? (
                  doc.brief.ratio.map((item, index) => (
                    <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-[13px] text-muted">Not available in this record.</li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/cases/${doc.id}`} className="btn btn-primary h-9 px-3 text-xs">
                  Open the full brief <Icon name="arrow" size={13} />
                </Link>
                <Link href={`/tutor?doc=${doc.id}`} className="btn btn-secondary h-9 px-3 text-xs">
                  <Icon name="tutor" size={13} /> Ask about this case
                </Link>
              </div>
            </section>
          ) : null}

          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">Record details</p>
                <h2 className="font-display text-lg">Source and verification</h2>
              </div>
              <VerificationBadge value={doc.verification} />
            </div>
            <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-2">
              <div>
                <dt className="text-muted">Jurisdiction</dt>
                <dd className="font-medium">{doc.jurisdiction ?? "India"}</dd>
              </div>
              <div>
                <dt className="text-muted">Document type</dt>
                <dd className="font-medium">{doc.docType ?? doc.kind}</dd>
              </div>
              <div>
                <dt className="text-muted">Added to library</dt>
                <dd className="font-medium">{formatDate(doc.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted">Owner</dt>
                <dd className="font-medium">{doc.ownerId ? "You" : "Vidhi curated library"}</dd>
              </div>
            </dl>
            {doc.sourceUrl ? (
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-secondary mt-4 h-9 text-xs"
              >
                <Icon name="external" size={13} /> Open the official source
              </a>
            ) : null}
            {doc.meta.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {doc.meta.tags.map((tag) => (
                  <span key={tag} className="chip">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start no-print">
          <section className="card p-4">
            <p className="eyebrow mb-2">How to read this</p>
            <ul className="space-y-2 text-[11.5px] leading-relaxed text-ink-soft">
              <li className="flex gap-2">
                <span className="text-gold">01</span> Read the official text first; mark the ingredients.
              </li>
              <li className="flex gap-2">
                <span className="text-gold">02</span> Then read the explanation as commentary, not authority.
              </li>
              <li className="flex gap-2">
                <span className="text-gold">03</span> Select any passage to save it as a highlight.
              </li>
            </ul>
          </section>

          <NotesPanel documentId={doc.id} initialNotes={notes} />
          <HighlightList documentId={doc.id} highlights={highlights} />

          <section className="card p-4">
            <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold">
              <Icon name="library" size={14} className="text-gold" /> Related material
            </h2>
            <ul className="space-y-2.5">
              {related.length ? (
                related.map((item) => (
                  <li key={item.id}>
                    <Link href={`/library/${item.id}`} className="group block">
                      <p className="text-[12px] font-medium leading-snug group-hover:text-gold">
                        {truncate(item.title, 70)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {item.kind} · {item.subject}
                      </p>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-[11.5px] text-muted">Nothing related yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
