"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [moyskladUrl, setMoyskladUrl] = useState("");
  const [moyskladToken, setMoyskladToken] = useState("");
  const [oneCUrl, setOneCUrl] = useState("");
  const [oneCToken, setOneCToken] = useState("");
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTheme(localStorage.getItem("operix_theme") || "light");
    setLang(localStorage.getItem("operix_lang") || "uz");
    setMoyskladUrl(localStorage.getItem("operix_moysklad_url") || "");
    setMoyskladToken(localStorage.getItem("operix_moysklad_token") || "");
    setOneCUrl(localStorage.getItem("operix_1c_url") || "");
    setOneCToken(localStorage.getItem("operix_1c_token") || "");
  }, []);

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      setMessage("Joriy parol va yangi parolni kiriting");
      return;
    }
    try {
      await apiJson("/users/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage("Parol yangilandi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.message || "Backend tayyor bo‘lmasa, bu funksiya keyingi patchda ulanadi");
    }
  }

  function saveIntegrations() {
    localStorage.setItem("operix_moysklad_url", moyskladUrl);
    localStorage.setItem("operix_moysklad_token", moyskladToken);
    localStorage.setItem("operix_1c_url", oneCUrl);
    localStorage.setItem("operix_1c_token", oneCToken);
    setMessage("Integratsiya sozlamalari saqlandi");
  }

  function saveTheme(value: string) {
    setTheme(value);
    localStorage.setItem("operix_theme", value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }

  function saveLang(value: string) {
    setLang(value);
    localStorage.setItem("operix_lang", value);
  }

  return (
    <AppLayout title="Sozlamalar" subtitle="Parol, integratsiyalar, til va rejim">
      {message && <div className="mb-5 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{message}</div>}

      <div className="grid grid-cols-2 gap-5">
        <Card title="Parolni o‘zgartirish" subtitle="User o‘z parolini mustaqil yangilaydi">
          <div className="space-y-3">
            <PasswordInput value={currentPassword} setValue={setCurrentPassword} show={showPassword} setShow={setShowPassword} placeholder="Joriy parol" />
            <PasswordInput value={newPassword} setValue={setNewPassword} show={showPassword} setShow={setShowPassword} placeholder="Yangi parol" />
            <button onClick={changePassword} className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600">Parolni saqlash</button>
          </div>
        </Card>

        <Card title="Til va rejim" subtitle="UZ/RU, kunduzgi/tungi rejim">
          <div className="grid grid-cols-2 gap-3">
            <select value={lang} onChange={(e) => saveLang(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="uz">Uzbek</option>
              <option value="ru">Русский</option>
            </select>
            <select value={theme} onChange={(e) => saveTheme(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <option value="light">Kunduzgi</option>
              <option value="dark">Tungi</option>
            </select>
          </div>
        </Card>

        <Card title="MoySklad integratsiya" subtitle="URL, token yoki JSON konfiguratsiya">
          <div className="space-y-3">
            <input value={moyskladUrl} onChange={(e) => setMoyskladUrl(e.target.value)} placeholder="" className="input" />
            <textarea value={moyskladToken} onChange={(e) => setMoyskladToken(e.target.value)} placeholder="Token / JSON" className="input min-h-[120px]" />
          </div>
        </Card>

        <Card title="1C integratsiya" subtitle="Webhook, URL yoki token joyi">
          <div className="space-y-3">
            <input value={oneCUrl} onChange={(e) => setOneCUrl(e.target.value)} placeholder="" className="input" />
            <textarea value={oneCToken} onChange={(e) => setOneCToken(e.target.value)} placeholder="Token / JSON" className="input min-h-[120px]" />
          </div>
        </Card>
      </div>

      <button onClick={saveIntegrations} className="mt-5 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-600">Integratsiyalarni saqlash</button>
    </AppLayout>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-[20px] font-semibold tracking-[-0.03em] dark:text-white">{title}</h2>
      <p className="mb-5 mt-1 text-sm text-slate-400">{subtitle}</p>
      {children}
    </div>
  );
}

function PasswordInput({ value, setValue, show, setShow, placeholder }: any) {
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="input pr-11" />
      <button type="button" onClick={() => setShow((v: boolean) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
