import React, { useEffect, useState } from "react";
import api from "@/api/client";

const formatVND = (n) => (typeof n === "number" ? n : parseInt(n || 0, 10)).toLocaleString("vi-VN") + " đ";
const isPaid = (b) =>
  b?.payment_status === "paid" || b?.status === "paid" || b?.is_paid === 1 || !!b?.paid_at;

const StatusBadge = ({ paid }) =>
  paid ? (
    <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
      ĐÃ THANH TOÁN
    </span>
  ) : (
    <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
      Chưa thanh toán
    </span>
  );

export default function MyTickets() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/tickets"); // API trả list bookings của user
      setItems(Array.isArray(data) ? data : data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // reload nhẹ sau 2.5s để bắt IPN nếu vừa thanh toán xong
    const t = setTimeout(load, 2500);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <div className="p-6">Đang tải vé…</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {items.map((b) => {
        const paid = isPaid(b);
        return (
          <div key={b.id || b.code} className="mb-4 p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/40">
            <div className="rounded-2xl bg-slate-900/80 text-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm">
                  Mã vé: <b className="tracking-wider">{b.code}</b>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge paid={paid} />
                  <div className="font-extrabold text-lg">{formatVND(b.total_price)}</div>
                </div>
              </div>

              {/* các thông tin khác của vé */}
              <div className="mt-3 text-sm opacity-90">
                <div>Tuyến: {b.route_name || `${b.from_city} → ${b.to_city}`}</div>
                <div>Ghế: {Array.isArray(b.seat_numbers) ? b.seat_numbers.join(", ") : (b.seats_list || b.seat_number || "—")}</div>
                <div>Thời gian: {b.departure_time}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
