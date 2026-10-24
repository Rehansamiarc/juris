"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { createCardAction, deleteCardAction, reviewCardAction } from "@/app/actions/revision";
import { RATING_LABEL, type Rating } from "@/lib/srs";
import { formatDate, truncate } from "@/lib/utils";

export interface SessionCard {
  id: string;
  front: string;
  back: string;
  source: string | null;
  documentId: string | null;
}

const RATINGS: Array<{ value: Rating; hint: string; tone: string }> = [
  { value: 0, hint: "10 min", tone: "border-danger/30 text-danger hover:bg-danger/5" },
  { value: 1, hint: "Sooner", tone: "border-line-strong text-ink-soft hover:border-gold" },
  { value: 2, hint: "On schedule", tone: "border-success/30 text-success hover:bg-success/5" },
  { value: 3, hint: "Longer", tone: "border-gold/40 text-gold hover:bg-gold-soft/40" },
];

export function RevisionSession({ cards }: { cards: SessionCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const router = useRouter();
  const card = cards[index];
  const finished = index >= cards.length;

  function rate(rating: Rating) {
    if (!card || pending) return;
    startTransition(async () => {
      const result = await reviewCardAction(card.id, rating);
      if (!result.ok) {
        setError(result.error ?? "Could not save that review.");
        return;
      }
      setCounts((prev) => ({ ...prev, [rating]: (prev[rating] ?? 0) + 1 }));
      setRevealed(false);
      setIndex((i) => i + 1);
      setError("");
      router.refresh();
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (finished || pending) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.code === "Space" || event.key === "Enter") {
        event.preventDefault();
        setRevealed(true);
      }
      if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        rate((Number(event.key) - 1) as Rating);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-11 text-center">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="check" size={20} />
        </span>
        <h3 className="font-display text-lg">Nothing due right now</h3>
        <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted">
          Your queue is clear. Cards return as their intervals mature — or make new ones from a case brief.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/library?kind=judgment" className="btn btn-secondary h-9 px-3 text-xs">
            Open a case
          </Link>
          <Link href="/practice" className="btn btn-primary h-9 px-3 text-xs">
            Practise instead
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const reviewed = Object.values(counts).reduce((a, b) => a + b, 0);
    return (
      <div className="px-5 py-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="check" size={22} />
        </span>
        <h3 className="font-display text-xl">Session complete</h3>
        <p className="mt-1 text-[12.5px] text-muted">
          {reviewed} card{reviewed === 1 ? "" : "s"} reviewed. The schedule has been updated.
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-4 gap-2 text-center">
          {([0, 1, 2, 3] as Rating[]).map((rating) => (
            <div key={rating} className="rounded-xl border border-line bg-surface-2 px-2 py-2.5">
              <p className="font-display text-lg">{counts[rating]}</p>
              <p className="text-[9.5px] text-muted">{RATING_LABEL[rating]}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/home" className="btn btn-secondary h-9 px-3 text-xs">
            Back to home
          </Link>
          <Link href="/library?kind=judgment" className="btn btn-primary h-9 px-3 text-xs">
            Study a case <Icon name="arrow" size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between text-[10.5px] text-muted">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>Space to reveal · 1–4 to rate</span>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>

      <div className="min-h-[190px] rounded-2xl border border-line bg-surface-2 p-5">
        <p className="eyebrow mb-2">Question</p>
        <p className="font-display text-[1.2rem] leading-snug" aria-live="polite">
          {card.front}
        </p>
        {revealed ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow mb-1.5">Answer</p>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">{card.back}</p>
            {card.source ? (
              <p className="mt-3 text-[10.5px] text-muted">
                Source:{" "}
                {card.documentId ? (
                  <Link href={`/library/${card.documentId}`} className="text-gold hover:underline">
                    {truncate(card.source, 60)}
                  </Link>
                ) : (
                  truncate(card.source, 60)
                )}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-[11px] text-danger">{error}</p> : null}

      {revealed ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating) => (
            <button
              key={rating.value}
              type="button"
              className={`rounded-xl border bg-surface px-2 py-2.5 text-[12px] font-medium transition-colors disabled:opacity-50 ${rating.tone}`}
              onClick={() => rate(rating.value)}
              disabled={pending}
            >
              {RATING_LABEL[rating.value]}
              <span className="mt-0.5 block text-[9px] font-normal text-muted">{rating.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          onClick={() => setRevealed(true)}
        >
          Show answer
        </button>
      )}
      <p className="mt-3 text-center text-[10px] text-muted">
        Rating honestly is what makes spaced repetition work. “Again” is not failure.
      </p>
    </div>
  );
}

export function NewCardForm({
  documents,
  defaultDocumentId,
}: {
  documents: Array<{ id: string; title: string }>;
  defaultDocumentId?: string;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [documentId, setDocumentId] = useState(defaultDocumentId ?? "");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await createCardAction({ front, back, documentId: documentId || undefined });
      if (result.ok) {
        setFront("");
        setBack("");
        setMessage({ type: "ok", text: result.message ?? "Card added." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Could not add the card." });
      }
    });
  }

  return (
    <section className="card p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon name="plus" size={14} className="text-gold" /> Add a flashcard
      </h2>
      <label htmlFor="card-front" className="label">
        Front
      </label>
      <textarea
        id="card-front"
        value={front}
        onChange={(e) => setFront(e.target.value)}
        rows={2}
        className="textarea text-[12px]"
        placeholder="What is the rule in…?"
        maxLength={500}
      />
      <label htmlFor="card-back" className="label mt-2.5">
        Back
      </label>
      <textarea
        id="card-back"
        value={back}
        onChange={(e) => setBack(e.target.value)}
        rows={3}
        className="textarea text-[12px]"
        placeholder="The answer, in your own words."
        maxLength={2000}
      />
      <label htmlFor="card-source" className="label mt-2.5">
        Source (optional)
      </label>
      <select
        id="card-source"
        value={documentId}
        onChange={(e) => setDocumentId(e.target.value)}
        className="select py-2 text-[11.5px]"
      >
        <option value="">No source</option>
        {documents.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {truncate(doc.title, 60)}
          </option>
        ))}
      </select>
      {message ? (
        <p className={`mt-2 text-[10.5px] ${message.type === "ok" ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn-primary mt-3 h-8 w-full text-[11px]"
        onClick={submit}
        disabled={pending || !front.trim() || !back.trim()}
      >
        {pending ? "Adding…" : "Add to queue"}
      </button>
    </section>
  );
}

export function CardList({
  cards,
  compact = false,
}: {
  cards: Array<SessionCard & { dueAt: string; reps: number }>;
  compact?: boolean;
}) {
  const [items, setItems] = useState(cards);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!items.length) {
    return <p className="px-4 py-6 text-center text-[12px] text-muted">No cards yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.slice(0, compact ? 6 : 60).map((card) => {
        const due = new Date(card.dueAt);
        const isDue = due.getTime() <= Date.now();
        return (
          <li key={card.id} className="group flex items-start gap-3 px-4 py-3">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${
                isDue ? "bg-gold-soft text-gold" : "bg-surface-2 text-muted"
              }`}
            >
              {card.reps}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-snug">{truncate(card.front, 110)}</p>
              <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{truncate(card.back, 110)}</p>
              <p className="mt-0.5 text-[9.5px] text-muted">
                {isDue ? "Due now" : `Due ${formatDate(due)}`}
                {card.source ? ` · ${truncate(card.source, 40)}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="rounded p-1 text-muted opacity-0 transition hover:text-danger focus:opacity-100 group-hover:opacity-100"
              aria-label="Delete card"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteCardAction(card.id);
                  if (result.ok) {
                    setItems((prev) => prev.filter((item) => item.id !== card.id));
                    router.refresh();
                  }
                })
              }
            >
              <Icon name="trash" size={13} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
