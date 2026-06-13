"use client";

export function PremiumButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "soft" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const cls =
    variant === "primary"
      ? "bg-[#315efb] text-white shadow-[0_14px_30px_rgba(49,94,251,0.14)] hover:bg-[#2754de]"
      : variant === "danger"
        ? "bg-[#fff5f5] text-[#d92d20] hover:bg-[#fee4e2]"
        : "bg-[#f5f7fa] text-[#52637a] hover:bg-[#eef3f8] hover:text-[#315efb]";

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`h-12 rounded-[18px] px-5 text-[14px] font-normal transition disabled:cursor-not-allowed disabled:opacity-50 ${cls} ${className}`}>
      {children}
    </button>
  );
}
