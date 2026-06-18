"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { apiUpload, downloadFile } from "../lib/api";
import { can } from "../lib/permissions";

type ImportResult = {
  ok?: boolean;
  message?: string;
  rowsRead?: number;
  rowsProcessed?: number;
  debtsCreated?: number;
  clientsCreated?: number;
  clientsUpdated?: number;
  skipped?: number;
  negativeRows?: number;
  importedUsdTotal?: number;
  importedUzsTotal?: number;
  totalUSD?: number;
  totalUZS?: number;
  skippedRows?: Array<{ row: number; reason: string; name?: string }>;
};

export default function ClientsExcelTools({ onDone }: { onDone?: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function upload(file: File) {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setResult(null);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "replace");

      const data = await apiUpload<ImportResult>("/debts/import-excel", fd);
      setResult(data);
      setMessage(
        data?.message ||
          `Excel import: ${data?.debtsCreated || 0} ta qarz. USD ${num(data?.importedUsdTotal ?? data?.totalUSD)}, UZS ${num(data?.importedUzsTotal ?? data?.totalUZS)}.`,
      );

      onDone?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import xatosi");
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    try {
      setError("");
      setMessage("");
      await downloadFile("/debts/export-excel", "QARZ13-operix-export.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export xatosi");
    }
  }

  if (!can("clients:import") && !can("clients:export")) return null;

  return (
    <div className="premium-card mb-5 p-5">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-[860px]">
          <h2 className="text-[21px] font-normal tracking-[-0.04em] text-[var(--text)]">
            1C / QARZ13 Excel import
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
            Import bosilganda eski Operix qarzlari tozalanadi va Excel yagona manba bo‘ladi. Format: B=Клиент, C=Тел, D=Срок, E=Доллар, F=Сум. Data 5-qatordan boshlanadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {can("clients:import") ? (
            <button disabled={loading} onClick={() => inputRef.current?.click()} className="premium-button premium-button-primary disabled:opacity-60">
              <span className="inline-flex items-center gap-2">
                <Upload size={17} /> {loading ? "Import..." : "Excel import"}
              </span>
            </button>
          ) : null}

          {can("clients:export") ? (
            <button onClick={exportExcel} className="premium-button premium-button-soft">
              <span className="inline-flex items-center gap-2">
                <Download size={17} /> Excel export
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p>{message}</p>
          {result ? (
            <p className="mt-1 opacity-90">
              Qator: {num(result.rowsRead)} | Kiritildi: {num(result.rowsProcessed)} | Skip: {num(result.skipped)} | Minus: {num(result.negativeRows)}
            </p>
          ) : null}
        </div>
      ) : null}

      {result?.skippedRows?.length ? (
        <details className="mt-3 rounded-[16px] border border-[var(--border)] bg-[var(--card-soft)] px-4 py-3 text-[12px] text-[var(--muted)]">
          <summary className="cursor-pointer text-[var(--text)]">Skip qatorlar</summary>
          <div className="mt-3 space-y-1">
            {result.skippedRows.slice(0, 12).map((row) => (
              <p key={`${row.row}-${row.reason}`}>#{row.row}: {row.reason} {row.name ? `— ${row.name}` : ""}</p>
            ))}
          </div>
        </details>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function num(value: any) {
  return Number(value || 0).toLocaleString("ru-RU");
}
