// src/pages/admin/routes/Routes.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "@/api/client";

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [createForm, setCreateForm] = useState({ from: "", to: "" });
  const [rowEdit, setRowEdit] = useState(null); // { id, from, to } khi sửa inline
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null); // id đang lưu inline
  const [q, setQ] = useState("");

  async function loadRoutes() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get("/routes");
      const list = Array.isArray(res.data) ? res.data : [];
      setRoutes(list);
    } catch {
      setMsg({ type: "err", msg: "Không tải được danh sách tuyến xe" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadRoutes(); }, []);

  // ====== CREATE (form đầu trang) ======
  const submitCreate = async (e) => {
    e.preventDefault();
    if (!createForm.from.trim() || !createForm.to.trim()) {
      setMsg({ type: "err", msg: "Vui lòng nhập đủ Điểm đi và Điểm đến" });
      return;
    }
    setSubmitting(true); setMsg(null);
    try {
      await api.post("/routes", createForm);
      setMsg({ type: "ok", msg: "Thêm tuyến xe thành công" });
      setCreateForm({ from: "", to: "" });
      loadRoutes();
    } catch (err) {
      setMsg({ type: "err", msg: err?.response?.data?.message || "Thêm tuyến thất bại" });
    } finally {
      setSubmitting(false);
    }
  };

  // ====== EDIT INLINE (trong bảng) ======
  const startEditRow = (r) => setRowEdit({ id: r.id, from: r.from || "", to: r.to || "" });
  const cancelEditRow = () => setRowEdit(null);

  const saveRow = async () => {
    if (!rowEdit) return;
    if (!rowEdit.from.trim() || !rowEdit.to.trim()) {
      setMsg({ type: "err", msg: "Vui lòng nhập đủ Điểm đi và Điểm đến" });
      return;
    }
    setSavingRowId(rowEdit.id); setMsg(null);
    try {
      await api.put(`/routes/${rowEdit.id}`, { from: rowEdit.from, to: rowEdit.to });
      setMsg({ type: "ok", msg: "Cập nhật tuyến xe thành công" });
      setRowEdit(null);
      loadRoutes();
    } catch (err) {
      setMsg({ type: "err", msg: err?.response?.data?.message || "Cập nhật thất bại" });
    } finally {
      setSavingRowId(null);
    }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tuyến này?")) return;
    try {
      await api.delete(`/routes/${id}`);
      setMsg({ type: "ok", msg: "Đã xóa tuyến xe thành công" });
      loadRoutes();
    } catch {
      setMsg({ type: "err", msg: "Không thể xóa tuyến xe" });
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return routes;
    return routes.filter(
      (r) =>
        String(r.from || "").toLowerCase().includes(t) ||
        String(r.to || "").toLowerCase().includes(t) ||
        String(r.id || "").includes(t)
    );
  }, [routes, q]);

  return (
    <div className="route-wrap dark-bg">
      <div className="route-card glass">
        <div className="route-head glass-soft">
          <div className="route-title">
            <h2>Quản lý tuyến xe</h2>
          </div>
          <div className="route-actions">
            <div className="search">
              <span className="i">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo ID / Điểm đi / Điểm đến"
              />
            </div>
          </div>
        </div>

        {msg && <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>{msg.msg}</div>}

        {/* FORM THÊM MỚI */}
        <form onSubmit={submitCreate} className="route-form">
          <div className="frow">
            <div className="field">
              <label>Điểm đi</label>
              <input
                type="text"
                placeholder="VD: Hà Nội"
                value={createForm.from}
                onChange={(e) => setCreateForm((f) => ({ ...f, from: e.target.value }))}
                required
              />
            </div>
            <div className="field">Đến</div>
            <div className="field">
              <label>Điểm đến</label>
              <input
                type="text"
                placeholder="VD: Đà Nẵng"
                value={createForm.to}
                onChange={(e) => setCreateForm((f) => ({ ...f, to: e.target.value }))}
                required
              />
            </div>
            <div className="btns">
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Thêm"}
              </button>
            </div>
          </div>
        </form>

        <div className="hr" />

        {loading ? (
          <div className="skeleton">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk-row" />)}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Điểm đi</th>
                  <th>Điểm đến</th>
                  <th style={{ width: 300, textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <div className="empty">
                        <div className="emo">🗺️</div>
                        <div>Không có tuyến nào</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const editing = rowEdit?.id === r.id;
                    return (
                      <tr key={r.id}>
                        <td><span className="id-badge">#{r.id}</span></td>

                        {/* FROM */}
                        <td className="strong">
                          {!editing ? (
                            r.from
                          ) : (
                            <input
                              className="in-row"
                              value={rowEdit.from}
                              onChange={(e) => setRowEdit((p) => ({ ...p, from: e.target.value }))}
                              placeholder="Điểm đi"
                              required
                            />
                          )}
                        </td>

                        {/* TO */}
                        <td className="strong">
                          {!editing ? (
                            r.to
                          ) : (
                            <input
                              className="in-row"
                              value={rowEdit.to}
                              onChange={(e) => setRowEdit((p) => ({ ...p, to: e.target.value }))}
                              placeholder="Điểm đến"
                              required
                            />
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="row-actions">
                            {!editing ? (
                              <>
                                <button className="btn soft sm" onClick={() => startEditRow(r)}>
                                  Sửa
                                </button>
                                <button className="btn danger sm" onClick={() => deleteRoute(r.id)}>
                                  Xóa
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn primary sm"
                                  onClick={saveRow}
                                  disabled={savingRowId === r.id}
                                >
                                  {savingRowId === r.id ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button className="btn ghost sm" onClick={cancelEditRow}>
                                  Hủy
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* THEME — dark glass giữ nguyên + style cho input inline */}
      <style>{`
        .dark-bg{
          min-height: 100vh;
          padding: 24px 16px;
          background:
            radial-gradient(900px 420px at 5% -10%, #1b2551 0%, transparent 60%),
            radial-gradient(900px 420px at 95% -10%, #3b1f7a 0%, transparent 60%),
            linear-gradient(180deg, #0b1224 0%, #0a1122 60%, #0b1224 100%);
          color: #e5e7eb;
        }
        .glass{
          max-width: 980px; margin: 0 auto;
          background: rgba(13, 20, 42, .65);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          box-shadow: 0 18px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.06);
          overflow: hidden;
        }
        .glass-soft{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .route-head{
          display:flex; gap:12px; align-items:center; justify-content:space-between;
          padding: 16px;
        }
        .route-title{ display:flex; align-items:center; gap:10px; }
        .route-title h2{ margin:0; font-weight:900; color:#fff; }
        .title-dot{
          width: 14px; height: 14px; border-radius: 50%;
          background: linear-gradient(90deg,#60a5fa,#22d3ee);
          box-shadow: 0 0 0 6px rgba(37,99,235,.15);
        }
        .route-actions{ display:flex; align-items:center; gap:10px; }
        .search{ position:relative; }
        .search .i{ position:absolute; left:10px; top:50%; transform:translateY(-50%); opacity:.7; }
        .search input{
          width: 260px; padding:10px 12px 10px 34px;
          border-radius: 12px; outline:none;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06); color:#e8edf7;
          transition: box-shadow .15s, border-color .15s, background .15s;
        }
        .search input:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); background: rgba(255,255,255,.08); }

        .route-form{ padding:16px; }
        .frow{ display:grid; grid-template-columns: 1fr 60px 1fr auto; gap:10px; align-items:end; }
        .field label{ display:block; font-weight:800; color:#b6c2e2; margin-bottom:6px; }
        .field input{
          width:100%; padding:12px 14px; border-radius:12px; outline:none;
          border:1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06); color:#eff4ff;
          transition: box-shadow .15s, border-color .15s, background .15s;
        }
        .field input::placeholder{ color:#8fa0c9; }
        .field input:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); background: rgba(255,255,255,.08); }
        .sep{
          display:grid; place-items:center; align-self: center; font-weight:900; color:#93a4d3;
          height: 48px; border-radius:12px;
          background: rgba(255,255,255,.05); border:1px dashed rgba(255,255,255,.12);
        }

        .btn{ border:none; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:900; }
        .btn.primary{ background:#2563eb; color:#fff; box-shadow:0 12px 26px rgba(37,99,235,.35); }
        .btn.ghost{ background:rgba(255,255,255,.05); color:#e5edff; border:1px solid rgba(255,255,255,.12); }
        .btn.soft{ background:#2a355d; color:#dbe7ff; border:1px solid rgba(255,255,255,.12); }
        .btn.danger{ background:#ef4444; color:#fff; }
        .btn.sm{ padding:8px 10px; border-radius:10px; font-weight:800; }
        .btn:active{ transform:translateY(1px); }
        .btns{ display:flex; gap:8px; }

        .hr{ height:1px; background:rgba(255,255,255,.08); }

        .table-wrap{ overflow:auto; }
        .tbl{ width:100%; border-collapse: collapse; color:#eef2ff; }
        .tbl th, .tbl td{ padding:14px; border-bottom:1px solid rgba(255,255,255,.08); }
        .tbl thead th{ text-align:left; font-weight:900; color:#cdd7ff; background:rgba(255,255,255,.04); }
        .tbl tbody tr:nth-child(even){ background: rgba(255,255,255,.02); }
        .tbl tbody tr:hover{ background: rgba(59,130,246,.08); }
        .strong{ font-weight:800; color:#ffffff; }
        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }

        .id-badge{
          display:inline-block; padding:4px 10px; border-radius:999px; font-weight:900; color:#cfe6ff;
          background: linear-gradient(90deg,#1f3b8a,#1e293b); border:1px solid rgba(255,255,255,.18);
        }

        .alert{ margin:12px 16px 0; padding:10px 12px; border-radius:12px; font-weight:800; border:1px solid; }
        .alert.ok{ background:rgba(34,197,94,.12); color:#86efac; border-color:rgba(34,197,94,.35); }
        .alert.err{ background:rgba(239,68,68,.12); color:#fca5a5; border-color:rgba(239,68,68,.35); }

        .skeleton{ padding: 14px 16px; display:grid; gap:10px; }
        .sk-row{
          height:44px; border-radius:12px;
          background: linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06));
          background-size:200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer{ 0%{background-position: 0 0;} 100%{background-position: -200% 0;} }

        .empty{ text-align:center; padding:28px 0; color:#9fb2e8; }
        .empty .emo{ font-size: 20px; margin-bottom: 6px; }

        /* input inline trong bảng */
        .in-row{
          width:100%; padding:10px 12px; border-radius:10px; outline:none;
          border:1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.07); color:#eff4ff;
        }
        .in-row:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); }

        @media (max-width: 860px){
          .frow{ grid-template-columns: 1fr 40px 1fr; }
          .btns{ grid-column: 1 / -1; }
          .search input{ width: 200px; }
        }
      `}</style>
    </div>
  );
}
