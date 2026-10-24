"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("vidhi-theme", next);
    } catch {
      /* storage may be unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={compact ? "btn btn-ghost px-2" : "btn btn-ghost w-full justify-start"}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
      {compact ? null : <span className="text-xs">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
