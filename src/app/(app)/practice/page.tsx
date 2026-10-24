import type { Metadata } from "next";
import Link from "next/link";
import { startQuizAction } from "@/app/actions/practice";
import { Icon } from "@/components/icons";
import { PendingSubmit } from "@/components/submit-button";
import { EmptyState, PageHeader, Stat } from "@/components/ui";
import { aiStatus } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import {
  listDocuments,
  listQuizzes,
  quizAttempts,
  subjectsAvailable,
} from "@/lib/db";
import { formatDate, relativeTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Practice" };

const ERROR_COPY: Record<string, string> = {
  empty: "There is no material to build questions from yet. Add or scan a document first.",
  insufficient:
    "That document needs more text to generate a practice set. Add pages or add study notes.",
  missing: "That document is not available in your library.",
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, profile } = await requireSession();
  const { error } = await searchParams;
  const quizzes = listQuizzes(user.id);
  const attempts = quizAttempts(user.id);
  const subjects = subjectsAvailable(user.id);
  const documents = listDocuments({ userId: user.id, limit: 100 })
    .filter((doc) => doc.officialText || doc.brief)
    .map((doc) => ({ id: doc.id, title: doc.title, subject: doc.subject }));
  const ai = aiStatus();
  const average = attempts.length
    ? Math.round(
        (attempts.reduce((sum, attempt) => sum + attempt.score / Math.max(attempt.total, 1), 0) /
          attempts.length) *
          100,
      )
    : 0;
  const best = attempts.length
    ? Math.max(...attempts.map((attempt) => Math.round((attempt.score / Math.max(attempt.total, 1)) * 100)))
    : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Practice"
        title="Test recall before the exam does."
        description="Generate multiple-choice questions from a provision, a case brief or a whole subject. Every explanation points back to the material it came from."
      />

      {error ? (
        <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 text-[12.5px] text-danger">
          {ERROR_COPY[error] ?? "The practice set could not be generated."}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Practice sets" value={quizzes.length} hint="saved in your workspace" icon="practice" />
        <Stat label="Attempts" value={attempts.length} hint="recorded scores" icon="check" />
        <Stat label="Average" value={`${average}%`} hint="across all attempts" icon="grid" />
        <Stat label="Best" value={`${best}%`} hint="personal best" icon="sparkles" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-6">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-lg">Your practice sets</h2>
                <p className="text-[11px] text-muted">Generated from your own library</p>
              </div>
            </div>
            {quizzes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {quizzes.map((quiz) => {
                  const quizAttempt = attempts.find((attempt) => attempt.quizId === quiz.id);
                  return (
                    <Link
                      key={quiz.id}
                      href={`/practice/${quiz.id}`}
                      className="card flex flex-col p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="chip">{quiz.questions.length} questions</span>
                        <span className="text-[10px] text-muted">{relativeTime(quiz.createdAt)}</span>
                      </div>
                      <p className="text-[13.5px] font-medium leading-snug">{quiz.title}</p>
                      <p className="mt-1 text-[10.5px] text-muted">
                        {quiz.subject ?? "Mixed"} · {formatDate(quiz.createdAt)}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-[10.5px]">
                        {quizAttempt ? (
                          <span className="text-success">
                            Last: {quizAttempt.score}/{quizAttempt.total}
                          </span>
                        ) : (
                          <span className="text-muted">Not attempted</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-gold">
                          Start <Icon name="arrow" size={11} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="practice"
                title="No practice sets yet"
                description="Generate a set from a subject or a single case. Each answer includes an explanation you can check."
              />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg">Recent attempts</h2>
            <div className="card divide-y divide-line">
              {attempts.length ? (
                attempts.slice(0, 8).map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <Icon name="check" size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{attempt.title}</p>
                      <p className="text-[10px] text-muted">
                        {formatDate(attempt.createdAt)} · {attempt.total} questions
                      </p>
                    </div>
                    <span className="font-display text-lg">
                      {attempt.score}
                      <span className="text-xs text-muted">/{attempt.total}</span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-4 py-5 text-center text-[12px] text-muted">No attempts recorded yet.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-1 flex items-center gap-1.5 font-display text-lg">
              <Icon name="sparkles" size={16} className="text-gold" /> New practice set
            </h2>
            <p className="mb-3 text-[11px] leading-relaxed text-muted">
              {ai.configured
                ? "Questions are generated by AI from the selected material, then checked against the source."
                : "No AI provider is configured, so questions are assembled directly from the library text — each answer is traceable to a document."}
            </p>
            <form action={startQuizAction}>
              <label htmlFor="practice-subject" className="label">
                Subject
              </label>
              <select id="practice-subject" name="subject" className="select mb-3 text-xs" defaultValue={profile?.subjects?.[0] ?? ""}>
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <label htmlFor="practice-document" className="label">
                Or focus on one document
              </label>
              <select id="practice-document" name="documentId" className="select mb-3 text-xs" defaultValue="">
                <option value="">No specific document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {truncate(doc.title, 60)}
                  </option>
                ))}
              </select>
              <PendingSubmit pendingLabel="Building questions…">
                <Icon name="practice" size={14} /> Generate practice set
              </PendingSubmit>
            </form>
            <p className="mt-2 text-[9.5px] leading-relaxed text-muted">
              Choosing a document overrides the subject filter.
            </p>
          </section>

          <section className="card p-4">
            <p className="eyebrow mb-2">How to use practice</p>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-muted">
              <li>• Attempt from memory before checking notes.</li>
              <li>• Read the explanation even when you are right.</li>
              <li>• Any question you miss belongs in your flashcards.</li>
              <li>• Low scores are data, not a verdict.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
