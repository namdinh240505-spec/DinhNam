import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/client";

export default function BusesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:''}
  const [q, setQ] = useState("");

  const emptyForm = {
    id: null,
    license_number: "",
    type: "",
    seats: 40,
    manufacturer: "",
    model: "",
    year: "",
    note: "",
    active: true,
  };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true); setMsg(null);
    try {
      const res = await api.get("/buses");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMsg({ type: "err", text: "Không tải được danh sách xe" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const startEdit = (row) => {
    setForm({
      id: row.id,
      license_number: row.license_number || "",
      type: row.type || "",
      seats: row.seats ?? 40,
      manufacturer: row.manufacturer || "",
      model: row.model || "",
      year: row.year || "",
      note: row.note || "",
      active: !!row.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => setForm(emptyForm);
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.license_number.trim() || !form.type.trim()) {
      setMsg({ type: "err", text: "Vui lòng nhập Biển số và Loại xe" }); return;
    }
    setSubmitting(true); setMsg(null);
    try {
      if (form.id) {
        await api.put(`/buses/${form.id}`, {
          license_number: form.license_number,
          type: form.type,
          seats: Number(form.seats) || 40,
          manufacturer: form.manufacturer || null,
          model: form.model || null,
          year: form.year ? Number(form.year) : null,
          note: form.note || null,
          active: !!form.active,
        });
        setMsg({ type: "ok", text: "Cập nhật xe thành công" });
      } else {
        await api.post("/buses", {
          license_number: form.license_number,
          type: form.type,
          seats: Number(form.seats) || 40,
          manufacturer: form.manufacturer || null,
          model: form.model || null,
          year: form.year ? Number(form.year) : null,
          note: form.note || null,
          active: !!form.active,
        });
        setMsg({ type: "ok", text: "Thêm xe thành công" });
      }
      cancelEdit();
      load();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.license_number?.[0] ||
        err?.response?.data?.errors?.type?.[0] ||
        err?.response?.data?.errors?.seats?.[0] ||
        "Thao tác thất bại";
      setMsg({ type: "err", text: apiMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!window.confirm(`Xóa xe #${form.id}?`)) return;
    setDeleting(true); setMsg(null);
    try {
      await api.delete(`/buses/${form.id}`);
      setMsg({ type: "ok", text: "Đã xóa xe" });
      cancelEdit();
      load();
    } catch {
      setMsg({ type: "err", text: "Không thể xóa xe" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((b) =>
      [b.id, b.license_number, b.type, b.manufacturer, b.model, b.year]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [list, q]);

  return (
    <div className="bus-wrap dark-bg">
      <div className="bus-card glass">
        <div className="bus-head glass-soft">
          <div className="head-left">
            <div>
              <h2>Quản lý xe</h2>
              <p>Thêm / Sửa / Xóa trong 1 form</p>
            </div>
          </div>
          <div className="head-actions">
            <div className="search">
              <span className="i">🔎</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo biển số / loại / hãng..." />
            </div>
            <button className="btn ghost" onClick={load}>↻ Tải lại</button>
          </div>
        </div>

        {msg && <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>{msg.text}</div>}

        {/* FORM THÊM / SỬA / XÓA */}
        <form onSubmit={submit} className="bus-form">
          <div className="fgrid">
            <div className="field">
              <label>Biển số</label>
              <input name="license_number" value={form.license_number} onChange={onChange} placeholder="VD: 51B-12345" required />
            </div>
            <div className="field">
              <label>Loại xe</label>
              <input name="type" value={form.type} onChange={onChange} placeholder="Giường nằm / Limousine..." required />
            </div>
            <div className="field">
              <label>Số ghế</label>
              <input type="number" min="1" max="100" name="seats" value={form.seats} onChange={onChange} />
            </div>
            <div className="field">
              <label>Hãng</label>
              <input name="manufacturer" value={form.manufacturer} onChange={onChange} placeholder="Thaco / Ford..." />
            </div>
            <div className="field">
              <label>Model</label>
              <input name="model" value={form.model} onChange={onChange} placeholder="Mobihome / Transit..." />
            </div>
            <div className="field">
              <label>Năm SX</label>
              <input type="number" name="year" value={form.year} onChange={onChange} placeholder="2022" />
            </div>
            <div className="field">
              <label>Ghi chú</label>
              <input name="note" value={form.note} onChange={onChange} placeholder="Ghi chú..." />
            </div>
            <div className="field check">
              <label className="row">
                <input type="checkbox" name="active" checked={!!form.active} onChange={onChange} />
                <span>Đang hoạt động</span>
              </label>
            </div>

            <div className="btns">
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Thêm mới"}
              </button>
              {form.id ? (
                <>
                  <button type="button" className="btn ghost" onClick={cancelEdit}>Hủy</button>
                  <button type="button" className="btn danger" onClick={remove} disabled={deleting}>
                    {deleting ? "Đang xóa..." : `Xóa #${form.id}`}
                  </button>
                </>
              ) : (
                <button type="button" className="btn soft" onClick={() => setForm(emptyForm)}>Làm mới</button>
              )}
            </div>
          </div>
        </form>

        <div className="hr" />

        {loading ? (
          <div className="skeleton">{Array.from({ length: 6 }).map((_,i)=><div key={i} className="sk-row" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="emo">🚌</div><div>Không có xe phù hợp.</div></div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:80}}>ID</th>
                  <th>Biển số</th>
                  <th>Loại</th>
                  <th>Ghế</th>
                  <th>Hãng</th>
                  <th>Model</th>
                  <th>Năm</th>
                  <th>Trạng thái</th>
                  <th style={{width:260, textAlign:'right'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td><span className="id-badge">#{b.id}</span></td>
                    <td className="strong">{b.license_number}</td>
                    <td>{b.type}</td>
                    <td>{b.seats}</td>
                    <td>{b.manufacturer || '—'}</td>
                    <td>{b.model || '—'}</td>
                    <td>{b.year || '—'}</td>
                    <td>
                      <span className={b.active ? "badge ok" : "badge danger"}>
                        {b.active ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn soft sm" onClick={() => startEdit(b)}>Sửa</button>
                        <button className="btn danger sm" onClick={() => { setForm({ ...form, id: b.id }); startEdit(b); }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Styles: tái sử dụng theme glass */}
      <style>{`
        .dark-bg{ min-height:100vh; padding:24px 16px;
          background:
            radial-gradient(900px 420px at 5% -10%, #1b2551 0%, transparent 60%),
            radial-gradient(900px 420px at 95% -10%, #3b1f7a 0%, transparent 60%),
            linear-gradient(180deg, #0b1224 0%, #0a1122 60%, #0b1224 100%);
          color:#e5e7eb; font-family: Inter, system-ui; }
        .glass{ max-width:1200px; margin:0 auto; background:rgba(13,20,42,.65);
          border:1px solid rgba(255,255,255,.08); border-radius:16px; overflow:hidden;
          box-shadow:0 18px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.06); }
        .glass-soft{ background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border-bottom:1px solid rgba(255,255,255,.08); }
        .bus-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px; }
        .head-left{ display:flex; align-items:center; gap:12px; }
        .head-left h2{ margin:0; font-weight:900; color:#fff; }
        .head-left p{ margin:2px 0 0; color:#9fb2e8; font-size:12px; }
        .head-icon{ height:40px; width:40px; border-radius:12px;
          background: linear-gradient(135deg,#2563eb,#22d3ee); display:grid; place-items:center;
          font-size:20px; box-shadow:0 6px 18px rgba(34,211,238,.25); }
        .head-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .search{ position:relative; }
        .search .i{ position:absolute; left:10px; top:50%; transform:translateY(-50%); opacity:.75; }
        .search input{ width:280px; padding:10px 12px 10px 34px; border-radius:12px; outline:none;
          border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#e8edf7;
          transition: box-shadow .15s, border-color .15s, background .15s; }
        .search input:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); background:rgba(255,255,255,.08); }

        .alert{ margin:12px 16px 0; padding:10px 12px; border-radius:12px; font-weight:800; border:1px solid; }
        .alert.ok{ background:rgba(34,197,94,.12); color:#86efac; border-color:rgba(34,197,94,.35); }
        .alert.err{ background:rgba(239,68,68,.12); color:#fca5a5; border-color:rgba(239,68,68,.35); }

        .bus-form{ padding:16px; }
        .fgrid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; align-items:end; }
        .field label{ display:block; font-weight:800; color:#b6c2e2; margin-bottom:6px; }
        .field input{ width:100%; padding:12px 14px; border-radius:12px; outline:none;
          border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#eff4ff; }
        .field input:focus{ border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.25); }
        .field.check .row{ display:flex; align-items:center; gap:8px; padding-bottom:8px; }
        .btns{ display:flex; gap:8px; justify-content:flex-end; grid-column:1 / -1; }

        .hr{ height:1px; background:rgba(255,255,255,.08); }
        .table-wrap{ overflow:auto; }
        .tbl{ width:100%; border-collapse: collapse; color:#eef2ff; }
        .tbl th, .tbl td{ padding:14px; border-bottom:1px solid rgba(255,255,255,.08); }
        .tbl thead th{ text-align:left; font-weight:900; color:#cdd7ff; background:rgba(255,255,255,.04); }
        .tbl tbody tr:nth-child(even){ background: rgba(255,255,255,.02); }
        .tbl tbody tr:hover{ background: rgba(59,130,246,.08); }
        .strong{ font-weight:800; color:#ffffff; }
        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }
        .id-badge{ display:inline-block; padding:4px 8px; border-radius:999px; font-weight:800; color:#dbeafe;
          background:#1e3a8a; border:1px solid rgba(191,219,254,.3); }
        .badge{ padding:4px 10px; border-radius:999px; font-weight:900; }
        .badge.ok{ background:rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
        .badge.danger{ background:rgba(239,68,68,.15); color:#fecaca; border:1px solid rgba(239,68,68,.35); }

        @media (max-width: 980px){
          .fgrid{ grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px){
          .fgrid{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
