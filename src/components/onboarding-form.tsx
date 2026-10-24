"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction, type AuthState } from "@/app/actions/auth";
import { Icon } from "./icons";

const COURSES = [
  ["LLB", "3-year law degree", "For graduates entering law."],
  ["BA LLB", "5-year integrated", "Arts and law, integrated."],
  ["BBA LLB", "5-year integrated", "Business and law, integrated."],
  ["Judiciary preparation", "Judicial services", "Prelims, mains and interview."],
  ["Other", "Something else", "LLM, diploma or self-study."],
] as const;

const SUBJECTS = [
  "Constitutional Law",
  "Criminal Law",
  "Criminal Procedure",
  "Civil Procedure",
  "Contract Law",
  "Law of Torts",
  "Family Law",
  "Law of Evidence",
  "Property Law",
  "Company Law",
  "Administrative Law",
  "International Law",
  "Labour Law",
  "Taxation",
  "Jurisprudence",
  "Environmental Law",
  "Human Rights",
  "Arbitration",
];

const YEARS = [
  "1st year · Semester 1",
  "1st year · Semester 2",
  "2nd year · Semester 3",
  "2nd year · Semester 4",
  "3rd year · Semester 5",
  "3rd year · Semester 6",
  "4th year · Semester 7",
  "4th year · Semester 8",
  "5th year · Semester 9",
  "5th year · Semester 10",
  "Judiciary — prelims",
  "Judiciary — mains",
  "Judiciary — interview",
];

const GOALS = [
  "Score well in semester exams",
  "Prepare for judiciary services",
  "Build strong conceptual foundations",
  "Improve recall and revision",
  "Prepare for moot court and arguments",
];

const STEPS = ["Course", "Subjects", "Rhythm"];

export function OnboardingForm({
  userId,
  name,
  initialSubjects,
  initialCourse,
  initialYear,
}: {
  userId: string;
  name: string;
  initialSubjects?: string[];
  initialCourse?: string;
  initialYear?: string;
}) {
  const [state, action, pending] = useActionState(completeOnboardingAction, {} as AuthState);
  const [step, setStep] = useState(0);
  const [course, setCourse] = useState(initialCourse ?? "");
  const [subjects, setSubjects] = useState<string[]>(initialSubjects ?? []);
  const [minutes, setMinutes] = useState(45);
  const [goal, setGoal] = useState(initialCourse === "Judiciary preparation" ? GOALS[1] : GOALS[0]);

  function toggleSubject(subject: string) {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject].slice(0, 8),
    );
  }

  const canContinue = step === 0 ? Boolean(course) : step === 1 ? subjects.length > 0 : Boolean(goal);

  return (
    <form action={action} className="card overflow-hidden">
      <input type="hidden" name="userId" value={userId} />

      <div className="border-b border-line bg-surface-2 px-5 py-4 sm:px-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            Step {step + 1} of 3 · <span className="text-muted">{STEPS[step]}</span>
          </p>
          <p className="text-[11px] text-muted">{name}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((label, i) => (
            <div key={label} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-deep">
              <div
                className={`h-full rounded-full bg-gold transition-all duration-300 ${i <= step ? "w-full" : "w-0"}`}
              />
            </div>
          ))}
        </div>
      </div>

      {state.error ? (
        <div role="alert" className="mx-5 mt-5 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 text-[13px] text-danger sm:mx-7">
          {state.error}
        </div>
      ) : null}

      {/* Step 1 */}
      <div hidden={step !== 0} className="p-5 sm:p-7">
        <fieldset>
          <legend className="mb-1 font-display text-xl">Which course are you pursuing?</legend>
          <p className="mb-4 text-sm text-muted">This shapes the subjects we suggest and your revision plan.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {COURSES.map(([value, label, body]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  course === value ? "border-gold bg-gold-soft/40" : "border-line hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="course"
                  value={value}
                  checked={course === value}
                  onChange={() => setCourse(value)}
                  className="mt-1 accent-[var(--gold)]"
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-[11.5px] text-muted">{body}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 max-w-sm">
          <label htmlFor="yearLabel" className="label">
            Year or semester
          </label>
          <select id="yearLabel" name="yearLabel" defaultValue={initialYear ?? YEARS[4]} className="select">
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2 */}
      <div hidden={step !== 1} className="p-5 sm:p-7">
        <h2 className="font-display text-xl">What are you studying this term?</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Choose up to eight. We use these for your dashboard, library filters and revision plan.
        </p>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => {
            const selected = subjects.includes(subject);
            return (
              <label
                key={subject}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-[12.5px] transition-colors ${
                  selected
                    ? "border-gold bg-gold-soft font-medium text-gold"
                    : "border-line text-ink-soft hover:border-line-strong"
                }`}
              >
                <input
                  type="checkbox"
                  name="subjects"
                  value={subject}
                  checked={selected}
                  onChange={() => toggleSubject(subject)}
                  className="sr-only"
                />
                {subject}
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted">{subjects.length} of 8 selected</p>
      </div>

      {/* Step 3 */}
      <div hidden={step !== 2} className="p-5 sm:p-7">
        <h2 className="font-display text-xl">What are you working towards?</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Pick one goal and how much time you can realistically give each day.</p>
        <fieldset className="space-y-2">
          <legend className="sr-only">Study goal</legend>
          {GOALS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                goal === option ? "border-gold bg-gold-soft/40" : "border-line hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="goal"
                value={option}
                checked={goal === option}
                onChange={() => setGoal(option)}
                className="accent-[var(--gold)]"
              />
              {option}
            </label>
          ))}
        </fieldset>

        <div className="mt-6">
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor="dailyMinutes" className="label mb-0">
              Daily study time
            </label>
            <span className="font-display text-xl">{minutes} min</span>
          </div>
          <input
            id="dailyMinutes"
            name="dailyMinutes"
            type="range"
            min={15}
            max={180}
            step={15}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full accent-[var(--gold)]"
          />
          <div className="mt-1 flex justify-between text-[10.5px] text-muted">
            <span>15 min</span>
            <span>3 hours</span>
          </div>
          <p className="mt-3 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
            We will propose a daily plan that fits this window: a short reading, a revision block, and a
            practice set when you have time.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-5 py-4 sm:px-7">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStep((s) => Math.min(2, s + 1))}
            disabled={!canContinue}
          >
            Continue <Icon name="arrow" size={15} />
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending || !canContinue}>
            {pending ? "Setting up…" : "Enter your workspace"} <Icon name="arrow" size={15} />
          </button>
        )}
      </div>
    </form>
  );
}
