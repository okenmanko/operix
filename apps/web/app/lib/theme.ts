"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("operix_theme") as Theme | null;
    const next = saved === "dark" || saved === "light" ? saved : "light";
    setThemeState(next);
    applyTheme(next);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("operix_theme", next);
    applyTheme(next);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "light" as Theme, setTheme: () => {}, toggleTheme: () => {} };
  return ctx;
}
