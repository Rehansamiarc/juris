import { aiConfigured, aiConfig, aiJson, FABRICATION_RULES } from "./ai";
import { getDocument, listDocuments } from "./db";
import type { DocumentRecord, QuizQuestion } from "./types";

export interface GeneratedQuiz {
  title: string;
  subject: string | null;
  questions: QuizQuestion[];
  mode: "ai" | "local";
  warning?: string;
}

const QUIZ_SYSTEM = `${FABRICATION_RULES}

Create multiple-choice revision questions from the supplied legal material.
Return JSON: {"title": string, "questions": [{"question": string, "options": [4 strings], "answer": 0-3, "explanation": string}]}
Requirements:
- 4 options per question, exactly one correct.
- Test understanding, not trivia. Include at least one application/hypothetical question when the material allows.
- Explanation must justify the correct option using only the supplied material, in 1-2 sentences.
- Do not invent section numbers, case names or holdings.`;

function shuffle<T>(items: T[], seed: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seed() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalise(raw: unknown): QuizQuestion[] {
  if (!raw || typeof raw !== "object") return [];
  const questions = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];
  const out: QuizQuestion[] = [];
  for (const item of questions) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const question = typeof q.question === "string" ? q.question.trim() : "";
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
    let answer = typeof q.answer === "number" ? q.answer : Number(q.answer);
    if (!Number.isInteger(answer) && typeof q.answer === "string") {
      answer = ["a", "b", "c", "d"].indexOf(q.answer.toLowerCase());
    }
    if (!question || options.length !== 4 || !Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    out.push({
      id: crypto.randomUUID(),
      question,
      options,
      answer,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
    });
  }
  return out.slice(0, 8);
}

function localQuestions(docs: DocumentRecord[], pool: DocumentRecord[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const statutes = docs.filter((d) => d.officialText && d.officialText.trim().length > 80);
  const cases = docs.filter((d) => d.brief && d.brief.decision && !/^not available/i.test(d.brief.decision));

  const statutePool = pool.filter((d) => d.officialText && d.officialText.trim().length > 80);
  const casePool = pool.filter((d) => d.brief && d.brief.decision && !/^not available/i.test(d.brief.decision));

  for (const doc of shuffle(statutes).slice(0, 3)) {
    const distractors = shuffle(statutePool.filter((d) => d.id !== doc.id)).slice(0, 3);
    if (distractors.length < 3) continue;
    const quote = doc.officialText!.replace(/\s+/g, " ").slice(0, 220).trim();
    const options = shuffle([doc.title, ...distractors.map((d) => d.title)]);
    out.push({
      id: crypto.randomUUID(),
      question: `Which provision contains this text?\n\n“${quote}…”`,
      options,
      answer: options.indexOf(doc.title),
      explanation: `This is ${doc.title}${doc.citation ? ` (${doc.citation})` : ""}. Source: ${doc.sourceUrl ?? "library record"}.`,
    });
  }

  for (const doc of shuffle(cases).slice(0, 3)) {
    const distractors = shuffle(casePool.filter((d) => d.id !== doc.id)).slice(0, 3);
    if (distractors.length < 3) continue;
    const correct = doc.brief!.decision.replace(/\s+/g, " ").slice(0, 180);
    const options = shuffle([
      correct,
      ...distractors.map((d) => d.brief!.decision.replace(/\s+/g, " ").slice(0, 180)),
    ]);
    out.push({
      id: crypto.randomUUID(),
      question: `In ${doc.title}, what did the court decide?`,
      options,
      answer: options.indexOf(correct),
      explanation: `The recorded decision is: ${correct}… Cross-check the full holding in the case brief.`,
    });
  }

  return out.slice(0, 6);
}

export async function generateQuiz(
  userId: string,
  options: { documentId?: string; subject?: string; limit?: number } = {},
): Promise<GeneratedQuiz> {
  const focus = options.documentId ? getDocument(options.documentId) : undefined;
  const corpus = focus
    ? [focus]
    : listDocuments({ userId, subject: options.subject, limit: 40 }).filter(
        (d) => d.officialText || d.brief,
      );

  if (!corpus.length) {
    return {
      title: "Practice set",
      subject: options.subject ?? null,
      questions: [],
      mode: "local",
      warning: "No material matches this selection yet. Add a document to your library first.",
    };
  }

  // Distractors come from the whole library (same subject when one is given), so a
  // single-document quiz still has enough real alternatives to be meaningful.
  const pool = listDocuments({ userId, subject: options.subject, limit: 40 }).filter(
    (d) => d.officialText || d.brief,
  );

  if (aiConfigured()) {
    const material = corpus
      .slice(0, 4)
      .map((d) => `### ${d.title}${d.citation ? ` — ${d.citation}` : ""}\n${(d.officialText || JSON.stringify(d.brief)).slice(0, 3500)}`)
      .join("\n\n");
    try {
      const raw = await aiJson<unknown>(
        QUIZ_SYSTEM,
        `Subject: ${options.subject ?? focus?.subject ?? "Indian law"}\n\n${material}`,
        { model: aiConfig.chatModel, maxTokens: 2000 },
      );
      const questions = normalise(raw);
      if (questions.length) {
        return {
          title: focus ? `${focus.title} — practice set` : `${options.subject ?? "Mixed"} practice set`,
          subject: focus?.subject ?? options.subject ?? null,
          questions,
          mode: "ai",
        };
      }
      throw new Error("The model returned no usable questions.");
    } catch (error) {
      const questions = localQuestions(corpus, pool);
      return {
        title: focus ? `${focus.title} — practice set` : `${options.subject ?? "Mixed"} practice set`,
        subject: focus?.subject ?? options.subject ?? null,
        questions,
        mode: "local",
        warning: `AI generation failed (${error instanceof Error ? error.message : "unknown error"}). These questions were assembled directly from your library instead.`,
      };
    }
  }

  const questions = localQuestions(corpus, pool);
  return {
    title: focus ? `${focus.title} — practice set` : `${options.subject ?? "Mixed"} practice set`,
    subject: focus?.subject ?? options.subject ?? null,
    questions,
    mode: "local",
    warning:
      "No AI provider is configured, so this set was assembled from your library's own text — every answer is traceable to a document.",
  };
}
