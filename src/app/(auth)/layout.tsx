import Link from "next/link";
import { Monogram } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy px-12 py-12 text-[#f4ecdc] lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(600px 300px at 20% 10%, rgba(201,154,69,0.55), transparent 65%), radial-gradient(500px 400px at 90% 90%, rgba(201,154,69,0.35), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Monogram className="bg-white/10 ring-1 ring-white/15" />
            <span>
              <span className="block font-display text-2xl leading-none">Vidhi</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-[#c9b78f]">
                Law, understood
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[2.6rem] leading-[1.1] tracking-tight">
            “The law is reason, free from passion.”
          </p>
          <p className="mt-4 text-sm text-[#c9b78f]">Aristotle, Politics — a reminder for every case brief.</p>
          <div className="mt-10 space-y-4 border-t border-white/10 pt-8">
            {[
              ["Scan and structure a judgment", "Facts, issues, ratio and exam outline — never invented."],
              ["Revise what is actually due", "A spaced-repetition queue built from your own notes."],
              ["Ask with sources attached", "Answers cite the provision or case they came from."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d5ae68]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[#f7f1e4]">{title}</p>
                  <p className="text-xs leading-relaxed text-[#b9c3d2]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative max-w-sm text-[11px] leading-relaxed text-[#93a2b8]">
          Built for LLB, BA LLB, BBA LLB and judiciary preparation. Educational use only; always verify
          citations against the official reporter and bare Act.
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <Monogram />
            <span className="font-display text-xl">Vidhi</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle compact />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-12 pt-2 sm:px-8">
          <div className="fade-up">{children}</div>
        </div>
        <footer className="px-6 pb-6 text-center text-[11px] text-muted">
          <Link href="/" className="hover:text-gold">
            ← Back to vidhi.app
          </Link>
        </footer>
      </main>
    </div>
  );
}
