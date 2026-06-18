"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5 max-md:block">
      <div>
        <h1 className="text-[30px] font-medium tracking-[-0.06em] text-[var(--text)] max-sm:text-[26px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[var(--muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 max-md:mt-4">{action}</div> : null}
    </div>
  );
}
