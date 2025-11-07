// src/pages/TripReviews.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ---------- helpers ---------- */
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const getToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("api_token") ||
  "";

function normalizeArray(d) {
  const v = d?.data ?? d?.items ?? d?.results ?? d;
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return [v];
}

/* ---------- Rating stars ---------- */
function Stars({ value = 0, onChange, size = 22, readOnly = false }) {
  const arr = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {arr.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange?.(i)}
          title={`${i} sao`}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: i <= value ? "#fde047" : "#fff",
            color: "#0f172a",
            cursor: readOnly ? "default" : "pointer",
            boxShadow: i <= value ? "0 2px 8px rgba(234,179,8,.35)" : "none",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */
export default function TripReviews() {
  const nav = useNavigate();

  const formRef = useRef(null);
  const commentRef = useRef(null);

  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:''}

  const [tripId, setTripId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null); // id review đang sửa (nếu có)

  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // Chưa đăng nhập → login
  useEffect(() => {
    if (!token) nav("/login", { replace: true });
  }, [token, nav]);

  const myTrips = useMemo(() => trips.filter(Boolean), [trips]);
  const pickedTrip = useMemo(() => myTrips.find((t) => String(t.id) === String(tripId)), [myTrips, tripId]);
  const myExisting = useMemo(
    () => reviews.find((r) => String(r.trip_id ?? r.tripId) === String(tripId)),
    [reviews, tripId]
  );

  async function fetchMyTrips() {
    try {
      const r = await api.get("/bookings", { params: { mine: 1 }, headers: authHeader });
      const arr = normalizeArray(r.data);
      const list = [];
      const seen = new Set();
      for (const b of arr) {
        const t = b?.trip || b;
        if (t?.id && !seen.has(t.id)) {
          seen.add(t.id);
          list.push(t);
        }
      }
      if (list.length) {
        setTrips(list);
        return;
      }
      // fallback /me/trips nếu backend có
      try {
        const r2 = await api.get("/me/trips", { headers: authHeader });
        setTrips(normalizeArray(r2.data));
      } catch {
        setTrips([]);
      }
    } catch (e) {
      if (e?.response?.status === 401) return nav("/login", { replace: true });
      setTrips([]);
    }
  }

  async function fetchMyReviews() {
    try {
      const r = await api.get("/reviews", { params: { mine: 1 }, headers: authHeader });
      setReviews(normalizeArray(r.data));
    } catch (e) {
      if (e?.response?.status === 401) return nav("/login", { replace: true });
      setReviews([]);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMyTrips(), fetchMyReviews()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi chọn chuyến, tự điền review nếu đã có; đồng thời set editingId
  useEffect(() => {
    if (myExisting) {
      setRating(Number(myExisting.rating ?? 5));
      setComment(myExisting.comment ?? "");
      setEditingId(myExisting.id ?? null);
    } else {
      setRating(5);
      setComment("");
      setEditingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function submitReview(e) {
    e?.preventDefault();
    if (!tripId) return setMsg({ type: "err", text: "Vui lòng chọn chuyến muốn nhận xét." });
    if (!rating) return setMsg({ type: "err", text: "Vui lòng chọn số sao." });

    try {
      setMsg(null);
      const id = editingId || myExisting?.id;
      if (id) {
        await api.put(`/reviews/${id}`, { rating, comment }, { headers: authHeader });
        setMsg({ type: "ok", text: "Đã cập nhật nhận xét." });
      } else {
        await api.post(`/reviews`, { trip_id: tripId, rating, comment }, { headers: authHeader });
        setMsg({ type: "ok", text: "Đã gửi nhận xét. Cảm ơn bạn!" });
      }
      await fetchMyReviews();
      setEditingId(null);
    } catch (err) {
      if (err?.response?.status === 401) return nav("/login", { replace: true });
      setMsg({ type: "err", text: err?.response?.data?.message || "Gửi nhận xét thất bại." });
    }
  }

  async function deleteReview(id) {
    if (!window.confirm("Xóa nhận xét này?")) return;
    try {
      await api.delete(`/reviews/${id}`, { headers: authHeader });
      setMsg({ type: "ok", text: "Đã xóa nhận xét." });
      await fetchMyReviews();
      if (String(editingId) === String(id)) {
        setComment("");
        setRating(5);
        setEditingId(null);
      }
    } catch (err) {
      if (err?.response?.status === 401) return nav("/login", { replace: true });
      setMsg({ type: "err", text: "Xóa nhận xét thất bại." });
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "26px auto", padding: "0 16px", fontFamily: "Inter, system-ui", color: "#0f172a" }}>
      {/* breadcrumb */}
      <div style={{ marginBottom: 10, color: "#475569" }}>
        <Link to="/" style={{ color: "#1e40af", fontWeight: 800 }}>
          Trang chủ
        </Link>{" "}
        <span style={{ opacity: 0.6 }}>›</span>{" "}
        <b>Nhận xét chuyến đi</b>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 12px 30px rgba(2,6,23,.06)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: 16,
            borderBottom: "1px solid #e5e7eb",
            background: "linear-gradient(180deg,#f8fafc,#ffffff)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg,#22d3ee,#2563eb)",
                boxShadow: "0 6px 18px rgba(37,99,235,.25)",
                color: "#fff",
                fontSize: 18,
              }}
            >
              ⭐
            </div>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900 }}>Nhận xét chuyến đi</h2>
              <div style={{ color: "#64748b", fontSize: 13 }}>Chọn chuyến đã đi để chấm sao & viết nhận xét</div>
            </div>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([fetchMyTrips(), fetchMyReviews()]).finally(() => setLoading(false));
            }}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ↻ Tải lại
          </button>
        </div>

        {/* alert */}
        {msg && (
          <div
            style={{
              margin: "12px 16px 0",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 800,
              background: msg.type === "ok" ? "#e8f6ee" : "#fdecec",
              color: msg.type === "ok" ? "#166534" : "#991b1b",
              border: `1px solid ${msg.type === "ok" ? "#b7ebc6" : "#f3b7b7"}`,
            }}
          >
            {msg.text}
          </div>
        )}

        {/* body */}
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 48,
                    borderRadius: 10,
                    background: "linear-gradient(90deg,#f3f4f6,#eef2f7,#f3f4f6)",
                    backgroundSize: "200% 100%",
                    animation: "sh 1.2s infinite",
                  }}
                />
              ))}
              <style>{`@keyframes sh{0%{background-position:0 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <>
              {/* form */}
              <form ref={formRef} onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
                {/* select trip */}
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800, color: "#334155" }}>Chọn chuyến</label>
                  <select
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none", background: "#fff" }}
                  >
                    <option value="">-- Chọn chuyến đã đi --</option>
                    {myTrips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t?.route ? `${t.route.from} → ${t.route.to}` : `#${t.id}`} • {t.date} {t.time}{" "}
                        {t?.price ? `• ${money.format(t.price)}` : ""}
                      </option>
                    ))}
                  </select>
                  {pickedTrip && (
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      Bến đón: <b>{pickedTrip.depart_station || "—"}</b> • Bến trả: <b>{pickedTrip.arrive_station || "—"}</b>
                    </div>
                  )}
                </div>

                {/* rating */}
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800, color: "#334155" }}>Mức độ hài lòng</label>
                  <Stars value={rating} onChange={setRating} />
                </div>

                {/* comment */}
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800, color: "#334155" }}>Nhận xét</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    ref={commentRef}
                    placeholder="Chia sẻ trải nghiệm của bạn (vd: tài xế thân thiện, xe sạch, chạy đúng giờ...)"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(37,99,235,.25)",
                    }}
                    disabled={!tripId}
                  >
                    {(editingId || myExisting) ? "Cập nhật nhận xét" : "Gửi nhận xét"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setRating(5);
                        setComment("");
                      }}
                      style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 900, cursor: "pointer" }}
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>

              {/* list my reviews */}
              <div style={{ marginTop: 18, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                <h3 style={{ margin: "0 0 10px", fontWeight: 900 }}>Nhận xét đã gửi</h3>
                {reviews.length === 0 ? (
                  <div style={{ color: "#64748b" }}>Bạn chưa có nhận xét nào.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {reviews.map((r) => (
                      <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 800 }}>
                            {r?.trip?.route ? `${r.trip.route.from} → ${r.trip.route.to}` : `Chuyến #${r.trip_id || r.tripId}`}
                            <span style={{ color: "#64748b", fontWeight: 600 }}>
                              {" "}
                              • {r?.trip?.date || r.date || "—"} {r?.trip?.time || ""}
                            </span>
                          </div>
                          <Stars value={Number(r.rating || 0)} readOnly size={18} />
                        </div>
                        {r.comment && <div style={{ marginTop: 6, color: "#334155" }}>{r.comment}</div>}
                        <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                          <button
                            className="btn soft sm"
                            onClick={() => {
                              setTripId(String(r.trip_id ?? r.tripId));
                              setRating(Number(r.rating || 5));
                              setComment(r.comment || "");
                              setEditingId(r.id);
                              setTimeout(() => {
                                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                commentRef.current?.focus();
                              }, 0);
                            }}
                          >
                            Sửa nhanh
                          </button>
                          <button className="btn danger sm" onClick={() => deleteReview(r.id)}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* small inline styles for small buttons */}
      <style>{`
        .btn.soft{ background:#f1f5f9; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; font-weight:800; cursor:pointer; }
        .btn.danger{ background:#ef4444; color:#fff; border:none; border-radius:10px; padding:8px 10px; font-weight:800; cursor:pointer; }
        .btn.sm{ padding:8px 10px; border-radius:10px; font-weight:800; }
      `}</style>
    </div>
  );
}
