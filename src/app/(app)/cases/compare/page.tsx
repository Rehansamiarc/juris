import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader, VerificationBadge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { listDocuments } from "@/lib/db";
import type { CaseBrief } from "@/lib/types";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Compare cases" };

const ROWS: Array<{ label: string; pick: (brief: CaseBrief) => string | string[] }> = [
  { label: "Case", pick: (b) => b.caseName },
  { label: "Citation", pick: (b) => b.citation },
  { label: "Court", pick: (b) => b.court },
  { label: "Decided", pick: (b) => b.date },
  { label: "Facts", pick: (b) => truncate(b.facts, 420) },
  { label: "Issues", pick: (b) => b.issues },
  { label: "Decision", pick: (b) => b.decision },
  { label: "Ratio decidendi", pick: (b) => b.ratio },
  { label: "Key principles", pick: (b) => b.principles },
  { label: "Exam summary", pick: (b) => b.examSummary },
];

function Cell({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    if (!value.length) return <span className="italic text-muted">Not available</span>;
    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index} className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (!value || /^not available/i.test(value)) return <span className="italic text-muted">Not available</span>;
  return <span>{value}</span>;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const { user } = await requireSession();
  const params = await searchParams;
  const cases = listDocuments({ userId: user.id, limit: 300 }).filter((doc) => doc.brief);
  const left = cases.find((doc) => doc.id === params.left) ?? cases[0];
  const right = cases.find((doc) => doc.id === params.right && doc.id !== left?.id) ??
    cases.find((doc) => doc.id !== left?.id);

  return (
    <div>
      <PageHeader
        eyebrow="Comparative reading"
        title="Put two cases beside each other."
        description="A side-by-side view of the structured fields you already have. No text is invented to fill a gap: missing fields stay missing, which is often the most useful comparison."
        actions={
          <Link href="/library?kind=judgment" className="btn btn-secondary">
            <Icon name="library" size={14} /> Browse judgments
          </Link>
        }
      />

      {!left || !right ? (
        <EmptyState
          icon="compare"
          title="Two cases are needed"
          description="You need at least two case briefs to compare. Scan a judgment or open a curated brief from the library."
          action={
            <Link href="/scanner" className="btn btn-primary">
              Scan a case
            </Link>
          }
        />
      ) : (
        <>
          <form method="get" action="/cases/compare" className="card mb-5 flex flex-col gap-2 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="left-case" className="label">
                Left case
              </label>
              <select id="left-case" name="left" defaultValue={left.id} className="select py-2 text-xs">
                {cases.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {truncate(doc.brief?.caseName ?? doc.title, 70)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="right-case" className="label">
                Right case
              </label>
              <select id="right-case" name="right" defaultValue={right.id} className="select py-2 text-xs">
                {cases.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {truncate(doc.brief?.caseName ?? doc.title, 70)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Compare
            </button>
          </form>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {[left, right].map((doc, index) => (
              <div key={`${doc.id}-${index}`} className="card p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="chip">{index === 0 ? "Left" : "Right"}</span>
                  <VerificationBadge value={doc.verification} />
                </div>
                <h2 className="text-[1rem] leading-snug">{doc.brief?.caseName}</h2>
                <p className="mt-0.5 text-[10.5px] text-muted">{doc.citation}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted">
                  {truncate(doc.brief?.decision ?? "", 160)}
                </p>
                <Link href={`/cases/${doc.id}`} className="mt-2 inline-flex text-[11px] text-gold hover:underline">
                  Open brief →
                </Link>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <caption className="sr-only">Side-by-side comparison of two case briefs</caption>
                <thead>
                  <tr className="bg-surface-2 text-left">
                    <th scope="col" className="w-32 border-b border-line px-4 py-3 text-[10px] uppercase tracking-wider text-muted">
                      Field
                    </th>
                    <th scope="col" className="border-b border-line px-4 py-3 text-[10px] uppercase tracking-wider text-muted">
                      {left.title}
                    </th>
                    <th scope="col" className="border-b border-line px-4 py-3 text-[10px] uppercase tracking-wider text-muted">
                      {right.title}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="align-top">
                      <th scope="row" className="border-b border-line bg-surface-2/40 px-4 py-3 text-left text-[10.5px] font-semibold text-muted">
                        {row.label}
                      </th>
                      <td className="border-b border-line px-4 py-3 leading-relaxed">
                        <Cell value={row.pick(left.brief!)} />
                      </td>
                      <td className="border-b border-line px-4 py-3 leading-relaxed">
                        <Cell value={row.pick(right.brief!)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-2 px-4 py-3 text-[10.5px] text-muted">
              <span>Direct extracts from each brief. No comparative analysis has been generated.</span>
              <Link
                href={`/tutor?compare=${left.id},${right.id}`}
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                Ask the tutor to compare them <Icon name="arrow" size={11} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
