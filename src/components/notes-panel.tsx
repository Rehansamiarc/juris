"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import {
  createNoteAction,
  deleteHighlightAction,
  deleteNoteAction,
  saveHighlightAction,
} from "@/app/actions/library";
import { relativeTime } from "@/lib/utils";

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface Highlight {
  id: string;
  text: string;
  createdAt: string;
}

export function NotesPanel({
  documentId,
  initialNotes,
}: {
  documentId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await createNoteAction(documentId, body);
      if (result.ok) {
        setNotes((prev) => [
          { id: crypto.randomUUID(), body: body.trim(), createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setBody("");
        setError("");
        router.refresh();
      } else {
        setError(result.error ?? "Could not save the note.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteNoteAction(documentId, id);
      if (result.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        router.refresh();
      }
    });
  }

  return (
    <section aria-labelledby="notes-heading" className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="notes-heading" className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Icon name="note" size={14} className="text-gold" /> Your notes
        </h2>
        <span className="text-[10px] text-muted">{notes.length}</span>
      </div>
      <label htmlFor={`note-${documentId}`} className="sr-only">
        Add a note
      </label>
      <textarea
        id={`note-${documentId}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write what you want to remember, in your own words…"
        className="textarea resize-y text-[12.5px]"
        maxLength={4000}
      />
      {error ? <p className="mt-1 text-[11px] text-danger">{error}</p> : null}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted">{body.length}/4000</span>
        <button
          type="button"
          className="btn btn-primary h-8 px-3 text-[11px]"
          onClick={submit}
          disabled={pending || !body.trim()}
        >
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="group rounded-xl border border-line bg-surface-2 p-3">
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">{note.body}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9.5px] text-muted">{relativeTime(note.createdAt)}</span>
              <button
                type="button"
                onClick={() => remove(note.id)}
                className="rounded p-1 text-muted opacity-60 transition hover:text-danger group-hover:opacity-100"
                aria-label="Delete note"
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          </li>
        ))}
        {!notes.length ? <li className="py-2 text-center text-[11px] text-muted">No notes yet.</li> : null}
      </ul>
    </section>
  );
}

export function Highlighter({ documentId, children }: { documentId: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !ref.current) return;
    const text = selection.toString().trim();
    if (text.length < 8 || !ref.current.contains(selection.anchorNode)) return;
    setSelected(text);
    setNotice("");
  }

  function save() {
    startTransition(async () => {
      const result = await saveHighlightAction(documentId, selected);
      if (result.ok) {
        setSelected("");
        window.getSelection()?.removeAllRanges();
        setNotice("Highlighted and saved.");
        router.refresh();
      } else {
        setNotice(result.error ?? "Could not save the highlight.");
      }
    });
  }

  return (
    <div>
      <div ref={ref} onMouseUp={captureSelection} onTouchEnd={captureSelection}>
        {children}
      </div>
      {selected ? (
        <div className="sticky bottom-20 z-20 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-surface px-3 py-2 shadow-lg lg:bottom-4">
          <p className="min-w-0 flex-1 truncate text-[11.5px] text-ink-soft">
            “{selected.slice(0, 90)}{selected.length > 90 ? "…" : ""}”
          </p>
          <div className="flex gap-1.5">
            <button type="button" className="btn btn-ghost h-7 px-2 text-[11px]" onClick={() => setSelected("")}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-gold h-7 px-2.5 text-[11px]"
              onClick={save}
              disabled={pending}
            >
              <Icon name="bookmark" size={11} /> {pending ? "Saving…" : "Highlight"}
            </button>
          </div>
        </div>
      ) : null}
      {notice ? <p className="mt-2 text-[11px] text-gold">{notice}</p> : null}
    </div>
  );
}

export function HighlightList({
  documentId,
  highlights,
}: {
  documentId: string;
  highlights: Highlight[];
}) {
  const [items, setItems] = useState(highlights);
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (!items.length) return null;

  return (
    <section className="card p-4" aria-label="Saved highlights">
      <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon name="bookmark" size={14} className="text-gold" /> Highlights
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="group rounded-lg border-l-2 border-gold/60 bg-gold-soft/30 px-2.5 py-2">
            <p className="font-display text-[12px] leading-relaxed text-ink">“{item.text}”</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[9.5px] text-muted">{relativeTime(item.createdAt)}</span>
              <button
                type="button"
                className="rounded p-1 text-muted opacity-0 transition hover:text-danger group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove highlight"
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteHighlightAction(documentId, item.id);
                    if (result.ok) {
                      setItems((prev) => prev.filter((h) => h.id !== item.id));
                      router.refresh();
                    }
                  })
                }
              >
                <Icon name="trash" size={11} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
