import Sidebar from "./Sidebar";
import LanguageSwitcher from "./LanguageSwitcher";

export default function AppLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="ml-[230px] min-h-screen px-10 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-[-0.045em] text-slate-950">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1.5 text-[14px] font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700">
              Digi World
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}