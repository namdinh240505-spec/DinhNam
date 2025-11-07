// src/pages/BookingDetail.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ===== Helpers ===== */
const normalizeArray = (data) => {
  const d = data?.data ?? data?.items ?? data?.results ?? data;
  if (Array.isArray(d)) return d;
  if (d == null) return [];
  return [d];
};
const moneyFmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function seatsToString(b) {
  if (Array.isArray(b?.seat_numbers)) return b.seat_numbers.join(", ");
  if (typeof b?.seat_numbers === "string" && b.seat_numbers.trim() !== "") {
    try { const arr = JSON.parse(b.seat_numbers); if (Array.isArray(arr)) return arr.join(", "); }
    catch { return b.seat_numbers; }
  }
  if (typeof b?.seats_list === "string" && b.seats_list.trim() !== "") return b.seats_list;
  if (b?.seat_number) return String(b.seat_number);
  if (b?.seats) return String(b.seats);
  return "—";
}
const toBoolPaid = (v) => (typeof v === "boolean" ? v
  : typeof v === "number" ? v === 1
  : typeof v === "string" ? ["1","true","paid","yes","đã thanh toán"].includes(v.trim().toLowerCase())
  : false);

/* Geocode + OSRM */
async function geocodePlace(query) {
  if (!query) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=0&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "vi" } });
  if (!res.ok) return null;
  const arr = await res.json();
  if (!arr?.length) return null;
  const { lat, lon } = arr[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon) };
}
async function fetchRoute(from, to) {
  if (!from || !to) return null;
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const coords = json?.routes?.[0]?.geometry?.coordinates;
  if (!coords) return null;
  return coords.map(([lon, lat]) => [lat, lon]);
}

export default function BookingDetail() {
  const { code: raw } = useParams();
  const code = decodeURIComponent(raw || "");
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [booking, setBooking] = useState(null);

  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const routeLayer = useRef(null);
  const markers = useRef([]);

  /* Load booking */
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!code) { setErr("Thiếu mã vé."); setLoading(false); return; }
      setLoading(true); setErr(null);
      try {
        let data;
        try {
          const r1 = await api.get(`/bookings/${encodeURIComponent(code)}`);
          data = r1.data;
        } catch {
          const r2 = await api.get("/bookings", { params: { code } });
          const arr = normalizeArray(r2.data);
          if (!arr.length) throw new Error("Không tìm thấy vé.");
          data = arr[0];
        }
        if (!alive) return;
        setBooking(data);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Không tải được chi tiết vé.";
        if (alive) setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [code]);

  /* Leaflet */
  useEffect(() => {
    const hasLeaflet = !!window.L;
    let cssEl, jsEl;
    const init = () => {
      if (mapObj.current || !mapRef.current || !window.L) return;
      const L = window.L;
      mapObj.current = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(mapObj.current);
      mapObj.current.setView([10.777, 106.695], 5);
    };
    if (!hasLeaflet) {
      cssEl = document.createElement("link");
      cssEl.rel = "stylesheet";
      cssEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssEl);
      jsEl = document.createElement("script");
      jsEl.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      jsEl.addEventListener("load", init);
      document.body.appendChild(jsEl);
    } else init();

    return () => {
      jsEl?.removeEventListener?.("load", init);
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  }, []);

  /* Draw route */
  useEffect(() => {
    async function draw() {
      if (!booking || !window.L || !mapObj.current) return;
      const L = window.L;
      if (routeLayer.current) { mapObj.current.removeLayer(routeLayer.current); routeLayer.current = null; }
      markers.current.forEach(m => mapObj.current.removeLayer(m));
      markers.current = [];

      const trip = booking?.trip || {};
      const fromTxt = trip?.route?.from || trip?.depart_station || "";
      const toTxt   = trip?.route?.to   || trip?.arrive_station || "";
      if (!fromTxt || !toTxt) return;

      const [from, to] = await Promise.all([geocodePlace(fromTxt), geocodePlace(toTxt)]);
      if (!from || !to) return;

      const mA = L.marker([from.lat, from.lng], { title: fromTxt }).addTo(mapObj.current);
      const mB = L.marker([to.lat, to.lng], { title: toTxt }).addTo(mapObj.current);
      markers.current = [mA, mB];

      const line = await fetchRoute(from, to);
      if (line && line.length) {
        routeLayer.current = L.polyline(line, { weight: 5, opacity: 0.9 }).addTo(mapObj.current);
        mapObj.current.fitBounds(routeLayer.current.getBounds(), { padding: [40, 40] });
      } else {
        const group = L.featureGroup([mA, mB]);
        mapObj.current.fitBounds(group.getBounds(), { padding: [40, 40] });
      }
    }
    draw();
  }, [booking]);

  /* Prepare data */
  const trip = booking?.trip || {};
  const routeLabel = trip?.route ? `${trip.route.from} → ${trip.route.to}` : "—";
  const dateStr = trip?.date || "—";
  const timeStr = trip?.time || "—";
  const seats = seatsToString(booking);
  const vendor = trip?.bus_plate || trip?.operator || trip?.bus_company || trip?.bus || "Nhà xe";
  const price = Number(trip?.price ?? booking?.price);
  const priceStr = Number.isFinite(price) ? moneyFmt.format(price) : "—";
  const paid = toBoolPaid(booking?.paid);
  const isCancelled = String(booking?.status || "").toLowerCase().includes("hủy");
  const canPay = !paid && !isCancelled && booking?.code;

  return (
    <div className="bd-shell">
      <div className="bd-wrap">
        {/* Header */}
        <div className="bd-head">
          <div>
            <h1 className="bd-title">Chi tiết vé #{booking?.code || code}</h1>
            <p className="bd-desc">Thông tin chuyến đi và bản đồ lộ trình.</p>
          </div>
          <div className="bd-actions">
            <Link to="/booking" className="btn ghost">← Vé của tôi</Link>
            <button onClick={() => nav(`/booking/detail/${encodeURIComponent(code)}`)} className="btn primary">🔄 Tải lại</button>
          </div>
        </div>

        <div className="bd-grid">
          {/* Info card */}
          <section className="card info">
            {loading && <div className="skeleton">Đang tải chi tiết vé…</div>}
            {err && <div className="alert alert-danger">{err}</div>}
            {!loading && !err && (
              <>
                {/* top */}
                <div className="info-top">
                  <div className="code-box">
                    <span className="label">Mã vé</span>
                    <span className="val">{booking?.code || "—"}</span>
                    <button className="btn-mini" onClick={() => navigator.clipboard.writeText(booking?.code || "")}>Copy</button>
                  </div>
                  <span className={`badge ${isCancelled ? "cancel" : paid ? "paid" : "unpaid"}`}>
                    {isCancelled ? "Đã hủy" : paid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>

                {/* bảng key–value để căn thẳng tuyệt đối */}
                <table className="kv">
                  <tbody>
                    <tr>
                      <th>Tuyến</th>
                      <td>{routeLabel}</td>
                    </tr>
                    <tr>
                      <th>Thời gian</th>
                      <td>
                        <span>{dateStr}</span>
                        <span className="dot" />
                        <span>{timeStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>Ghế</th>
                      <td>{seats}</td>
                    </tr>
                    <tr>
                      <th>Khách</th>
                      <td>
                        <span>{booking?.customer_name || booking?.customer?.name || booking?.name || "Ẩn danh"}</span>
                        <span className="dot" />
                        <span>{booking?.customer_phone || booking?.customer?.phone || booking?.phone || "Không rõ"}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>Xe</th>
                      <td>{vendor}</td>
                    </tr>
                    <tr>
                      <th>Giá vé</th>
                      <td className="price">{priceStr}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="row-actions">
                  <button className="btn ghost" onClick={() => nav(`/booking/detail/${encodeURIComponent(code)}`)}>Làm mới</button>
                  {canPay && (
                    <Link to={`/payment/momo?code=${encodeURIComponent(booking.code)}`} className="btn ghost">
                      Thanh toán MoMo
                    </Link>
                  )}
                  {(trip?.route?.from || trip?.depart_station) && (trip?.route?.to || trip?.arrive_station) && (
                    <a
                      className="btn ghost"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip?.route?.from || trip?.depart_station)}&destination=${encodeURIComponent(trip?.route?.to || trip?.arrive_station)}&travelmode=driving`}
                      target="_blank" rel="noreferrer"
                    >
                      Mở Google Maps
                    </a>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Map card */}
          <section className="card map">
            <h3>Bản đồ lộ trình</h3>
            <div ref={mapRef} className="map-box" />
            <p className="map-note">
              * Tuyến đường do OSRM/OSM tính toán, có thể khác thực tế. Nhấn “Mở Google Maps” để điều hướng chuẩn.
            </p>
          </section>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        :root{
          --brand:#2563eb; --ink:#e5e7eb; --muted:#94a3b8;
          --card:rgba(255,255,255,.06); --line:rgba(148,163,184,.18);
          --shell:linear-gradient(145deg, #0f172a, #1e293b);
        }
        .bd-shell{ background:var(--shell); min-height:100vh; color:var(--ink); }
        .bd-wrap{ max-width:1140px; margin:0 auto; padding:20px 16px 56px; }
        .bd-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .bd-title{ margin:0 0 4px 0; font-weight:900; }
        .bd-desc{ margin:0; color:var(--muted); }
        .bd-actions{ display:flex; gap:8px; flex-wrap:wrap; }

        .bd-grid{ display:grid; grid-template-columns: 1.1fr 1fr; gap:16px; }
        .card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; backdrop-filter: blur(10px); box-shadow:0 8px 24px rgba(0,0,0,.35); }
        .card h3{ margin:0 0 10px 0; font-weight:900; }

        /* header info */
        .info .info-top{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
        .info .code-box{ display:flex; align-items:center; gap:8px; }
        .info .code-box .label{ color:var(--muted); font-size:14px; }
        .info .code-box .val{ font-weight:900; font-size:18px; }
        .info .badge{ margin-left:auto; padding:4px 10px; border-radius:999px; font-weight:800; font-size:12px; white-space:nowrap; }
        .badge.paid{ background:#e8f6ee; color:#166534; }
        .badge.unpaid{ background:#fdecec; color:#991b1b; }
        .badge.cancel{ background:#fee2e2; color:#7f1d1d; }

        /* bảng key-value: căn thẳng tuyệt đối */
        .kv{ width:100%; border-collapse:collapse; }
        .kv th, .kv td{
          padding:12px 0;
          border-bottom:1px dashed var(--line);
          vertical-align:middle;
        }
        .kv th{ width:180px; text-align:left; color:var(--muted); font-weight:900; }
        .kv td{ color:#f8fafc; font-weight:700; }
        .kv td.price{ font-weight:900; font-size:18px; color:#fff; }
        .kv td > span{ display:inline-flex; align-items:center; gap:8px; }
        .dot{ width:6px; height:6px; border-radius:50%; background:var(--line); display:inline-block; margin:0 8px; }

        .row-actions{ margin-top:14px; display:flex; gap:8px; flex-wrap:wrap; }
        .btn{ padding:10px 14px; border-radius:10px; cursor:pointer; text-decoration:none; font-weight:900; display:inline-flex; align-items:center; gap:8px; }
        .btn.primary{ background:var(--brand); color:#fff; border:none; box-shadow:0 10px 24px rgba(37,99,235,.25); }
        .btn.ghost{ background:transparent; color:var(--ink); border:1px solid var(--line); }
        .btn-mini{ padding:6px 10px; border-radius:8px; border:none; background:#3b82f6; color:#fff; font-weight:800; cursor:pointer; white-space:nowrap; }

        .map .map-box{ width:100%; height:420px; border-radius:12px; overflow:hidden; }
        .map-note{ margin:8px 0 0 0; color:#cbd5e1; font-size:13px; }

        .alert{ padding:10px 12px; border-radius:12px; border:1px solid var(--line); }
        .alert-danger{ background:#fdecec; color:#991b1b; }
        .skeleton{ height:20px; background:linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.2), rgba(255,255,255,.08)); background-size:200% 100%; animation: shimmer 1.2s infinite; border-radius:8px; }
        @keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media (max-width: 992px){
          .bd-grid{ grid-template-columns: 1fr; }
          .kv th{ width:140px; }
        }
      `}</style>
    </div>
  );
}
