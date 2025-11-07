// src/pages/admin/customers/Customers.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/client";
import { Link } from "react-router-dom";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:''}
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Chuẩn hóa payload => mảng
  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.data)) return payload.data;         // paginator
    if (Array.isArray(payload.users)) return payload.users;       // { users: [...] }
    if (Array.isArray(payload.items)) return payload.items;       // { items: [...] }
    if (Array.isArray(payload.results)) return payload.results;   // { results: [...] }
    // 1 object đơn
    if (payload.id) return [payload];
    return [];
  };

  async function loadCustomers() {
    setLoading(true);
    setMsg(null);
    try {
      // linh hoạt: /users ưu tiên, fallback /user
      let res;
      try {
        res = await api.get("/users");
      } catch {
        res = await api.get("/user");
      }
      setCustomers(toArray(res?.data));
    } catch {
      setMsg({ type: "err", text: "Không tải được khách hàng" });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleBlock = async (id) => {
    try {
      await api.put(`/user/${id}`, { blocked: true });
      setMsg({ type: "ok", text: "Đã khóa tài khoản" });
      loadCustomers();
    } catch {
      setMsg({ type: "err", text: "Thao tác thất bại" });
    }
  };
  const handleUnblock = async (id) => {
    try {
      await api.put(`/user/${id}`, { blocked: false });
      setMsg({ type: "ok", text: "Đã mở khóa tài khoản" });
      loadCustomers();
    } catch {
      setMsg({ type: "err", text: "Thao tác thất bại" });
    }
  };

  // Tìm kiếm + lọc
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (customers || []).filter((c) => {
      const status = c?.blocked ? "blocked" : "active";
      const okStatus = statusFilter === "all" ? true : statusFilter === status;
      if (!okStatus) return false;
      if (!t) return true;
      return [c.id, c.name, c.email, c.phone, c.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
    });
  }, [customers, q, statusFilter]);

  return (
    <div className="cus-wrap dark-bg">
      <div className="cus-card glass">
        {/* Header */}
        <div className="cus-head glass-soft">
          <div className="head-left">
            <div>
              <h2>Quản lý khách hàng</h2>
              <p>Theo dõi tài khoản, trạng thái và thao tác nhanh</p>
            </div>
          </div>

          <div className="head-actions">
            <div className="search">
              <span className="i">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên / email / SĐT / vai trò…"
              />
            </div>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Lọc trạng thái"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="blocked">Đã khóa</option>
            </select>
            <button className="btn ghost" onClick={loadCustomers}>↻ Tải lại</button>
          </div>
        </div>

        {/* Alert */}
        {msg && (
          <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>
            {msg.text}
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
            <div>Không có khách hàng phù hợp.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 88 }}>Mã</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 280, textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isBlocked = !!c?.blocked;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="id-badge">#{c.id}</span>
                      </td>
                      <td className="strong">{c.name || "—"}</td>
                      <td>{c.email || "—"}</td>
                      <td>{c.phone || c.phone_number || "—"}</td>
                      <td>
                        <span className="chip">{c.role || c.roles || "customer"}</span>
                      </td>
                      <td>
                        <span className={isBlocked ? "badge danger" : "badge ok"}>
                          {isBlocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {isBlocked ? (
                            <button className="btn primary sm" onClick={() => handleUnblock(c.id)}>Mở khóa</button>
                          ) : (
                            <button className="btn warn sm" onClick={() => handleBlock(c.id)}>Khóa</button>
                          )}
                          <Link to={`/admin/customers/delete/${c.id}`} className="btn danger sm">
                            Xóa
                          </Link>
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
        .cus-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px; }
        .head-left{ display:flex; align-items:center; gap:12px; }
        .head-left h2{ margin:0; font-weight:900; color:#fff; }
        .head-left p{ margin:2px 0 0; color:#9fb2e8; font-size:12px; }
        .head-icon{
          height:40px; width:40px; border-radius:12px;
          background: linear-gradient(135deg,#2563eb,#22d3ee);
          display:grid; place-items:center; font-size:20px; box-shadow:0 6px 18px rgba(34,211,238,.25);
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

        .id-badge{
          display:inline-block; padding:4px 8px; border-radius:999px; font-weight:800; color:#dbeafe;
          background:#1e3a8a; border:1px solid rgba(191,219,254,.3);
        }
        .chip{
          display:inline-block; padding:4px 8px; border-radius:8px; font-weight:800;
          background: rgba(99,102,241,.15); color:#dbe4ff; border:1px solid rgba(99,102,241,.25);
          text-transform: lowercase;
        }
        .badge{ padding:4px 10px; border-radius:999px; font-weight:900; }
        .badge.ok{ background:rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
        .badge.danger{ background:rgba(239,68,68,.15); color:#fecaca; border:1px solid rgba(239,68,68,.35); }

        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }

        .btn{ border:none; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:900; }
        .btn.soft{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#e6ebff; }
        .btn.ghost{ background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); color:#e6ebff; }
        .btn.primary{ background:#2563eb; color:#fff; box-shadow:0 12px 26px rgba(37,99,235,.35); }
        .btn.warn{ background:#f59e0b; color:#0b1120; }
        .btn.danger{ background:#ef4444; color:#fff; }
        .btn.sm{ padding:8px 10px; border-radius:10px; }
        .btn:active{ transform: translateY(1px); }

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
