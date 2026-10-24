"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Monogram, type IconName } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { cn, initials } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

const PRIMARY: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/library", label: "Law Library", icon: "library" },
  { href: "/scanner", label: "Case Scanner", icon: "scan" },
  { href: "/revision", label: "Revision", icon: "revision" },
  { href: "/tutor", label: "AI Tutor", icon: "tutor" },
  { href: "/practice", label: "Practice", icon: "practice" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export function AppShell({
  children,
  user,
  streak,
  dueCount,
  aiReady,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; course?: string };
  streak: number;
  dueCount: number;
  aiReady: boolean;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSheetOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const current = PRIMARY.find((item) => isActive(item.href));
  const sectionLabel = pathname.startsWith("/cases")
    ? "Case briefs"
    : pathname.startsWith("/onboarding")
      ? "Onboarding"
      : current?.label;

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Link href="/home" className="flex items-center gap-2.5">
            <Monogram />
            <span>
              <span className="block font-display text-[1.35rem] leading-none tracking-tight">Juris</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                Law, understood
              </span>
            </span>
          </Link>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-navy text-[#f8f2e6] shadow-[0_10px_24px_-18px_rgba(10,20,35,0.9)] dark:bg-gold-soft dark:text-gold-bright"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon
                  name={item.icon}
                  size={17}
                  className={active ? "text-gold-bright dark:text-gold" : "text-muted group-hover:text-gold"}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/revision" && dueCount > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      active ? "bg-white/15 text-white" : "bg-gold-soft text-gold",
                    )}
                  >
                    {dueCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <span className={cn("chip", aiReady ? "chip-success" : "chip-gold")}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {aiReady ? "AI tutor live" : "Local mode"}
            </span>
            {streak > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold" title="Study streak">
                <Icon name="flame" size={13} /> {streak}d
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-[#f8f2e6] dark:bg-gold-soft dark:text-gold-bright">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight">{user.name}</p>
              <p className="truncate text-[10.5px] text-muted">{user.course ?? user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-danger"
                aria-label="Sign out"
                title="Sign out"
              >
                <Icon name="logout" size={15} />
              </button>
            </form>
          </div>
          <div className="mt-1.5">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/home" className="flex items-center gap-2">
          <Monogram className="h-8 w-8" />
          <span className="font-display text-xl leading-none">Juris</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {streak > 0 ? (
            <span className="chip chip-gold" title="Study streak">
              <Icon name="flame" size={12} /> {streak}
            </span>
          ) : null}
          <Link
            href="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-[#f8f2e6] dark:bg-gold-soft dark:text-gold-bright"
            aria-label="Your profile"
          >
            {initials(user.name)}
          </Link>
        </div>
      </div>

      <div className="min-w-0 flex-1 lg:pl-[264px]">
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-line/70 bg-paper/80 px-8 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-2 text-[12.5px] text-muted">
            <Icon name="gavel" size={14} className="text-gold" />
            <span>Juris Study Workspace</span>
            <span className="text-line-strong">/</span>
            <span className="text-ink">{sectionLabel ?? "Workspace"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-ink"
            >
              <Icon name="search" size={13} />
              Search the library
              <kbd className="rounded border border-line px-1 text-[10px] text-muted">/</kbd>
            </Link>
            <Link href="/scanner" className="btn btn-primary h-8 px-3 text-xs">
              <Icon name="scan" size={14} /> Scan a case
            </Link>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1220px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {PRIMARY.slice(0, 4).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium",
                  active ? "text-gold" : "text-muted",
                )}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label.replace("Law Library", "Library").replace("Case Scanner", "Scan")}</span>
                {item.href === "/revision" && dueCount > 0 ? (
                  <span className="absolute right-[22%] top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
                ) : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium",
              ["/tutor", "/practice", "/profile"].some(isActive) ? "text-gold" : "text-muted",
            )}
            aria-expanded={sheetOpen}
          >
            <Icon name="more" size={19} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-line bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Workspace</p>
                <p className="font-display text-lg">More ways to study</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full border border-line p-2 text-muted"
                aria-label="Close menu"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY.slice(4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-3 text-sm font-medium"
                >
                  <Icon name={item.icon} size={17} className="text-gold" />
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-2 py-2">
                <ThemeToggle />
              </div>
            </div>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="btn btn-secondary w-full">
                <Icon name="logout" size={15} /> Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
