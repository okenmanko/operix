"use client";

export function PremiumTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
      <table className="w-full text-left text-[14px]">
        <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
          <tr>{headers.map((header) => <th key={header} className="p-4 font-normal">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
