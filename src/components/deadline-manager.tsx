"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import {
  addDeadlineAction,
  removeDeadlineAction,
  toggleDeadlineAction,
} from "@/app/actions/profile";
import type { DeadlineRecord } from "@/lib/types";
import { daysUntil, formatDate } from "@/lib/utils";

export function DeadlineManager({
  initial,
  subjects,
}: {
  initial: DeadlineRecord[];
  subjects: string[];
}) {
  const [deadlines, setDeadlines] = useState(initial);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    startTransition(async () => {
      const dueAt = new Date(`${date}T09:00:00`).toISOString();
      const result = await addDeadlineAction({ title, subject, dueAt, notes });
      if (result.ok) {
        setTitle("");
        setNotes("");
        setMessage({ type: "ok", text: result.message ?? "Deadline added." });
        router.refresh();
        setDeadlines((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            userId: "self",
            title,
            subject: subject || null,
            dueAt,
            notes: notes || null,
            completed: false,
          },
        ]);
      } else {
        setMessage({ type: "error", text: result.error ?? "Could not add the deadline." });
      }
    });
  }

  return (
    <section id="deadlines" className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg">Deadlines</h2>
          <p className="text-[11.5px] text-muted">Internal assessments, moots, vivas and filing dates.</p>
        </div>
        <Icon name="calendar" size={17} className="text-gold" />
      </div>

      <div className="space-y-2">
        {deadlines.length ? (
          deadlines.map((deadline) => {
            const days = daysUntil(deadline.dueAt);
            const overdue = !deadline.completed && days < 0;
            return (
              <div
                key={deadline.id}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                  deadline.completed
                    ? "border-line bg-surface-2 opacity-60"
                    : overdue
                      ? "border-danger/30 bg-danger/5"
                      : "border-line bg-surface-2"
                }`}
              >
                <button
                  type="button"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    deadline.completed ? "border-success bg-success text-white" : "border-line-strong text-transparent hover:border-gold"
                  }`}
                  aria-label={deadline.completed ? "Mark as not done" : "Mark as done"}
                  aria-pressed={deadline.completed}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleDeadlineAction(deadline.id, !deadline.completed);
                      setDeadlines((prev) =>
                        prev.map((item) =>
                          item.id === deadline.id ? { ...item, completed: !item.completed } : item,
                        ),
                      );
                      router.refresh();
                    })
                  }
                >
                  <Icon name="check" size={10} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12.5px] font-medium leading-snug ${deadline.completed ? "line-through" : ""}`}>
                    {deadline.title}
                  </p>
                  <p className="text-[10px] text-muted">
                    {deadline.subject ? `${deadline.subject} · ` : ""}
                    {formatDate(deadline.dueAt)}
                    {!deadline.completed
                      ? overdue
                        ? " · overdue"
                        : days === 0
                          ? " · today"
                          : ` · in ${days} day${days === 1 ? "" : "s"}`
                      : " · done"}
                  </p>
                  {deadline.notes ? (
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{deadline.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded p-1 text-muted hover:text-danger"
                  aria-label="Delete deadline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await removeDeadlineAction(deadline.id);
                      setDeadlines((prev) => prev.filter((item) => item.id !== deadline.id));
                      router.refresh();
                    })
                  }
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[11px] text-muted">
            No deadlines yet.
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_150px_140px]">
          <div>
            <label htmlFor="deadline-title" className="label">
              Add a deadline
            </label>
            <input
              id="deadline-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xs"
              placeholder="Constitutional Law internal"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="deadline-subject" className="label">
              Subject
            </label>
            <select
              id="deadline-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select py-2 text-xs"
            >
              <option value="">General</option>
              {subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deadline-date" className="label">
              Due
            </label>
            <input
              id="deadline-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input py-2 text-xs"
            />
          </div>
        </div>
        <label htmlFor="deadline-notes" className="label mt-2">
          Notes (optional)
        </label>
        <input
          id="deadline-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input text-xs"
          placeholder="Units, team, citation list…"
          maxLength={300}
        />
        {message ? (
          <p className={`mt-2 text-[10.5px] ${message.type === "ok" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-secondary mt-2 h-8 text-[11px]"
          onClick={add}
          disabled={pending || title.trim().length < 3}
        >
          <Icon name="plus" size={12} /> Add deadline
        </button>
      </div>
    </section>
  );
}
