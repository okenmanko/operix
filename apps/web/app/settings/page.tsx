"use client";

import { Building2, Globe2, Lock, Moon, UserCog } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { LANGS, useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout title={t("settings")} subtitle={t("settingsSubtitle")}>
      <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Card icon={<Globe2 size={20} />} title={t("interface")} subtitle={t("interfaceSub")}>
          <Label label={t("language")}><CustomSelect value={lang} onChange={(v) => setLang(v as any)} options={LANGS.map((x) => ({ value: x.value, label: x.name }))} /></Label>
          <Label label={t("theme")}><CustomSelect value={theme} onChange={(v) => setTheme(v as any)} options={[{ value: "light", label: t("light") }, { value: "dark", label: t("dark") }]} /></Label>
        </Card>
        <Card icon={<UserCog size={20} />} title={t("profile")} subtitle="User profile"><Input label={t("client")} /><Input label={t("phone")} /></Card>
        <Card icon={<Building2 size={20} />} title={t("company")} subtitle="Company information"><Input label={t("company")} /><Input label={t("phone")} /></Card>
        <Card icon={<Lock size={20} />} title={t("security")} subtitle="Password and access"><Input label="Password" type="password" /><button className="premium-button premium-button-primary mt-4 w-full">{t("save")}</button></Card>
        <Card icon={<Moon size={20} />} title={t("theme")} subtitle={t("interfaceSub")}><p className="text-[14px] text-[var(--muted)]">{t("language")} / {t("theme")}: Settings ichida. Navbar toza qoladi.</p></Card>
      </div>
    </AppLayout>
  );
}

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) { return <div className="premium-card p-6"><div className="mb-5 flex items-start gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--blue-soft)] text-[var(--blue)]">{icon}</div><div><h2 className="text-[22px] font-semibold tracking-[-0.05em]">{title}</h2><p className="mt-1 text-[13px] text-[var(--muted)]">{subtitle}</p></div></div><div className="space-y-4">{children}</div></div>; }
function Label({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="premium-label">{label}</span>{children}</label>; }
function Input({ label, type = "text" }: { label: string; type?: string }) { return <label className="block"><span className="premium-label">{label}</span><input type={type} className="premium-input" /></label>; }
