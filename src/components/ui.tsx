import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { VERIFICATION_LABEL, cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-[1.75rem] leading-[1.15] sm:text-[2.1rem]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg leading-tight">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "book",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold-soft text-gold">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="text-base">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const VERIFICATION_STYLE: Record<string, string> = {
  "official-source": "chip-success",
  "limited-verification": "chip-gold",
  unverified: "chip-danger",
  "ai-generated": "chip",
};

export function VerificationBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("chip", VERIFICATION_STYLE[value] ?? "chip", className)} title="Verification status">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {VERIFICATION_LABEL[value] ?? value}
    </span>
  );
}

export function DocTypeBadge({ doc }: { doc: Pick<DocumentRecord, "kind" | "docType"> }) {
  const label =
    doc.docType ??
    (doc.kind === "judgment" ? "Judgment" : doc.kind === "brief" ? "Case brief" : doc.kind);
  return <span className="chip">{label}</span>;
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-[11px] text-muted">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        {icon ? <Icon name={icon} size={15} className="text-gold" /> : null}
      </div>
      <p className="stat-value mt-2">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
