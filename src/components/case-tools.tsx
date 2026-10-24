"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { ExportButtons, ListenButton } from "./document-tools";
import { createCaseFlashcardsAction, createCaseQuizAction } from "@/app/actions/cases";

export function CaseTools({
  documentId,
  title,
  markdown,
  audioText,
  cardCount,
}: {
  documentId: string;
  title: string;
  markdown: string;
  audioText: string;
  cardCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const router = useRouter();

  function makeFlashcards() {
    startTransition(async () => {
      const result = await createCaseFlashcardsAction(documentId);
      if (result.ok) {
        setMessage({ type: "ok", text: result.message ?? "Flashcards created." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Could not create flashcards." });
      }
    });
  }

  return (
    <section className="card p-4" aria-labelledby="case-actions">
      <h2 id="case-actions" className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon name="sparkles" size={14} className="text-gold" /> Study actions
      </h2>
      <div className="space-y-2">
        <button
          type="button"
          className="btn btn-primary h-9 w-full text-xs"
          onClick={makeFlashcards}
          disabled={pending}
        >
          <Icon name="revision" size={14} />
          {pending ? "Preparing cards…" : `Generate flashcards${cardCount ? ` (${cardCount} exist)` : ""}`}
        </button>
        <button
          type="button"
          className="btn btn-secondary h-9 w-full text-xs"
          onClick={() => startTransition(() => createCaseQuizAction(documentId))}
          disabled={pending}
        >
          <Icon name="practice" size={14} /> Create a quiz from this case
        </button>
        <div className="grid grid-cols-2 gap-2">
          <ListenButton text={audioText} label="Audio recap" />
          <Link href={`/tutor?doc=${documentId}`} className="btn btn-secondary h-9 px-2 text-[11px]">
            <Icon name="tutor" size={13} /> Ask a follow-up
          </Link>
        </div>
        <div className="pt-1">
          <ExportButtons
            filename={`${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60)}.md`}
            markdown={markdown}
          />
        </div>
        <Link href={`/cases/compare?left=${documentId}`} className="btn btn-ghost h-8 w-full text-[11px]">
          <Icon name="compare" size={13} /> Compare with another case
        </Link>
      </div>
      {message ? (
        <p
          role="status"
          className={`mt-3 rounded-lg border px-2.5 py-2 text-[10.5px] leading-relaxed ${
            message.type === "ok"
              ? "border-success/30 bg-success/5 text-success"
              : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          {message.text}
        </p>
      ) : null}
      <p className="mt-3 text-[9.5px] leading-relaxed text-muted">
        Flashcards are built only from the brief’s own fields, so nothing new is invented. Audio uses your
        browser’s speech engine.
      </p>
    </section>
  );
}
