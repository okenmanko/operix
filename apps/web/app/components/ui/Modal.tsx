"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open?: boolean;
  isOpen?: boolean;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  className?: string;
};

export function PremiumModal({
  open,
  isOpen,
  title,
  children,
  onClose,
  footer,
  className = "",
}: ModalProps) {
  const visible = open ?? isOpen ?? false;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className={`w-full max-w-[620px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] ${className}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[#111827]">{title || ""}</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7fa] text-[#64748b] hover:bg-[#eef3f8]"
            >
              ×
            </button>
          ) : null}
        </div>

        <div>{children}</div>

        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export const Modal = PremiumModal;
export default PremiumModal;
