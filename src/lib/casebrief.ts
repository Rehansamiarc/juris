import { aiConfigured, aiConfig, aiJson, FABRICATION_RULES } from "./ai";
import type { CaseBrief } from "./types";

export const BRIEF_SECTIONS: Array<{ key: keyof CaseBrief; label: string }> = [
  { key: "caseName", label: "Case name" },
  { key: "citation", label: "Citation" },
  { key: "court", label: "Court" },
  { key: "date", label: "Date decided" },
  { key: "bench", label: "Bench" },
  { key: "facts", label: "Facts of the case" },
  { key: "proceduralHistory", label: "Procedural history" },
  { key: "issues", label: "Legal issues" },
  { key: "petitionerArguments", label: "Petitioner / appellant arguments" },
  { key: "respondentArguments", label: "Respondent arguments" },
  { key: "statutes", label: "Applicable statutes" },
  { key: "precedents", label: "Precedents relied on" },
  { key: "reasoning", label: "Court's reasoning" },
  { key: "decision", label: "Final judgment and decision" },
  { key: "ratio", label: "Ratio decidendi" },
  { key: "obiter", label: "Obiter dicta" },
  { key: "principles", label: "Key legal principles" },
  { key: "examSummary", label: "Exam-oriented summary" },
  { key: "pointsToRemember", label: "Important points to remember" },
  { key: "beginner", label: "Beginner-friendly explanation" },
  { key: "examOutline", label: "Exam answer outline" },
];

export const UNAVAILABLE = "Not available in the supplied document.";

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

const COURT_RE =
  /(SUPREME COURT OF INDIA|HIGH COURT OF [A-Z][A-Za-z ]+|SUPREME COURT|DISTRICT COURT[^\n,]*|FAMILY COURT[^\n,]*|TRIBUNAL[^\n,]*)/;

export interface ExtractedMetadata {
  caseName: string;
  court: string;
  date: string;
  citation: string;
  bench: string;
  statutes: string[];
  missingPagesHint: string[];
}

/** Best-effort deterministic metadata read directly from the document text. */
export function extractMetadata(text: string): ExtractedMetadata {
  const head = text.slice(0, 12_000);
  const lines = head.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let caseName = "";
  const vPattern = /([A-Z][A-Za-z.,&'()\-\s]{2,90}?)\s+(?:v\.?|vs\.?|versus)\s+([A-Z][A-Za-z.,&'()\-\s]{2,90}?)(?:\s{2,}|$|\n)/;
  for (const line of lines.slice(0, 40)) {
    const m = line.match(vPattern);
    if (m) {
      const partA = m[1].replace(/^(IN THE|BEFORE THE)\s+/i, "").trim();
      const partB = m[2].replace(/\s+(on|decided|judgment).*$/i, "").trim();
      caseName = `${partA} v. ${partB}`.replace(/\s{2,}/g, " ").slice(0, 180);
      break;
    }
  }

  const courtMatch = head.match(COURT_RE);
  const smallWords = new Set(["of", "the", "and", "for", "in", "at", "on"]);
  const court = courtMatch
    ? courtMatch[1]
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) =>
          index > 0 && smallWords.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join(" ")
        .trim()
    : "";

  const dateMatch =
    head.match(new RegExp(`(?:decided on|date of judgment|judgment dated)?\\s*(\\d{1,2})\\s+(${MONTHS})\\s*,?\\s*(\\d{4})`, "i")) ??
    head.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  let date = "";
  if (dateMatch) {
    date = dateMatch[0].replace(/^[^0-9]*/, "").trim();
  }

  const citationMatch =
    head.match(/\(\d{4}\)\s*\d+\s*SCC\s*\d+/) ??
    head.match(/AIR\s+\d{4}\s+SC\s+\d+/) ??
    head.match(/\d{4}\s+SCC\s+OnLine\s+[A-Za-z]+\s+\d+/) ??
    head.match(/\(\d{4}\)\s*\d+\s*SCR\s*\d+/);
  const citation = citationMatch ? citationMatch[0].replace(/\s+/g, " ").trim() : "";

  const benchMatch = head.match(/(?:BENCH|CORAM|JUDGES?)\s*[:\-]\s*([^\n]{3,160})/i);
  const bench = benchMatch ? benchMatch[1].trim() : "";

  const statuteSet = new Set<string>();
  const provisionRe =
    /\b(Article|Articles|Section|Sections|Sec\.|S\.)\s*([\dIVXLC]+[A-Za-z]?(?:\s*\(\d+\))?(?:\s*,\s*\d+[A-Za-z]?)?)(?:\s+(?:of|read with|r\/w)\s+(?:the\s+)?([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,5}\s+(?:Act|Code|Constitution)(?:,\s*\d{4})?))?/g;
  for (const m of head.matchAll(provisionRe)) {
    const label = `${m[1]} ${m[2]}${m[3] ? ` of the ${m[3]}` : ""}`.replace(/\s+/g, " ").trim();
    if (label.length < 90) statuteSet.add(label);
    if (statuteSet.size >= 10) break;
  }

  const actRe =
    /\b((?:The\s+)?[A-Z][A-Za-z]+(?:\s+(?:of\s+)?[A-Z][A-Za-z]+){0,6}\s+(?:Act|Code|Constitution|Rules|Regulations)(?:\s*,\s*\d{4})?)\b/g;
  for (const m of head.matchAll(actRe)) {
    const name = m[1].replace(/^The\s+/i, "").replace(/\s+/g, " ").trim();
    if (name.length >= 8 && name.length <= 90) statuteSet.add(name);
    if (statuteSet.size >= 12) break;
  }

  const missingPagesHint: string[] = [];
  if (/\b(continued|contd\.?|page \d+ of \d+)\b/i.test(text) && !/page 1 of/i.test(text)) {
    missingPagesHint.push("The document may start mid-way through a page.");
  }
  if (/\.\.\.|\[illegible\]|\[unclear\]/i.test(text)) {
    missingPagesHint.push("The extract contains gaps or illegible passages — check the source images.");
  }

  return { caseName, court, date, citation, bench, statutes: [...statuteSet], missingPagesHint };
}

const BRIEF_SYSTEM = `${FABRICATION_RULES}

You produce a structured study brief for a scanned Indian judgment or case note.
Return one JSON object only, with exactly these keys:
caseName, citation, court, date, bench, facts, proceduralHistory, issues, petitionerArguments,
respondentArguments, statutes, precedents, reasoning, decision, ratio, obiter, principles,
examSummary, pointsToRemember, thirtySecond, oneMinute, beginner, examOutline, missing,
confidence.

Rules:
- facts, proceduralHistory, petitionerArguments, respondentArguments, reasoning, decision: strings, 2-6 sentences each.
- issues, statutes, precedents, ratio, obiter, principles, pointsToRemember, examOutline, missing: arrays of short strings (0-8 items).
- thirtySecond: one or two sentences a student can read in 30 seconds.
- oneMinute: 70-110 words.
- beginner: explain in plain English for a first-year student, 60-120 words.
- examOutline: 4-8 ordered answer points for a 10-mark exam question.
- citation/court/date/bench: only if visible in the text; otherwise exactly "${UNAVAILABLE}".
- Put any field you could not support in "missing" (use the human field names).
- confidence: "high" only when the text is complete and clearly legible.
- Do not quote long passages. Paraphrase.`;

interface RawBrief {
  [key: string]: unknown;
}

function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  return "";
}

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => str(v)).filter(Boolean).slice(0, 10);
  if (typeof value === "string" && value.trim() && !value.includes(UNAVAILABLE)) {
    return value
      .split(/\n|;|•/)
      .map((s) => s.replace(/^[-\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}

function normalise(raw: RawBrief, text: string, generatedBy: CaseBrief["generatedBy"]): CaseBrief {
  const meta = extractMetadata(text);
  const pick = (key: string, fallback = UNAVAILABLE) => str(raw[key]) || fallback;
  const missingFromModel = arr(raw.missing);
  const brief: CaseBrief = {
    caseName: pick("caseName", meta.caseName || UNAVAILABLE),
    citation: pick("citation", meta.citation || UNAVAILABLE),
    court: pick("court", meta.court || UNAVAILABLE),
    date: pick("date", meta.date || UNAVAILABLE),
    bench: pick("bench", meta.bench || UNAVAILABLE),
    facts: pick("facts"),
    proceduralHistory: pick("proceduralHistory"),
    issues: arr(raw.issues),
    petitionerArguments: pick("petitionerArguments"),
    respondentArguments: pick("respondentArguments"),
    statutes: arr(raw.statutes).length ? arr(raw.statutes) : meta.statutes,
    precedents: arr(raw.precedents),
    reasoning: pick("reasoning"),
    decision: pick("decision"),
    ratio: arr(raw.ratio),
    obiter: arr(raw.obiter),
    principles: arr(raw.principles),
    examSummary: pick("examSummary"),
    pointsToRemember: arr(raw.pointsToRemember),
    thirtySecond: pick("thirtySecond"),
    oneMinute: pick("oneMinute"),
    beginner: pick("beginner"),
    examOutline: arr(raw.examOutline),
    missing: missingFromModel,
    confidence: raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low" ? raw.confidence : "low",
    generatedBy,
  };
  for (const section of BRIEF_SECTIONS) {
    const value = brief[section.key];
    if (typeof value === "string" && value === UNAVAILABLE && !brief.missing.includes(section.label)) {
      brief.missing.push(section.label);
    }
    if (Array.isArray(value) && value.length === 0 && !brief.missing.includes(section.label)) {
      brief.missing.push(section.label);
    }
  }
  return brief;
}

const ABBREVIATIONS = new Set([
  "v",
  "vs",
  "no",
  "co",
  "ltd",
  "pvt",
  "govt",
  "mr",
  "mrs",
  "ms",
  "dr",
  "hon",
  "art",
  "sec",
  "ss",
  "scc",
  "scr",
  "air",
  "sc",
  "hc",
  "j",
  "jj",
  "ed",
  "vol",
  "pp",
  "para",
  "cf",
  "eg",
  "ie",
]);

const HEADING_RE =
  /^(IN THE|BEFORE THE|CIVIL|CRIMINAL|WRIT|SPECIAL LEAVE|TRANSFER PETITION|APPEAL|JUDGMENT|ORDER|Decided on|Date of|Citation|Bench|Coram|Relevant provisions|Facts|Issues|Background|Held)\b/i;
const LABEL_RE =
  /^(Citation|Decided on|Date of|Bench|Coram|Relevant provisions|Facts|Issues|Held|IN THE|BEFORE THE|WRIT|CIVIL|CRIMINAL|APPEAL|JUDGMENT|ORDER)\b/i;

function isHeading(line: string): boolean {
  if (HEADING_RE.test(line)) return true;
  if (/[A-Z]{3,}/.test(line) && line === line.toUpperCase()) return true;
  return /\sv\.?\s/.test(line) && line.length < 120;
}

/**
 * Splits a judgment or note into sentences. PDF wrapping is rejoined while headings,
 * citations and labels stay separate, and "v.", "SCC." or initials never end a sentence.
 */
function splitSentences(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^---\s.*\s---$/.test(line) &&
        !/^page\s+\d+/i.test(line) &&
        !/^\d{1,4}$/.test(line),
    );

  const units: string[] = [];
  let buffer = "";
  for (const line of lines) {
    if (!buffer) {
      buffer = line;
      continue;
    }
    const prevClosed = /[.!?]["”')]*$/.test(buffer);
    const prevIsLabel = LABEL_RE.test(buffer);
    const wrapEnds = /[,;:–—-]$/.test(buffer);
    if (isHeading(line) || prevIsLabel || prevClosed || wrapEnds) {
      units.push(buffer);
      buffer = line;
    } else {
      buffer = `${buffer} ${line}`;
    }
  }
  if (buffer) units.push(buffer);

  const out: string[] = [];
  for (const unit of units) {
    let start = 0;
    const boundary = /[.!?](?=\s+["“(]?[A-Z])/g;
    let match: RegExpExecArray | null;
    while ((match = boundary.exec(unit))) {
      const end = match.index + 1;
      const candidate = unit.slice(start, end).trim();
      const lastWord = (candidate.match(/([A-Za-z.]+)\.$/)?.[1] ?? "").toLowerCase();
      if (lastWord && (lastWord.length <= 2 || ABBREVIATIONS.has(lastWord))) continue;
      out.push(candidate);
      start = end;
    }
    const tail = unit.slice(start).trim();
    if (tail) out.push(tail);
  }
  return [...new Set(out)].filter(
    (sentence) => sentence.length >= 45 && sentence.length <= 520,
  );
}

function rankSentences(sentences: string[], cues: RegExp[], limit: number): string[] {
  return sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: cues.reduce((total, cue) => total + (cue.test(sentence) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.sentence);
}

function clipping(value: string, max = 320) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Pulls the proposition after "held ... that" so the ratio is a holding, not the whole paragraph. */
function holdingClause(sentence: string): string {
  const clause = sentence.match(/\bheld\b[^.]{0,60}?\bthat\b\s+([^.]{20,400})/i)?.[1];
  return clipping(clause ?? sentence, 320);
}

/**
 * Deterministic brief used when no model is configured or the model call fails.
 * It only copies sentences that are present in the document; it never infers facts or holdings.
 */
export function localBrief(text: string, errorNote?: string): CaseBrief {
  const meta = extractMetadata(text);
  const sentences = splitSentences(text);
  const pick = (cues: RegExp[], limit = 2) => rankSentences(sentences, cues, limit);

  const factSentences = pick(
    [/\b(challenged|filed|sought|aggrieved|alleged|arose|facts?\b|petition(?:er)?\s+(?:filed|challenged))\b/i],
    2,
  );
  const issueSentences = pick(
    [/\b(whether|legal issue|question (?:of law|for determination)|the issue (?:is|was))\b/i],
    3,
  );
  const argumentSentences = pick([/\b(argued|contended|submitted|urged|averred)\b/i], 3);
  const reasonSentences = pick(
    [/\b(observed|noted|reasoned|because|in the view of|the court (?:said|explained))\b/i],
    2,
  );
  const decisionSentences = pick(
    [/\b(held|dismissed|allowed|quashed|set aside|overruled|upheld|declared|directed|answered? (?:in|the))\b/i],
    2,
  );
  const proceduralSentences = pick(
    [/\b(appeal|revision|impugned|high court|trial court|acquitted|convicted|writ petition)\b/i],
    2,
  );

  const facts = factSentences.length ? clipping(factSentences.join(" "), 700) : UNAVAILABLE;
  const decision = decisionSentences.length
    ? clipping(decisionSentences.join(" "), 700)
    : UNAVAILABLE;
  const reasoningSentence =
    reasonSentences.find((sentence) => !decisionSentences.includes(sentence)) ?? "";
  const reasoning = reasoningSentence ? clipping(reasoningSentence, 500) : UNAVAILABLE;
  const proceduralHistory = proceduralSentences.length
    ? clipping(proceduralSentences.join(" "), 600)
    : UNAVAILABLE;

  const ratioSentence =
    decisionSentences.find((sentence) => /\bheld\b[^.]{0,60}?\bthat\b/i.test(sentence)) ??
    decisionSentences.find((sentence) => /\b(cannot|must not|is not open|basic structure)\b/i.test(sentence));
  const ratio = ratioSentence ? [holdingClause(ratioSentence)] : [];
  const principles = ratio.length ? [...ratio] : [];

  const petitionerArguments = argumentSentences
    .filter((sentence) => /\b(petitioner|appellant|writ petitioner)\b/i.test(sentence))
    .slice(0, 2)
    .join(" ");
  const respondentArguments = argumentSentences
    .filter((sentence) => /\b(respondent|state|union)\b/i.test(sentence))
    .slice(0, 2)
    .join(" ");

  const examSummary =
    facts !== UNAVAILABLE || decision !== UNAVAILABLE
      ? clipping(
          [
            facts !== UNAVAILABLE ? `The document records these facts: ${facts}` : "",
            decision !== UNAVAILABLE ? `It records the holding: ${decision}` : "",
            ratio[0] ? `Ratio as stated: ${ratio[0]}` : "",
          ]
            .filter(Boolean)
            .join(" "),
          1000,
        )
      : UNAVAILABLE;

  const thirtySecond =
    decision !== UNAVAILABLE
      ? clipping(
          [meta.caseName || "This case", meta.citation, decision].filter(Boolean).join(" — "),
          420,
        )
      : UNAVAILABLE;
  const oneMinute =
    facts !== UNAVAILABLE || decision !== UNAVAILABLE
      ? clipping(
          [
            facts !== UNAVAILABLE ? `Facts: ${facts}` : "",
            decision !== UNAVAILABLE ? `Held: ${decision}` : "",
            reasoning !== UNAVAILABLE ? `Reasoning noted: ${reasoning}` : "",
          ]
            .filter(Boolean)
            .join(" "),
          900,
        )
      : UNAVAILABLE;

  const pointsToRemember = [...new Set([...meta.statutes, decision])]
    .filter((item) => item && item !== UNAVAILABLE)
    .slice(0, 5)
    .map((item) => clipping(item, 260));

  const examOutline = [
    issueSentences[0] ? `Issue: ${clipping(issueSentences[0], 240)}` : "",
    facts !== UNAVAILABLE ? `Material facts: ${clipping(facts, 240)}` : "",
    meta.statutes.length ? `Provisions: ${meta.statutes.slice(0, 4).join("; ")}` : "",
    ratio[0]
      ? `Ratio: ${clipping(ratio[0], 240)}`
      : decision !== UNAVAILABLE
        ? `Holding: ${clipping(decision, 240)}`
        : "",
  ].filter(Boolean);

  const brief: CaseBrief = {
    caseName: meta.caseName || UNAVAILABLE,
    citation: meta.citation || UNAVAILABLE,
    court: meta.court || UNAVAILABLE,
    date: meta.date || UNAVAILABLE,
    bench: meta.bench || UNAVAILABLE,
    facts,
    proceduralHistory,
    issues: issueSentences.map((sentence) => clipping(sentence, 260)).slice(0, 3),
    petitionerArguments: petitionerArguments ? clipping(petitionerArguments, 500) : UNAVAILABLE,
    respondentArguments: respondentArguments ? clipping(respondentArguments, 500) : UNAVAILABLE,
    statutes: meta.statutes,
    precedents: [],
    reasoning,
    decision,
    ratio,
    obiter: [],
    principles,
    examSummary,
    pointsToRemember,
    thirtySecond,
    oneMinute,
    beginner: UNAVAILABLE,
    examOutline,
    missing: [],
    confidence: "low",
    generatedBy: "local",
  };
  for (const section of BRIEF_SECTIONS) {
    const value = brief[section.key];
    if (
      (typeof value === "string" && value === UNAVAILABLE) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      brief.missing.push(section.label);
    }
  }
  if (meta.missingPagesHint.length) brief.missing.push(...meta.missingPagesHint);
  if (errorNote) brief.missing.push(`AI provider error: ${errorNote}`);
  return brief;
}

export async function generateBrief(text: string): Promise<{ brief: CaseBrief; warning?: string }> {
  const trimmed = text.trim();
  if (trimmed.length < 80) {
    return {
      brief: localBrief(trimmed),
      warning: "There is not enough text to analyse yet. Add the document text or retry OCR.",
    };
  }
  if (!aiConfigured()) return { brief: localBrief(trimmed) };
  const clipped = trimmed.slice(0, 60_000);
  try {
    const raw = await aiJson<RawBrief>(
      BRIEF_SYSTEM,
      `Source document${trimmed.length > clipped.length ? " (truncated for length)" : ""}:\n"""\n${clipped}\n"""`,
      { model: aiConfig.briefModel, maxTokens: 4000 },
    );
    const brief = normalise(raw, clipped, "ai");
    const warning =
      trimmed.length > clipped.length
        ? "The document was longer than the model window, so the brief is based on the first portion. Verify the remaining pages."
        : undefined;
    return { brief, warning };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    return {
      brief: localBrief(trimmed, message),
      warning:
        "The AI provider could not be reached, so this brief only contains metadata read directly from the document. Nothing has been inferred.",
    };
  }
}

/** Redact obviously fabricated-looking content? We instead flag unverified citations in the UI. */
export function citationLooksUnverified(citation: string) {
  return /^Not available/i.test(citation) || citation.trim().length === 0;
}
