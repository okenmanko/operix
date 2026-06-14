"use client";

import type { ReactNode } from "react";

type ActionItem = {
  label: string;
  icon?: ReactNode;
  action?: string;
  href?: string;
  variant?: "primary" | "soft" | "danger" | "ghost";
  onClick?: () => void;
};

type ActionBarProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  items?: ActionItem[];
  className?: string;
};

export function ActionBar({
  title,
  subtitle,
  children,
  items = [],
  className = "",
}: ActionBarProps) {
  return (
    <div className={`mb-5 rounded-[26px] border border-[#e7edf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          {title ? (
            <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[#111827]">
              {title}
            </h2>
          ) : null}

          {subtitle ? (
            <p className="mt-1 text-[13px] text-[#8aa0ba]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {items.map((item, index) => {
            const variant = item.variant || (index === 0 ? "primary" : "soft");

            const cls =
              variant === "primary"
                ? "bg-[#315efb] text-white shadow-[0_14px_30px_rgba(49,94,251,0.14)] hover:bg-[#2754de]"
                : variant === "danger"
                  ? "bg-[#fff5f5] text-[#d92d20] hover:bg-[#fee4e2]"
                  : variant === "ghost"
                    ? "bg-transparent text-[#52637a] hover:bg-[#f5f7fa]"
                    : "bg-[#f5f7fa] text-[#52637a] hover:bg-[#eef3f8] hover:text-[#315efb]";

            const content = (
              <>
                {item.icon ? <span className="flex items-center">{item.icon}</span> : null}
                <span>{item.label}</span>
              </>
            );

            if (item.href) {
              return (
                <a
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-[16px] px-4 text-[13px] font-normal transition ${cls}`}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                onClick={item.onClick}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-[16px] px-4 text-[13px] font-normal transition ${cls}`}
              >
                {content}
              </button>
            );
          })}

          {children}
        </div>
      </div>
    </div>
  );
}

export default ActionBar;
