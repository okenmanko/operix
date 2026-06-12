"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-7 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-[32px] font-normal tracking-[-0.045em] text-[#111827]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-[15px] font-normal leading-6 text-[#6d7b90]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
