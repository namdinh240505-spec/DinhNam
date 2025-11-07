import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/client";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const CATS = [
  { key: "general", label: "Tất cả (general)" },
  { key: "lich-chay", label: "Lịch chạy" },
  { key: "khuyen-mai", label: "Khuyến mãi" },
  { key: "tuyen-duong", label: "Tuyến đường" },
  { key: "cam-nang", label: "Cẩm nang" },
  { key: "an-toan", label: "An toàn" },
];
const STATUSES = [
  { key: "published", label: "Đã xuất bản" },
  { key: "draft", label: "Nháp" },
];

function toSlug(s = "") {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------- Main page ---------- */
export default function NewsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null); // item hiện đang sửa

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/news", {
        params: {
          q: q || undefined,
          category: cat || undefined,
          status: status || undefined,
          per_page: 50,
          sort: "-created_at",
        },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setItems(data);
    } catch (e) {
      setMsg({ type: "err", text: e?.response?.data?.message || "Không tải được danh sách tin." });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // first load

  function createNew() { setEditing(null); setOpenForm(true); }
  function editRow(row) { setEditing(row); setOpenForm(true); }

  async function delRow(id) {
    if (!window.confirm("Xóa bài viết này?")) return;
    try {
      await api.delete(`/news/${id}`);
      setMsg({ type: "ok", text: "Đã xóa." });
      load();
    } catch (e) {
      setMsg({ type: "err", text: e?.response?.data?.message || "Xóa thất bại." });
    }
  }

  const filtered = useMemo(() => {
    let arr = items;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      arr = arr.filter(n =>
        [n.title, n.summary, n.slug, n.category].filter(Boolean)
          .some(v => String(v).toLowerCase().includes(t))
      );
    }
    if (cat) arr = arr.filter(n => n.category === cat);
    if (status) arr = arr.filter(n => n.status === status);
    return arr;
  }, [items, q, cat, status]);

  return (
    <div className="news-wrap">
      <div className="card">
        {/* Head */}
        <div className="head">
          <div className="title">
            <div className="icon">📰</div>
            <div>
              <h2>Tin tức</h2>
              <p>Thêm, sửa, xoá bài viết cho HuyNamBusLines</p>
            </div>
          </div>
          <div className="actions">
            <div className="filter">
              <input placeholder="Tìm tiêu đề / slug…" value={q} onChange={e => setQ(e.target.value)} />
              <select value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">-- Tất cả danh mục --</option>
                {CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">-- Tất cả trạng thái --</option>
                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button className="btn ghost" onClick={load}>Lọc</button>
            </div>
            <button className="btn primary" onClick={createNew}>Thêm bài</button>
          </div>
        </div>

        {msg && <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>{msg.text}</div>}

        {/* Table */}
        {loading ? (
          <div className="skeleton">{Array.from({ length: 6 }).map((_,i)=><div key={i} className="sk"/> )}</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:70}}>ID</th>
                  <th>Tiêu đề</th>
                  <th>Slug</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th style={{width:180,textAlign:"right"}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty">Chưa có bài viết.</div></td></tr>
                ) : filtered.map(n => (
                  <tr key={n.id}>
                    <td>#{n.id}</td>
                    <td className="strong">
                      <div className="row">
                        {n.image && <img src={n.image} alt="" className="thumb" />}
                        <div>
                          <div>{n.title}</div>
                          {n.summary && <div className="muted">{n.summary}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="monospace">{n.slug}</td>
                    <td><span className="tag">{n.category || "general"}</span></td>
                    <td><span className={`badge ${n.status==='published'?'ok':'warn'}`}>{n.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn ghost sm" onClick={() => editRow(n)}>Sửa</button>
                        <button className="btn danger sm" onClick={() => delRow(n.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer form */}
      {openForm && (
        <NewsForm
          initial={editing}
          onClose={() => setOpenForm(false)}
          onSaved={() => { setOpenForm(false); load(); setMsg({type:'ok',text: editing?'Đã cập nhật.':'Đã tạo bài.'}); }}
        />
      )}

      <style>{`
        .news-wrap{ min-height:100vh; padding:18px; color:#e5e7eb; font-family:Inter,system-ui; }
        .card{ max-width:1100px; margin:0 auto; background:rgba(13,20,42,.65); border:1px solid rgba(255,255,255,.08); border-radius:16px; }
        .head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.08); }
        .title{ display:flex; gap:12px; align-items:center; }
        .title h2{ margin:0; font-weight:900; }
        .title p{ margin:2px 0 0; color:#9fb2e8; font-size:12px; }
        .icon{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center;
               background:linear-gradient(135deg,#2563eb,#22d3ee); box-shadow:0 6px 18px rgba(34,211,238,.25); }
        .actions{ display:flex; gap:10px; align-items:center; }
        .filter{ display:flex; gap:8px; flex-wrap:wrap; }
        .filter input, .filter select{
          border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#e8edf7;
          border-radius:10px; padding:8px 10px; outline:none;
        }
        .btn{ border:none; border-radius:10px; padding:10px 12px; cursor:pointer; font-weight:900; }
        .btn.primary{ background:#2563eb; color:#fff; box-shadow:0 12px 26px rgba(37,99,235,.35); }
        .btn.ghost{ background:rgba(255,255,255,.05); color:#e5edff; border:1px solid rgba(255,255,255,.12); }
        .btn.danger{ background:#ef4444; color:#fff; }
        .btn.sm{ padding:8px 10px; }
        .alert{ margin:12px 16px 0; padding:10px 12px; border-radius:12px; font-weight:800; border:1px solid; }
        .alert.ok{ background:rgba(34,197,94,.12); color:#86efac; border-color:rgba(34,197,94,.35); }
        .alert.err{ background:rgba(239,68,68,.12); color:#fca5a5; border-color:rgba(239,68,68,.35); }
        .table-wrap{ overflow:auto; }
        .tbl{ width:100%; border-collapse:collapse; }
        .tbl th, .tbl td{ padding:14px; border-bottom:1px solid rgba(255,255,255,.08); }
        .tbl thead th{ text-align:left; font-weight:900; color:#cdd7ff; background:rgba(255,255,255,.04); }
        .row{ display:flex; align-items:flex-start; gap:10px; }
        .thumb{ width:44px; height:44px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,.15); }
        .strong{ font-weight:800; color:#fff; }
        .monospace{ font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"; font-size:12px; }
        .tag{ display:inline-block; padding:4px 8px; border-radius:8px; font-weight:700;
              background:rgba(99,102,241,.15); color:#dbe4ff; border:1px solid rgba(99,102,241,.25); }
        .badge{ padding:4px 10px; border-radius:999px; font-weight:900; }
        .badge.ok{ background:rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
        .badge.warn{ background:rgba(245,158,11,.15); color:#fde68a; border:1px solid rgba(245,158,11,.35); }
        .row-actions{ display:flex; gap:8px; justify-content:flex-end; }
        .skeleton{ padding: 14px 16px; display:grid; gap:10px; }
        .sk{ height:44px; border-radius:12px; background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06)); background-size:200% 100%; animation:shimmer 1.2s infinite; }
        @keyframes shimmer{ 0%{background-position:0 0;} 100%{background-position:-200% 0;} }

        /* Drawer */
        .drawer{
          position:fixed; inset:0; display:grid; place-items:center; z-index:60;
          background:rgba(2,6,23,.55); backdrop-filter:blur(4px);
        }
        .form{
          width:min(820px, 92vw); background:#0f172a; color:#e5e7eb;
          border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:16px;
          box-shadow:0 40px 90px rgba(2,6,23,.6);
        }
        .form h3{ margin:0 0 12px 0; font-weight:900; }
        .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        .grid .col{ display:flex; flex-direction:column; gap:8px; }
        .row2{ display:flex; gap:10px; align-items:center; flex-wrap:wrap;}
        label{ font-size:12px; color:#9fb2e8; font-weight:800; }
        input[type="text"], textarea, select{
          background:rgba(255,255,255,.06); color:#e5e7eb; border:1px solid rgba(255,255,255,.14);
          border-radius:10px; padding:10px; outline:none; width:100%;
        }
        textarea{ min-height:120px; }
        .form-actions{ display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
        @media (max-width: 860px){ .grid{ grid-template-columns:1fr; } }
        /* ---------- Select dropdown style fix ---------- */
.filter select, .form select {
  background-color: rgba(17, 24, 39, 0.9); /* xanh than đậm */
  color: #e5e7eb;                          /* chữ sáng */
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 10px;
  padding: 8px 10px;
  outline: none;
  appearance: none; /* bỏ mũi tên mặc định */
  background-image: linear-gradient(135deg, #2563eb, #1e40af);
  background-repeat: no-repeat;
  background-size: 0 100%;
  transition: background-size 0.25s ease;
}
.filter select:hover, .form select:hover {
  background-color: rgba(30, 41, 59, 0.95);
  background-size: 100% 100%;
  border-color: #60a5fa;
  color: #fff;
}
.filter select option, .form select option {
  background-color: #0f172a; /* nền dropdown */
  color: #f8fafc;            /* chữ sáng hơn */
}
.filter select option:hover,
.form select option:hover {
  background-color: #1e293b;
  color: #93c5fd;
}

      `}</style>
    </div>
  );
}

/* ---------- Form (create + edit) ---------- */
function NewsForm({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    summary: initial?.summary || "",
    content: initial?.content || "",
    image: initial?.image || "",
    category: initial?.category || "general",
    status: initial?.status || "published",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function patch(k, v) { setF(s => ({ ...s, [k]: v })); }
  function autoSlug() { patch("slug", toSlug(f.title)); }

  async function submit() {
    setErr(null);
    try {
      setSaving(true);
      const payload = { ...f };
      if (!payload.slug) payload.slug = toSlug(payload.title);

      if (isEdit) await api.put(`/news/${initial.id}`, payload);
      else await api.post("/news", payload);

      onSaved?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer" onMouseDown={onClose}>
      <div className="form" onMouseDown={e => e.stopPropagation()}>
        <h3>{isEdit ? "Sửa bài viết" : "Thêm bài viết"}</h3>

        <div className="grid">
          <div className="col">
            <label>Tiêu đề *</label>
            <input type="text" value={f.title} onChange={e => patch("title", e.target.value)} placeholder="Tiêu đề bài viết" />

            <div className="row2">
              <div style={{flex:1}}>
                <label>Slug</label>
                <input type="text" value={f.slug} onChange={e => patch("slug", e.target.value)} placeholder="tu-khoa-seo" />
              </div>
              <button className="btn ghost" onClick={autoSlug} type="button">Tạo slug</button>
            </div>

            <label>Tóm tắt</label>
            <textarea value={f.summary} onChange={e => patch("summary", e.target.value)} placeholder="Tóm tắt ngắn…" />
          </div>

          <div className="col">
            <label>Ảnh đại diện (URL)</label>
            <input type="text" value={f.image} onChange={e => patch("image", e.target.value)} placeholder="https://.../image.jpg" />

            <label>Nội dung (HTML / Markdown)</label>
            <textarea value={f.content} onChange={e => patch("content", e.target.value)} placeholder="<p>Nội dung…</p>" />
          </div>
        </div>

        <div className="grid" style={{marginTop: 8}}>
          <div className="col">
            <label>Danh mục</label>
            <select value={f.category} onChange={e => patch("category", e.target.value)}>
              {CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Trạng thái</label>
            <select value={f.status} onChange={e => patch("status", e.target.value)}>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {err && <div className="alert err" style={{marginTop:10}}>{err}</div>}

        <div className="form-actions">
          <button className="btn ghost" onClick={onClose} type="button">Đóng</button>
          <button className="btn primary" onClick={submit} disabled={saving} type="button">{saving ? "Đang lưu…" : (isEdit ? "Cập nhật" : "Tạo mới")}</button>
        </div>
      </div>
    </div>
  );
}
