"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "soft" | "danger" | "ghost";

type PremiumButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export function PremiumButton({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}: PremiumButtonProps) {
  const cls =
    variant === "primary"
      ? "qanot-primary text-white"
      : variant === "danger"
        ? "bg-[var(--danger-bg)] text-[var(--danger-text)] shadow-[var(--shadow-soft)] hover:brightness-[0.98]"
        : variant === "ghost"
          ? "bg-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)]"
          : "qanot-soft";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-[16px] px-5 text-[13px] font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${cls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const Button = PremiumButton;
export default PremiumButton;
