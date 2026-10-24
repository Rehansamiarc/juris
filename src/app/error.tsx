"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Vidhi error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Something broke</p>
      <h1 className="max-w-lg text-3xl leading-tight">The workspace hit an unexpected error.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Your data is stored locally and has not been changed by this error. Try again, or return to your
        dashboard.
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/home" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
      {error.digest ? <p className="mt-4 text-[10px] text-muted">Reference: {error.digest}</p> : null}
    </div>
  );
}
