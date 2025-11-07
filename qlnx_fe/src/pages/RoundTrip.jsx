// src/pages/RoundTrip.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/api/client";
import "@/styles/roundtrip.css";

const nf = new Intl.NumberFormat("vi-VN");
const normalize = (d) => {
  const v = d?.data ?? d?.items ?? d?.results ?? d;
  return Array.isArray(v) ? v : v ? [v] : [];
};

const toDateObj = (t) =>
  t?.date && t?.time ? new Date(`${t.date}T${t.time}:00`) : new Date(8640000000000000);

// Lọc theo ngày (client). Nếu không có chuyến đúng ngày → fallback danh sách đầy đủ
function filterByDateOrFallback(list, dateStr) {
  if (!dateStr) return list;
  const only = list.filter((x) => String(x.date) === String(dateStr));
  return only.length ? only : list;
}

export default function RoundTrip() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  // Thông tin đã nhập ở bước "Tìm chuyến"
  const goRouteId = sp.get("go");        // id tuyến lượt đi
  const fromQ = sp.get("from") || "";    // điểm đi
  const toQ   = sp.get("to") || "";      // điểm đến
  const goDate = sp.get("date") || new Date().toISOString().slice(0, 10); // ngày đi cố định

  const [routes, setRoutes] = useState([]);
  const [backRouteId, setBackRouteId] = useState(null);

  // Danh sách tất cả chuyến (không truyền date lên API)
  const [goAll, setGoAll] = useState([]);
  const [backAll, setBackAll] = useState([]);

  // Danh sách hiển thị (lọc client + fallback)
  const [goTrips, setGoTrips] = useState([]);
  const [backTrips, setBackTrips] = useState([]);

  const [loadingGo, setLoadingGo] = useState(true);
  const [loadingBack, setLoadingBack] = useState(true);
  const [err, setErr] = useState(null);

  const [selGo, setSelGo] = useState(null);
  const [selBack, setSelBack] = useState(null);

  // Ngày về có thể chọn (mặc định = ngày đi + 1)
  const defaultBackDate = (() => {
    try { const d = new Date(goDate); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); }
    catch { return goDate; }
  })();
  const [backDate, setBackDate] = useState(defaultBackDate);

  /* 1) Tải tuyến để tìm id tuyến ngược (to → from) */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get("/routes");
        if (!alive) return;
        const list = Array.isArray(r.data) ? r.data : [];
        setRoutes(list);
        const back = list.find((x) => x.from === toQ && x.to === fromQ);
        setBackRouteId(back?.id ?? null);
      } catch {
        setErr("Không tải được danh sách tuyến.");
      }
    })();
    return () => { alive = false; };
  }, [fromQ, toQ]);

  /* 2) Gọi API lấy toàn bộ chuyến LƯỢT ĐI (không truyền date) */
  useEffect(() => {
    if (!goRouteId) return;
    let alive = true;
    (async () => {
      setLoadingGo(true);
      try {
        const r = await api.get("/trips", { params: { route: goRouteId } });
        if (!alive) return;
        const list = normalize(r.data)
          .map((t) => ({ ...t, __routeId: goRouteId })) // gắn nhãn
          .sort((a, b) => toDateObj(a) - toDateObj(b));
        setGoAll(list);
      } catch {
        if (alive) setGoAll([]);
      } finally {
        if (alive) setLoadingGo(false);
      }
    })();
    return () => { alive = false; };
  }, [goRouteId]);

  /* 3) Gọi API lấy toàn bộ chuyến LƯỢT VỀ (không truyền date) */
  useEffect(() => {
    if (!backRouteId) return;
    let alive = true;
    (async () => {
      setLoadingBack(true);
      try {
        const r = await api.get("/trips", { params: { route: backRouteId } });
        if (!alive) return;
        const list = normalize(r.data)
          .map((t) => ({ ...t, __routeId: backRouteId }))
          .sort((a, b) => toDateObj(a) - toDateObj(b));
        setBackAll(list);
      } catch {
        if (alive) setBackAll([]);
      } finally {
        if (alive) setLoadingBack(false);
      }
    })();
    return () => { alive = false; };
  }, [backRouteId]);

  /* 4) Lọc theo ngày (client) + fallback, nhưng HIỂN THỊ NGÀY = goDate/backDate */
  useEffect(() => { setGoTrips(filterByDateOrFallback(goAll, goDate)); }, [goAll, goDate]);
  useEffect(() => { setBackTrips(filterByDateOrFallback(backAll, backDate)); }, [backAll, backDate]);

  /* 5) Xác nhận khứ hồi → tới booking1
        - Chỉ chọn ghế lượt đi ở bước tiếp theo.
        - Truyền đúng ngày hiển thị: goDate/backDate (không dùng t.date). */
  function confirmRoundtrip() {
    if (!selGo || !selBack) return;
    const total = (Number(selGo.price || 0) + Number(selBack.price || 0)) || 0;

    const qs =
      `/booking1?go=${selGo.id}&back=${selBack.id}` +
      `&total=${encodeURIComponent(total)}` +
      `&goDate=${encodeURIComponent(goDate)}` +
      `&backDate=${encodeURIComponent(backDate)}`;

    nav(qs, {
      state: {
        go: selGo,
        back: selBack,
        total,
        goDate,
        backDate,
        seatPick: { for: "go" }, // Booking1 chỉ cho chọn ghế lượt đi
      },
    });
  }

  /* ---------- Item hiển thị chuyến (dùng forceDate thay vì t.date) ---------- */
  const TripItem = ({ t, active, onClick, forceDate }) => {
    const depart = t.depart_station || t.from || t.route?.from || "Điểm đi";
    const arrive = t.arrive_station || t.to || t.route?.to || "Điểm đến";
    const available = Math.max(
      Number(t.seats ?? t.bus?.seats ?? 40) - Number(t.booked ?? 0),
      0
    );

    return (
      <li className={`rt-item ${active ? "active" : ""}`} onClick={onClick}>
        <div className="rt-main">
          <div>
            <div className="rt-time">
              {(forceDate ? new Date(forceDate) : new Date()).toLocaleDateString("vi-VN")}
              {" · "}
              {t.time ?? "--:--"}
              {t.arrive_time ? ` → ${t.arrive_time}` : ""}
            </div>
            <div className="rt-sta">
              {depart} → {arrive}
            </div>
          </div>
          <div className="rt-side">
            <div className="rt-price">{nf.format(t.price || 0)} đ</div>
            <div className="rt-sta">{available} ghế trống</div>
          </div>
        </div>
      </li>
    );
  };

  const totalPreview = (Number(selGo?.price || 0) + Number(selBack?.price || 0)) || 0;

  return (
    <div className="rt-container">
      <h1 className="rt-title">{fromQ} ⇄ {toQ}</h1>
      <p className="rt-sub">
        Lượt đi dùng <b>ngày đã nhập ở bước trước</b>. Bạn chỉ cần chọn <b>ngày về</b>.
      </p>
      {err && <div className="rt-alert">{err}</div>}

      <div className="rt-grid">
        {/* ==== Lượt đi (không có input ngày, chỉ hiển thị goDate) ==== */}
        <section className="rt-col">
          <div className="rt-col-head">
            <h3 className="rt-section-title">Lượt đi: {fromQ} → {toQ}</h3>
            <span className="rt-badge">Ngày đi: {new Date(goDate).toLocaleDateString("vi-VN")}</span>
          </div>

          {loadingGo ? (
            <div className="rt-skeleton">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk-line" />)}
            </div>
          ) : goTrips.length === 0 ? (
            <div className="rt-empty">Không có chuyến phù hợp ngày đi — đang hiển thị tất cả chuyến để bạn chọn.</div>
          ) : null}

          <ul className="rt-list">
            {goTrips.map((t) => (
              <TripItem
                key={t.id}
                t={t}
                active={selGo?.id === t.id}
                onClick={() => setSelGo(t)}
                forceDate={goDate}
              />
            ))}
          </ul>
        </section>

        {/* ==== Lượt về (chọn ngày về; hiển thị backDate) ==== */}
        <section className="rt-col">
          <div className="rt-col-head">
            <h3 className="rt-section-title">Lượt về: {toQ} → {fromQ}</h3>
            <input
              className="rt-input"
              type="date"
              value={backDate}
              min={goDate}
              onChange={(e) => setBackDate(e.target.value)}
            />
          </div>

          {loadingBack ? (
            <div className="rt-skeleton">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk-line" />)}
            </div>
          ) : backTrips.length === 0 ? (
            <div className="rt-empty">Không có chuyến về theo ngày — đang hiển thị tất cả chuyến để bạn chọn.</div>
          ) : null}

          <ul className="rt-list">
            {backTrips.map((t) => (
              <TripItem
                key={t.id}
                t={t}
                active={selBack?.id === t.id}
                onClick={() => setSelBack(t)}
                forceDate={backDate}
              />
            ))}
          </ul>
        </section>
      </div>

      <div className="rt-actions">
        <button className="rt-btn" disabled={!selGo || !selBack} onClick={confirmRoundtrip}>
          {selGo && selBack ? `Xác nhận · Tổng ${nf.format(totalPreview)} đ` : "Xác nhận"}
        </button>
      </div>
    </div>
  );
}
