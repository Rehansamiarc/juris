import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkButton } from "@/components/document-tools";
import { Icon } from "@/components/icons";
import { DocTypeBadge, EmptyState, PageHeader, VerificationBadge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import {
  courtsAvailable,
  listBookmarks,
  listDocuments,
  subjectsAvailable,
  yearsAvailable,
} from "@/lib/db";
import type { DocumentRecord } from "@/lib/types";
import { cn, readingTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Law Library" };

type Params = { q?: string; subject?: string; kind?: string; court?: string; year?: string; saved?: string };

const KINDS = [
  { value: "", label: "All material" },
  { value: "statute", label: "Bare Acts" },
  { value: "judgment", label: "Judgments" },
  { value: "brief", label: "Case briefs" },
  { value: "note", label: "Student notes" },
  { value: "article", label: "Articles" },
  { value: "upload", label: "Uploads" },
];

function buildHref(params: Params, patch: Partial<Params>) {
  const merged = { ...params, ...patch };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return `/library${query ? `?${query}` : ""}`;
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { user, profile } = await requireSession();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const savedOnly = params.saved === "1";

  const docs = listDocuments({
    userId: user.id,
    q: q || undefined,
    subject: params.subject || undefined,
    kind: params.kind || undefined,
    court: params.court || undefined,
    year: params.year || undefined,
    bookmarkedOnly: savedOnly,
    limit: 300,
  });
  const bookmarkIds = new Set(listBookmarks(user.id).map((d) => d.id));
  const subjects = subjectsAvailable(user.id);
  const courts = courtsAvailable(user.id);
  const years = yearsAvailable(user.id);
  const hasFilters = Boolean(q || params.subject || params.kind || params.court || params.year || savedOnly);
  const interest = new Set(profile?.subjects ?? []);

  const counts = {
    statutes: docs.filter((d) => d.kind === "statute").length,
    judgments: docs.filter((d) => d.kind === "judgment" || d.kind === "brief").length,
    notes: docs.filter((d) => d.kind === "note" || d.kind === "article").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Smart law library"
        title="Everything you need, organised the way law is taught."
        description="Bare Act text, judgments, student notes and your own uploads — filtered by subject, court, year and principle. Official text is always separated from study commentary."
        actions={
          <Link href="/scanner" className="btn btn-primary">
            <Icon name="upload" size={15} /> Add your own material
          </Link>
        }
      />

      <form
        method="get"
        action="/library"
        className="card mb-5 p-4"
        role="search"
        aria-label="Search the law library"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by case name, section, principle or court…"
              className="input pl-9"
              aria-label="Search documents"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {hasFilters ? (
            <Link href="/library" className="btn btn-ghost">
              Clear
            </Link>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <label htmlFor="filter-subject" className="sr-only">
              Subject
            </label>
            <select id="filter-subject" name="subject" defaultValue={params.subject ?? ""} className="select py-2 text-xs">
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-kind" className="sr-only">
              Document type
            </label>
            <select id="filter-kind" name="kind" defaultValue={params.kind ?? ""} className="select py-2 text-xs">
              {KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-court" className="sr-only">
              Court
            </label>
            <select id="filter-court" name="court" defaultValue={params.court ?? ""} className="select py-2 text-xs">
              <option value="">All courts</option>
              {courts.map((court) => (
                <option key={court} value={court}>
                  {court}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="filter-year" className="sr-only">
                Year
              </label>
              <select id="filter-year" name="year" defaultValue={params.year ?? ""} className="select py-2 text-xs">
                <option value="">Any year</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {savedOnly ? <input type="hidden" name="saved" value="1" /> : null}
        <button type="submit" className="sr-only">
          Apply filters
        </button>
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Link
          href={buildHref(params, { kind: "", saved: undefined })}
          className={cn("chip", !params.kind && !savedOnly ? "chip-gold" : "hover:border-gold")}
        >
          All · {docs.length}
        </Link>
        <Link
          href={buildHref(params, { kind: "statute", saved: undefined })}
          className={cn("chip", params.kind === "statute" ? "chip-gold" : "hover:border-gold")}
        >
          <Icon name="book" size={11} /> Bare Acts
        </Link>
        <Link
          href={buildHref(params, { kind: "judgment", saved: undefined })}
          className={cn("chip", params.kind === "judgment" ? "chip-gold" : "hover:border-gold")}
        >
          <Icon name="gavel" size={11} /> Judgments
        </Link>
        <Link
          href={buildHref(params, { kind: "note", saved: undefined })}
          className={cn("chip", params.kind === "note" ? "chip-gold" : "hover:border-gold")}
        >
          <Icon name="note" size={11} /> Notes
        </Link>
        <Link
          href={buildHref(params, { saved: savedOnly ? undefined : "1" })}
          className={cn("chip", savedOnly ? "chip-gold" : "hover:border-gold")}
        >
          <Icon name="bookmark" size={11} /> Saved
        </Link>
        <span className="ml-auto text-[11px] text-muted">
          {docs.length} result{docs.length === 1 ? "" : "s"}
          {hasFilters ? " · filtered" : ""}
        </span>
      </div>

      {docs.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {docs.map((doc) => (
            <LibraryCard
              key={doc.id}
              doc={doc}
              bookmarked={bookmarkIds.has(doc.id)}
              interested={doc.subject ? interest.has(doc.subject) : false}
              href={doc.kind === "brief" || doc.kind === "judgment" ? `/cases/${doc.id}` : `/library/${doc.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No material matches those filters"
          description="Try a broader search, clear a filter, or scan your own case notes — they join the library immediately."
          action={
            <div className="flex gap-2">
              <Link href="/library" className="btn btn-secondary">
                Clear filters
              </Link>
              <Link href="/scanner" className="btn btn-primary">
                Scan a case
              </Link>
            </div>
          }
        />
      )}

      {!hasFilters ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="card-quiet p-4">
            <p className="eyebrow">Bare Acts</p>
            <p className="mt-1 font-display text-2xl">{counts.statutes}</p>
            <p className="text-[11px] text-muted">Provisions with official text and study notes</p>
          </div>
          <div className="card-quiet p-4">
            <p className="eyebrow">Judgments</p>
            <p className="mt-1 font-display text-2xl">{counts.judgments}</p>
            <p className="text-[11px] text-muted">Structured briefs, ratio and exam outlines</p>
          </div>
          <div className="card-quiet p-4">
            <p className="eyebrow">Student notes</p>
            <p className="mt-1 font-display text-2xl">{counts.notes}</p>
            <p className="text-[11px] text-muted">Method notes and original explainers</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LibraryCard({
  doc,
  bookmarked,
  interested,
  href,
}: {
  doc: DocumentRecord;
  bookmarked: boolean;
  interested: boolean;
  href: string;
}) {
  return (
    <article className="card group flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <DocTypeBadge doc={doc} />
        {doc.subject ? <span className="chip">{doc.subject}</span> : null}
        {interested ? <span className="chip chip-gold">On your course</span> : null}
        <div className="ml-auto">
          <BookmarkButton documentId={doc.id} initial={bookmarked} path="/library" />
        </div>
      </div>
      <Link href={href} className="group/title">
        <h2 className="text-[1.08rem] leading-snug transition-colors group-hover/title:text-gold">
          {doc.title}
        </h2>
      </Link>
      <p className="mt-1 text-[11px] text-muted">
        {[doc.citation, doc.court, doc.year ? String(doc.year) : null].filter(Boolean).join(" · ") || doc.subtitle}
      </p>
      <p className="mt-2.5 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-ink-soft">
        {truncate(doc.officialText ?? doc.explanation ?? doc.brief?.facts ?? "Open to read this document.", 240)}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <VerificationBadge value={doc.verification} />
        <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
          <Icon name="clock" size={11} /> {readingTime(doc.officialText ?? doc.explanation)} min read
        </span>
      </div>
    </article>
  );
}
