"use client";

import AppLayout from "../components/AppLayout";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { LANGS, useI18n } from "../lib/i18n";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  return (
    <AppLayout title={t("settings")} subtitle={t("settingsSubtitle")}>
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("interface")}</h2>
          <p className="mt-1 text-[14px] text-[var(--muted)]">{t("interfaceSub")}</p>
          <div className="mt-6 grid gap-5">
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-[0.14em] text-[var(--muted)]">{t("language")}</p>
              <div className="grid grid-cols-3 gap-2">
                {LANGS.map((item) => (
                  <button key={item.value} onClick={() => setLang(item.value)} className={`premium-button ${lang === item.value ? "premium-button-primary" : "premium-button-soft"}`}>{item.name}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-[0.14em] text-[var(--muted)]">{t("theme")}</p>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("profile")}</h2>
          <div className="mt-5 grid gap-3">
            <Info label={t("company")} value="Qanot" />
            <Info label={t("security")} value="JWT / Role access" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
function Info({ label, value }: { label: string; value: string }) { return <div className="soft-card flex items-center justify-between px-4 py-3"><span className="text-[var(--muted)]">{label}</span><b>{value}</b></div>; }
