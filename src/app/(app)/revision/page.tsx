import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { CardList, NewCardForm, RevisionSession } from "@/components/revision-session";
import { PageHeader, Stat } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import {
  dailyActivityCounts,
  dueFlashcards,
  listDocuments,
  listFlashcards,
  reviewStats,
  studyStreak,
} from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Revision" };

export default async function RevisionPage() {
  const { user } = await requireSession();
  const due = dueFlashcards(user.id, 30);
  const all = listFlashcards(user.id);
  const stats = reviewStats(user.id);
  const streak = studyStreak(user.id);
  const weekly = dailyActivityCounts(user.id, 7);
  const upcoming = all
    .filter((card) => card.dueAt > new Date().toISOString())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 5);
  const documents = listDocuments({ userId: user.id, limit: 60 })
    .filter((doc) => doc.kind === "statute" || doc.kind === "judgment" || doc.kind === "brief")
    .map((doc) => ({ id: doc.id, title: doc.title }));

  return (
    <div>
      <PageHeader
        eyebrow="Memory and revision engine"
        title="Revise what is due, while it still matters."
        description="A conservative SM-2 style schedule brings each card back just before you would forget it. Cards come only from your own briefs and notes — nothing is invented to fill a queue."
        actions={
          <Link href="/library?kind=judgment" className="btn btn-secondary">
            <Icon name="sparkles" size={14} /> Make cards from a case
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Due now" value={stats.due} hint="ready to review" icon="clock" />
        <Stat label="Streak" value={`${streak}d`} hint="consecutive study days" icon="flame" />
        <Stat label="Card library" value={stats.cards} hint="across all subjects" icon="revision" />
        <Stat label="Reviewed today" value={stats.reviews} hint="ratings recorded" icon="check" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-3">
              <div>
                <h2 className="font-display text-lg">Today’s queue</h2>
                <p className="text-[11px] text-muted">
                  {due.length ? `${due.length} card${due.length === 1 ? "" : "s"} ready` : "Nothing due right now"}
                </p>
              </div>
              <span className="chip">
                <Icon name="calendar" size={11} /> {formatDate(new Date())}
              </span>
            </div>
            <RevisionSession
              cards={due.map((card) => ({
                id: card.id,
                front: card.front,
                back: card.back,
                source: card.source,
                documentId: card.documentId,
              }))}
            />
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-3">
              <div>
                <h2 className="font-display text-lg">All cards</h2>
                <p className="text-[11px] text-muted">Delete anything that no longer helps</p>
              </div>
              <span className="chip">{all.length}</span>
            </div>
            <CardList
              cards={all.map((card) => ({
                id: card.id,
                front: card.front,
                back: card.back,
                source: card.source,
                documentId: card.documentId,
                dueAt: card.dueAt,
                reps: card.reps,
              }))}
            />
          </section>
        </div>

        <aside className="space-y-4">
          <NewCardForm documents={documents} />

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
              <Icon name="calendar" size={14} className="text-gold" /> Coming up
            </h2>
            {upcoming.length ? (
              <ul className="space-y-2.5">
                {upcoming.map((card) => (
                  <li key={card.id} className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11.5px] font-medium leading-snug">{card.front}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted">Due {formatDate(card.dueAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-[11px] text-muted">No scheduled cards yet.</p>
            )}
          </section>

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
              <Icon name="flame" size={14} className="text-gold" /> This week
            </h2>
            <div className="flex h-16 items-end gap-1.5" role="img" aria-label="Review activity this week">
              {weekly.map((day) => {
                const max = Math.max(...weekly.map((d) => d.count), 1);
                return (
                  <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-11 w-full items-end">
                      <div
                        className={`w-full rounded-t ${day.count ? "bg-gold/80" : "bg-paper-deep"}`}
                        style={{ height: `${Math.max(8, (day.count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
              Every rating counts as study activity. Consistency matters more than volume.
            </p>
          </section>

          <section className="card p-4">
            <p className="eyebrow mb-2">How the schedule works</p>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-muted">
              <li>• New card, “Good” → tomorrow. Second success → three days.</li>
              <li>• Later successes stretch by your ease factor.</li>
              <li>• “Again” resets the interval and brings the card back in 10 minutes.</li>
              <li>• Intervals cap at 180 days.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
