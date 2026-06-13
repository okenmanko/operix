"use client";

import { ActionKey, can } from "../../lib/permissions";

type Item = {
  label: string;
  icon?: React.ReactNode;
  action?: ActionKey;
  onClick: () => void;
  variant?: "primary" | "soft" | "danger";
};

export default function ActionBar({
  title,
  subtitle,
  items,
}: {
  title?: string;
  subtitle?: string;
  items: Item[];
}) {
  const visible = items.filter((item) => !item.action || can(item.action));
  if (!visible.length && !title) return null;

  return (
    <div className="premium-card mb-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {title ? <h2 className="text-[21px] font-normal tracking-[-0.04em] text-[#101828]">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-[13px] leading-5 text-[#8aa0ba]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {visible.map((item) => {
            const cls =
              item.variant === "danger"
                ? "bg-[#fff5f5] text-[#d92d20] hover:bg-[#fee4e2]"
                : item.variant === "soft"
                  ? "bg-[#f5f7fa] text-[#52637a] hover:bg-[#eef3f8] hover:text-[#315efb]"
                  : "bg-[#315efb] text-white shadow-[0_14px_30px_rgba(49,94,251,0.16)] hover:bg-[#2754de]";
            return (
              <button key={item.label} type="button" onClick={item.onClick} className={`h-12 rounded-[18px] px-5 text-[14px] font-normal transition ${cls}`}>
                <span className="inline-flex items-center gap-2">{item.icon}{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
