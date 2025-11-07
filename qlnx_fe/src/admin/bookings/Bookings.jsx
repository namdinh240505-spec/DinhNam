// src/pages/admin/bookings/Bookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/client";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', msg:''}
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Chuẩn hóa payload về mảng
  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.data)) return payload.data;        // Laravel paginator
    if (Array.isArray(payload.bookings)) return payload.bookings; // { bookings: [...] }
    if (Array.isArray(payload.items)) return payload.items;       // { items: [...] }
    if (Array.isArray(payload.results)) return payload.results;   // { results: [...] }
    return [];
  };

  const loadBookings = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get("/bookings");
      setBookings(toArray(res.data));
    } catch (err) {
      setMsg({
        type: "err",
        msg: err?.response?.data?.message || "Không tải được vé",
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleConfirm = async (id) => {
    try {
      await api.put(`/bookings/${id}`, { status: "confirmed" });
      setMsg({ type: "ok", msg: "✅ Xác nhận thành công" });
      loadBookings();
    } catch {
      setMsg({ type: "err", msg: "❌ Thất bại khi xác nhận vé" });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Hủy vé này?")) return;
    try {
      await api.put(`/bookings/${id}`, { status: "canceled" });
      setMsg({ type: "ok", msg: "🗑️ Hủy vé thành công" });
      loadBookings();
    } catch {
      setMsg({ type: "err", msg: "❌ Thất bại khi hủy vé" });
    }
  };

  // Helpers hiển thị linh hoạt
  const routeFrom  = (b) => b?.trip?.route?.from ?? b?.route?.from ?? b?.from ?? "—";
  const routeTo    = (b) => b?.trip?.route?.to   ?? b?.route?.to   ?? b?.to   ?? "—";
  const bookDate   = (b) => b?.date ?? b?.trip?.date ?? b?.trip_date ?? "—";
  const seats      = (b) => b?.seats ?? b?.quantity ?? b?.seat_count ?? "—";
  const phone      = (b) => b?.phone ?? b?.customer_phone ?? "—";
  const name       = (b) => b?.name ?? b?.customer ?? b?.customer_name ?? "—";
  const status     = (b) => (b?.status ?? b?.state ?? "—").toLowerCase();

  // Lọc + tìm kiếm
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (bookings || []).filter((b) => {
      const okStatus = statusFilter === "all" ? true : status(b) === statusFilter;
      if (!okStatus) return false;
      if (!t) return true;
      return [b.id, name(b), phone(b), routeFrom(b), routeTo(b), bookDate(b), status(b)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
    });
  }, [bookings, q, statusFilter]);

  return (
    <div className="bk-wrap dark-bg">
      <div className="bk-card glass">
        {/* Head */}
        <div className="bk-head glass-soft">
          <div className="head-left">
            <div>
              <h2>Quản lý vé xe</h2>
              <p>Xem, lọc và xử lý vé của khách</p>
            </div>
          </div>

          <div className="head-actions">
            <div className="search">
              <span className="i">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên / SĐT / tuyến / ngày / trạng thái"
              />
            </div>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Lọc trạng thái"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="canceled">Đã hủy</option>
              <option value="paid">Đã thanh toán</option>
            </select>
            <button className="btn ghost" onClick={loadBookings}>↻ Tải lại</button>
          </div>
        </div>

        {/* Alerts */}
        {msg && (
          <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>
            {msg.msg}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sk-row" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="emo">🗂️</div>
            <div>Không có vé phù hợp.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 84 }}>Mã</th>
                  <th>Khách</th>
                  <th>SĐT</th>
                  <th>Tuyến</th>
                  <th>Ngày</th>
                  <th>Số ghế</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 240, textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const st = status(b);
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="id-badge">#{b.id}</span>
                      </td>
                      <td className="strong">{name(b)}</td>
                      <td>{phone(b)}</td>
                      <td>
                        <div className="route">
                          <span>{routeFrom(b)}</span>
                          <span className="arrow">→</span>
                          <span>{routeTo(b)}</span>
                        </div>
                      </td>
                      <td>{bookDate(b)}</td>
                      <td>
                        <span className="chip">{seats(b)}</span>
                      </td>
                      <td>
                        <span
                          className={
                            st === "confirmed"
                              ? "badge ok"
                              : st === "canceled"
                              ? "badge danger"
                              : st === "paid"
                              ? "badge info"
                              : "badge warn"
                          }
                        >
                          {st}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {st === "pending" && (
                            <>
                              <button className="btn primary sm" onClick={() => handleConfirm(b.id)}>
                                Xác nhận
                              </button>
                              <button className="btn danger sm" onClick={() => handleCancel(b.id)}>
                                Hủy
                              </button>
                            </>
                          )}
                          {st !== "pending" && <span className="muted">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .dark-bg{
          min-height: 100vh; padding: 24px 16px;
          background:
            radial-gradient(900px 420px at 5% -10%, #1b2551 0%, transparent 60%),
            radial-gradient(900px 420px at 95% -10%, #3b1f7a 0%, transparent 60%),
            linear-gradient(180deg, #0b1224 0%, #0a1122 60%, #0b1224 100%);
          color:#e5e7eb; font-family: Inter, system-ui;
        }
        .glass{
          max-width: 1200px; margin: 0 auto;
          background: rgba(13,20,42,.65);
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px; overflow:hidden;
          box-shadow: 0 18px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .glass-soft{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .bk-head{ display:flex; gap:12px; align-items:center; justify-content:space-between; padding:16px; }
        .head-left{ display:flex; align-items:center; gap:12px; }
        .head-left h2{ margin:0; font-weight:900; color:#fff; }
        .head-left p{ margin:2px 0 0; color:#9fb2e8; font-size:12px; }
        .head-icon{
          height:40px; width:40px; border-radius:12px;
          background: linear-gradient(135deg,#2563eb,#22d3ee);
          display:grid; place-items:center; font-size:20px; box-shadow: 0 6px 18px rgba(34,211,238,.25);
        }
        .head-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .search{ position:relative; }
        .search .i{ position:absolute; left:10px; top:50%; transform:translateY(-50%); opacity:.75; }
        .search input{
          width: 280px; padding:10px 12px 10px 34px; border-radius:12px; outline:none;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06); color:#e8edf7;
          transition: box-shadow .15s, border-color .15s, background .15s;
        }
        .search input:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); background: rgba(255,255,255,.08); }
        .select{
          padding:10px 12px; border-radius:12px; outline:none;
          border:1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06); color:#e8edf7;
        }

        .btn{ border:none; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:900; }
        .btn.primary{ background:#2563eb; color:#fff; box-shadow:0 12px 26px rgba(37,99,235,.35); }
        .btn.ghost{ background:rgba(255,255,255,.05); color:#e5edff; border:1px solid rgba(255,255,255,.12); }
        .btn.danger{ background:#ef4444; color:#fff; }
        .btn.sm{ padding:8px 10px; border-radius:10px; }
        .btn:active{ transform: translateY(1px); }

        .alert{ margin:12px 16px 0; padding:10px 12px; border-radius:12px; font-weight:800; border:1px solid; }
        .alert.ok{ background:rgba(34,197,94,.12); color:#86efac; border-color:rgba(34,197,94,.35); }
        .alert.err{ background:rgba(239,68,68,.12); color:#fca5a5; border-color:rgba(239,68,68,.35); }

        .table-wrap{ overflow:auto; }
        .tbl{ width:100%; border-collapse: collapse; color:#eef2ff; }
        .tbl th, .tbl td{ padding:14px; border-bottom:1px solid rgba(255,255,255,.08); vertical-align: middle; }
        .tbl thead th{ text-align:left; font-weight:900; color:#cdd7ff; background:rgba(255,255,255,.04); }
        .tbl tbody tr:nth-child(even){ background: rgba(255,255,255,.02); }
        .tbl tbody tr:hover{ background: rgba(59,130,246,.08); }
        .strong{ font-weight:800; color:#ffffff; }

        .route{ display:flex; align-items:center; gap:6px; }
        .route .arrow{ opacity:.7; }

        .chip{
          display:inline-block; padding:4px 8px; border-radius:8px; font-weight:800;
          background: rgba(99,102,241,.15); color:#dbe4ff; border:1px solid rgba(99,102,241,.25);
        }
        .badge{ padding:4px 10px; border-radius:999px; font-weight:900; text-transform: capitalize; }
        .badge.ok{ background:rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
        .badge.warn{ background:rgba(245,158,11,.15); color:#fde68a; border:1px solid rgba(245,158,11,.35); }
        .badge.danger{ background:rgba(239,68,68,.15); color:#fecaca; border:1px solid rgba(239,68,68,.35); }
        .badge.info{ background:rgba(59,130,246,.18); color:#c7ddff; border:1px solid rgba(59,130,246,.35); }

        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }
        .muted{ color:#9fb2e8; }

        .skeleton{ padding: 14px 16px; display:grid; gap:10px; }
        .sk-row{
          height:48px; border-radius:12px;
          background: linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06));
          background-size:200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer{ 0%{background-position: 0 0;} 100%{background-position: -200% 0;} }

        .empty{ text-align:center; padding:28px 0; color:#9fb2e8; }
        .empty .emo{ font-size: 20px; margin-bottom: 6px; }
      `}</style>
    </div>
  );
}
