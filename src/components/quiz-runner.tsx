"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "./icons";
import { submitAttemptAction } from "@/app/actions/practice";
import type { QuizQuestion } from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

export function QuizRunner({
  quizId,
  questions,
  documentId,
  documentTitle,
}: {
  quizId: string;
  questions: QuizQuestion[];
  documentId: string | null;
  documentTitle: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<{ score: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const question = questions[index];
  const selected = question ? answers[question.id] : undefined;

  function choose(value: number) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function submit() {
    startTransition(async () => {
      const result = await submitAttemptAction(quizId, answers);
      if (result.ok && typeof result.score === "number" && typeof result.total === "number") {
        setSubmitted({ score: result.score, total: result.total });
        setError("");
      } else {
        setError(result.error ?? "Could not submit the attempt.");
      }
    });
  }

  function reset() {
    setAnswers({});
    setIndex(0);
    setSubmitted(null);
    setError("");
  }

  if (submitted) {
    const pct = Math.round((submitted.score / Math.max(submitted.total, 1)) * 100);
    return (
      <div>
        <div className="card p-6 text-center">
          <p className="eyebrow mb-1">Attempt recorded</p>
          <p className="font-display text-5xl">
            {submitted.score}
            <span className="text-2xl text-muted">/{submitted.total}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{pct}% correct</p>
          <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-paper-deep">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-secondary" onClick={reset}>
              <Icon name="rotate" size={14} /> Try again
            </button>
            <Link href="/practice" className="btn btn-primary">
              All practice sets <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {questions.map((item, itemIndex) => {
            const chosen = answers[item.id];
            const correct = chosen === item.answer;
            return (
              <article key={item.id} className="card p-4">
                <div className="mb-2 flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      correct ? "bg-success/15 text-success" : "bg-danger/10 text-danger",
                    )}
                  >
                    {correct ? <Icon name="check" size={11} /> : <Icon name="close" size={11} />}
                  </span>
                  <p className="text-[13px] font-medium leading-snug">
                    {itemIndex + 1}. {item.question}
                  </p>
                </div>
                <ul className="ml-7 space-y-1 text-[12px]">
                  {item.options.map((option, optionIndex) => (
                    <li
                      key={optionIndex}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 leading-relaxed",
                        optionIndex === item.answer
                          ? "border-success/40 bg-success/5 text-ink"
                          : optionIndex === chosen
                            ? "border-danger/30 bg-danger/5 text-ink-soft line-through"
                            : "border-line text-muted",
                      )}
                    >
                      {option}
                      {optionIndex === item.answer ? (
                        <span className="ml-1.5 text-[9px] font-semibold uppercase text-success">correct</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {item.explanation ? (
                  <p className="ml-7 mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft">
                    <span className="font-semibold text-ink">Why: </span>
                    {item.explanation}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
        {documentId ? (
          <p className="mt-4 text-center text-[11px] text-muted">
            Source:{" "}
            <Link href={`/library/${documentId}`} className="text-gold hover:underline">
              {truncate(documentTitle ?? "document", 70)}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  if (!question) {
    return <p className="card p-6 text-center text-sm text-muted">This practice set has no questions.</p>;
  }

  const answered = Object.keys(answers).length;

  return (
    <div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-3 text-[11px] text-muted">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{answered} answered</span>
        </div>
        <div className="h-1 bg-paper-deep">
          <div
            className="h-full bg-gold transition-[width] duration-300"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          <fieldset>
            <legend className="mb-4 font-display text-[1.15rem] leading-snug">{question.question}</legend>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed transition-colors",
                    selected === optionIndex
                      ? "border-gold bg-gold-soft/40 text-ink"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={selected === optionIndex}
                    onChange={() => choose(optionIndex)}
                    className="mt-0.5 accent-[var(--gold)]"
                  />
                  <span>
                    <span className="mr-1.5 font-semibold text-muted">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error ? <p className="mt-3 text-[11px] text-danger">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2 px-4 py-3">
          <button
            type="button"
            className="btn btn-ghost h-9 px-3 text-xs"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <Icon name="arrow" size={13} className="rotate-180" /> Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary h-9 px-4 text-xs"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              Next <Icon name="arrow" size={13} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary h-9 px-4 text-xs"
              onClick={submit}
              disabled={pending || answered === 0}
            >
              {pending ? "Checking…" : "Submit answers"} <Icon name="check" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {questions.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-label={`Go to question ${itemIndex + 1}`}
            aria-current={itemIndex === index ? "step" : undefined}
            className={cn(
              "h-7 w-7 rounded-lg border text-[10.5px] font-medium",
              itemIndex === index
                ? "border-gold bg-gold text-[#1c1403]"
                : answers[item.id] !== undefined
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-line bg-surface text-muted hover:border-gold",
            )}
          >
            {itemIndex + 1}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted">
          You can move between questions before submitting.
        </span>
      </div>
    </div>
  );
}
