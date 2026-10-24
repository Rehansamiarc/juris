import { getDocument, listDocuments } from "./db";
import type { DocumentRecord } from "./types";

const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "is", "are", "was", "were", "to", "for", "and", "or", "what",
  "which", "how", "why", "when", "does", "do", "did", "with", "under", "about", "explain", "law",
  "legal", "please", "tell", "me", "case", "cases", "section", "article", "can", "could", "would",
  "should", "this", "that", "these", "those", "it", "its", "be", "been", "being", "as", "at", "by",
  "from", "into", "than", "then", "there", "their", "has", "have", "had", "not", "no", "if", "but",
  "also", "such", "any", "all", "you", "your", "i", "we", "they", "he", "she", "his", "her",
  "explain", "simple", "simpleterms", "terms", "meaning", "difference", "different", "give", "example",
  "hypothetical", "question", "questions", "answer", "define", "definition", "describe",
  "summary", "summarise", "summarize", "understand", "concept", "please", "using", "use", "kindly",
]);

/** A clean, quotable corpus for a document — never raw JSON or field names. */
export function documentCorpus(doc: DocumentRecord): string {
  if (doc.brief) {
    const b = doc.brief;
    return [
      b.caseName,
      b.citation,
      b.court,
      b.facts,
      b.proceduralHistory,
      b.issues.join(". "),
      b.reasoning,
      b.decision,
      b.ratio.join(". "),
      b.obiter.join(". "),
      b.principles.join(". "),
      b.examSummary,
      b.pointsToRemember.join(". "),
    ]
      .filter((value) => value && !/^not available/i.test(value))
      .join("\n\n");
  }
  return doc.officialText || doc.explanation || "";
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count < 40) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export interface Source {
  documentId: string;
  title: string;
  citation: string | null;
  subject: string | null;
  sourceUrl: string | null;
  verification: DocumentRecord["verification"];
  snippet: string;
  score: number;
}

function bestSnippet(text: string, terms: string[], width = 420) {
  if (!text) return "";
  const lower = text.toLowerCase();
  let best = 0;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      best = Math.max(0, idx - 120);
      break;
    }
  }
  const window = text.slice(best, best + width).replace(/\s+/g, " ").trim();
  return `${best > 0 ? "…" : ""}${window}${best + width < text.length ? "…" : ""}`;
}

export function retrieveSources(
  userId: string,
  query: string,
  options: { documentId?: string; subject?: string; limit?: number } = {},
): Source[] {
  const terms = tokenize(query);
  const limit = options.limit ?? 6;
  if (!terms.length) return [];

  let docs: DocumentRecord[];
  if (options.documentId) {
    const doc = getDocument(options.documentId);
    docs = doc ? [doc] : [];
  } else {
    docs = listDocuments({ userId, subject: options.subject, limit: 500 });
  }

  const scored: Source[] = [];
  for (const doc of docs) {
    if (doc.ownerId && doc.ownerId !== userId) continue;
    const title = doc.title.toLowerCase();
    const citation = (doc.citation ?? "").toLowerCase();
    const explanation = (doc.explanation ?? "").toLowerCase();
    const tags = ((doc.meta.tags ?? []).join(" ") + " " + (doc.subject ?? "")).toLowerCase();
    const corpus = documentCorpus(doc);
    const body = corpus.toLowerCase();

    let score = 0;
    let matched = 0;
    let titleHits = 0;
    for (const term of terms) {
      const inTitle = countOccurrences(title, term);
      if (inTitle) titleHits += 1;
      const termScore =
        inTitle * 10 +
        countOccurrences(citation, term) * 6 +
        countOccurrences(tags, term) * 4 +
        countOccurrences(body, term) * 2.5 +
        countOccurrences(explanation, term) * 1.3;
      if (termScore > 0) matched += 1;
      score += termScore;
    }
    if (!score) continue;
    // Require either a title match or overlap on at least two meaningful terms.
    if (!titleHits && matched < 2) continue;
    if (doc.kind === "brief" || doc.kind === "judgment") score *= 1.05;
    scored.push({
      documentId: doc.id,
      title: doc.title,
      citation: doc.citation,
      subject: doc.subject,
      sourceUrl: doc.sourceUrl,
      verification: doc.verification,
      snippet: bestSnippet(corpus || doc.title, terms),
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
