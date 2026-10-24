import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Monogram } from "@/components/icons";
import { OnboardingForm } from "@/components/onboarding-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireOnboarding } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const { user, profile } = await requireOnboarding();
  if (profile?.onboardedAt) redirect("/home");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Monogram />
          <span className="font-display text-xl">Vidhi</span>
        </Link>
        <ThemeToggle compact />
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-2 sm:px-6">
        <div className="mb-6">
          <p className="eyebrow mb-2">Welcome, {user.name.split(" ")[0]}</p>
          <h1 className="text-[1.9rem] leading-tight sm:text-[2.2rem]">
            Let’s shape the desk around your course.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Three quick questions. Everything can be changed later from your profile.
          </p>
        </div>
        <OnboardingForm
          userId={user.id}
          name={user.name}
          initialSubjects={profile?.subjects}
          initialCourse={profile?.course}
          initialYear={profile?.yearLabel}
        />
      </main>
    </div>
  );
}
