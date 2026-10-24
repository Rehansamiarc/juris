"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function PendingSubmit({
  children,
  pendingLabel,
  className = "btn btn-primary",
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
