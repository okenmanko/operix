"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Lang = "uz" | "ru";

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
  },
};

type Key = keyof typeof dict.uz;

const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key) => string;
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

  function t(key: Key) {
    return dict[lang][key] || key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "uz" as Lang,
      setLang: () => {},
      t: (key: Key) => dict.uz[key] || key,
    };
  }
  return ctx;
}