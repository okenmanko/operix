"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "uz" | "ru" | "en";

export type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

export const LANGS: Array<{ value: Lang; label: string }> = [
  { value: "uz", label: "UZ" },
  { value: "ru", label: "RU" },
  { value: "en", label: "EN" },
];

const dictionary: Record<Lang, Record<string, string>> = {
  uz: {
    dashboard: "Dashboard",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    reports: "Hisobotlar",
    analytics: "Analytics",
    inventory: "Sklad",
    products: "Mahsulotlar",
    warehouses: "Omborlar",
    settings: "Sozlamalar",
    integrations: "Integratsiyalar",
    delivery: "Delivery",
    qrCodes: "QR kodlar",
    qrScanner: "QR Scanner",
    movements: "Harakatlar",
    cashflow: "DDS",
    sales: "Sotuv POS",
    billing: "Billing",
    superAdmin: "Super Admin",
    companies: "Kompaniyalar",
    users: "Userlar",
    logout: "Chiqish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    edit: "Tahrirlash",
    delete: "O‘chirish",
    search: "Qidirish",
    import: "Import",
    export: "Export",
    light: "Light",
    dark: "Dark",
    language: "Til",
    theme: "Rejim",
    businessOS: "Business OS",
    controlCenter: "Operix Control Center",
  },
  ru: {
    dashboard: "Дашборд",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    reports: "Отчёты",
    analytics: "Аналитика",
    inventory: "Склад",
    products: "Товары",
    warehouses: "Склады",
    settings: "Настройки",
    integrations: "Интеграции",
    delivery: "Доставка",
    qrCodes: "QR коды",
    qrScanner: "QR Сканер",
    movements: "Движения",
    cashflow: "ДДС",
    sales: "Продажи POS",
    billing: "Биллинг",
    superAdmin: "Супер Админ",
    companies: "Компании",
    users: "Пользователи",
    logout: "Выйти",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Редактировать",
    delete: "Удалить",
    search: "Поиск",
    import: "Импорт",
    export: "Экспорт",
    light: "Светлая",
    dark: "Тёмная",
    language: "Язык",
    theme: "Режим",
    businessOS: "Business OS",
    controlCenter: "Operix Control Center",
  },
  en: {
    dashboard: "Dashboard",
    clients: "Clients",
    debts: "Debts",
    payments: "Payments",
    reports: "Reports",
    analytics: "Analytics",
    inventory: "Inventory",
    products: "Products",
    warehouses: "Warehouses",
    settings: "Settings",
    integrations: "Integrations",
    delivery: "Delivery",
    qrCodes: "QR codes",
    qrScanner: "QR Scanner",
    movements: "Movements",
    cashflow: "Cashflow",
    sales: "Sales POS",
    billing: "Billing",
    superAdmin: "Super Admin",
    companies: "Companies",
    users: "Users",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    import: "Import",
    export: "Export",
    light: "Light",
    dark: "Dark",
    language: "Language",
    theme: "Theme",
    businessOS: "Business OS",
    controlCenter: "Operix Control Center",
  },
};

function normalizeLang(value: string | null): Lang {
  if (value === "ru" || value === "en" || value === "uz") return value;
  return "uz";
}

const I18nContext = createContext<I18nValue>({
  lang: "uz",
  setLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    setLangState(normalizeLang(localStorage.getItem("operix_lang")));
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem("operix_lang", next);
  }

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: string, fallback?: string) => dictionary[lang]?.[key] || fallback || key,
    }),
    [lang],
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export function t(key: string, fallback?: string) {
  return dictionary.uz[key] || fallback || key;
}
