import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./password";
import { SEED_CASES } from "./seed-cases";
import { SEED_NOTES, SEED_STATUTES, type SeedDocument } from "./seed-statutes";

const DOC_INSERT = `INSERT INTO documents
  (id, owner_id, kind, title, subtitle, citation, court, year, subject, jurisdiction, doc_type,
   source_url, official_text, explanation, brief, meta, verification, created_at)
  VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const DAY = 86_400_000;

function insertDocuments(db: DatabaseSync) {
  const stmt = db.prepare(DOC_INSERT);
  const docs: SeedDocument[] = [...SEED_STATUTES, ...SEED_CASES, ...SEED_NOTES];
  for (const doc of docs) {
    stmt.run(
      doc.id,
      doc.kind,
      doc.title,
      doc.subtitle ?? null,
      doc.citation ?? null,
      doc.court ?? null,
      doc.year ?? null,
      doc.subject ?? null,
      "India",
      doc.docType ?? null,
      doc.sourceUrl ?? null,
      doc.officialText ?? null,
      doc.explanation ?? null,
      doc.brief ? JSON.stringify(doc.brief) : null,
      JSON.stringify(doc.meta ?? {}),
      doc.verification,
      new Date().toISOString(),
    );
  }
}

function seedDemoAccount(db: DatabaseSync) {
  const userId = "demo-user";
  const now = new Date();
  const iso = (offsetDays: number, hour = 19) => {
    const d = new Date(now.getTime() + offsetDays * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(userId, "demo@vidhi.app", hashPassword("demo1234"), "Aarav Mehta", iso(-42));

  db.prepare(
    `INSERT INTO profiles (user_id, course, year_label, subjects, goal, daily_minutes, onboarded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    "BA LLB",
    "3rd year · Semester 5",
    JSON.stringify(["Constitutional Law", "Criminal Law", "Contract Law", "Family Law"]),
    "Judiciary preparation",
    60,
    iso(-41),
  );

  db.prepare("INSERT INTO bookmarks (user_id, document_id, created_at) VALUES (?, ?, ?)").run(
    userId,
    "const-art-21",
    iso(-3),
  );
  db.prepare("INSERT INTO bookmarks (user_id, document_id, created_at) VALUES (?, ?, ?)").run(
    userId,
    "case-vishaka",
    iso(-2),
  );

  db.prepare(
    "INSERT INTO notes (id, user_id, document_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    "demo-note-1",
    userId,
    "const-art-14",
    "Exam structure for Article 14: (1) text; (2) two limbs — equality before law vs equal protection; (3) reasonable classification test; (4) arbitrariness — Maneka, Royappa; (5) apply to facts. Remember the new test in Navtej for indirect discrimination.",
    iso(-4),
    iso(-4),
  );

  const cards = [
    ["What are the two limbs of Article 14?", "Equality before the law (negative, no privileges) and equal protection of the laws (positive, like treated alike).", "const-art-14", "Article 14 — Equality before law"],
    ["State the ratio of Kesavananda Bharati.", "Parliament's amending power under Article 368 is wide but cannot damage or destroy the basic structure of the Constitution.", "case-kesavananda", "Kesavananda Bharati v. State of Kerala"],
    ["What are the Vishaka Guidelines?", "Binding workplace sexual harassment norms framed under Article 32 using CEDAW: definition, prevention, complaints committee, disciplinary action, protection from retaliation.", "case-vishaka", "Vishaka v. State of Rajasthan"],
    ["Which section defines theft, and what are its ingredients?", "Section 378 IPC: dishonest intention, movable property, possession of another, absence of consent, and moving the property.", "ipc-s378", "Section 378 — Theft"],
    ["When is a contract void under section 56?", "When the act is impossible in itself, or becomes impossible or unlawful after formation without the promisor's fault.", "contract-s56", "Section 56 — Agreement to do impossible act"],
    ["What did Shah Bano decide about maintenance?", "Section 125 CrPC applies to all citizens regardless of religion; a divorced wife unable to maintain herself can claim beyond the iddat period, and mahr is not a substitute.", "case-shah-bano", "Mohd. Ahmed Khan v. Shah Bano Begum"],
  ] as const;

  const cardStmt = db.prepare(
    `INSERT INTO flashcards (id, user_id, document_id, front, back, source, ease, interval_days, due_at, reps, lapses, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  cards.forEach(([front, back, docId, sourceTitle], index) => {
    cardStmt.run(
      `demo-card-${index + 1}`,
      userId,
      docId,
      front,
      back,
      sourceTitle,
      2.5,
      index < 3 ? 0 : 2,
      index < 3 ? now.toISOString() : iso(index + 1, 9),
      index < 3 ? 1 : 2,
      0,
      iso(-10 + index),
    );
  });

  const deadlines = [
    ["Constitutional Law II — internal assessment", "Constitutional Law", iso(3, 10), "Basic structure and amendment — units 3 and 4."],
    ["Criminal Procedure moot memorial", "Criminal Procedure", iso(8, 17), "Team B; cite Lalita Kumari and Arnesh Kumar."],
    ["Contract Law viva", "Contract Law", iso(14, 11), "Sections 10, 23, 56 and 73."],
  ] as const;
  const deadlineStmt = db.prepare(
    "INSERT INTO deadlines (id, user_id, title, subject, due_at, notes, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
  );
  deadlines.forEach(([title, subject, dueAt, notes], i) => {
    deadlineStmt.run(`demo-deadline-${i + 1}`, userId, title, subject, dueAt, notes, iso(-6));
  });

  const activityStmt = db.prepare(
    "INSERT INTO activities (id, user_id, kind, label, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const activities: Array<[string, string, string | null, number]> = [
    ["view", "Read Article 21 — Life and personal liberty", "const-art-21", 0],
    ["flashcards", "Reviewed 12 flashcards", null, 0],
    ["brief", "Studied Vishaka v. State of Rajasthan", "case-vishaka", -1],
    ["view", "Read Section 300 — Murder", "ipc-s300", -1],
    ["quiz", "Scored 4/6 in a Constitutional Law quiz", null, -2],
    ["brief", "Studied Kesavananda Bharati v. State of Kerala", "case-kesavananda", -2],
    ["tutor", "Asked the tutor about the basic structure doctrine", null, -3],
    ["view", "Read Article 14 — Equality before law", "const-art-14", -4],
    ["note", "Saved a note on Article 14", "const-art-14", -5],
    ["view", "Read Navtej Singh Johar v. Union of India", "case-navtej", -6],
  ];
  activities.forEach(([kind, label, refId, offset], i) => {
    activityStmt.run(`demo-activity-${i + 1}`, userId, kind, label, refId, iso(offset, 18 - (i % 5)));
  });

  const convoId = "demo-conversation-1";
  db.prepare(
    "INSERT INTO conversations (id, user_id, title, document_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)",
  ).run(convoId, userId, "Basic structure and Article 368", iso(-3), iso(-3));

  const msgStmt = db.prepare(
    "INSERT INTO messages (id, conversation_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  msgStmt.run(
    "demo-msg-1",
    convoId,
    "user",
    "Can Parliament amend fundamental rights?",
    "[]",
    iso(-3, 18),
  );
  msgStmt.run(
    "demo-msg-2",
    convoId,
    "assistant",
    "**Yes — but only within the basic structure.**\n\nArticle 368 gives Parliament the power to amend any provision, including Part III. Kesavananda Bharati (1973) read an implied limitation into that power: the amendment cannot damage or destroy the Constitution's basic structure. The Court upheld the Twenty-fourth Amendment's procedural changes but rejected the claim of unlimited amending power.\n\nMinerva Mills (1980) applied the doctrine to strike down Article 368(4) and (5), holding that judicial review is itself a basic feature. So the practical sequence for an exam answer is: text of Article 368 → Kesavananda → application (Minerva Mills) → conclusion.\n\n*Study check:* Which two clauses of Article 368 were invalidated in Minerva Mills, and why?\n\n*This is educational material, not legal advice. Verify the holdings in the reporter.*",
    JSON.stringify([
      {
        documentId: "case-kesavananda",
        title: "Kesavananda Bharati v. State of Kerala",
        snippet: "The amending power is wide but cannot destroy the basic structure.",
        sourceUrl: "https://main.sci.gov.in/",
        verification: "unverified",
      },
    ]),
    iso(-3, 18),
  );
}

export function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as n FROM documents").get() as { n: number };
  if (row.n > 0) return;
  insertDocuments(db);
  seedDemoAccount(db);
}
