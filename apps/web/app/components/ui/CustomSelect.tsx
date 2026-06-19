"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; icon?: React.ReactNode };

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Tanlang",
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = options.find((item) => item.value === value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between rounded-[16px] border bg-[var(--surface)] px-4 text-left text-[14px] font-medium text-[var(--text)] shadow-[var(--shadow-soft)] outline-none transition ${
          open ? "border-[var(--blue)] ring-4 ring-[var(--focus)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected?.icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-[11px] bg-[var(--blue-soft)] text-[var(--blue)]">
              {selected.icon}
            </span>
          ) : null}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <ChevronDown size={17} strokeWidth={2} className={`shrink-0 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[56px] z-[100] max-h-[300px] overflow-auto rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
          {options.map((item) => {
            const active = item.value === value;
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`flex h-[44px] w-full items-center justify-between rounded-[14px] px-3 text-[13px] font-medium transition ${
                  active ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "text-[var(--text)] hover:bg-[var(--hover)]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {item.icon ? <span className={active ? "text-[var(--blue)]" : "text-[var(--muted)]"}>{item.icon}</span> : null}
                  <span className="truncate">{item.label}</span>
                </span>
                {active ? <Check size={17} strokeWidth={2.2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
