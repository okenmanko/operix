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
      className="qanot-soft flex h-10 items-center gap-2 rounded-[15px] px-4 text-[13px] font-medium transition hover:text-[var(--blue)]"
    >
      {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      {dark ? t("light") : t("dark")}
    </button>
  );
}
