"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Warehouse = {
  id: string;
  name: string;
  address?: string | null;
  productCount?: number;
  productTypes?: number;
  totalQuantity?: number;
  quantity?: number;
  totalValue?: number;
  value?: number;
};

export default function WarehousesPage() {
  const { t } = useI18n();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Warehouse[]>("/inventory/warehouses");
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("warehouseLoadError"));
    }
  }

  useEffect(() => { load(); }, []);

  const totalQuantity = warehouses.reduce((sum, item) => sum + Number(item.totalQuantity || item.quantity || 0), 0);
  const totalValue = warehouses.reduce((sum, item) => sum + Number(item.totalValue || item.value || 0), 0);

  return (
    <AppLayout title={t("warehouses")} subtitle={t("warehousesSubtitleClean")}>
      {error ? <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <Stat label={t("warehouseCount")} value={`${num(warehouses.length)} ${t("pcsShort")}`} />
        <Stat label={t("stockQty")} value={`${num(totalQuantity)} ${t("unitPcs")}`} />
        <Stat label={t("warehouseValue")} value={money(totalValue, "USD")} />
      </div>

      <div className="premium-card mt-5 p-6">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("warehouseList")}</h2>
            <p className="mt-1 text-[14px] text-[var(--muted)]">{t("warehouseListSubtitle")}</p>
          </div>
          <Link href="/integrations" className="premium-button premium-button-primary max-md:w-full">{t("syncMoySklad")}</Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-[var(--card)]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[var(--soft-card)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
              <tr>
                <th className="px-4 py-3 font-normal">{t("warehouse")}</th>
                <th className="px-4 py-3 text-right font-normal">{t("productCount")}</th>
                <th className="px-4 py-3 text-right font-normal">{t("quantity")}</th>
                <th className="px-4 py-3 text-right font-normal">{t("stockValue")}</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]">
                  <td className="px-4 py-4 font-semibold">
                    <Link href={`/warehouses/${encodeURIComponent(warehouse.id)}`} className="hover:text-[#315efb]">{warehouse.name}</Link>
                    <p className="mt-1 text-[12px] font-normal text-[var(--muted)]">{warehouse.address || "—"}</p>
                  </td>
                  <td className="px-4 py-4 text-right">{num(warehouse.productCount || warehouse.productTypes || 0)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{num(warehouse.totalQuantity || warehouse.quantity || 0)} {t("unitPcs")}</td>
                  <td className="px-4 py-4 text-right font-semibold">{money(warehouse.totalValue || warehouse.value || 0, "USD")}</td>
                </tr>
              ))}
              {!warehouses.length ? <tr><td colSpan={4} className="p-10 text-center text-[var(--muted)]">{t("noWarehouses")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-4 whitespace-nowrap text-[27px] font-semibold tracking-[-0.06em]">{value}</p></div>;
}
