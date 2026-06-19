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
    brand: "qanot",
    dashboard: "Dashboard",
    finance: "Moliya",
    debtors: "Qarzdorlar",
    warehouseOS: "Sklad",
    sales: "Sotuv",
    reports: "Hisobot",
    settings: "Sozlamalar",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    analytics: "Analitika",
    inventory: "Sklad",
    products: "Tovarlar",
    warehouses: "Omborlar",
    integrations: "Integratsiyalar",
    delivery: "Dostavka",
    qrCodes: "QR kodlar",
    movements: "Harakatlar",
    cashflow: "Pul oqimi",
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
    businessOS: "Business OS",
    dashboardSubtitle: "Pul, qarz, sklad va xavflar bitta tartibli ekranda.",
    ownerPanel: "Bugungi boshqaruv paneli",
    ownerPanelSubtitle: "Egaga kerak bo‘lgan asosiy signal va raqamlar.",
    todayRevenue: "Bugungi tushum",
    todayPayment: "Bugungi to‘lov",
    debtRisk: "Qarz riski",
    stockValue: "Sklad qiymati",
    businessHealth: "Business health",
    attentionNeeded: "E’tibor kerak",
    aiDirector: "AI Director",
    todayAdvice: "Bugungi maslahat",
    aiAdviceText: "Pul, qarz va skladni har kuni tekshiring. Muddati o‘tgan qarz ko‘paysa, savdo real pulga aylanmaydi.",
    overdueDebtsText: "ta muddati o‘tgan qarz bor",
    usdDebtText: "USD qarz nazoratda",
    stockSyncText: "Sklad qoldig‘ini sync qilish kerak",
    money: "Pul",
    uzsIncome: "UZS tushum",
    usdIncome: "USD tushum",
    paymentCount: "To‘lovlar soni",
    debtsBlock: "Qarzlar",
    uzsRemaining: "UZS qoldiq",
    usdRemaining: "USD qoldiq",
    activeDebt: "Aktiv qarz",
    stockBlock: "Sklad",
    productTypes: "Mahsulot turi",
    warehouseCount: "Omborlar",
    stockPieces: "Qoldiq dona",
    openReport: "Hisobotni ochish",
  },
  ru: {
    brand: "qanot",
    dashboard: "Дашборд",
    finance: "Финансы",
    debtors: "Должники",
    warehouseOS: "Склад",
    sales: "Продажи",
    reports: "Отчёты",
    settings: "Настройки",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    analytics: "Аналитика",
    inventory: "Склад",
    products: "Товары",
    warehouses: "Склады",
    integrations: "Интеграции",
    delivery: "Доставка",
    qrCodes: "QR коды",
    movements: "Движения",
    cashflow: "ДДС",
    logout: "Выйти",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Изменить",
    delete: "Удалить",
    search: "Поиск",
    import: "Импорт",
    export: "Экспорт",
    light: "Светлая",
    dark: "Тёмная",
    businessOS: "Business OS",
    dashboardSubtitle: "Деньги, долги, склад и риски на одном аккуратном экране.",
    ownerPanel: "Панель управления на сегодня",
    ownerPanelSubtitle: "Главные сигналы и цифры для владельца.",
    todayRevenue: "Выручка сегодня",
    todayPayment: "Платежи сегодня",
    debtRisk: "Риск долгов",
    stockValue: "Стоимость склада",
    businessHealth: "Здоровье бизнеса",
    attentionNeeded: "Нужно внимание",
    aiDirector: "AI Директор",
    todayAdvice: "Совет на сегодня",
    aiAdviceText: "Проверяйте деньги, долги и склад каждый день. Если просрочки растут, продажи не превращаются в реальные деньги.",
    overdueDebtsText: "просроченных долгов",
    usdDebtText: "USD долг под контролем",
    stockSyncText: "Нужно обновить остатки склада",
    money: "Деньги",
    uzsIncome: "Поступления UZS",
    usdIncome: "Поступления USD",
    paymentCount: "Кол-во платежей",
    debtsBlock: "Долги",
    uzsRemaining: "Остаток UZS",
    usdRemaining: "Остаток USD",
    activeDebt: "Активные долги",
    stockBlock: "Склад",
    productTypes: "Видов товара",
    warehouseCount: "Склады",
    stockPieces: "Остаток, шт",
    openReport: "Открыть отчёт",
  },
  en: {
    brand: "qanot",
    dashboard: "Dashboard",
    finance: "Finance",
    debtors: "Debtors",
    warehouseOS: "Stock",
    sales: "Sales",
    reports: "Reports",
    settings: "Settings",
    clients: "Clients",
    debts: "Debts",
    payments: "Payments",
    analytics: "Analytics",
    inventory: "Stock",
    products: "Products",
    warehouses: "Warehouses",
    integrations: "Integrations",
    delivery: "Delivery",
    qrCodes: "QR codes",
    movements: "Movements",
    cashflow: "Cashflow",
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
    businessOS: "Business OS",
    dashboardSubtitle: "Money, debts, stock and risks on one clean screen.",
    ownerPanel: "Today’s control panel",
    ownerPanelSubtitle: "Key signals and numbers for the owner.",
    todayRevenue: "Revenue today",
    todayPayment: "Payments today",
    debtRisk: "Debt risk",
    stockValue: "Stock value",
    businessHealth: "Business health",
    attentionNeeded: "Needs attention",
    aiDirector: "AI Director",
    todayAdvice: "Today’s advice",
    aiAdviceText: "Check money, debts and stock every day. When overdue debt grows, sales do not turn into real cash.",
    overdueDebtsText: "overdue debts",
    usdDebtText: "USD debt under control",
    stockSyncText: "Stock balances need sync",
    money: "Money",
    uzsIncome: "UZS income",
    usdIncome: "USD income",
    paymentCount: "Payments count",
    debtsBlock: "Debts",
    uzsRemaining: "UZS remaining",
    usdRemaining: "USD remaining",
    activeDebt: "Active debt",
    stockBlock: "Stock",
    productTypes: "Product types",
    warehouseCount: "Warehouses",
    stockPieces: "Stock pieces",
    openReport: "Open report",
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
    setLangState(normalizeLang(localStorage.getItem("operix_lang") || localStorage.getItem("qanot_lang")));
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("operix_lang", next);
      localStorage.setItem("qanot_lang", next);
    }
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
