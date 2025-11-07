import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/api/client";

const viDfmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const fallbackImg =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop";

export default function NewsDetail() {
  const { slug } = useParams(); // có thể là slug hoặc id
  const [n, setN] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await api.get(`/news/${encodeURIComponent(slug)}`);
        if (!alive) return;
        setN(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Không tìm thấy bài viết.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  return (
    <div className="dd-shell">
      <div className="dd-wrap">
        <header className="bar">
          <Link to="/BusNews" className="btn ghost">← Tin tức</Link>
        </header>

        {loading && <div className="sk" />}
        {err && <div className="alert err">{err}</div>}
        {!loading && !err && n && (
          <article className="article">
            <h1 className="title">{n.title}</h1>
            <div className="meta">
              <span className="cat">{n.category || "general"}</span>
              <span>•</span>
              <span>{viDfmt.format(new Date(n.created_at || Date.now()))}</span>
            </div>
            <div className="hero">
              <img
                src={n.image || fallbackImg}
                alt={n.title}
                onError={(e) => (e.currentTarget.src = fallbackImg)}
              />
            </div>
            {n.summary && <p className="sum">{n.summary}</p>}
            <div
              className="content"
              dangerouslySetInnerHTML={{ __html: n.content || "<p>(Chưa có nội dung)</p>" }}
            />
          </article>
        )}
      </div>

      <style>{`
        .dd-shell{min-height:100vh;background:linear-gradient(145deg,#0f172a,#1e293b);color:#e5e7eb;font-family:Inter,system-ui}
        .dd-wrap{max-width:900px;margin:0 auto;padding:20px 16px 56px}
        .bar{display:flex;justify-content:flex-start;margin-bottom:12px}
        .btn.ghost{border:1px solid rgba(255,255,255,.18);background:transparent;color:#e5edff;border-radius:10px;padding:8px 12px;font-weight:900;text-decoration:none}
        .sk{height:180px;border-radius:12px;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06));background-size:200% 100%;animation:shimmer 1.2s infinite}
        @keyframes shimmer{0%{background-position:0 0}100%{background-position:-200% 0}}
        .article{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px}
        .title{margin:0 0 6px;font-weight:900}
        .meta{display:flex;gap:8px;align-items:center;color:#a5b4fc}
        .cat{padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(2,6,23,.6)}
        .hero{margin:10px 0;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
        .hero img{width:100%;height:360px;object-fit:cover;display:block}
        .sum{color:#c7d2fe;font-weight:700}
        .content{margin-top:8px;line-height:1.7}
        .content img{max-width:100%;border-radius:12px}
        .alert.err{margin:10px 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.12);color:#fecaca}
      `}</style>
    </div>
  );
}
