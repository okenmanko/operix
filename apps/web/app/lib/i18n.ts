"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type Lang = "uz" | "ru" | "en";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const dictionary: Record<Lang, Record<string, string>> = {
  uz: {
    dashboard: "Dashboard",
    dashboardSubtitle: "Operix core ko‘rsatkichlari: mijozlar, qarzlar, to‘lovlar va aktivlik.",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    todayPayment: "Bugungi to‘lov",
    uzsBalance: "UZS balans",
    usdBalance: "USD balans",
    debtStatuses: "Qarz statuslari",
    totalDebt: "Jami qarz",
    paid: "To‘langan",
    remaining: "Qoldiq",
    active: "Aktiv",
    closed: "Yopilgan",
    overdue: "Muddati o‘tgan",
    topDebtors: "Top qarzdorlar",
    noTopDebtors: "Top qarzdorlar yo‘q",
    client: "Mijoz",
    phone: "Telefon",
    debt: "Qarz",
    reports: "Hisobotlar",
    analytics: "Analytics",
    inventory: "Sklad",
    products: "Mahsulotlar",
    warehouses: "Omborlar",
    stockMovements: "Harakatlar",
    qrCodes: "QR kodlar",
    pos: "Sotuv POS",
    settings: "Sozlamalar",
    integrations: "Integratsiyalar",
    logout: "Chiqish",
    light: "Light",
    dark: "Dark",
    save: "Saqlash",
    search: "Qidirish",
    import: "Import",
    export: "Export",
  },
  ru: {
    dashboard: "Дашборд",
    dashboardSubtitle: "Ключевые показатели Operix: клиенты, долги, платежи и активность.",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    todayPayment: "Оплата сегодня",
    uzsBalance: "Баланс UZS",
    usdBalance: "Баланс USD",
    debtStatuses: "Статусы долгов",
    totalDebt: "Общий долг",
    paid: "Оплачено",
    remaining: "Остаток",
    active: "Активные",
    closed: "Закрытые",
    overdue: "Просроченные",
    topDebtors: "Топ должников",
    noTopDebtors: "Должников нет",
    client: "Клиент",
    phone: "Телефон",
    debt: "Долг",
    reports: "Отчёты",
    analytics: "Аналитика",
    inventory: "Склад",
    products: "Товары",
    warehouses: "Склады",
    stockMovements: "Движения",
    qrCodes: "QR коды",
    pos: "Продажи POS",
    settings: "Настройки",
    integrations: "Интеграции",
    logout: "Выйти",
    light: "Светлая",
    dark: "Тёмная",
    save: "Сохранить",
    search: "Поиск",
    import: "Импорт",
    export: "Экспорт",
  },
  en: {
    dashboard: "Dashboard",
    dashboardSubtitle: "Operix core metrics: clients, debts, payments and activity.",
    clients: "Clients",
    debts: "Debts",
    payments: "Payments",
    todayPayment: "Today payment",
    uzsBalance: "UZS balance",
    usdBalance: "USD balance",
    debtStatuses: "Debt statuses",
    totalDebt: "Total debt",
    paid: "Paid",
    remaining: "Remaining",
    active: "Active",
    closed: "Closed",
    overdue: "Overdue",
    topDebtors: "Top debtors",
    noTopDebtors: "No top debtors",
    client: "Client",
    phone: "Phone",
    debt: "Debt",
    reports: "Reports",
    analytics: "Analytics",
    inventory: "Inventory",
    products: "Products",
    warehouses: "Warehouses",
    stockMovements: "Movements",
    qrCodes: "QR codes",
    pos: "Sales POS",
    settings: "Settings",
    integrations: "Integrations",
    logout: "Logout",
    light: "Light",
    dark: "Dark",
    save: "Save",
    search: "Search",
    import: "Import",
    export: "Export",
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
    const saved = localStorage.getItem("operix_lang") as Lang | null;
    return saved === "ru" || saved === "en" || saved === "uz" ? saved : "uz";
  });

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem("operix_lang", next);
  }

  const value = useMemo<I18nValue>(() => ({
    lang,
    setLang,
    t: (key: string, fallback?: string) => dictionary[lang]?.[key] || fallback || key,
  }), [lang]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export function t(key: string, fallback?: string) {
  return dictionary.uz[key] || fallback || key;
}
