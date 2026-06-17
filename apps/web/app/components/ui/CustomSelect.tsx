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
        className={`flex h-[48px] w-full items-center justify-between rounded-[17px] border bg-[var(--input-bg)] px-4 text-left text-[14px] font-normal text-[var(--text)] shadow-[0_8px_22px_rgba(15,23,42,0.035)] outline-none transition ${
          open ? "border-[var(--blue)] ring-4 ring-[var(--focus)]" : "border-[var(--input-line)] hover:border-[var(--line)]"
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
        <div className="absolute left-0 right-0 top-[56px] z-[100] max-h-[300px] overflow-auto rounded-[20px] border border-[var(--line)] bg-[var(--card)] p-2 shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
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
                className={`flex h-[46px] w-full items-center justify-between rounded-[15px] px-3 text-[13px] font-normal transition ${
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
