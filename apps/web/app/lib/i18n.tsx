export type Lang = "uz" | "ru";

export const translations = {
  uz: {
    dashboard: "Dashboard",
    clients: "Mijozlar",
    debts: "Qarzlar",
    payments: "To‘lovlar",
    reports: "Hisobotlar",
    settings: "Sozlamalar",
    businessOS: "Business OS",
    operixCRM: "Operix CRM",
    clientList: "Mijozlar ro‘yxati",
    debtList: "Qarzlar ro‘yxati",
    paymentList: "To‘lovlar ro‘yxati",
    newClient: "Yangi mijoz",
    newDebt: "Yangi qarz",
    newPayment: "Yangi to‘lov",
    total: "Jami",
    phone: "Telefon",
    address: "Manzil",
    guarantor: "Kafil",
    guarantorPhone: "Kafil telefoni",
    debt: "Qarz",
    paid: "To‘langan",
    remaining: "Qoldiq",
    status: "Status",
    dueDate: "Muddat",
    clientsSubtitle: "Mijozlar va qarzdorlar bazasi",
    debtsSubtitle: "Qarzlar va qoldiq nazorati",
    paymentsSubtitle: "To‘lovlar tarixi",
  },
  ru: {
    dashboard: "Панель",
    clients: "Клиенты",
    debts: "Долги",
    payments: "Платежи",
    reports: "Отчёты",
    settings: "Настройки",
    businessOS: "Business OS",
    operixCRM: "Operix CRM",
    clientList: "Список клиентов",
    debtList: "Список долгов",
    paymentList: "Список платежей",
    newClient: "Новый клиент",
    newDebt: "Новый долг",
    newPayment: "Новый платёж",
    total: "Всего",
    phone: "Телефон",
    address: "Адрес",
    guarantor: "Поручитель",
    guarantorPhone: "Телефон поручителя",
    debt: "Долг",
    paid: "Оплачено",
    remaining: "Остаток",
    status: "Статус",
    dueDate: "Срок",
    clientsSubtitle: "База клиентов и должников",
    debtsSubtitle: "Контроль долгов и остатков",
    paymentsSubtitle: "История платежей",
  },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "uz";
  return (localStorage.getItem("operix_lang") as Lang) || "uz";
}

export function setLang(lang: Lang) {
  localStorage.setItem("operix_lang", lang);
  window.location.reload();
}