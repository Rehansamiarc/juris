import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="eyebrow mb-2">Account recovery</p>
      <h1 className="text-3xl leading-tight">Reset your password</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Enter the email on your account. Reset links expire after one hour and can be used once.
      </p>
      <ForgotForm />
      <p className="mt-6 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
        This workspace has no outgoing email service. In production, connect an email provider (for example
        Resend or Postmark) inside <code>requestResetAction</code>; the token flow is already in place.
      </p>
    </div>
  );
}
