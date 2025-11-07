// src/pages/admin/drivers/DriversList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "@/api/client";

export default function DriversList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [q, setQ] = useState("");

  // Upsert state trong cùng file
  const INIT = { name: "", phone: "", license_number: "", status: "active" };
  const [mode, setMode] = useState("idle"); // idle | add | edit
  const [curId, setCurId] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === "edit";

  async function loadDrivers() {
    try {
      setLoading(true);
      const res = await api.get("/drivers");
      setDrivers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMsg({ type: "err", text: "Không tải được danh sách tài xế" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadDrivers(); }, []);

  // ==== CRUD helpers ====
  function openAdd() {
    setForm(INIT);
    setCurId(null);
    setMode("add");
  }
  async function openEdit(id) {
    try {
      setSaving(true);
      const res = await api.get(`/drivers/${id}`);
      const d = res.data || {};
      setForm({
        name: d.name || "",
        phone: d.phone || "",
        license_number: d.license_number || "",
        status: (d.status || "active").toLowerCase(),
      });
      setCurId(id);
      setMode("edit");
    } catch {
      setMsg({ type: "err", text: "Không tải được thông tin tài xế" });
    } finally {
      setSaving(false);
    }
  }
  function closeForm() {
    setMode("idle");
    setCurId(null);
    setForm(INIT);
  }
  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Vui lòng nhập Họ tên" });
      return;
    }
    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/drivers/${curId}`, form);
        setMsg({ type: "ok", text: "Cập nhật thành công" });
      } else {
        await api.post(`/drivers`, form);
        setMsg({ type: "ok", text: "Tạo tài xế thành công" });
      }
      await loadDrivers();
      closeForm();
    } catch {
      setMsg({ type: "err", text: "Lưu thất bại. Kiểm tra dữ liệu hoặc thử lại." });
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Xóa tài xế này?")) return;
    try {
      await api.delete(`/drivers/${id}`);
      setMsg({ type: "ok", text: "Đã xóa tài xế" });
      if (isEdit && curId === id) closeForm();
      loadDrivers();
    } catch {
      setMsg({ type: "err", text: "Xóa thất bại" });
    }
  }
  async function onDeleteInForm() {
    if (!isEdit || !curId) return;
    if (!window.confirm("Xóa tài xế này?")) return;
    await handleDelete(curId);
  }

  // Search
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return drivers;
    return drivers.filter((d) =>
      [d.id, d.name, d.phone, d.license_number, d.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [drivers, q]);

  return (
    <div className="drv-wrap dark-bg">
      <div className="drv-card glass">
        {/* Head */}
        <div className="drv-head glass-soft">
          <div className="head-left">
            <div>
              <h2>Quản lý tài xế</h2>
              <p>Thêm, sửa, xoá và tìm kiếm tài xế</p>
            </div>
          </div>

          <div className="head-actions">
            <div className="search">
              <span className="i">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên / SĐT / bằng lái / trạng thái"
              />
            </div>
            <button className="btn primary" onClick={openAdd}>
              + Thêm tài xế
            </button>
          </div>
        </div>

        {/* Alerts */}
        {msg && (
          <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>
            {msg.text}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk-row" />
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Họ tên</th>
                  <th>SĐT</th>
                  <th>Bằng lái</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 280, textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <div className="emo">🚐</div>
                        <div>Chưa có tài xế</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="id-badge">#{d.id}</span>
                      </td>
                      <td className="strong">{d.name}</td>
                      <td>{d.phone || "—"}</td>
                      <td>
                        <span className="tag">{d.license_number || "—"}</span>
                      </td>
                      <td>
                        <span
                          className={
                            (d.status || "active").toLowerCase() === "inactive"
                              ? "badge warn"
                              : "badge ok"
                          }
                        >
                          {d.status || "active"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn ghost sm"
                            onClick={() => openEdit(d.id)}
                          >
                            Sửa 
                          </button>
                          
                          <button
                            className="btn danger sm"
                            onClick={() => handleDelete(d.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Form (trong cùng file) */}
      <div className={`drawer ${mode !== "idle" ? "open" : ""}`}>
        <div className="drawer-head">
          <div className="title">
            <div className="icon">🧾</div>
            <div>
              <h3>{isEdit ? "Sửa tài xế" : "Thêm tài xế"}</h3>
              <p>{isEdit ? `ID #${curId}` : "Tạo mới tài xế"}</p>
            </div>
          </div>
          <div className="actions">
            {isEdit && (
              <button className="btn danger sm" disabled={saving} onClick={onDeleteInForm}>
                Xóa
              </button>
            )}
            <button className="btn ghost sm" onClick={closeForm}>Đóng</button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="drawer-body">
          <div className="grid">
            <div className="field">
              <label>Họ tên <span className="req">*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="VD: 09xx xxx xxx"
              />
            </div>
            <div className="field">
              <label>Bằng lái</label>
              <input
                name="license_number"
                value={form.license_number}
                onChange={onChange}
                placeholder="VD: B2-123456789"
              />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <select name="status" value={form.status} onChange={onChange}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>

          <div className="footer">
            <button className="btn primary" disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      {mode !== "idle" && <div className="backdrop" onClick={closeForm} />}

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
          max-width: 1100px; margin: 0 auto;
          background: rgba(13,20,42,.65);
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px; overflow:hidden;
          box-shadow: 0 18px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .glass-soft{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .drv-head{ display:flex; gap:12px; align-items:center; justify-content:space-between; padding:16px; }
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

        .btn{ border:none; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:900; }
        .btn.primary{ background:#2563eb; color:#fff; box-shadow:0 12px 26px rgba(37,99,235,.35); }
        .btn.ghost{ background:rgba(255,255,255,.05); color:#e5edff; border:1px solid rgba(255,255,255,.12); text-decoration:none; }
        .btn.danger{ background:#ef4444; color:#fff; }
        .btn.sm{ padding:8px 10px; border-radius:10px; }
        .btn:active{ transform: translateY(1px); }

        .alert{ margin:12px 16px 0; padding:10px 12px; border-radius:12px; font-weight:800; border:1px solid; }
        .alert.ok{ background:rgba(34,197,94,.12); color:#86efac; border-color:rgba(34,197,94,.35); }
        .alert.err{ background:rgba(239,68,68,.12); color:#fca5a5; border-color:rgba(239,68,68,.35); }

        .table-wrap{ overflow:auto; }
        .tbl{ width:100%; border-collapse: collapse; color:#eef2ff; }
        .tbl th, .tbl td{ padding:14px; border-bottom:1px solid rgba(255,255,255,.08); }
        .tbl thead th{ text-align:left; font-weight:900; color:#cdd7ff; background:rgba(255,255,255,.04); }
        .tbl tbody tr:nth-child(even){ background: rgba(255,255,255,.02); }
        .tbl tbody tr:hover{ background: rgba(59,130,246,.08); }
        .strong{ font-weight:800; color:#ffffff; }

        .tag{
          display:inline-block; padding:4px 8px; border-radius:8px; font-weight:700;
          background: rgba(99,102,241,.15); color:#dbe4ff; border:1px solid rgba(99,102,241,.25);
        }
        .badge{ padding:4px 10px; border-radius:999px; font-weight:900; }
        .badge.ok{ background:rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
        .badge.warn{ background:rgba(245,158,11,.15); color:#fde68a; border:1px solid rgba(245,158,11,.35); }

        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }
        .id-badge{
          display:inline-block; padding:4px 10px; border-radius:999px; font-weight:900; color:#cfe6ff;
          background: linear-gradient(90deg,#1f3b8a,#1e293b); border:1px solid rgba(255,255,255,.18);
        }

        .skeleton{ padding: 14px 16px; display:grid; gap:10px; }
        .sk-row{
          height:44px; border-radius:12px;
          background: linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06));
          background-size:200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer{ 0%{background-position: 0 0;} 100%{background-position: -200% 0;} }

        .empty{ text-align:center; padding:28px 0; color:#9fb2e8; }
        .empty .emo{ font-size: 20px; margin-bottom: 6px; }

        /* Drawer */
        .drawer{
          position: fixed; top: 0; right: -480px; width: 420px; max-width: 96%;
          height: 100vh; background: rgba(13,20,42,.98); color:#e5e7eb;
          border-left:1px solid rgba(255,255,255,.08);
          box-shadow: -20px 0 60px rgba(2,6,23,.45);
          transition: right .24s ease;
          z-index: 50; display:flex; flex-direction:column;
        }
        .drawer.open{ right: 0; }
        .drawer-head{
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 14px; border-bottom:1px solid rgba(255,255,255,.08);
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
        }
        .drawer-head .title{ display:flex; align-items:center; gap:10px; }
        .drawer-head .title h3{ margin:0; font-weight:900; color:#fff; }
        .drawer-head .title p{ margin:2px 0 0; color:#9fb2e8; font-size:12px; }
        .drawer-head .icon{
          height:36px; width:36px; border-radius:10px;
          background: linear-gradient(135deg,#2563eb,#22d3ee);
          display:grid; place-items:center; font-size:18px;
          box-shadow: 0 6px 18px rgba(34,211,238,.25);
        }
        .drawer-body{ padding:14px; display:flex; flex-direction:column; height:100%; }
        .drawer-body .grid{ display:grid; grid-template-columns: 1fr; gap:12px; }
        .field label{ display:block; font-size:12px; color:#cfe0ff; margin-bottom:6px; font-weight:800; }
        .field input, .field select{
          width:100%; padding:10px 12px; border-radius:12px; outline:none;
          border:1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06); color:#e8edf7;
        }
        .field input:focus, .field select:focus{
          border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25);
          background: rgba(255,255,255,.08);
        }
        .req{ color:#fda4af; }
        .footer{ margin-top:auto; display:flex; justify-content:flex-end; gap:8px; }
        .backdrop{
          position: fixed; inset: 0; background: rgba(0,0,0,.3);
          z-index: 40;
        }

        @media (max-width: 860px){
          .head-actions{ width:100%; justify-content:flex-end; }
          .search input{ width: 220px; }
        }
      `}</style>
    </div>
  );
}
