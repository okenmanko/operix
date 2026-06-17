"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useI18n } from "../lib/i18n";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-11 items-center gap-2 rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-4 text-[13px] font-normal text-[var(--text)] shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
    >
      {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      {dark ? t("light") : t("dark")}
    </button>
  );
}
