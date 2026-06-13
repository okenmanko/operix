"use client";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="premium-label">{label}</span>
      {children}
    </label>
  );
}

export function PremiumInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="premium-input"
    />
  );
}

export function PremiumTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-[110px] w-full resize-none rounded-[18px] border border-[#dfe8f3] bg-white px-4 py-3 text-[14px] font-normal outline-none transition focus:border-[#9ec5fe] focus:ring-4 focus:ring-[#eef5ff]"
    />
  );
}
