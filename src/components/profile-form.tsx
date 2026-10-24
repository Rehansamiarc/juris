"use client";

import { useActionState, useState } from "react";
import { saveProfileAction, type ProfileState } from "@/app/actions/profile";
import { COURSE_OPTIONS, GOAL_OPTIONS, SUBJECT_OPTIONS, YEAR_OPTIONS } from "@/lib/options";
import type { ProfileRecord } from "@/lib/types";
import { Icon } from "./icons";

export function ProfileForm({ profile, name }: { profile: ProfileRecord; name: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, {} as ProfileState);
  const [subjects, setSubjects] = useState<string[]>(profile.subjects);
  const [minutes, setMinutes] = useState(profile.dailyMinutes);

  function toggle(subject: string) {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject].slice(0, 8),
    );
  }

  return (
    <form action={action} className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Study preferences</h2>
          <p className="text-[11.5px] text-muted">These shape the dashboard, plan and recommendations.</p>
        </div>
        <Icon name="profile" size={17} className="text-gold" />
      </div>

      {state.error ? (
        <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5 text-[12px] text-danger">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="mb-3 rounded-xl border border-success/30 bg-success/5 px-3 py-2.5 text-[12px] text-success">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="label">
            Full name
          </label>
          <input id="profile-name" name="name" defaultValue={name} className="input" maxLength={80} required />
        </div>
        <div>
          <label htmlFor="profile-course" className="label">
            Course
          </label>
          <select id="profile-course" name="course" defaultValue={profile.course} className="select">
            {COURSE_OPTIONS.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile-year" className="label">
            Year / semester
          </label>
          <select id="profile-year" name="yearLabel" defaultValue={profile.yearLabel} className="select">
            {[...new Set([profile.yearLabel, ...YEAR_OPTIONS])].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile-goal" className="label">
            Study goal
          </label>
          <select id="profile-goal" name="goal" defaultValue={profile.goal} className="select">
            {[...new Set([profile.goal, ...GOAL_OPTIONS])].map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="label">Subjects of interest</legend>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_OPTIONS.map((subject) => {
            const selected = subjects.includes(subject);
            return (
              <label
                key={subject}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
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
                  onChange={() => toggle(subject)}
                  className="sr-only"
                />
                {subject}
              </label>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-muted">{subjects.length} of 8 selected</p>
      </fieldset>

      <div className="mt-5 max-w-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor="profile-minutes" className="label mb-0">
            Daily study time
          </label>
          <span className="font-display text-lg">{minutes} min</span>
        </div>
        <input
          id="profile-minutes"
          name="dailyMinutes"
          type="range"
          min={15}
          max={180}
          step={15}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full accent-[var(--gold)]"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
