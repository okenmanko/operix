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
      className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
      {dark ? t("light") : t("dark")}
    </button>
  );
}
