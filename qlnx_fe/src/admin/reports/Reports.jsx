// src/pages/admin/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/client";

/* ===== helpers ===== */
const money = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v || 0);

const fmtDate = (s) => (typeof s === "string" ? s.slice(0, 10) : s || "—");
const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export default function Reports() {
  const [range, setRange] = useState(() => ({
    start: addDays(todayStr(), -7),
    end: todayStr(),
  }));
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const summary = useMemo(() => {
    if (!list) return { days: 0, orders: 0, tickets: 0, revenue: 0, revenue_formatted: money(0) };
    return {
      days: list?.summary?.days ?? list?.data?.length ?? 0,
      orders: list?.summary?.orders ?? 0,
      tickets: list?.summary?.tickets ?? 0,
      revenue: list?.summary?.revenue ?? 0,
      revenue_formatted: list?.summary?.revenue_formatted ?? money(list?.summary?.revenue ?? 0),
    };
  }, [list]);

  const fetchRange = async () => {
    setLoading(true);
    setErr("");
    try {
      const qs = `?start=${range.start}&end=${range.end}`;
      const res = await api.get(`/reports${qs}`);
      // Chuẩn hoá
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setList({ data, summary: res.data?.summary });
    } catch (e) {
      setErr(e?.response?.data?.message || "Không tải được dữ liệu");
      setList({ data: [] });
    } finally {
      setLoading(false);
    }
  };

  const setQuick = (type) => {
    const today = todayStr();
    if (type === "today") return setRange({ start: today, end: today });
    if (type === "7d")    return setRange({ start: addDays(today, -6), end: today });
    if (type === "30d")   return setRange({ start: addDays(today, -29), end: today });
  };

  const exportCSV = () => {
    const rows = (list?.data || []).map(r => ({
      date: fmtDate(r.report_date),
      orders: r.orders_count ?? 0,
      tickets: r.tickets_sold ?? 0,
      revenue: r.revenue ?? 0,
    }));
    const header = "Ngày,Đơn,Vé,Doanh thu\n";
    const body = rows.map(r => [r.date, r.orders, r.tickets, r.revenue].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${range.start}_${range.end}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  useEffect(() => { fetchRange(); }, []); // load mặc định 7 ngày

  return (
    <div className="mx-auto max-w-[1200px] p-2 sm:p-4">
      <div className="report-card">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8">
          <h1 className="text-2xl font-bold text-gray-100">Báo cáo doanh thu</h1>
          <p className="text-sm text-gray-400 mt-1">Xem, lọc và xuất doanh thu theo ngày</p>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input-soft"
                value={range.start}
                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              />
              <span className="text-gray-500">→</span>
              <input
                type="date"
                className="input-soft"
                value={range.end}
                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <button className="chip" onClick={() => setQuick("today")}>Hôm nay</button>
              <button className="chip" onClick={() => setQuick("7d")}>7 ngày</button>
              <button className="chip" onClick={() => setQuick("30d")}>30 ngày</button>
            </div>

            <div className="ml-auto flex gap-2">
              <button onClick={fetchRange} className="btn-soft" title="Lấy báo cáo">↻ Tải lại</button>
              <button onClick={exportCSV} className="btn-soft">⬇ Xuất CSV</button>
            </div>
          </div>

          {/* Tổng kết */}
          {summary.days > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              Tổng <b className="text-gray-200">{summary.days}</b> ngày ·{" "}
              <b className="text-gray-200">{money(summary.revenue)}</b> ·{" "}
              {summary.orders} đơn · {summary.tickets} vé
            </div>
          )}

          {err && (
            <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {err}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm table-soft">
            <thead>
              <tr>
                <th className="px-8 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 text-left">Đơn</th>
                <th className="px-4 py-3 text-left">Số ghế</th>
                <th className="px-4 py-3 text-left">Doanh thu</th>
                <th className="px-4 py-3 text-right w-[120px]">—</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="row-soft">
                    <td className="px-8 py-3"><div className="skeleton w-40" /></td>
                    <td className="px-4 py-3"><div className="skeleton w-10" /></td>
                    <td className="px-4 py-3"><div className="skeleton w-10" /></td>
                    <td className="px-4 py-3"><div className="skeleton w-24" /></td>
                    <td className="px-4 py-3 text-right text-gray-500">—</td>
                  </tr>
                ))
              ) : !list || list.data.length === 0 ? (
                <tr>
                  <td className="px-8 py-6 text-gray-400" colSpan={5}>
                    Không có dữ liệu trong khoảng đã chọn.
                  </td>
                </tr>
              ) : (
                list.data.map((r) => (
                  <tr key={r.report_date} className="row-soft">
                    <td className="px-8 py-3 whitespace-nowrap">{fmtDate(r.report_date)}</td>
                    <td className="px-4 py-3">
                      <span className="pill pill-blue">{r.orders_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="pill pill-indigo">{r.tickets_sold ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{money(r.revenue ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="h-6" />
      </div>

      {/* ===== Inline styles đồng bộ theme glassy ===== */}
      <style>{`
        .report-card {
          position: relative;
          border-radius: 24px;
          background: rgba(17,24,39,.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 20px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
          overflow: hidden;
        }
        .report-card::before {
          content: "";
          position: absolute; inset: 0; padding: 1px; border-radius: 24px;
          background: radial-gradient(1200px 400px at 80% -100%,
                      rgba(2,12,22,.35), rgba(30,144,255,.35) 45%, rgba(255,255,255,0) 70%) border-box;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none;
        }
        .input-soft{
          background: rgba(0,0,0,.3);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          padding: 8px 12px;
          color: #e5e7eb;
          outline: none;
        }
        .input-soft:focus{ box-shadow: 0 0 0 2px rgba(255,255,255,.2); }
        .btn-soft{
          padding: 8px 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.08);
          color: #e5e7eb;
          transition: background .2s ease, transform .05s ease;
        }
        .btn-soft:hover{ background: rgba(255,255,255,.15); }
        .btn-soft:active{ transform: translateY(1px); }
        .chip{
          padding: 6px 10px; border-radius: 999px;
          font-size: 12px;
          border: 1px solid rgba(30,144,255,.35);
          background: rgba(30,144,255,.12);
          color: #a0cfff;
        }
        .table-soft thead{
          color: #9ca3af;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .table-soft .row-soft{
          border-top: 1px solid rgba(255,255,255,.05);
        }
        .table-soft .row-soft:hover{
          background: rgba(255,255,255,.03);
        }
        .pill{
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 999px;
          font-weight: 600; border: 1px solid;
        }
        .pill-blue{
          background: rgba(59,130,246,.15);
          color: #93c5fd;
          border-color: rgba(96,165,250,.3);
        }
        .pill-indigo{
          background: rgba(99,102,241,.15);
          color: #c7d2fe;
          border-color: rgba(129,140,248,.3);
        }
        .skeleton{
          height: 20px; border-radius: 6px; opacity:.7;
          background: linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.12), rgba(255,255,255,.05));
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer{
          0%{ background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
