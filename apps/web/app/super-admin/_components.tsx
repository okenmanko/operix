"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { clearAuth } from "../lib/api";
import { useI18n } from "../lib/i18n";
import LangSwitcher from "../components/LangSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";
import CustomSelect, { SelectOption } from "../components/ui/CustomSelect";

export const MODULES = [
  "CRM",
  "DEBTS",
  "PAYMENTS",
  "REPORTS",
  "INVENTORY",
  "WAREHOUSES",
  "QR",
  "STOCK_MOVEMENT",
  "DELIVERY",
  "DDS",
  "ANALYTICS",
  "POS",
  "HR",
  "KPI",
  "AI_DIRECTOR",
  "MOYSKLAD",
  "ONE_C",
];

export const PLANS = ["STARTER", "BUSINESS", "PRO"];
export const STATUSES = ["TRIAL", "ACTIVE", "BLOCKED"];
export const ROLES = ["OWNER", "MANAGER", "ACCOUNTANT", "CASHIER", "ADMIN"];

export type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status: string;
  subscriptionPlan: string;
  enabledModules?: string[];
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
  monthlyPriceUZS?: number | null;
  createdAt?: string;
};

export type User = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  companyId: string;
  company?: { id: string; name: string };
};

const links = [
  { href: "/super-admin", labelKey: "dashboard", fallback: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/companies", labelKey: "companies", fallback: "Kompaniyalar", icon: Building2 },
  { href: "/super-admin/users", labelKey: "users", fallback: "Userlar", icon: Users },
  { href: "/super-admin/billing", labelKey: "billing", fallback: "Billing", icon: CreditCard },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[246px] flex-col border-r border-[var(--line)] bg-[var(--card)]/96 px-5 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.025)] backdrop-blur-xl">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[var(--blue-soft)] text-[var(--blue)]">
            <ShieldCheck size={23} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[18px] font-normal tracking-[-0.035em] text-[var(--text)]">Operix</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-2)]">
              {t("superAdmin")}
            </p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/super-admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center gap-3 rounded-[18px] px-4 text-[14px] font-normal transition ${
                  active
                    ? "border border-[var(--blue-line)] bg-[var(--blue-soft)] text-[var(--blue)]"
                    : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} /> {t(item.labelKey, item.fallback)}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            clearAuth();
            router.replace("/super-login");
          }}
          className="mt-auto flex h-12 items-center justify-center gap-2 rounded-[18px] border border-[var(--line)] bg-[var(--soft)] text-[14px] text-[var(--muted)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
        >
          <LogOut size={18} /> {t("logout")}
        </button>
      </aside>

      <section className="ml-[246px] min-h-screen px-9 py-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 flex justify-end gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export function PageTop({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-7 flex items-start justify-between gap-6">
      <div>
        <p className="mb-2 text-[12px] uppercase tracking-[0.18em] text-[var(--muted-2)]">
          {t("controlCenter")}
        </p>
        <h1 className="text-[38px] font-normal tracking-[-0.055em] text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[var(--muted)]">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[30px] border border-[var(--line)] bg-[var(--card)] shadow-[0_20px_55px_rgba(15,23,42,0.045)] ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "soft" | "danger";
  className?: string;
  type?: "button" | "submit";
}) {
  const cls =
    variant === "primary"
      ? "bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] shadow-[0_14px_30px_rgba(49,94,251,0.16)]"
      : variant === "danger"
        ? "bg-[var(--danger-soft)] text-[var(--danger)] hover:opacity-90"
        : "bg-[var(--soft)] text-[var(--muted)] hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`h-12 rounded-[18px] px-5 text-[14px] font-normal transition ${cls} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-[48px] w-full rounded-[17px] border border-[var(--input-line)] bg-[var(--input-bg)] px-4 text-[14px] font-normal text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[#9ec5fe] focus:ring-4 focus:ring-[var(--focus)]"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | SelectOption[];
}) {
  const normalized = options.map((x: any) =>
    typeof x === "string" ? { value: x, label: x } : x,
  );

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">
        {label}
      </span>
      <CustomSelect value={value} onChange={onChange} options={normalized} />
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "BLOCKED"
        ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return <span className={`rounded-full px-3 py-1.5 text-[12px] ${cls}`}>{status}</span>;
}

export function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      {children}
    </div>
  );
}
