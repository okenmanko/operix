"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Globe2, KeyRound, Lock, Moon, ShieldCheck, Smartphone, UserCog } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { Toast } from "../components/ui/Toast";
import { useI18n, type Lang } from "../lib/i18n";
import { useTheme, type Theme } from "../lib/theme";

type SettingsState = {
  fullName: string;
  phone: string;
  companyName: string;
  companyPhone: string;
  usdRate: string;
  telegramReport: boolean;
  debtReminder: boolean;
  paymentNotification: boolean;
  sessionTimeout: string;
};

const defaults: SettingsState = {
  fullName: "",
  phone: "",
  companyName: "Digi World",
  companyPhone: "",
  usdRate: "12200",
  telegramReport: true,
  debtReminder: true,
  paymentNotification: true,
  sessionTimeout: "30",
};

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [state, setState] = useState<SettingsState>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("operix_settings") || localStorage.getItem("qanot_settings");
      if (saved) setState({ ...defaults, ...JSON.parse(saved) });
    } catch {}
  }, []);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function save(nextMessage: string) {
    localStorage.setItem("qanot_settings", JSON.stringify(state));
    localStorage.setItem("operix_settings", JSON.stringify(state));
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2500);
  }

  const languageOptions = [
    { value: "uz", label: "O‘zbek", icon: <Globe2 size={17} /> },
    { value: "ru", label: "Русский", icon: <Globe2 size={17} /> },
    { value: "en", label: "English", icon: <Globe2 size={17} /> },
  ];

  const themeOptions = [
    { value: "light", label: t("light"), icon: <Moon size={17} /> },
    { value: "dark", label: t("dark"), icon: <Moon size={17} /> },
  ];

  return (
    <AppLayout title={t("settings")} subtitle={t("settingsSubtitle")}>
      {message ? <Toast type="success">{message}</Toast> : null}

      <div className="mb-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Card icon={<Globe2 size={22} />} title={t("languageAndTheme")} subtitle={t("settingsSubtitle")} wide>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Label label={t("language")}>
              <CustomSelect value={lang} onChange={(v) => setLang(v as Lang)} options={languageOptions} />
            </Label>
            <Label label={t("theme")}>
              <CustomSelect value={theme} onChange={(v) => setTheme(v as Theme)} options={themeOptions} />
            </Label>
          </div>
          <button onClick={() => save(t("interfaceSaved"))} className="qanot-button qanot-button-primary mt-4 w-full">
            {t("save")}
          </button>
        </Card>

        <Card icon={<Building2 size={22} />} title={t("company")} subtitle={t("companySaved")} wide>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <Input label={t("companyName")} value={state.companyName} onChange={(v) => update("companyName", v)} placeholder="Digi World" />
            <Input label={t("phone")} value={state.companyPhone} onChange={(v) => update("companyPhone", v)} placeholder="+998..." />
            <Input label="USD" value={state.usdRate} onChange={(v) => update("usdRate", v)} placeholder="12200" />
          </div>
          <button onClick={() => save(t("companySaved"))} className="qanot-button qanot-button-primary mt-4 w-full">
            {t("save")}
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-lg:grid-cols-1">
        <Card icon={<UserCog size={22} />} title={t("profile")} subtitle={t("profileSaved")}>
          <Input label={t("profile")} value={state.fullName} onChange={(v) => update("fullName", v)} placeholder="Aziz" />
          <Input label={t("phone")} value={state.phone} onChange={(v) => update("phone", v)} placeholder="+998..." />
          <button onClick={() => save(t("profileSaved"))} className="qanot-button qanot-button-primary mt-4 w-full">{t("save")}</button>
        </Card>

        <Card icon={<Lock size={22} />} title={t("password")} subtitle={t("securityChecklist")}>
          <Input label={t("oldPassword")} type="password" placeholder="••••••••" />
          <Input label={t("newPassword")} type="password" placeholder="••••••••" />
          <button onClick={() => save(t("passwordSaved"))} className="qanot-button qanot-button-primary mt-4 w-full">{t("save")}</button>
        </Card>

        <Card icon={<Bell size={22} />} title={t("notifications")} subtitle="Telegram / report">
          <Toggle title={t("telegramReport")} enabled={state.telegramReport} onChange={(v) => update("telegramReport", v)} />
          <Toggle title={t("debtReminder")} enabled={state.debtReminder} onChange={(v) => update("debtReminder", v)} />
          <Toggle title={t("paymentNotification")} enabled={state.paymentNotification} onChange={(v) => update("paymentNotification", v)} />
          <button onClick={() => save(t("interfaceSaved"))} className="qanot-button qanot-button-primary mt-4 w-full">{t("save")}</button>
        </Card>

        <Card icon={<ShieldCheck size={22} />} title={t("security")} subtitle={t("securityChecklist")}>
          <CheckItem title="JWT cookie + localStorage clear" ok />
          <CheckItem title="Super admin guard" ok />
          <CheckItem title="Role/permission frontend gate" ok />
          <Label label={t("session")}>
            <CustomSelect value={state.sessionTimeout} onChange={(v) => update("sessionTimeout", v)} options={[{ value: "7", label: "7 kun" }, { value: "30", label: "30 kun" }, { value: "90", label: "90 kun" }]} />
          </Label>
        </Card>

        <Card icon={<Smartphone size={22} />} title="Mobile" subtitle={t("mobileReady")}>
          <CheckItem title="Sidebar responsive" ok />
          <CheckItem title="Tables scroll" ok />
          <CheckItem title="Cards one column" ok />
        </Card>

        <Card icon={<KeyRound size={22} />} title={t("roles")} subtitle={t("permissions")}>
          <p className="text-[14px] leading-6 text-[var(--muted)]">/settings/roles</p>
          <a href="/settings/roles" className="qanot-button qanot-button-primary mt-4 inline-flex w-full">{t("permissions")}</a>
        </Card>
      </div>
    </AppLayout>
  );
}

function Card({ icon, title, subtitle, children, wide }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`qanot-card p-6 ${wide ? "" : ""}`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--blue-soft)] text-[var(--blue)]">{icon}</div>
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.055em] text-[var(--text)]">{title}</h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="qanot-label">{label}</span>{children}</label>;
}

function Input({ label, type = "text", placeholder = "", value, onChange }: { label: string; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return <label className="block"><span className="qanot-label">{label}</span><input type={type} value={value || ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="qanot-input" /></label>;
}

function Toggle({ title, enabled, onChange }: { title: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <button onClick={() => onChange(!enabled)} className="flex w-full items-center justify-between rounded-[18px] bg-[var(--soft)] px-4 py-3 text-left text-[14px] text-[var(--text)]"><span>{title}</span><span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-[var(--blue)]" : "bg-slate-400"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span></button>;
}

function CheckItem({ title, ok }: { title: string; ok?: boolean }) {
  return <div className="flex items-center justify-between rounded-[18px] bg-[var(--soft)] px-4 py-3 text-[14px]"><span className="text-[var(--text)]">{title}</span><span className={ok ? "text-[var(--success-text)]" : "text-[var(--muted)]"}>{ok ? "OK" : "—"}</span></div>;
}
