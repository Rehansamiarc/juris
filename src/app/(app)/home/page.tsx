import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { EmptyState, ProgressBar, SectionHeading, Stat, VerificationBadge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import {
  countDocuments,
  dailyActivityCounts,
  dueFlashcards,
  listDeadlines,
  listDocuments,
  listFlashcards,
  listQuizzes,
  listScanJobs,
  recentActivity,
  recentlyViewed,
  reviewStats,
  studyMinutesLast7Days,
  studyStreak,
  todayActivities,
} from "@/lib/db";
import { briefModes } from "@/lib/modes";
import { formatDate, relativeTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

const QUICK: Array<{ href: string; label: string; hint: string; icon: IconName }> = [
  { href: "/scanner", label: "Scan a case", hint: "Photo, PDF or notes", icon: "scan" },
  { href: "/tutor", label: "Ask the tutor", hint: "Grounded in your library", icon: "tutor" },
  { href: "/practice?start=1", label: "Start a quiz", hint: "5–8 questions", icon: "practice" },
];

export default async function HomePage() {
  const { user, profile } = await requireSession();
  const hour = Number(
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }),
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  const subjects = profile?.subjects ?? [];
  const due = dueFlashcards(user.id, 20);
  const stats = reviewStats(user.id);
  const streak = studyStreak(user.id);
  const weekly = dailyActivityCounts(user.id, 7);
  const viewed = recentlyViewed(user.id, 4);
  const deadlines = listDeadlines(user.id)
    .filter((d) => !d.completed && new Date(d.dueAt).getTime() >= Date.now() - 86_400_000)
    .slice(0, 3);
  const activities = recentActivity(user.id, 6);
  const today = todayActivities(user.id);
  const docsTotal = countDocuments(user.id);
  const minutes = studyMinutesLast7Days(user.id);
  const cards = listFlashcards(user.id);
  const recentGenerated = cards
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((card) => ({ ...card, document: card.documentId ? listDocuments({ userId: user.id, limit: 500 }).find((d) => d.id === card.documentId) : undefined }));
  const scans = listScanJobs(user.id).slice(0, 3);
  const quizzes = listQuizzes(user.id).slice(0, 2);

  const primarySubject = subjects[0];
  const readingDoc =
    listDocuments({ userId: user.id, subject: primarySubject, limit: 50 }).find(
      (d) => !viewed.some((v) => v.id === d.id) && (d.kind === "statute" || d.kind === "judgment"),
    ) ??
    listDocuments({ userId: user.id, limit: 50 }).find((d) => d.kind === "statute") ??
    listDocuments({ userId: user.id, limit: 1 })[0];

  const plan = [
    {
      title: readingDoc ? `Read ${readingDoc.title}` : "Open the law library",
      detail: readingDoc?.subject ?? "Start with a subject you are studying",
      href: readingDoc ? `/library/${readingDoc.id}` : "/library",
      minutes: Math.max(10, Math.round((profile?.dailyMinutes ?? 45) * 0.45)),
      done: today.some((a) => a.kind === "view"),
      icon: "book" as IconName,
    },
    {
      title: due.length ? `Revise ${due.length} due flashcard${due.length === 1 ? "" : "s"}` : "Review your flashcards",
      detail: due.length ? "Spaced repetition queue" : "Nothing due — add cards from a case brief",
      href: "/revision",
      minutes: Math.max(8, Math.round((profile?.dailyMinutes ?? 45) * 0.3)),
      done: today.some((a) => a.kind === "flashcards"),
      icon: "revision" as IconName,
    },
    {
      title: "One practice set",
      detail: quizzes.length ? `Last: ${quizzes[0].title}` : "Test recall with 5–8 questions",
      href: `/practice${primarySubject ? `?subject=${encodeURIComponent(primarySubject)}` : ""}`,
      minutes: Math.max(8, Math.round((profile?.dailyMinutes ?? 45) * 0.25)),
      done: today.some((a) => a.kind === "quiz"),
      icon: "practice" as IconName,
    },
  ];
  const planDone = plan.filter((item) => item.done).length;
  const recommended = listDocuments({ userId: user.id, limit: 200 })
    .filter((d) => d.kind === "note" || d.kind === "article")
    .slice(0, 3);

  return (
    <div className="stagger space-y-8">
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70"
          style={{
            background:
              "radial-gradient(420px 240px at 80% 20%, color-mix(in oklab, var(--gold) 18%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow mb-2">
              {greeting} · {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-[1.8rem] leading-tight sm:text-[2.15rem]">
              {greeting}, {firstName}.{" "}
              <span className="text-muted">
                {planDone === plan.length ? "Today is complete." : "Here is your desk for today."}
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {profile?.goal ?? "Study steadily"} · {profile?.course ?? "Law"} ·{" "}
              {profile?.dailyMinutes ?? 45} minutes planned
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {subjects.slice(0, 5).map((subject) => (
                <Link
                  key={subject}
                  href={`/library?subject=${encodeURIComponent(subject)}`}
                  className="chip hover:border-gold hover:text-gold"
                >
                  {subject}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-center">
              <Icon name="flame" size={16} className="mx-auto text-gold" />
              <p className="stat-value mt-1 text-2xl">{streak}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">day streak</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-center">
              <Icon name="revision" size={16} className="mx-auto text-gold" />
              <p className="stat-value mt-1 text-2xl">{stats.due}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">cards due</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-center">
              <Icon name="book" size={16} className="mx-auto text-gold" />
              <p className="stat-value mt-1 text-2xl">{docsTotal}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">sources</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Today’s study plan"
          subtitle={`${planDone} of ${plan.length} blocks done · built from your course and revision load`}
          action={
            <Link href="/revision" className="btn btn-secondary h-8 px-3 text-xs">
              Revision queue <Icon name="arrow" size={13} />
            </Link>
          }
        />
        <div className="card divide-y divide-line">
          {plan.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 px-4 py-4 transition-colors first:rounded-t-[1.25rem] last:rounded-b-[1.25rem] hover:bg-surface-2 sm:px-5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  item.done
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-line bg-surface-2 text-gold"
                }`}
              >
                <Icon name={item.done ? "check" : item.icon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${item.done ? "text-muted line-through" : ""}`}>
                  {item.title}
                </p>
                <p className="truncate text-[11.5px] text-muted">{item.detail}</p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted sm:flex">
                <Icon name="clock" size={12} /> {item.minutes}m
              </span>
              <Icon name="chevron" size={15} className="shrink-0 text-muted" />
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <ProgressBar value={planDone} max={plan.length} label="Daily progress" />
        </div>
      </section>

      <section>
        <SectionHeading title="Quick actions" subtitle="Everything one tap from here" />
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group card flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <Icon name={action.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="truncate text-[11px] text-muted">{action.hint}</p>
              </div>
              <Icon name="arrow" size={15} className="ml-auto text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <SectionHeading title="Continue reading" subtitle="Where you left off" />
          <div className="card divide-y divide-line">
            {viewed.length ? (
              viewed.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/library/${doc.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 sm:px-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-gold">
                    <Icon name={doc.kind === "judgment" ? "gavel" : "book"} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-[11px] text-muted">
                      <span className="capitalize">{doc.kind}</span> · opened {relativeTime(doc.viewedAt)}
                    </p>
                  </div>
                  <Icon name="arrow" size={14} className="text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            ) : (
              <div className="p-4">
                <EmptyState
                  icon="library"
                  title="Nothing opened yet"
                  description="Start with a provision or a landmark case; it will appear here next time."
                  action={
                    <Link href="/library" className="btn btn-primary h-9 px-4 text-xs">
                      Browse the library
                    </Link>
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <SectionHeading
              title="Your practice"
              subtitle="Quizzes you generated"
              action={
                <Link href="/practice" className="text-xs text-gold hover:underline">
                  All practice
                </Link>
              }
            />
            <div className="card divide-y divide-line">
              {quizzes.length ? (
                quizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/practice/${quiz.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 sm:px-5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold">
                      <Icon name="practice" size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{quiz.title}</p>
                      <p className="text-[11px] text-muted">{quiz.questions.length} questions · {relativeTime(quiz.createdAt)}</p>
                    </div>
                    <Icon name="chevron" size={14} className="text-muted" />
                  </Link>
                ))
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <p className="text-[13px] text-muted">No practice sets yet.</p>
                  <Link href="/practice" className="btn btn-secondary h-8 px-3 text-[11px]">
                    Create one
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <SectionHeading
              title="Today’s revision queue"
              subtitle={`${stats.due} due · ${stats.cards} cards total`}
              action={
                <Link href="/revision" className="text-xs text-gold hover:underline">
                  Open
                </Link>
              }
            />
            <div className="card p-4">
              {due.length ? (
                <ul className="space-y-3">
                  {due.slice(0, 3).map((card) => (
                    <li key={card.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                      <p className="text-[13px] font-medium leading-snug">{truncate(card.front, 90)}</p>
                      <p className="mt-1 text-[11px] text-muted">Rep {card.reps + 1} · ease {card.ease.toFixed(1)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-center text-[12.5px] text-muted">
                  Nothing due right now. Your queue will refill as cards mature.
                </p>
              )}
              <Link href="/revision" className="btn btn-primary mt-4 h-9 w-full text-xs">
                Start revision
              </Link>
            </div>
          </div>

          <div>
            <SectionHeading title="Upcoming deadlines" subtitle="Keep the term in view" />
            <div className="card divide-y divide-line">
              {deadlines.length ? (
                deadlines.map((deadline) => (
                  <div key={deadline.id} className="flex gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
                      <span className="font-display text-sm leading-none">
                        {new Date(deadline.dueAt).getDate()}
                      </span>
                      <span className="text-[8.5px] uppercase text-muted">
                        {new Date(deadline.dueAt).toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium">{deadline.title}</p>
                      <p className="truncate text-[10.5px] text-muted">
                        {deadline.subject ?? "General"} · {formatDate(deadline.dueAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-4 py-5 text-center text-[12px] text-muted">No deadlines. Add one from your profile.</p>
              )}
              <Link href="/profile#deadlines" className="block px-4 py-2.5 text-center text-[11px] text-gold hover:bg-surface-2">
                Manage deadlines
              </Link>
            </div>
          </div>

          <div>
            <SectionHeading title="This week" subtitle={`${minutes} minutes of study activity`} />
            <div className="card p-4">
              <div className="flex h-24 items-end gap-2" role="img" aria-label="Study activity over the last seven days">
                {weekly.map((day) => {
                  const max = Math.max(...weekly.map((d) => d.count), 1);
                  return (
                    <div key={day.day} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-16 w-full items-end">
                        <div
                          className={`w-full rounded-t-md ${day.count ? "bg-gold/80" : "bg-paper-deep"}`}
                          style={{ height: `${Math.max(6, (day.count / max) * 100)}%` }}
                          title={`${day.count} activities`}
                        />
                      </div>
                      <span className="text-[9.5px] text-muted">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section>
        <SectionHeading
          title="Recently generated study material"
          subtitle="Flashcards and briefs from your own documents"
          action={
            <Link href="/revision" className="text-xs text-gold hover:underline">
              All cards
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {recentGenerated.length ? (
            recentGenerated.map((card) => (
              <div key={card.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="chip">Flashcard</span>
                  <span className="text-[10px] text-muted">{relativeTime(card.createdAt)}</span>
                </div>
                <p className="text-[13px] font-medium leading-snug">{truncate(card.front, 100)}</p>
                <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{truncate(card.back, 120)}</p>
                {card.document ? (
                  <Link href={`/library/${card.document.id}`} className="mt-3 inline-flex text-[11px] text-gold hover:underline">
                    From: {truncate(card.document.title, 42)}
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <div className="sm:col-span-3">
              <EmptyState
                icon="sparkles"
                title="No generated material yet"
                description="Scan a judgment to create a brief, then turn it into flashcards."
                action={
                  <Link href="/scanner" className="btn btn-primary h-9 px-4 text-xs">
                    Scan a case
                  </Link>
                }
              />
            </div>
          )}
          {scans.length ? (
            <div className="sm:col-span-3">
              <div className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <Icon name="scan" size={14} className="text-gold" />
                  {scans.length} recent scan{scans.length === 1 ? "" : "s"} · latest “{truncate(scans[0].title, 40)}”
                </div>
                <Link href="/scanner" className="text-[11px] text-gold hover:underline">
                  Open scanner
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Recommended reading" subtitle="Matched to your subjects" />
          <div className="card divide-y divide-line">
            {recommended.length ? (
              recommended.map((doc) => (
                <Link key={doc.id} href={`/library/${doc.id}`} className="flex gap-3 px-4 py-3.5 hover:bg-surface-2 sm:px-5">
                  <Icon name="note" size={16} className="mt-0.5 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{doc.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {truncate(doc.explanation ?? "", 130)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-5 text-center text-[12px] text-muted">No articles yet.</p>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Recent activity" subtitle="Your study trail" />
          <div className="card p-4">
            <ol className="space-y-3">
              {activities.length ? (
                activities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug">{activity.label}</p>
                      <p className="text-[10.5px] text-muted">{relativeTime(activity.createdAt)}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-[12px] text-muted">Your activity will appear here.</li>
              )}
            </ol>
          </div>
        </section>
      </div>

      <section className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft text-gold">
            <Icon name="sparkles" size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold">Have a judgment to understand tonight?</p>
            <p className="text-[12px] text-muted">
              Photograph the pages, correct the OCR, and get a structured brief in minutes.
            </p>
          </div>
        </div>
        <Link href="/scanner" className="btn btn-primary h-9 px-4 text-xs">
          <Icon name="camera" size={14} /> Scan a case
        </Link>
      </section>
    </div>
  );
}
