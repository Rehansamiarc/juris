import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect("/home");

  return (
    <div>
      <p className="eyebrow mb-2">Start studying</p>
      <h1 className="text-3xl leading-tight">Build your law workspace</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Two minutes to set up. Your course and subjects shape the dashboard, plan and revision queue.
      </p>
      <SignupForm />
    </div>
  );
}
