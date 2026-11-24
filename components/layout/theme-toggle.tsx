"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync with the class already applied by the no-FOUC inline script.
  useEffect(() => {
    // Runs once after hydration; the DOM class can't be read during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--surface-2)"
    >
      {/* Render nothing theme-specific until mounted to avoid hydration mismatch */}
      {mounted ? (
        dark ? (
          <SunIcon width={18} height={18} />
        ) : (
          <MoonIcon width={18} height={18} />
        )
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
