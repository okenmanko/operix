export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-950">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}