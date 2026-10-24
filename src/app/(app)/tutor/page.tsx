import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { TutorChat } from "@/components/tutor-chat";
import { PageHeader, VerificationBadge } from "@/components/ui";
import { aiStatus } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import {
  getConversation,
  getDocument,
  listConversations,
  listDocuments,
  listMessages,
} from "@/lib/db";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Tutor" };

type Search = { c?: string; doc?: string; q?: string; compare?: string };

export default async function TutorPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user, profile } = await requireSession();
  const params = await searchParams;
  const ai = aiStatus();
  const conversations = listConversations(user.id);
  const active = params.c ? getConversation(params.c, user.id) : undefined;
  const messages = active ? listMessages(active.id) : [];

  let compareQuestion = "";
  let compareTitles = "";
  if (params.compare) {
    const [leftId, rightId] = params.compare.split(",");
    const left = leftId ? getDocument(leftId) : undefined;
    const right = rightId ? getDocument(rightId) : undefined;
    if (left && right) {
      compareQuestion = `Compare ${left.title} and ${right.title}. What does each decide, where do they diverge, and when should I cite each in an exam answer?`;
      compareTitles = `${left.title} · ${right.title}`;
    }
  }

  const focusDocId = params.doc ?? active?.documentId ?? undefined;
  const focusDoc = focusDocId ? getDocument(focusDocId) : undefined;
  const documents = listDocuments({ userId: user.id, limit: 200 })
    .filter((doc) => doc.kind !== "article")
    .map((doc) => ({ id: doc.id, title: doc.title }));
  const subjectHint = profile?.subjects?.[0];

  return (
    <div>
      <PageHeader
        eyebrow="AI law tutor"
        title="Ask a question. Get an answer with sources."
        description={
          ai.configured
            ? "Answers are grounded in the documents in your library, with numbered citations. When the library cannot support an answer, the tutor says so instead of guessing."
            : "No AI provider is configured, so the tutor works in local extractive mode: it retrieves and quotes the most relevant material from your library rather than writing an answer."
        }
        actions={
          <Link href="/tutor" className="btn btn-secondary">
            <Icon name="plus" size={14} /> New conversation
          </Link>
        }
      />

      {!ai.configured ? (
        <div className="mb-5 flex gap-3 rounded-xl border border-gold/30 bg-gold-soft/40 p-4">
          <Icon name="sparkles" size={17} className="mt-0.5 shrink-0 text-gold" />
          <div className="text-[11.5px] leading-relaxed">
            <p className="font-semibold text-ink">Local extractive mode is active.</p>
            <p className="mt-0.5 text-ink-soft">
              Configure <code className="rounded bg-surface px-1">AI_API_KEY</code> and{" "}
              <code className="rounded bg-surface px-1">AI_API_URL</code> to enable generative,
              source-cited answers. Until then the tutor quotes your library verbatim and never invents
              holdings.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="order-2 space-y-4 lg:order-1">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-3.5 py-2.5">
              <h2 className="text-[12px] font-semibold">Conversations</h2>
              <span className="text-[10px] text-muted">{conversations.length}</span>
            </div>
            <ul className="max-h-[320px] overflow-y-auto">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/tutor?c=${conversation.id}`}
                      aria-current={active?.id === conversation.id ? "page" : undefined}
                      className={`block border-l-2 px-3.5 py-2.5 transition-colors ${
                        active?.id === conversation.id
                          ? "border-gold bg-gold-soft/40"
                          : "border-transparent hover:bg-surface-2"
                      }`}
                    >
                      <p className="line-clamp-2 text-[11.5px] font-medium leading-snug">
                        {conversation.title}
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-muted">
                        {new Date(conversation.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {conversation.documentId ? " · document" : ""}
                      </p>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-4 py-5 text-center text-[11px] text-muted">No conversations yet.</li>
              )}
            </ul>
          </section>

          {focusDoc ? (
            <section className="card p-3.5">
              <p className="eyebrow mb-1.5">Reading context</p>
              <p className="text-[12px] font-medium leading-snug">{focusDoc.title}</p>
              <p className="mt-1 text-[10px] text-muted">{focusDoc.citation ?? focusDoc.subject}</p>
              <div className="mt-2 flex items-center justify-between">
                <VerificationBadge value={focusDoc.verification} />
                <Link href={`/library/${focusDoc.id}`} className="text-[10px] text-gold hover:underline">
                  Open source
                </Link>
              </div>
            </section>
          ) : null}

          <section className="card p-3.5">
            <p className="eyebrow mb-2">Ground rules</p>
            <ul className="space-y-2 text-[10.5px] leading-relaxed text-muted">
              <li className="flex gap-1.5">
                <Icon name="check" size={11} className="mt-0.5 shrink-0 text-gold" />
                Every factual claim should carry a source number.
              </li>
              <li className="flex gap-1.5">
                <Icon name="check" size={11} className="mt-0.5 shrink-0 text-gold" />
                Statutory text is quoted separately from explanation.
              </li>
              <li className="flex gap-1.5">
                <Icon name="check" size={11} className="mt-0.5 shrink-0 text-gold" />
                No predictions, no advice, no invented citations.
              </li>
            </ul>
          </section>
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          {conversations.length && !params.c ? (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
              {conversations.slice(0, 5).map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/tutor?c=${conversation.id}`}
                  className="chip shrink-0 hover:border-gold"
                >
                  {truncate(conversation.title, 28)}
                </Link>
              ))}
            </div>
          ) : null}

          {compareTitles ? (
            <p className="mb-3 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[11px] text-muted">
              Comparison loaded: <span className="font-medium text-ink">{compareTitles}</span>. Send the
              prepared question or edit it first.
            </p>
          ) : null}

          <TutorChat
            key={active?.id ?? "new"}
            conversationId={active?.id ?? null}
            documentId={focusDoc?.id ?? null}
            initialMessages={messages}
            documents={documents}
            aiReady={ai.configured}
            initialQuestion={params.q ?? compareQuestion}
            focusTitle={focusDoc?.title}
          />

          {subjectHint ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>Try asking about {subjectHint}:</span>
              {[
                `Explain the most examinable principle in ${subjectHint}.`,
                `Give me a hypothetical problem on ${subjectHint}.`,
                `Make five revision questions on ${subjectHint}.`,
              ].map((question) => (
                <Link key={question} href={`/tutor?q=${encodeURIComponent(question)}`} className="chip hover:border-gold">
                  {truncate(question, 46)}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
