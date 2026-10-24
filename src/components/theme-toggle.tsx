"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "./icons";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // Delegated to next-themes so the class attribute and the storage key the
  // provider reads (juris-theme) stay the source of truth — toggling the class
  // by hand never persisted and got reverted on hydration.
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted ? (isDark ? "light" : "dark") : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={compact ? "btn btn-ghost px-2" : "btn btn-ghost w-full justify-start"}
      aria-label={mounted ? `Switch to ${label} mode` : "Toggle colour mode"}
      title={mounted ? `Switch to ${label} mode` : "Toggle colour mode"}
    >
      <Icon name={mounted && isDark ? "sun" : "moon"} size={16} />
      {compact ? null : (
        <span className="text-xs">{mounted ? `${label === "dark" ? "Dark" : "Light"} mode` : "Theme"}</span>
      )}
    </button>
  );
}
