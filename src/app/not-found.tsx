import Link from "next/link";
import { Monogram } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Monogram className="mb-5" />
      <p className="eyebrow mb-2">Nothing on this shelf</p>
      <h1 className="max-w-lg text-3xl leading-tight sm:text-4xl">
        This page is not in the record.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The document may have been deleted, or you may not have access to it. Your library and revision
        queue are unaffected.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/home" className="btn btn-primary">
          Back to home
        </Link>
        <Link href="/library" className="btn btn-secondary">
          Open the library
        </Link>
      </div>
    </div>
  );
}
