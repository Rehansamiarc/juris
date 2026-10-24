import { aiConfigured, aiConfig, aiText, AIUnavailableError, FABRICATION_RULES } from "./ai";
import { getDocument } from "./db";
import { retrieveSources, type Source } from "./retrieval";
import type { Citation } from "./types";

export interface TutorTurn {
  role: "user" | "assistant";
  content: string;
}

export interface TutorAnswer {
  content: string;
  citations: Citation[];
  mode: "ai" | "local";
  warning?: string;
}

function citationFrom(source: Source): Citation {
  return {
    documentId: source.documentId,
    title: source.title,
    snippet: source.snippet,
    sourceUrl: source.sourceUrl,
    verification: source.verification,
  };
}

const TUTOR_SYSTEM = `${FABRICATION_RULES}

You are Juris, an AI law tutor for Indian law students (LLB, BA LLB, BBA LLB and judiciary aspirants).
Style:
- Teach, don't lecture. Short paragraphs, clear headings, worked examples.
- Use Indian terminology and statutory references available in the sources.
- Number every factual claim with the source it came from, like [1] or [2][3].
- Where the sources do not answer the question, say "The library does not contain a reliable source for this" and explain what the student should check next (bare Act, reporter, official gazette).
- For comparison questions, use a compact markdown table with 3-5 rows.
- End with a one-line "Study check" question the student can answer to test themselves.
- Never present your answer as legal advice.`;

function formatSources(sources: Source[]) {
  return sources
    .map((s, i) => {
      const doc = getDocument(s.documentId);
      const excerpt = (doc?.officialText || doc?.explanation || s.snippet || "").slice(0, 2200);
      return `[${i + 1}] ${s.title}${s.citation ? ` — ${s.citation}` : ""}\nVerification: ${s.verification}${s.sourceUrl ? `\nSource: ${s.sourceUrl}` : ""}\nExcerpt:\n${excerpt}`;
    })
    .join("\n\n");
}

function localAnswer(question: string, sources: Source[], focusedTitle?: string): TutorAnswer {
  if (!sources.length) {
    return {
      mode: "local",
      citations: [],
      content: `**I could not find a reliable match in your library for this question.**

No AI model is configured on this deployment, so I will not generate an answer from memory — inventing statutory text or holdings is exactly what this product avoids.

**What you can do next**
- Search the Law Library by subject or provision name, or open the relevant Bare Act document.
- Configure an AI provider (\`AI_API_KEY\` and \`AI_API_URL\`) to enable generative, source-grounded answers with citations.
- If you scanned the judgment yourself, ask again from that case's page so the tutor reads your document.`,
    };
  }

  const blocks = sources.slice(0, 4).map((s, i) => {
    return `**${i + 1}. ${s.title}**${s.citation ? ` — *${s.citation}*` : ""}\n> ${s.snippet.replace(/\n/g, " ")}\n\n[Open the source](/library/${s.documentId})`;
  });

  return {
    mode: "local",
    citations: sources.slice(0, 4).map(citationFrom),
    content: `**Local extractive mode.** No AI provider is configured, so instead of generating an answer I am showing the closest material from your library${focusedTitle ? ` and **${focusedTitle}**` : ""}. Everything below is quoted or excerpted from a stored source.

${blocks.join("\n\n")}

---

*Reading these passages is not a substitute for the official text. Verify each provision in the bare Act, and each holding in the reporter, before you cite it.*`,
  };
}

export async function askTutor(input: {
  userId: string;
  question: string;
  documentId?: string;
  history?: TutorTurn[];
}): Promise<TutorAnswer> {
  const sources = retrieveSources(input.userId, input.question, {
    documentId: input.documentId,
    limit: 6,
  });
  const focused = input.documentId ? getDocument(input.documentId) : undefined;

  if (!aiConfigured()) return localAnswer(input.question, sources, focused?.title);

  if (!sources.length) {
    return {
      mode: "ai",
      citations: [],
      content: `**The library does not contain a reliable source for this question**, so I am not going to answer from memory.

Try one of these:
- Search the Law Library for the Act or section name.
- Scan the judgment or case note with the Case Scanner, then ask me from inside that case.
- Rephrase with the statute or case name, e.g. “Article 21 and the right to privacy”.

If you configure a broader source corpus later, this question can be answered with citations.`,
    };
  }

  const history = (input.history ?? []).slice(-6);
  const conversation = history
    .map((turn) => `${turn.role === "user" ? "Student" : "Tutor"}: ${turn.content}`)
    .join("\n\n");

  const user = `Sources available (cite them by number):
${formatSources(sources)}

${focused ? `The student is reading: ${focused.title}\n\n` : ""}${conversation ? `Earlier in this conversation:\n${conversation}\n\n` : ""}Student's question: ${input.question}`;

  try {
    const content = await aiText(TUTOR_SYSTEM, user, {
      model: aiConfig.chatModel,
      maxTokens: 1600,
      temperature: 0.25,
    });
    const cited = new Set<number>();
    for (const match of content.matchAll(/\[(\d+)\]/g)) {
      const n = Number(match[1]);
      if (n >= 1 && n <= sources.length) cited.add(n);
    }
    const citations = cited.size
      ? [...cited].sort((a, b) => a - b).map((n) => citationFrom(sources[n - 1]))
      : [];
    return {
      content,
      citations,
      mode: "ai",
      warning: citations.length
        ? undefined
        : "The tutor's answer did not reference a specific source. Treat it as background explanation and verify before citing.",
    };
  } catch (error) {
    if (error instanceof AIUnavailableError) return localAnswer(input.question, sources, focused?.title);
    const fallback = localAnswer(input.question, sources, focused?.title);
    return {
      ...fallback,
      warning: `The AI provider could not be reached (${error instanceof Error ? error.message : "unknown error"}). Showing source excerpts instead.`,
    };
  }
}
