"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import LanguageSwitcher from "./LanguageSwitcher";

type StoredUser = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  companyId: string;
};

export default function AppLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setChecking(false);
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "operix_token=; path=/; max-age=0";
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
          Yuklanmoqda...
        </div>
      </div>
    );
  }

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

            <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 lg:block">
              {user?.fullName || "Admin"}
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
            >
              Chiqish
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}