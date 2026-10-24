"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { MarkdownLite } from "./markdown";
import { sendTutorMessageAction } from "@/app/actions/tutor";
import type { ChatMessage, Citation } from "@/lib/types";
import { VERIFICATION_LABEL, relativeTime, truncate } from "@/lib/utils";

const STARTERS = [
  "Explain the basic structure doctrine in simple terms.",
  "What is the difference between culpable homicide and murder?",
  "How do I structure an answer on Article 14?",
  "What are the ingredients of theft under the IPC?",
  "Compare the Vishaka guidelines with the 2013 Act.",
];

function Citations({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <div className="mt-3 border-t border-line pt-2.5">
      <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">Sources used</p>
      <ul className="space-y-1.5">
        {citations.map((citation, index) => (
          <li key={`${citation.documentId}-${index}`} className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
            <Link href={`/library/${citation.documentId}`} className="text-[11px] font-medium text-ink hover:text-gold">
              [{index + 1}] {truncate(citation.title, 68)}
            </Link>
            {citation.snippet ? (
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted">{citation.snippet}</p>
            ) : null}
            <p className="mt-0.5 text-[9px] text-muted">
              {VERIFICATION_LABEL[citation.verification] ?? citation.verification}
              {citation.sourceUrl ? (
                <>
                  {" · "}
                  <a href={citation.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-gold hover:underline">
                    official source
                  </a>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TutorChat({
  conversationId: initialConversationId,
  documentId: initialDocumentId,
  initialMessages,
  documents,
  aiReady,
  initialQuestion = "",
  focusTitle,
}: {
  conversationId: string | null;
  documentId: string | null;
  initialMessages: ChatMessage[];
  documents: Array<{ id: string; title: string }>;
  aiReady: boolean;
  initialQuestion?: string;
  focusTitle?: string;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState(initialQuestion);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || pending) return;
    setInput("");
    setError("");
    setWarning("");
    setPending(true);
    const optimistic: ChatMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: question,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await sendTutorMessageAction({
        conversationId: conversationId ?? undefined,
        question,
        documentId: documentId ?? undefined,
      });
      if (result.error) {
        setError(result.error);
        setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
        setInput(question);
        return;
      }
      if (result.conversationId) {
        setConversationId(result.conversationId);
        router.replace(
          `/tutor?c=${result.conversationId}${documentId ? `&doc=${documentId}` : ""}`,
          { scroll: false },
        );
      }
      if (result.message) setMessages((prev) => [...prev, result.message!]);
      if (result.warning) setWarning(result.warning);
      router.refresh();
    } catch {
      setError("The tutor could not answer just now. Check the server logs and try again.");
      setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
      setInput(question);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card flex min-h-[560px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[#f5eddc] dark:bg-gold-soft dark:text-gold">
            <Icon name="tutor" size={14} />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold">Juris tutor</p>
            <p className="text-[9.5px] text-muted">
              {aiReady ? "Grounded in your library · cites its sources" : "Local extractive mode · sources only"}
            </p>
          </div>
        </div>
        {conversationId ? (
          <span className="chip">
            <Icon name="check" size={10} /> Saved conversation
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5" style={{ maxHeight: "62vh" }}>
        {!messages.length ? (
          <div className="mx-auto max-w-lg py-6 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold">
              <Icon name="sparkles" size={22} />
            </span>
            <h2 className="font-display text-xl">Ask a legal question</h2>
            <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-muted">
              {focusTitle
                ? `This conversation is attached to “${focusTitle}”. Ask about its facts, reasoning or ratio.`
                : "The tutor answers from the material in your library and shows the sources it used. If it cannot support an answer, it will say so."}
            </p>
            <div className="mt-5 flex flex-col gap-1.5 text-left">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left text-[11.5px] text-ink-soft transition-colors hover:border-gold hover:text-ink"
                  onClick={() => void send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-[13px] leading-relaxed text-[#f6efe2] dark:bg-gold-soft dark:text-ink">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold-soft text-gold">
                    <Icon name="gavel" size={13} />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-surface-2 px-4 py-3">
                    <MarkdownLite text={message.content} className="legal-prose text-[13px]" />
                    <Citations citations={message.citations} />
                    <p className="mt-2 text-[9px] text-muted">
                      {relativeTime(message.createdAt)} · Educational explanation, not legal advice.
                    </p>
                  </div>
                </div>
              ),
            )}
            {pending ? (
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-gold-soft text-gold">
                  <Icon name="gavel" size={13} />
                </span>
                <div className="rounded-2xl rounded-tl-md border border-line bg-surface-2 px-4 py-3">
                  <div className="flex items-center gap-2 text-[11.5px] text-muted">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    Reading your library and drafting a grounded answer…
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {warning ? (
        <p className="mx-4 mb-2 rounded-lg border border-gold/30 bg-gold-soft/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-soft">
          {warning}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mx-4 mb-2 text-[11px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="border-t border-line bg-surface p-3 sm:p-4">
        {conversationId ? (
          <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted">
            <Icon name="file" size={11} /> Context: {focusTitle ?? "Entire library"}
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-2">
            <label htmlFor="tutor-context" className="text-[10px] text-muted">
              Context
            </label>
            <select
              id="tutor-context"
              value={documentId ?? ""}
              onChange={(e) => {
                setDocumentId(e.target.value || null);
                router.replace(`/tutor${e.target.value ? `?doc=${e.target.value}` : ""}`, { scroll: false });
              }}
              className="select max-w-[280px] py-1.5 text-[10.5px]"
            >
              <option value="">Entire library</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {truncate(doc.title, 60)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="tutor-input" className="sr-only">
            Ask the tutor
          </label>
          <textarea
            id="tutor-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Ask about a provision, a case, or the document you scanned…"
            className="textarea max-h-32 min-h-[42px] resize-y text-[13px]"
          />
          <button
            type="button"
            className="btn btn-primary h-[42px] px-3"
            onClick={() => void send()}
            disabled={pending || !input.trim()}
            aria-label="Send question"
          >
            {pending ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Icon name="arrow" size={16} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[9.5px] text-muted">
          Enter to send · Shift+Enter for a new line. Answers cite sources from your library.
        </p>
      </div>
    </section>
  );
}
