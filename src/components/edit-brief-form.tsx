"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteCaseAction, saveCaseBriefAction, type CaseActionState } from "@/app/actions/cases";
import { Icon } from "./icons";
import type { CaseBrief } from "@/lib/types";

type Field = {
  name: keyof CaseBrief;
  label: string;
  type: "text" | "textarea" | "list";
  hint?: string;
  rows?: number;
};

const GROUPS: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: "Identity",
    description: "Only what the document or reporter actually shows. Leave blank if unknown.",
    fields: [
      { name: "caseName", label: "Case name", type: "text" },
      { name: "citation", label: "Citation", type: "text" },
      { name: "court", label: "Court", type: "text" },
      { name: "date", label: "Date decided", type: "text" },
      { name: "bench", label: "Bench", type: "text" },
    ],
  },
  {
    title: "Facts and proceedings",
    description: "Keep to material facts. Note what is missing rather than filling it in.",
    fields: [
      { name: "facts", label: "Facts of the case", type: "textarea", rows: 5 },
      { name: "proceduralHistory", label: "Procedural history", type: "textarea", rows: 3 },
      { name: "petitionerArguments", label: "Petitioner / appellant arguments", type: "textarea", rows: 3 },
      { name: "respondentArguments", label: "Respondent arguments", type: "textarea", rows: 3 },
    ],
  },
  {
    title: "Issues and law",
    description: "One item per line for lists.",
    fields: [
      { name: "issues", label: "Legal issues (one per line)", type: "list", rows: 3 },
      { name: "statutes", label: "Applicable statutes (one per line)", type: "list", rows: 3 },
      { name: "precedents", label: "Precedents (one per line)", type: "list", rows: 3 },
      { name: "reasoning", label: "Court’s reasoning", type: "textarea", rows: 5 },
    ],
  },
  {
    title: "Holding",
    description: "The decision, the rule necessary to it, and what the court said in passing.",
    fields: [
      { name: "decision", label: "Final judgment and decision", type: "textarea", rows: 4 },
      { name: "ratio", label: "Ratio decidendi (one per line)", type: "list", rows: 3 },
      { name: "obiter", label: "Obiter dicta (one per line)", type: "list", rows: 2 },
      { name: "principles", label: "Key legal principles (one per line)", type: "list", rows: 3 },
    ],
  },
  {
    title: "Study material",
    description: "These feed your flashcards, mnemonics and audio recap.",
    fields: [
      { name: "examSummary", label: "Exam-oriented summary", type: "textarea", rows: 4 },
      { name: "pointsToRemember", label: "Points to remember (one per line)", type: "list", rows: 3 },
      { name: "thirtySecond", label: "30-second summary", type: "textarea", rows: 2 },
      { name: "oneMinute", label: "One-minute revision", type: "textarea", rows: 4 },
      { name: "beginner", label: "Beginner-friendly explanation", type: "textarea", rows: 4 },
      { name: "examOutline", label: "Exam answer outline (one per line)", type: "list", rows: 5 },
    ],
  },
];

function initialValue(brief: CaseBrief, name: keyof CaseBrief) {
  const value = brief[name];
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string" && /^Not available/i.test(value)) return "";
  return typeof value === "string" ? value : "";
}

export function EditBriefForm({ documentId, brief }: { documentId: string; brief: CaseBrief }) {
  const [state, action, pending] = useActionState(saveCaseBriefAction, {} as CaseActionState);

  return (
    <form action={action}>
      <input type="hidden" name="documentId" value={documentId} />
      {state.error ? (
        <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 text-[12.5px] text-danger">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-5">
        {GROUPS.map((group) => (
          <section key={group.title} className="card p-5">
            <div className="mb-4">
              <h2 className="font-display text-lg">{group.title}</h2>
              <p className="text-[11.5px] text-muted">{group.description}</p>
            </div>
            <div className="grid gap-4">
              {group.fields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={`field-${field.name}`} className="label">
                    {field.label}
                  </label>
                  {field.type === "textarea" || field.type === "list" ? (
                    <textarea
                      id={`field-${field.name}`}
                      name={field.name}
                      defaultValue={initialValue(brief, field.name)}
                      rows={field.rows ?? 3}
                      className="textarea resize-y text-[12.5px]"
                    />
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      name={field.name}
                      defaultValue={initialValue(brief, field.name)}
                      className="input"
                    />
                  )}
                </div>
              ))}
              {group.title === "Identity" ? (
                <div className="max-w-sm">
                  <label htmlFor="field-confidence" className="label">
                    Confidence in this brief
                  </label>
                  <select id="field-confidence" name="confidence" defaultValue={brief.confidence} className="select">
                    <option value="high">High — complete, clearly legible text</option>
                    <option value="medium">Medium — some details need checking</option>
                    <option value="low">Low — partial or uncertain source</option>
                  </select>
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-20 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur-lg lg:bottom-4">
        <p className="px-1 text-[10.5px] leading-relaxed text-muted">
          Empty fields will be marked “not available” and listed under gaps.
        </p>
        <div className="flex gap-2">
          <Link href={`/cases/${documentId}`} className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save brief"} <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}

export function DeleteCaseForm({ documentId, title }: { documentId: string; title: string }) {
  return (
    <form
      action={deleteCaseAction.bind(null, documentId)}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${title}”? This removes the brief and its extracted text.`)) {
          event.preventDefault();
        }
      }}
      className="mt-4 border-t border-line pt-4"
    >
      <button type="submit" className="btn btn-ghost h-8 px-2 text-[11px] text-muted hover:text-danger">
        <Icon name="trash" size={13} /> Delete this case
      </button>
    </form>
  );
}
