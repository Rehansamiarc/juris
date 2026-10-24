import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { DeadlineManager } from "@/components/deadline-manager";
import { Icon } from "@/components/icons";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader, Stat } from "@/components/ui";
import { aiStatus } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import {
  countDocuments,
  countUserCards,
  listDeadlines,
  listQuizzes,
  studyStreak,
} from "@/lib/db";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireSession();
  const deadlines = listDeadlines(user.id);
  const streak = studyStreak(user.id);
  const documents = countDocuments(user.id);
  const cards = countUserCards(user.id);
  const quizzes = listQuizzes(user.id).length;
  const ai = aiStatus();

  if (!profile) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Your workspace"
        title={`${user.name.split(" ")[0]}’s study profile`}
        description={`${profile.course} · ${profile.yearLabel}. Your preferences drive the daily plan, recommended reading and revision load.`}
        actions={
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary">
              <Icon name="logout" size={14} /> Sign out
            </button>
          </form>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <ProfileForm profile={profile} name={user.name} />
          <DeadlineManager initial={deadlines} subjects={profile.subjects} />
        </div>

        <aside className="space-y-4">
          <section className="card p-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-xl text-[#f7f1e4] dark:bg-gold-soft dark:text-gold-bright">
              {initials(user.name)}
            </span>
            <h2 className="mt-3 font-display text-lg">{user.name}</h2>
            <p className="text-[11.5px] text-muted">{user.email}</p>
            <p className="mt-1 text-[10.5px] text-muted">
              Member since {formatDate(user.createdAt)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-surface-2 px-2 py-2">
                <p className="font-display text-xl">{streak}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">day streak</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 px-2 py-2">
                <p className="font-display text-xl">{cards}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">flashcards</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 px-2 py-2">
                <p className="font-display text-xl">{documents}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">sources</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 px-2 py-2">
                <p className="font-display text-xl">{quizzes}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">practice sets</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <ThemeToggle />
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">AI provider</h2>
              <span className={`chip ${ai.configured ? "chip-success" : "chip-gold"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {ai.configured ? "Configured" : "Not configured"}
              </span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-muted">
              {ai.configured
                ? `Case briefs and tutor answers use ${ai.model}; page images use ${ai.visionModel}.`
                : "Without a provider, Juris still parses text-based PDFs, extracts metadata and runs the library, revision and practice tools. Photos need a vision model."}
            </p>
            <dl className="mt-2 space-y-1 text-[10px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Chat model</dt>
                <dd className="truncate">{ai.model}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Vision model</dt>
                <dd className="truncate">{ai.visionModel}</dd>
              </div>
            </dl>
            {!ai.configured ? (
              <p className="mt-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[10px] leading-relaxed text-muted">
                Set <code>AI_API_KEY</code> and <code>AI_API_URL</code> in your environment. Any
                OpenAI-compatible endpoint works.
              </p>
            ) : null}
          </section>

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
              <Icon name="book" size={14} className="text-gold" /> Data and privacy
            </h2>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-muted">
              <li>• Your account, notes, uploads and cards live in this workspace’s SQLite database.</li>
              <li>• Pages you scan stay in your own upload folder and are served only to your session.</li>
              <li>• When an AI provider is configured, page images and prompts are sent to it for processing.</li>
              <li>• Juris does not provide legal advice or publish your material.</li>
            </ul>
          </section>

          <section className="card p-4">
            <h2 className="mb-1.5 text-[13px] font-semibold">Quick links</h2>
            <div className="space-y-1 text-[11.5px]">
              <Link href="/library" className="flex items-center justify-between rounded-lg px-1 py-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink">
                Law library <Icon name="arrow" size={12} />
              </Link>
              <Link href="/scanner" className="flex items-center justify-between rounded-lg px-1 py-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink">
                Case scanner <Icon name="arrow" size={12} />
              </Link>
              <Link href="/revision" className="flex items-center justify-between rounded-lg px-1 py-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink">
                Revision queue <Icon name="arrow" size={12} />
              </Link>
              <Link href="/practice" className="flex items-center justify-between rounded-lg px-1 py-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink">
                Practice sets <Icon name="arrow" size={12} />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
