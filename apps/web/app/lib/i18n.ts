"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type Lang = "uz" | "ru";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const dictionary: Record<Lang, Record<string, string>> = {
  uz: {
    dashboard: "Dashboard",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    reports: "Hisobotlar",
    analytics: "Analytics",
    inventory: "Inventory",
    products: "Products",
    warehouses: "Omborlar",
    settings: "Sozlamalar",
    integrations: "Integratsiyalar",
    logout: "Chiqish",
    save: "Saqlash",
    search: "Qidirish",
    import: "Import",
    export: "Export",
  },
  ru: {
    dashboard: "Дашборд",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    reports: "Отчеты",
    analytics: "Аналитика",
    inventory: "Склад",
    products: "Товары",
    warehouses: "Склады",
    settings: "Настройки",
    integrations: "Интеграции",
    logout: "Выйти",
    save: "Сохранить",
    search: "Поиск",
    import: "Импорт",
    export: "Экспорт",
  },
};

const I18nContext = createContext<I18nValue>({
  lang: "uz",
  setLang: () => {},
  t: (_key: string, fallback?: string) => fallback || _key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "uz";
    return (localStorage.getItem("operix_lang") as Lang) || "uz";
  });

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("operix_lang", next);
    }
  }

  const value = useMemo<I18nValue>(() => {
    return {
      lang,
      setLang,
      t: (key: string, fallback?: string) => dictionary[lang]?.[key] || fallback || key,
    };
  }, [lang]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export function t(key: string, fallback?: string) {
  return dictionary.uz[key] || fallback || key;
}
