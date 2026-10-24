import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const [user, params] = await Promise.all([currentUser(), searchParams]);
  if (user) redirect("/home");

  return (
    <div>
      <p className="eyebrow mb-2">Welcome back</p>
      <h1 className="text-3xl leading-tight">Continue your study</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Your cases, notes and revision queue are waiting exactly where you left them.
      </p>
      <LoginForm notice={params.reset ? "Your password was updated. Sign in with the new password." : undefined} />
    </div>
  );
}
