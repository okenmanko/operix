"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "uz" | "ru";

export const dict = {
  uz: {
    dashboard: "Dashboard",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    reports: "Hisobotlar",
    delivery: "Delivery",
    inventory: "Sklad",
    warehouses: "Skladlar",
    qrCodes: "QR kodlar",
    qrScanner: "QR Scanner",
    movements: "Harakatlar",
    cashflow: "DDS",
    integrations: "Integratsiyalar",
    settings: "Sozlamalar",
    logout: "Chiqish",
    company: "Digi World",
    user: "Aziz",
    starter: "STARTER",
    businessman: "BUSINESSMAN",
    pro: "PRO",
    light: "Light",
    dark: "Dark",
  },
  ru: {
    dashboard: "Dashboard",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    reports: "Отчёты",
    delivery: "Доставка",
    inventory: "Склад",
    warehouses: "Склады",
    qrCodes: "QR коды",
    qrScanner: "QR Сканер",
    movements: "Движения",
    cashflow: "ДДС",
    integrations: "Интеграции",
    settings: "Настройки",
    logout: "Выйти",
    company: "Digi World",
    user: "Aziz",
    starter: "STARTER",
    businessman: "BUSINESSMAN",
    pro: "PRO",
    light: "Light",
    dark: "Dark",
  },
};

export type I18nKey = keyof typeof dict.uz;

const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: I18nKey) => string;
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("operix_lang") as Lang | null;
    if (saved === "uz" || saved === "ru") setLangState(saved);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem("operix_lang", next);
  }

  function t(key: I18nKey) {
    return dict[lang][key] || dict.uz[key] || key;
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "uz" as Lang,
      setLang: () => {},
      t: (key: I18nKey) => dict.uz[key] || key,
    };
  }
  return ctx;
}
