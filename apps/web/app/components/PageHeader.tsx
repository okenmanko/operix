export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[40px] font-semibold tracking-[-0.07em] text-[var(--text)] max-md:text-[32px]">{title}</h1>
      {subtitle ? <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[var(--muted)]">{subtitle}</p> : null}
    </div>
  );
}
