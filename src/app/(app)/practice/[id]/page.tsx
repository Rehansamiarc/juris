import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { QuizRunner } from "@/components/quiz-runner";
import { PageHeader } from "@/components/ui";
import { currentUser, requireSession } from "@/lib/auth";
import { getDocument, getQuiz } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  const quiz = user ? getQuiz(id, user.id) : undefined;
  return { title: quiz?.title ?? "Practice set" };
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  const { id } = await params;
  const quiz = getQuiz(id, user.id);
  if (!quiz) notFound();
  const source = quiz.documentId ? getDocument(quiz.documentId) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-1.5 text-[11.5px] text-muted">
        <Link href="/practice" className="hover:text-gold">
          Practice
        </Link>
        <Icon name="chevron" size={11} />
        <span className="truncate">{quiz.title}</span>
      </div>

      <PageHeader
        eyebrow={`${quiz.questions.length} questions · ${formatDate(quiz.createdAt)}`}
        title={quiz.title}
        description={
          source
            ? `Built from “${source.title}”. Explanations quote the source material.`
            : "Built from the material in your library. Read each explanation before moving on."
        }
        actions={
          <Link href="/practice" className="btn btn-secondary">
            <Icon name="arrow" size={14} className="rotate-180" /> Practice hub
          </Link>
        }
      />

      <QuizRunner
        quizId={quiz.id}
        questions={quiz.questions}
        documentId={quiz.documentId}
        documentTitle={source?.title ?? null}
      />

      <p className="mt-5 text-center text-[10.5px] leading-relaxed text-muted">
        Practice questions are study aids, not model exam answers. If an explanation conflicts with the bare
        Act or the reporter, the official text prevails.
      </p>
    </div>
  );
}
