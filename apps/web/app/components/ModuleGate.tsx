"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { hasModule, isBlockedCompany } from "../lib/access";

export default function ModuleGate({ module, children }: { module: string; children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setAllowed(hasModule(module));
    setBlocked(isBlockedCompany());
  }, [module]);

  if (blocked) {
    return (
      <div className="premium-card flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
        <Lock size={38} className="text-[#d92d20]" />
        <h2 className="mt-5 text-[26px] font-normal tracking-[-0.04em]">Kompaniya bloklangan</h2>
        <p className="mt-2 max-w-md text-[14px] leading-6 text-[#8aa0ba]">Obuna muddati yoki to‘lov holati sababli kirish yopilgan.</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="premium-card flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
        <Lock size={38} className="text-[#315efb]" />
        <h2 className="mt-5 text-[26px] font-normal tracking-[-0.04em]">Modul yopiq</h2>
        <p className="mt-2 max-w-md text-[14px] leading-6 text-[#8aa0ba]">{module} moduli sizning tarifingizda yoqilmagan.</p>
      </div>
    );
  }

  return <>{children}</>;
}
