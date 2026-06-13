"use client";

import { useState } from "react";
import { Bell, Building2, Globe2, Lock, Moon, ShieldCheck, UserCog } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";

const languageOptions = [
  { value: "uz", label: "O‘zbek", icon: <Globe2 size={17} /> },
  { value: "ru", label: "Русский", icon: <Globe2 size={17} /> },
];

const themeOptions = [
  { value: "light", label: "Kunduzgi", icon: <Moon size={17} /> },
  { value: "dark", label: "Tungi", icon: <Moon size={17} /> },
];

export default function SettingsPage() {
  const [language, setLanguage] = useState("uz");
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState("");

  return (
    <AppLayout title="Sozlamalar" subtitle="Profil, kompaniya, xavfsizlik va interfeys sozlamalari.">
      {message ? <div className="mb-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{message}</div> : null}

      <div className="grid grid-cols-3 gap-5">
        <Card icon={<UserCog size={22} />} title="Profil" subtitle="Ism, telefon va shaxsiy sozlamalar">
          <Input label="Ism" placeholder="Foydalanuvchi ismi" />
          <Input label="Telefon" placeholder="+998..." />
          <button onClick={() => setMessage("Profil saqlandi")} className="premium-button premium-button-primary mt-4 w-full">Saqlash</button>
        </Card>

        <Card icon={<Lock size={22} />} title="Parol" subtitle="Xavfsizlik uchun parolni yangilash">
          <Input label="Eski parol" type="password" />
          <Input label="Yangi parol" type="password" />
          <button onClick={() => setMessage("Parol yangilandi")} className="premium-button premium-button-primary mt-4 w-full">Parolni saqlash</button>
        </Card>

        <Card icon={<Globe2 size={22} />} title="Til va rejim" subtitle="Interfeys tili va ko‘rinish rejimi">
          <Label label="Til"><CustomSelect value={language} onChange={setLanguage} options={languageOptions} /></Label>
          <Label label="Rejim"><CustomSelect value={theme} onChange={setTheme} options={themeOptions} /></Label>
          <button onClick={() => setMessage("Interfeys sozlamalari saqlandi")} className="premium-button premium-button-primary mt-4 w-full">Saqlash</button>
        </Card>

        <Card icon={<Building2 size={22} />} title="Kompaniya" subtitle="Kompaniya profili va umumiy ma’lumot">
          <Input label="Kompaniya nomi" placeholder="Digi World" />
          <Input label="Telefon" placeholder="+998..." />
          <button onClick={() => setMessage("Kompaniya sozlamalari saqlandi")} className="premium-button premium-button-primary mt-4 w-full">Saqlash</button>
        </Card>

        <Card icon={<Bell size={22} />} title="Bildirishnomalar" subtitle="Telegram, report va eslatmalar">
          <Toggle title="Telegram report" />
          <Toggle title="Qarz muddati eslatmasi" />
          <Toggle title="Yangi to‘lov xabari" />
        </Card>

        <Card icon={<ShieldCheck size={22} />} title="Integratsiyalar" subtitle="MoySklad va 1C alohida sahifada sozlanadi">
          <p className="text-[14px] leading-6 text-[#7d8ca2]">Token, URL va sync sozlamalari endi alohida <b>/integrations</b> sahifasida.</p>
          <a href="/integrations" className="premium-button premium-button-primary mt-4 inline-flex w-full items-center justify-center">Integratsiyalarni ochish</a>
        </Card>
      </div>
    </AppLayout>
  );
}

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="premium-card p-6"><div className="mb-5 flex items-start gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#315efb]">{icon}</div><div><h2 className="text-[22px] font-normal tracking-[-0.04em] text-[#111827]">{title}</h2><p className="mt-1 text-[13px] leading-5 text-[#8aa0ba]">{subtitle}</p></div></div><div className="space-y-4">{children}</div></div>;
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="premium-label">{label}</span>{children}</label>;
}

function Input({ label, type = "text", placeholder = "" }: { label: string; type?: string; placeholder?: string }) {
  return <label className="block"><span className="premium-label">{label}</span><input type={type} placeholder={placeholder} className="premium-input" /></label>;
}

function Toggle({ title }: { title: string }) {
  const [enabled, setEnabled] = useState(true);
  return <button onClick={() => setEnabled(!enabled)} className="flex w-full items-center justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3 text-left text-[14px]"><span>{title}</span><span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-[#315efb]" : "bg-[#cbd5e1]"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span></button>;
}
