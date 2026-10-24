import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div>
      <p className="eyebrow mb-2">Almost there</p>
      <h1 className="text-3xl leading-tight">Choose a new password</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        For security, setting a new password signs out every other session on your account.
      </p>
      <ResetForm token={token} />
    </div>
  );
}
