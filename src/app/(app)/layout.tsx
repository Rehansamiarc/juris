import { AppShell } from "@/components/app-shell";
import { aiConfigured } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { reviewStats, studyStreak } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireSession();
  const dueCount = reviewStats(user.id).due;
  const streak = studyStreak(user.id);

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        course: profile ? `${profile.course} · ${profile.yearLabel}` : undefined,
      }}
      streak={streak}
      dueCount={dueCount}
      aiReady={aiConfigured()}
    >
      {children}
    </AppShell>
  );
}
