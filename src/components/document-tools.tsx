"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { toggleBookmarkAction } from "@/app/actions/library";
import { downloadFile } from "@/lib/utils";

export function BookmarkButton({
  documentId,
  initial,
  path,
  withLabel = false,
}: {
  documentId: string;
  initial: boolean;
  path: string;
  withLabel?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        className={`btn ${bookmarked ? "btn-secondary text-gold" : "btn-secondary"} ${withLabel ? "" : "px-2.5"}`}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this document"}
        title={bookmarked ? "Remove bookmark" : "Bookmark"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await toggleBookmarkAction(documentId, path);
            if (result.ok) {
              setBookmarked(Boolean(result.bookmarked));
              setError("");
            } else {
              setError(result.error ?? "Could not update the bookmark.");
            }
          })
        }
      >
        <Icon name="bookmark" size={15} className={bookmarked ? "fill-current" : ""} />
        {withLabel ? (bookmarked ? "Saved" : "Save") : null}
      </button>
      {error ? <span className="mt-1 text-[10px] text-danger">{error}</span> : null}
    </div>
  );
}

export function ExportButtons({
  filename,
  markdown,
  showPrint = true,
}: {
  filename: string;
  markdown: string;
  showPrint?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn btn-secondary h-9 px-3 text-xs"
        onClick={() => downloadFile(filename, markdown)}
      >
        <Icon name="download" size={14} /> Markdown
      </button>
      {showPrint ? (
        <button type="button" className="btn btn-secondary h-9 px-3 text-xs" onClick={() => window.print()}>
          <Icon name="print" size={14} /> PDF / print
        </button>
      ) : null}
    </div>
  );
}

export function ListenButton({ text, label = "Listen" }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 6000));
    utterance.rate = 0.98;
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button type="button" className="btn btn-secondary h-9 px-3 text-xs" onClick={speak} aria-pressed={speaking}>
      <Icon name={speaking ? "close" : "volume"} size={14} /> {speaking ? "Stop" : label}
    </button>
  );
}

export function PrintStyles() {
  return null;
}

export function RefreshOnFocus() {
  const router = useRouter();
  return (
    <button type="button" className="hidden" onClick={() => router.refresh()} aria-hidden="true" tabIndex={-1} />
  );
}
