"use client";

import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function Topbar() {
  const { lang, setLang, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div className="operix-topbar">
      <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
        {(["uz", "ru"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setLang(item)}
            className="rounded-xl px-4 py-2 text-[12px] font-bold uppercase"
            style={{
              background: lang === item ? "var(--accent)" : "transparent",
              color: lang === item ? "#fff" : "var(--muted)",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <button onClick={toggleTheme} className="operix-btn-muted">
        {theme === "dark" ? t("light") : t("dark")}
      </button>

      <button onClick={logout} className="operix-btn-muted">
        {t("logout")}
      </button>
    </div>
  );
}
