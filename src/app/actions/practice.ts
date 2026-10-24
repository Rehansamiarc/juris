"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createQuiz, getDocument, getQuiz, logActivity, recordQuizAttempt } from "@/lib/db";
import { generateQuiz } from "@/lib/quizgen";

export async function startQuizAction(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") ?? "");
  const subject = String(formData.get("subject") ?? "");

  if (documentId) {
    const doc = getDocument(documentId);
    if (!doc || (doc.ownerId && doc.ownerId !== user.id)) redirect("/practice?error=missing");
  }

  const quiz = await generateQuiz(user.id, {
    documentId: documentId || undefined,
    subject: subject || undefined,
  });

  if (!quiz.questions.length) {
    redirect(`/practice?error=${documentId ? "insufficient" : "empty"}`);
  }

  const created = createQuiz(user.id, {
    title: quiz.title,
    subject: quiz.subject ?? subject ?? undefined,
    documentId: documentId || undefined,
    questions: quiz.questions,
  });
  logActivity(user.id, "quiz", `Generated “${created.title}”`, created.id);
  revalidatePath("/practice");
  redirect(`/practice/${created.id}`);
}

export async function submitAttemptAction(
  quizId: string,
  answers: Record<string, number>,
): Promise<{ ok?: boolean; score?: number; total?: number; error?: string }> {
  const user = await requireUser();
  const quiz = getQuiz(quizId, user.id);
  if (!quiz) return { error: "Quiz not found." };
  if (!quiz.questions.length) return { error: "This quiz has no questions." };

  let score = 0;
  for (const question of quiz.questions) {
    if (answers[question.id] === question.answer) score += 1;
  }
  recordQuizAttempt(quiz.id, user.id, answers, score, quiz.questions.length);
  logActivity(
    user.id,
    "quiz",
    `Scored ${score}/${quiz.questions.length} in “${quiz.title}”`,
    quiz.id,
  );
  revalidatePath("/practice");
  revalidatePath(`/practice/${quizId}`);
  revalidatePath("/home");
  return { ok: true, score, total: quiz.questions.length };
}

export async function retakeQuizAction(quizId: string) {
  const user = await requireUser();
  const quiz = getQuiz(quizId, user.id);
  if (!quiz) return { ok: false };
  redirect(`/practice/${quizId}`);
}
