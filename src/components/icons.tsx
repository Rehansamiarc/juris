import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "library"
  | "scan"
  | "revision"
  | "tutor"
  | "practice"
  | "profile"
  | "search"
  | "bookmark"
  | "note"
  | "close"
  | "menu"
  | "moon"
  | "sun"
  | "arrow"
  | "chevron"
  | "plus"
  | "sparkles"
  | "download"
  | "print"
  | "volume"
  | "compare"
  | "trash"
  | "edit"
  | "check"
  | "clock"
  | "flame"
  | "calendar"
  | "logout"
  | "upload"
  | "camera"
  | "rotate"
  | "file"
  | "external"
  | "book"
  | "gavel"
  | "grid"
  | "more";

const PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  library: "M4 19.5V5a2 2 0 0 1 2-2h2v18H6a2 2 0 0 1-2-2.5ZM8 3h6v18H8M14 3h2.5a2 2 0 0 1 2 1.6L20 19M17 21h1",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10",
  revision: "M4 5a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5ZM15 3v5h5M8 13h8M8 17h5",
  tutor: "M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8ZM8 11h.01M12 11h.01M16 11h.01",
  practice: "M9 3h6M12 3v3M6 21h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2ZM8 12h3M8 16h6M15 12h.01",
  profile: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  bookmark: "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z",
  note: "M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4ZM14 2v6h6M8 13h8M8 17h5",
  close: "M18 6 6 18M6 6l12 12",
  menu: "M4 7h16M4 12h16M4 17h16",
  moon: "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "m9 18 6-6-6-6",
  plus: "M12 5v14M5 12h14",
  sparkles: "M12 3v4M12 17v4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M3 12h4M17 12h4M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  print: "M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6v-7Z",
  volume: "M11 5 6 9H3v6h3l5 4V5ZM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  compare: "M8 3v18M16 3v18M3 8h5M16 8h5M3 16h5M16 16h5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z",
  check: "m5 13 4 4L19 7",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  flame: "M12 22c4 0 7-2.7 7-6.5 0-4.5-4-7.5-7-12.5-3 5-7 8-7 12.5C5 19.3 8 22 12 22ZM12 18a2.5 2.5 0 0 0 2.5-2.5c0-1.7-1.5-2.8-2.5-4.5-1 1.7-2.5 2.8-2.5 4.5A2.5 2.5 0 0 0 12 18Z",
  calendar: "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  rotate: "M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 13h8M8 17h5",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5Z",
  gavel: "m14 13-8.5 8.5M3 21h8M14.5 3.5 21 10M12 6l6 6M16.5 2.5l5 5M9.5 9.5l5 5M2.5 16.5l5 5",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

export function Icon({
  name,
  size = 18,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-[#f7f1e4] ${className}`}
      aria-hidden="true"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M5 4.5h4.2L12 10l2.8-5.5H19l-5.4 9v6H10.4v-6L5 4.5Z" fill="currentColor" />
        <circle cx="18.6" cy="18.4" r="1.6" fill="var(--gold-bright)" />
      </svg>
    </span>
  );
}
