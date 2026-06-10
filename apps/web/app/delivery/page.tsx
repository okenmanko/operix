"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Plus,
  Search,
  Send,
  Trash2,
  Truck,
  X,
} from "lucide-react";

type DeliveryItem = {
  name: string;
  qty: number;
  warehouse?: string;
};

type DeliveryOrder = {
  id: string;
  clientName: string;
  phone?: string | null;
  address: string;
  items?: DeliveryItem[];
  amount: number;
  currency: string;
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL";
  status: "NEW" | "ASSEMBLED" | "ON_WAY" | "DELIVERED" | "CANCELLED";
  courierName?: string | null;
  courierPhone?: string | null;
  deliveryDate?: string | null;
  comment?: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  new: number;
  assembled: number;
  onWay: number;
  delivered: number;
  cancelled: number;
  unpaid: number;
  totalAmountUZS: number;
  totalAmountUSD: number;
};

const statuses = [
  { value: "ALL", label: "Hammasi" },
  { value: "NEW", label: "Yangi" },
  { value: "ASSEMBLED", label: "Yig‘ildi" },
  { value: "ON_WAY", label: "Yo‘lda" },
  { value: "DELIVERED", label: "Yetkazildi" },
  { value: "CANCELLED", label: "Bekor" },
];

const emptyForm = {
  clientName: "",
  phone: "",
  address: "",
  amount: "",
  currency: "UZS",
  paymentStatus: "UNPAID",
  courierName: "",
  courierPhone: "",
  deliveryDate: "",
  comment: "",
  itemName: "",
  itemQty: "1",
  itemWarehouse: "",
};

function money(amount: number, currency = "UZS") {
  return `${new Intl.NumberFormat("ru-RU").format(Number(amount || 0))} ${currency}`;
}

function statusLabel(status: DeliveryOrder["status"]) {
  const map: Record<string, string> = {
    NEW: "Yangi",
    ASSEMBLED: "Yig‘ildi",
    ON_WAY: "Yo‘lda",
    DELIVERED: "Yetkazildi",
    CANCELLED: "Bekor",
  };
  return map[status] || status;
}

function paymentLabel(status: DeliveryOrder["paymentStatus"]) {
  const map: Record<string, string> = {
    UNPAID: "Pul olinadi",
    PAID: "To‘langan",
    PARTIAL: "Qisman",
  };
  return map[status] || status;
}

function cleanPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 7);
  const d = digits.slice(7, 9);
  let result = "";
  if (a) result += `+998 ${a}`;
  if (b) result += ` ${b}`;
  if (c) result += ` ${c}`;
  if (d) result += ` ${d}`;
  return result;
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(`http://localhost:4000${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<DeliveryItem[]>([]);

  async function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    const [ordersRes, statsRes] = await Promise.all([
      request(`/delivery?${params.toString()}`),
      request("/delivery/stats"),
    ]);

    const ordersData = await ordersRes.json();
    const statsData = await statsRes.json();

    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setStats(statsData && !statsData.statusCode ? statsData : null);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filteredOrders = useMemo(() => orders, [orders]);

  function openCreate() {
    setEditingOrder(null);
    setForm(emptyForm);
    setItems([]);
    setMessage("");
    setShowModal(true);
  }

  function openEdit(order: DeliveryOrder) {
    setEditingOrder(order);
    setForm({
      clientName: order.clientName || "",
      phone: order.phone || "",
      address: order.address || "",
      amount: String(order.amount || ""),
      currency: order.currency || "UZS",
      paymentStatus: order.paymentStatus || "UNPAID",
      courierName: order.courierName || "",
      courierPhone: order.courierPhone || "",
      deliveryDate: order.deliveryDate ? order.deliveryDate.slice(0, 16) : "",
      comment: order.comment || "",
      itemName: "",
      itemQty: "1",
      itemWarehouse: "",
    });
    setItems(Array.isArray(order.items) ? order.items : []);
    setMessage("");
    setShowModal(true);
  }

  function addItem() {
    if (!form.itemName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        name: form.itemName.trim(),
        qty: Number(form.itemQty || 1),
        warehouse: form.itemWarehouse.trim() || undefined,
      },
    ]);
    setForm((prev) => ({ ...prev, itemName: "", itemQty: "1", itemWarehouse: "" }));
  }

  async function saveOrder() {
    setMessage("");

    const payload = {
      clientName: form.clientName,
      phone: form.phone || undefined,
      address: form.address,
      amount: Number(form.amount || 0),
      currency: form.currency,
      paymentStatus: form.paymentStatus,
      courierName: form.courierName || undefined,
      courierPhone: form.courierPhone || undefined,
      deliveryDate: form.deliveryDate || undefined,
      comment: form.comment || undefined,
      items,
    };

    const res = await request(editingOrder ? `/delivery/${editingOrder.id}` : "/delivery", {
      method: editingOrder ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Xatolik yuz berdi");
      return;
    }

    setShowModal(false);
    await loadData();
  }

  async function changeStatus(id: string, nextStatus: string) {
    await request(`/delivery/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadData();
  }

  async function removeOrder(id: string) {
    if (!confirm("Dostavkani o‘chirasizmi?")) return;
    await request(`/delivery/${id}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <AppLayout title="Delivery" subtitle="Buyurtmalar, kuryerlar va yetkazib berish nazorati">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-slate-400">Jami zayavka</p>
          <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">{stats?.total || 0}</h3>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-slate-400">Yo‘lda</p>
          <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-sky-600">{stats?.onWay || 0}</h3>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-slate-400">Yetkazildi</p>
          <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-emerald-600">{stats?.delivered || 0}</h3>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-slate-400">Pul olinadi</p>
          <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">{stats?.unpaid || 0}</h3>
        </div>
      </div>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-950">Zayavkalar</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-400">Kuryer va statuslar bo‘yicha boshqaruv</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
                placeholder="Qidirish"
                className="w-48 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-sky-600"
            >
              <Plus size={16} />
              Yangi zayavka
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm font-medium text-slate-400">Yuklanmoqda...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Truck size={22} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">Dostavka zayavkasi yo‘q</p>
            <p className="mt-1 text-xs font-medium text-slate-400">Birinchi zayavkani yarating.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-semibold text-slate-950">{order.clientName}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{statusLabel(order.status)}</span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-slate-400">{order.phone || "Telefon yo‘q"}</p>
                  <p className="mt-2 text-[13px] font-medium text-slate-600">{order.address}</p>
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.slice(0, 4).map((item, index) => (
                        <span key={`${item.name}-${index}`} className="rounded-full bg-sky-50 px-3 py-1 text-[12px] font-semibold text-sky-700">
                          {item.name} × {item.qty}{item.warehouse ? ` · ${item.warehouse}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[12px] font-medium text-slate-400">Kuryer</p>
                  <p className="mt-1 text-[14px] font-semibold text-slate-800">{order.courierName || "Belgilanmagan"}</p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">{order.courierPhone || ""}</p>
                </div>

                <div>
                  <p className="text-[12px] font-medium text-slate-400">To‘lov</p>
                  <p className="mt-1 text-[14px] font-semibold text-slate-950">{money(order.amount, order.currency)}</p>
                  <p className="mt-1 text-[12px] font-semibold text-sky-600">{paymentLabel(order.paymentStatus)}</p>
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  <select
                    value={order.status}
                    onChange={(e) => changeStatus(order.id, e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none"
                  >
                    {statuses.filter((s) => s.value !== "ALL").map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={() => openEdit(order)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
                    <PackageCheck size={16} />
                  </button>
                  <button onClick={() => removeOrder(order.id)} className="rounded-xl border border-red-100 p-2 text-red-500 transition hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
                  {editingOrder ? "Zayavkani tahrirlash" : "Yangi dostavka"}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-slate-400">Mijoz, tovar, kuryer va to‘lov ma’lumotlari</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Mijoz ismi" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: cleanPhone(e.target.value) })} placeholder="Telefon" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Manzil" className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="Summa" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400">
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400">
                <option value="UNPAID">Pul olinadi</option>
                <option value="PAID">To‘langan</option>
                <option value="PARTIAL">Qisman</option>
              </select>
              <input type="datetime-local" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <input value={form.courierName} onChange={(e) => setForm({ ...form, courierName: e.target.value })} placeholder="Kuryer ismi" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <input value={form.courierPhone} onChange={(e) => setForm({ ...form, courierPhone: cleanPhone(e.target.value) })} placeholder="Kuryer telefoni" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Izoh" className="md:col-span-2 min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-[13px] font-semibold text-slate-700">Tovarlar</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_90px_1fr_auto]">
                <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="Tovar nomi" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                <input value={form.itemQty} onChange={(e) => setForm({ ...form, itemQty: e.target.value.replace(/\D/g, "") })} placeholder="Soni" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                <input value={form.itemWarehouse} onChange={(e) => setForm({ ...form, itemWarehouse: e.target.value })} placeholder="Sklad" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                <button type="button" onClick={addItem} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Qo‘shish</button>
              </div>
              {items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <button key={`${item.name}-${index}`} onClick={() => setItems(items.filter((_, i) => i !== index))} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
                      {item.name} × {item.qty}{item.warehouse ? ` · ${item.warehouse}` : ""} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{message}</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Bekor qilish</button>
              <button onClick={saveOrder} className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600">
                <Send size={16} />
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
