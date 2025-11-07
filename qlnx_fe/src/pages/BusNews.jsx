import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/api/client";

/* ===== Helpers ===== */
const CATS = [
  { key: "", label: "Tất cả" },
  { key: "lich-chay", label: "Lịch chạy" },
  { key: "khuyen-mai", label: "Khuyến mãi" },
  { key: "tuyen-duong", label: "Tuyến đường" },
  { key: "cam-nang", label: "Cẩm nang" },
  { key: "an-toan", label: "An toàn" },
];
const viDfmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
function normalizeItems(d) {
  // /api/news trả paginate: { data: [...] }
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
}
const fallbackImg =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop"; // ảnh mặc định

export default function BusNews() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const q = params.get("q") || "";
  const cat = params.get("cat") || "";
  const page = +(params.get("page") || 1);
  const perPage = 6;

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/news", {
        params: {
          q: q || undefined,
          category: cat || undefined,
          status: "published",
          per_page: perPage,
          page,
          sort: "-created_at",
        },
      });
      setItems(normalizeItems(res.data));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Không tải được tin tức.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, cat, page]);

  function setCat(newCat) {
    const p = new URLSearchParams(params);
    if (newCat) p.set("cat", newCat); else p.delete("cat");
    p.set("page", "1");
    setParams(p, { replace: true });
  }
  function setQ(newQ) {
    const p = new URLSearchParams(params);
    newQ ? p.set("q", newQ) : p.delete("q");
    p.set("page", "1");
    setParams(p, { replace: true });
  }

  // phân trang client nếu backend không trả meta
  const all = items;
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageItems = useMemo(() => {
    if (resHasServerPaging(items)) return items; // server đã cắt sẵn
    const start = (page - 1) * perPage;
    return all.slice(start, start + perPage);
  }, [items, page]);
  function resHasServerPaging(arr) { return !!arr.__from_server_paging; } // flag giả, không dùng thực tế

  return (
    <div className="news-shell">
      <div className="news-wrap">
        <header className="news-head">
          <div className="t">
            <h1>Tin tức</h1>
            <p>Cập nhật khuyến mãi, lịch chạy và cẩm nang đi xe</p>
          </div>
          <div className="actions">
            <div className="search">
              <input
                placeholder="Tìm tiêu đề…"
                defaultValue={q}
                onKeyDown={(e) => e.key === "Enter" && setQ(e.currentTarget.value)}
              />
              <button className="btn ghost" onClick={() => setQ(document.querySelector(".search input").value)}>
                Tìm
              </button>
            </div>
          </div>
        </header>

        {/* Category pills */}
        <nav className="cats">
          {CATS.map((c) => (
            <button
              key={c.key || "all"}
              className={`pill ${cat === c.key ? "active" : ""}`}
              onClick={() => setCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </nav>

        {msg && <div className="alert err">{msg}</div>}

        {/* Grid cards */}
        {loading ? (
          <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div className="sk" key={i} />)}</div>
        ) : pageItems.length === 0 ? (
          <div className="empty">Không có bài viết nào.</div>
        ) : (
          <div className="grid">
            {pageItems.map((n) => (
              <article key={n.id} className="card">
                <div className="thumb-wrap">
                  <img
                    src={n.image || fallbackImg}
                    alt={n.title}
                    onError={(e) => (e.currentTarget.src = fallbackImg)}
                  />
                  <span className="cat">{n.category || "general"}</span>
                </div>
                <div className="body">
                  <h3 className="title">
                    <Link to={`/news/${encodeURIComponent(n.slug || n.id)}`}>{n.title}</Link>
                  </h3>
                  {n.summary && <p className="sum">{n.summary}</p>}
                  <div className="meta">
                    <span>{viDfmt.format(new Date(n.created_at || Date.now()))}</span>
                    <Link className="more" to={`/news/${encodeURIComponent(n.slug || n.id)}`}>Đọc tiếp →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pager">
            <button className="btn ghost" disabled={page <= 1}
              onClick={() => setParams({ q, cat, page: String(page - 1) }, { replace: true })}>← Trước</button>
            <span>Trang {page}/{totalPages}</span>
            <button className="btn ghost" disabled={page >= totalPages}
              onClick={() => setParams({ q, cat, page: String(page + 1) }, { replace: true })}>Sau →</button>
          </div>
        )}
      </div>

      <style>{`
        .news-shell{min-height:100vh;background:
          radial-gradient(900px 420px at 5% -10%, #1b2551 0%, transparent 60%),
          radial-gradient(900px 420px at 95% -10%, #3b1f7a 0%, transparent 60%),
          linear-gradient(180deg, #0b1224 0%, #0a1122 60%, #0b1224 100%);
          color:#e5e7eb;font-family:Inter,system-ui;}
        .news-wrap{max-width:1140px;margin:0 auto;padding:20px 16px 56px;}
        .news-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px}
        .news-head h1{margin:0;font-weight:900}
        .news-head p{margin:2px 0 0;color:#9fb2e8;font-size:13px}
        .search{display:flex;gap:8px}
        .search input{width:260px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e8edf7}
        .btn{border:none;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:900}
        .btn.ghost{background:transparent;color:#e5edff;border:1px solid rgba(255,255,255,.18)}
        .cats{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 16px}
        .pill{padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#e5edff;font-weight:800;cursor:pointer}
        .pill.active{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(59,130,246,.25) inset}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden}
        .thumb-wrap{position:relative;height:180px;overflow:hidden}
        .thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block}
        .thumb-wrap .cat{position:absolute;left:10px;top:10px;padding:4px 8px;border-radius:8px;background:rgba(2,6,23,.6);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);font-weight:800}
        .body{padding:12px}
        .title{margin:0 0 6px}
        .title a{text-decoration:none;color:#fff}
        .sum{margin:0 0 8px;color:#c7d2fe}
        .meta{display:flex;justify-content:space-between;color:#a5b4fc;font-size:12px}
        .more{color:#93c5fd;text-decoration:none}
        .empty{padding:32px 0;text-align:center;color:#9fb2e8}
        .alert.err{margin:10px 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.12);color:#fecaca}
        .sk{height:260px;border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06));background-size:200% 100%;animation:shimmer 1.2s infinite}
        .pager{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:16px}
        @keyframes shimmer{0%{background-position:0 0}100%{background-position:-200% 0}}
        @media (max-width: 992px){ .grid{grid-template-columns: 1fr 1fr;} }
        @media (max-width: 620px){ .grid{grid-template-columns: 1fr;} .search input{width:100%} }
      `}</style>
    </div>
  );
}
