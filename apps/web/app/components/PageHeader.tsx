export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7">
      <h1 className="text-[42px] font-bold tracking-[-0.07em] text-[var(--text)] max-sm:text-[34px]">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-[820px] text-[15px] leading-6 text-[var(--muted)]">{subtitle}</p> : null}
    </header>
  );
}
