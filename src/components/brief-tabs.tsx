"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { MarkdownLite } from "./markdown";
import type { BriefMode } from "@/lib/modes";

export function BriefTabs({
  modes,
  sections,
}: {
  modes: BriefMode[];
  sections: Array<{ label: string; value: string | string[] }>;
}) {
  const [active, setActive] = useState<string>("thirty");
  const current = modes.find((mode) => mode.id === active) ?? modes[0];

  return (
    <section className="card overflow-hidden" aria-label="Case summary modes">
      <div className="border-b border-line bg-surface-2 px-3 pt-3">
        <div role="tablist" aria-label="Summary length" className="flex gap-1 overflow-x-auto pb-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              id={`tab-${mode.id}`}
              aria-selected={active === mode.id}
              aria-controls={`panel-${mode.id}`}
              tabIndex={active === mode.id ? 0 : -1}
              onClick={() => setActive(mode.id)}
              onKeyDown={(event) => {
                const index = modes.findIndex((m) => m.id === active);
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  const next = modes[(index + 1) % modes.length];
                  setActive(next.id);
                  document.getElementById(`tab-${next.id}`)?.focus();
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next = modes[(index - 1 + modes.length) % modes.length];
                  setActive(next.id);
                  document.getElementById(`tab-${next.id}`)?.focus();
                }
              }}
              className={`shrink-0 rounded-lg px-3 py-2 text-[11.5px] font-medium transition-colors ${
                active === mode.id
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:bg-surface/60 hover:text-ink"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="p-5 sm:p-6"
      >
        <p className="eyebrow mb-3">{current.hint}</p>
        {current.id === "detailed" ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.label}>
                <h3 className="mb-1 font-display text-[1.02rem]">{section.label}</h3>
                {Array.isArray(section.value) ? (
                  section.value.length ? (
                    <ul className="space-y-1.5">
                      {section.value.map((item, index) => (
                        <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] italic text-muted">Not available in the supplied document.</p>
                  )
                ) : (
                  <p className="text-[13px] leading-relaxed text-ink-soft">{section.value}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <MarkdownLite text={current.body} className="legal-prose" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2 px-4 py-2.5 text-[10px] text-muted">
        <span>
          <Icon name="clock" size={10} className="mr-1 inline" />
          {current.hint}
        </span>
        <span>{current.id === "detailed" ? "Full structure" : current.label}</span>
      </div>
    </section>
  );
}
