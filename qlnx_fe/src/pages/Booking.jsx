// src/pages/MyTickets.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/api/client";
import "@/styles/tickets.css";

/* ----------------- Helpers cơ bản ----------------- */
function seatsToString(b) {
  if (Array.isArray(b?.seat_numbers)) return b.seat_numbers.join(", ");
  if (typeof b?.seat_numbers === "string" && b.seat_numbers.trim() !== "") {
    try {
      const arr = JSON.parse(b.seat_numbers);
      if (Array.isArray(arr)) return arr.join(", ");
    } catch {
      return b.seat_numbers;
    }
  }
  if (b?.seat_number) return String(b.seat_number);
  if (b?.seats) return String(b.seats);
  return "—";
}
function normalizeArray(data) {
  const d = data?.data ?? data?.items ?? data?.results ?? data;
  if (Array.isArray(d)) return d;
  if (d == null) return [];
  return [d];
}
function toBoolPaidLoose(v) {
  if (v === true) return true;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return ["1", "true", "paid", "đã thanh toán", "da thanh toan", "success", "thanh cong"].includes(s);
  }
  return false;
}
function isPaid(b) {
  return (
    toBoolPaidLoose(b?.is_paid) ||
    toBoolPaidLoose(b?.paid) ||
    (typeof b?.payment_status === "string" && b.payment_status.toLowerCase() === "paid") ||
    Boolean(b?.paid_at)
  );
}
function isCancelled(b) {
  const raw = String(b?.status || "").toLowerCase();
  return raw.includes("hủy") || raw.includes("huy") || raw.includes("cancel");
}
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("auth_token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("api_token") ||
  "";

/* ----------------- Gộp vé ----------------- */
const toNum = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const pick = (a, b) => (a != null && a !== "" ? a : b);
function sameRouteReverse(a, b) {
  const af = a?.trip?.route?.from ?? a?.from;
  const at = a?.trip?.route?.to ?? a?.to;
  const bf = b?.trip?.route?.from ?? b?.from;
  const bt = b?.trip?.route?.to ?? b?.to;
  return af && at && bf && bt && af === bt && at === bf;
}
function detectBackLeg(a, b) {
  const aBack = a?.is_return || a?.is_back || a?.leg === "back";
  const bBack = b?.is_return || b?.is_back || b?.leg === "back";
  if (aBack && !bBack) return { go: b, back: a };
  if (bBack && !aBack) return { go: a, back: b };
  if (sameRouteReverse(a, b)) {
    const ta = new Date(`${a?.trip?.date ?? ""}T${a?.trip?.time ?? "00:00"}:00`).getTime();
    const tb = new Date(`${b?.trip?.date ?? ""}T${b?.trip?.time ?? "00:00"}:00`).getTime();
    return ta <= tb ? { go: a, back: b } : { go: b, back: a };
  }
  return { go: a, back: b };
}
function mergePair(go, back) {
  const ug = toNum(go?.trip?.price ?? go?.price);
  const ub = toNum(back?.trip?.price ?? back?.price ?? ug);
  return {
    id: pick(go?.id, back?.id),
    code: pick(go?.code, back?.code),
    customer: pick(go?.customer, back?.customer),
    phone: pick(go?.phone, back?.phone),
    roundtrip: true,
    trip: go?.trip,
    back_trip: back?.trip,
    total_price: toNum(go?.total_price) || toNum(back?.total_price) || (ug + ub),
    paid: go?.paid || back?.paid,
    payment_status: pick(go?.payment_status, back?.payment_status),
    status: pick(go?.status, back?.status),
  };
}
function mergeBookingsByCode(raw) {
  const map = new Map();
  (raw || []).forEach((b) => {
    const code = b?.code || `__nocode__${b?.id}`;
    if (!map.has(code)) map.set(code, []);
    map.get(code).push(b);
  });
  const result = [];
  for (const arr of map.values()) {
    if (arr.length === 1) result.push(arr[0]);
    else {
      const { go, back } = detectBackLeg(arr[0], arr[1]);
      result.push(mergePair(go, back));
    }
  }
  return result;
}

/* ----------------- Component ----------------- */
export default function MyTickets() {
  const [sp] = useSearchParams();
  const codeParam = sp.get("code") || "";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [myPhone, setMyPhone] = useState("");
  const [activeTab, setActiveTabState] = useState("all");

  const setActiveTab = useCallback((val) => {
    setActiveTabState((prev) => (prev === val ? prev : val));
  }, []);

  const money = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }),
    []
  );

  const fetchMine = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const r = await api.get("/bookings", { params: { mine: 1 }, headers: { Authorization: `Bearer ${token}` } });
      const arr = normalizeArray(r.data);
      setList(mergeBookingsByCode(arr));
      if (arr[0]?.phone) setMyPhone(arr[0].phone);
    } catch {
      setErr("Không tải được vé của bạn.");
    } finally {
      setLoading(false);
    }
  };

  const fetchByCode = async (code) => {
    if (!code) return;
    setLoading(true);
    try {
      const r = await api.get("/bookings", { params: { code } });
      const arr = normalizeArray(r.data);
      setList(mergeBookingsByCode(arr));
    } catch {
      setErr("Không tải được vé bằng mã.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const code = codeParam || localStorage.getItem("last_booking_code");
      if (code) await fetchByCode(code);
      else await fetchMine();
    })();
  }, [codeParam]);

  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
  };

  const filtered = useMemo(() => {
    if (activeTab === "paid") return list.filter(isPaid);
    if (activeTab === "unpaid") return list.filter((b) => !isPaid(b) && !isCancelled(b));
    if (activeTab === "cancelled") return list.filter(isCancelled);
    return list;
  }, [list, activeTab]);

  return (
    <div className="tickets-bg font-inter">
      <div className="tickets-wrap">
        <div className="tickets-panel">
          <div className="tickets-panel__head">
            <div>
              <h1 className="tickets-title">🎟 Vé của tôi</h1>
              <p className="tickets-desc">
                Các vé đã đặt{myPhone ? ` (SĐT: ${myPhone})` : ""}.
              </p>
            </div>
            <button onClick={fetchMine} disabled={loading} className="btn-primary">
              {loading ? "Đang tải…" : "🔄 Tải lại"}
            </button>
          </div>

          {/* Tabs */}
          <div className="tickets-tabs">
            {[
              ["all", "Tất cả"],
              ["paid", "Đã thanh toán"],
              ["unpaid", "Chưa thanh toán"],
              ["cancelled", "Đã hủy"],
            ].map(([val, label]) => (
              <button
                key={val}
                className={`tab ${activeTab === val ? "is-active" : ""}`}
                onClick={() => setActiveTab(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {err && <div className="alert alert-danger mb-4">{err}</div>}

          <div className="tickets-list">
            {loading && <p>⏳ Đang tải...</p>}

            {!loading && filtered.length === 0 && <p>Không có vé phù hợp.</p>}

            {!loading &&
              filtered.map((b) => {
                const trip = b?.trip || {};
                const back = b?.back_trip || null;
                const code = b?.code || "—";
                const route = trip?.route?.from && trip?.route?.to
                  ? `${trip.route.from} → ${trip.route.to}`
                  : "—";
                const backRoute = back?.route?.from && back?.route?.to
                  ? `${back.route.from} → ${back.route.to}`
                  : null;
                const total = money.format(toNum(b.total_price));

                return (
                  <div key={b.id} className="ticket-card">
                    <div className="ticket-card__head">
                      <div className="left">
                        <div className="code">
                          <span className="label">Mã vé:</span>
                          <span className="value">{code}</span>
                          <button className="btn-mini" onClick={() => copyCode(code)}>
                            Copy
                          </button>
                        </div>
                        {isCancelled(b) ? (
                          <span className="tk-badge tk-badge--cancel">Đã hủy</span>
                        ) : isPaid(b) ? (
                          <span className="tk-badge tk-badge--paid">Đã thanh toán</span>
                        ) : (
                          <span className="tk-badge tk-badge--unpaid">Chưa thanh toán</span>
                        )}
                      </div>
                      <div className="right">
                        <div className="price">{total}</div>
                        {b.roundtrip && <div className="rt-flag">Khứ hồi</div>}
                      </div>
                    </div>

                    <div className="ticket-card__body">
                      <p><b>Tuyến:</b> {route}</p>
                      <p><b>Ngày:</b> {trip.date || "—"} • {trip.time || "—"}</p>
                      <p><b>Xe:</b> {trip.bus || "—"}</p>
                      <p><b>Ghế:</b> {seatsToString(b)}</p>
                      <p><b>Khách:</b> {b.customer}</p>
                      <p><b>SĐT:</b> {b.phone}</p>

                      {back && (
                        <div className="back-trip mt-2 p-2 border-t border-gray-600">
                          <p><b>↩ Lượt về:</b> {backRoute}</p>
                          <p><b>Ngày:</b> {back.date || "—"} • {back.time || "—"}</p>
                          <p><b>Xe:</b> {back.bus || "—"}</p>
                        </div>
                      )}
                    </div>

                    <div className="ticket-card__actions">
                      <Link to={`/booking/detail/${code}`} className="btn-ghost">
                        Xem chi tiết
                      </Link>
                      {!isPaid(b) && !isCancelled(b) && (
                        <Link to={`/payment/momo?code=${encodeURIComponent(code)}`} className="btn-primary">
                          Thanh toán MoMo
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
