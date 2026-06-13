"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { apiUpload, downloadFile } from "../lib/api";
import { can } from "../lib/permissions";

export default function ClientsExcelTools({ onDone }: { onDone?: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(file: File) {
    try {
      setError("");
      setMessage("");

      const fd = new FormData();
      fd.append("file", file);

      const result = await apiUpload<any>("/clients/import-excel", fd);

      setMessage(
        `QARZ13 import: qator ${result?.rowsProcessed || 0}, qarz ${result?.debtsCreated || 0}. USD ${Number(result?.importedUsdTotal || 0).toLocaleString("ru-RU")}, UZS ${Number(result?.importedUzsTotal || 0).toLocaleString("ru-RU")}. Minus qatorlar: ${result?.negativeRows || 0}.`,
      );

      onDone?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import xatosi");
    }
  }

  async function exportExcel() {
    try {
      setError("");
      setMessage("");
      await downloadFile("/clients/export-excel", "QARZ13-operix-export.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export xatosi");
    }
  }

  async function downloadTemplate() {
    try {
      setError("");
      setMessage("");
      await downloadFile("/clients/import-template", "QARZ13-shablon.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Shablon yuklanmadi");
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
        <div className="max-w-[820px]">
          <h2 className="text-[21px] font-normal tracking-[-0.04em] text-[#111827]">
            QARZ13 Excel import / export
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[#8aa0ba]">
            Shu eski QARZ13.06.26.xls formatini avtomatik o‘qiydi: A=Номер, B=Клиент, C=Тел, D=Срок, E=Доллар, F=Сум.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {can("clients:import") ? (
            <button onClick={downloadTemplate} className="premium-button premium-button-soft">
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet size={17} /> QARZ13 shablon
              </span>
            </button>
          ) : null}

          {can("clients:import") ? (
            <button onClick={() => inputRef.current?.click()} className="premium-button premium-button-soft">
              <span className="inline-flex items-center gap-2">
                <Upload size={17} /> Import
              </span>
            </button>
          ) : null}

          {can("clients:export") ? (
            <button onClick={exportExcel} className="premium-button premium-button-primary">
              <span className="inline-flex items-center gap-2">
                <Download size={17} /> Export
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-[16px] bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[16px] bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
