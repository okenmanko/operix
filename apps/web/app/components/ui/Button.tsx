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
      ? "bg-[#315efb] text-white shadow-[0_14px_30px_rgba(49,94,251,0.14)] hover:bg-[#2754de]"
      : variant === "danger"
        ? "bg-[#fff5f5] text-[#d92d20] hover:bg-[#fee4e2]"
        : variant === "ghost"
          ? "bg-transparent text-[#52637a] hover:bg-[#f5f7fa]"
          : "bg-[#f5f7fa] text-[#52637a] hover:bg-[#eef3f8] hover:text-[#315efb]";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center rounded-[18px] px-5 text-[14px] font-normal transition disabled:cursor-not-allowed disabled:opacity-50 ${cls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const Button = PremiumButton;
export default PremiumButton;
