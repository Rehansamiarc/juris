import type { CaseBrief, DocumentRecord } from "./types";
import { UNAVAILABLE } from "./casebrief";
import { formatDate } from "./utils";

export interface BriefMode {
  id: "thirty" | "minute" | "detailed" | "exam" | "beginner";
  label: string;
  hint: string;
  body: string;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const usable = (s: string) => Boolean(s && s !== UNAVAILABLE && !/^not available/i.test(s));

function joinUsable(items: string[]) {
  return items.filter(usable).map(clean).join(" ");
}

export function briefModes(brief: CaseBrief): BriefMode[] {
  const identity = [brief.caseName, brief.citation, brief.court]
    .filter(usable)
    .map(clean)
    .join(" · ");

  const incompleteNote = brief.missing.length
    ? `This brief is incomplete — ${brief.missing.length} field${brief.missing.length === 1 ? " is" : "s are"} marked unavailable.`
    : "";
  const thirty = usable(brief.thirtySecond)
    ? clean(brief.thirtySecond)
    : joinUsable([
        identity,
        usable(brief.decision) ? `Decision: ${clean(brief.decision)}` : "",
        brief.ratio[0] ? `Ratio: ${clean(brief.ratio[0])}` : "",
        !usable(brief.decision) && !brief.ratio[0] ? incompleteNote : "",
      ]) || UNAVAILABLE;

  const minute = usable(brief.oneMinute)
    ? clean(brief.oneMinute)
    : joinUsable([
        identity,
        usable(brief.facts) ? `Facts: ${clean(brief.facts)}` : "",
        usable(brief.decision) ? `Held: ${clean(brief.decision)}` : "",
        brief.ratio[0] ? `Ratio: ${clean(brief.ratio[0])}` : "",
      ]) || UNAVAILABLE;

  const detailed = [
    `**${brief.caseName}**${usable(brief.citation) ? ` — ${brief.citation}` : ""}`,
    usable(brief.court) ? clean(brief.court) : "",
    usable(brief.date) ? `Decided: ${clean(brief.date)}` : "",
    usable(brief.bench) ? `Bench: ${clean(brief.bench)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const exam = usable(brief.examSummary)
    ? clean(brief.examSummary)
    : joinUsable([
        usable(brief.decision) ? `Outcome: ${clean(brief.decision)}` : "",
        brief.issues.length ? `Issues: ${brief.issues.join("; ")}` : "",
        brief.ratio.length ? `Ratio: ${brief.ratio.join(" ")}` : "",
      ]) || UNAVAILABLE;

  const beginner = usable(brief.beginner)
    ? clean(brief.beginner)
    : UNAVAILABLE;

  return [
    { id: "thirty", label: "30-second summary", hint: "The essentials, at a glance", body: thirty },
    { id: "minute", label: "One-minute revision", hint: "Facts, holding and ratio", body: minute },
    {
      id: "detailed",
      label: "Detailed case brief",
      hint: "Full structured notes",
      body: detailed,
    },
    { id: "exam", label: "Exam answer outline", hint: "Structure a 10-mark answer", body: exam },
    { id: "beginner", label: "Beginner-friendly", hint: "Plain-English walkthrough", body: beginner },
  ];
}

export function briefToMarkdown(brief: CaseBrief, meta: { sourceUrl?: string | null; verified?: string }) {
  const lines: string[] = [];
  lines.push(`# ${brief.caseName}`);
  lines.push("");
  lines.push(`> Generated with Vidhi · ${brief.generatedBy === "ai" ? "AI-assisted, verified by you" : "Local extraction — not AI-generated"}`);
  if (meta.sourceUrl) lines.push(`> Source: ${meta.sourceUrl}`);
  if (meta.verified) lines.push(`> Verification: ${meta.verified}`);
  lines.push("");
  const add = (label: string, value: string | string[]) => {
    lines.push(`## ${label}`);
    if (Array.isArray(value)) {
      if (!value.length) lines.push(`_${UNAVAILABLE}_`);
      else value.forEach((v) => lines.push(`- ${v}`));
    } else {
      lines.push(value || `_${UNAVAILABLE}_`);
    }
    lines.push("");
  };
  add("Identity", `${brief.citation || UNAVAILABLE} · ${brief.court || UNAVAILABLE} · ${brief.date || UNAVAILABLE}`);
  add("Facts", brief.facts);
  add("Procedural history", brief.proceduralHistory);
  add("Legal issues", brief.issues);
  add("Petitioner / appellant arguments", brief.petitionerArguments);
  add("Respondent arguments", brief.respondentArguments);
  add("Applicable statutes", brief.statutes);
  add("Precedents", brief.precedents);
  add("Court's reasoning", brief.reasoning);
  add("Decision", brief.decision);
  add("Ratio decidendi", brief.ratio);
  add("Obiter dicta", brief.obiter);
  add("Key legal principles", brief.principles);
  add("Exam summary", brief.examSummary);
  add("Points to remember", brief.pointsToRemember);
  add("30-second summary", brief.thirtySecond);
  add("One-minute revision", brief.oneMinute);
  add("Beginner-friendly explanation", brief.beginner);
  add("Exam answer outline", brief.examOutline);
  add("Missing or unverified", brief.missing);
  lines.push("---");
  lines.push(
    "Study aid only. Cross-check every citation and holding against the official reporter before relying on it in an exam answer, memo or court filing.",
  );
  return lines.join("\n");
}

export function flashcardsFromBrief(brief: CaseBrief) {
  const cards: Array<{ front: string; back: string }> = [];
  const seen = new Set<string>();
  const add = (front: string, back: string) => {
    const value = clean(back);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    cards.push({ front, back: value });
  };
  const name = usable(brief.caseName) ? brief.caseName : "this case";
  if (usable(brief.decision)) add(`What was the decision in ${name}?`, brief.decision);
  if (usable(brief.facts)) add(`State the material facts of ${name}.`, brief.facts);
  if (brief.ratio.length) add(`What is the ratio decidendi of ${name}?`, brief.ratio.join(" "));
  brief.issues.slice(0, 2).forEach((issue, i) =>
    add(`What legal issue ${i + 1} did the court decide in ${name}?`, issue),
  );
  brief.principles.slice(0, 3).forEach((p) =>
    add(`State a key legal principle from ${name}.`, p),
  );
  brief.pointsToRemember
    .filter((point) => !/^(article|section)\b/i.test(point.trim()))
    .slice(0, 2)
    .forEach((p) => add(`Exam point from ${name}?`, p));
  return cards.slice(0, 10);
}

const MNEMONIC_STOPWORDS = new Set([
  "article",
  "articles",
  "section",
  "sections",
  "under",
  "with",
  "from",
  "that",
  "this",
  "shall",
  "which",
  "there",
  "their",
  "have",
  "been",
  "court",
  "case",
  "state",
]);

/** A transparent, deterministic mnemonic built only from principle statements. */
export function mnemonicFromBrief(brief: CaseBrief) {
  const points = [...new Set([...brief.principles, ...brief.ratio].filter(usable))]
    .filter((point) => point.length <= 180)
    .slice(0, 6);
  if (points.length < 2) return null;
  const keywords = points.map((point) => {
    const word = point
      .replace(/[^A-Za-z\s]/g, " ")
      .split(/\s+/)
      .find((candidate) => candidate.length > 3 && !MNEMONIC_STOPWORDS.has(candidate.toLowerCase()));
    return word ? word[0].toUpperCase() : null;
  });
  if (keywords.filter(Boolean).length < 2) return null;
  return {
    acronym: keywords.filter(Boolean).join(""),
    lines: points.map((point, i) => ({ letter: keywords[i] ?? "•", text: clean(point) })),
  };
}

export function documentToMarkdown(doc: DocumentRecord) {
  const parts = [`# ${doc.title}`];
  if (doc.citation) parts.push(`*${doc.citation}*`);
  parts.push(
    `Type: ${doc.docType ?? doc.kind} · Jurisdiction: ${doc.jurisdiction ?? "India"} · Verification: ${doc.verification}`,
  );
  if (doc.sourceUrl) parts.push(`Source: ${doc.sourceUrl}`);
  if (doc.officialText) parts.push("## Official text", doc.officialText);
  if (doc.explanation) parts.push("## Study explanation", doc.explanation);
  if (doc.brief) parts.push(briefToMarkdown(doc.brief, { sourceUrl: doc.sourceUrl, verified: doc.verification }));
  parts.push(`_Exported ${formatDate(new Date())}. Verify against the official source._`);
  return parts.join("\n\n");
}
