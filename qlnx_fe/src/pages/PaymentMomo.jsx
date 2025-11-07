// src/pages/PaymentMomo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/api/client";
import "@/styles/payment-momo.css";

/* ===== Helpers ===== */
function SeatText(b) {
  if (Array.isArray(b?.seat_numbers)) return b.seat_numbers.join(", ");
  if (typeof b?.seat_numbers === "string" && b.seat_numbers.trim() !== "") return b.seat_numbers;
  if (typeof b?.seats_list === "string" && b.seats_list.trim() !== "") return b.seats_list;
  if (b?.seat_number) return String(b.seat_number);
  return String(b?.seats ?? "—");
}
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const toNum = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const normalizeArray = (data) => {
  const d = data?.data ?? data?.items ?? data?.results ?? data;
  return Array.isArray(d) ? d : d ? [d] : [];
};
const seatQty = (b) =>
  Array.isArray(b?.seat_numbers)
    ? b.seat_numbers.length
    : Number.isFinite(Number(b?.seats)) && Number(b?.seats) > 0
    ? Number(b.seats)
    : 0;

/* ========== Gộp 2 bản ghi theo code (đi + về) nếu BE trả tách ========== */
const sameRouteReverse = (a, b) => {
  const af = a?.trip?.route?.from ?? a?.from ?? a?.depart_station;
  const at = a?.trip?.route?.to   ?? a?.to   ?? a?.arrive_station;
  const bf = b?.trip?.route?.from ?? b?.from ?? b?.depart_station;
  const bt = b?.trip?.route?.to   ?? b?.to   ?? b?.arrive_station;
  return af && at && bf && bt && af === bt && at === bf;
};
const detectGoBack = (a, b) => {
  // ưu tiên flag từ BE nếu có
  const aBack = a?.is_return || a?.is_back || a?.leg === "back" || a?.direction === "return";
  const bBack = b?.is_return || b?.is_back || b?.leg === "back" || b?.direction === "return";
  if (aBack && !bBack) return { go: b, back: a };
  if (bBack && !aBack) return { go: a, back: b };

  if (sameRouteReverse(a, b)) {
    const ta = new Date(`${a?.trip?.date ?? a?.date ?? ""}T${a?.trip?.time ?? a?.time ?? "00:00"}:00`).getTime() || 0;
    const tb = new Date(`${b?.trip?.date ?? b?.date ?? ""}T${b?.trip?.time ?? b?.time ?? "00:00"}:00`).getTime() || 0;
    return ta <= tb ? { go: a, back: b } : { go: b, back: a };
  }
  return { go: a, back: b };
};
const mergeTwo = (go, back) => {
  const qty = seatQty(go) || seatQty(back) || 0;
  const unitGo   = toNum(go?.trip?.price ?? go?.unit_price_go ?? go?.price);
  const unitBack = toNum(back?.trip?.price ?? back?.unit_price_back ?? back?.price ?? unitGo);

  return {
    id: go?.id ?? back?.id,
    code: go?.code ?? back?.code ?? null,
    customer: go?.customer ?? back?.customer ?? "",
    phone: go?.phone ?? back?.phone ?? "",
    seat_numbers: go?.seat_numbers ?? back?.seat_numbers ?? [],
    seats: qty,
    roundtrip: true,
    trip: {
      price: unitGo,
      date : go?.trip?.date ?? go?.date ?? null,
      time : go?.trip?.time ?? go?.time ?? null,
      bus  : go?.trip?.bus  ?? go?.bus  ?? null,
      route: go?.trip?.route ?? go?.route ?? undefined,
    },
    back_trip: {
      price: unitBack,
      time : back?.trip?.time ?? back?.time ?? null,
      bus  : back?.trip?.bus  ?? back?.bus  ?? null,
      route: back?.trip?.route ?? back?.route ?? undefined,
    },
    back_date: back?.trip?.date ?? back?.date ?? null,
    total_price:
      toNum(go?.total_price) > 0
        ? toNum(go?.total_price)
        : toNum(back?.total_price) > 0
        ? toNum(back?.total_price)
        : qty * (unitGo + unitBack),
    paid: (go?.paid || back?.paid) || false,
    payment_status: go?.payment_status ?? back?.payment_status ?? null,
    status: go?.status ?? back?.status ?? null,
  };
};
const mergeBookingsByCode = (arr) => {
  const list = normalizeArray(arr);
  if (list.length <= 1) return list[0] || null;
  // nếu có bản ghi đã là khứ hồi → dùng luôn
  const hasRT = list.find((x) => x?.roundtrip || x?.back_trip || x?.back_trip_id);
  if (hasRT) return hasRT;
  // ghép hai bản ghi
  const { go, back } = detectGoBack(list[0], list[1]);
  return mergeTwo(go, back);
};

/* ========== Component ========== */
export default function PaymentMomo() {
  const [sp] = useSearchParams();
  const code = sp.get("code") || "";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  const [lastPayUrl, setLastPayUrl] = useState("");
  const [lastDeeplink, setLastDeeplink] = useState("");
  const [showLinks, setShowLinks] = useState(false);

  // rtCtx từ Booking1 (khi vừa đặt xong)
  const rtCtx = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("rtCtx") || "null"); }
    catch { return null; }
  }, []);

  // Hợp nhất dữ liệu từ API + rtCtx để đủ field cho UI & payment
  function mergeWithCtx(apiBk, ctx) {
    const base = apiBk ? (apiBk.data ?? apiBk) : {};
    let bk = { ...base };

    // Nếu API trả nhiều dòng cho cùng code → gộp lại (đi + về)
    if (Array.isArray(base)) {
      bk = mergeBookingsByCode(base);
    }

    if (!ctx) return bk;

    // user & seats
    bk.seats = bk.seats ?? ctx.seats ?? (Array.isArray(ctx.seat_numbers) ? ctx.seat_numbers.length : undefined);
    bk.seat_numbers = bk.seat_numbers ?? ctx.seat_numbers ?? [];
    bk.customer = bk.customer ?? ctx.customer ?? "";
    bk.phone = bk.phone ?? ctx.phone ?? "";

    // GO
    bk.trip = bk.trip || {};
    bk.trip.price = toNum(bk.trip.price ?? ctx.unitGo ?? ctx.go?.price ?? 0);
    bk.trip.date = bk.trip.date ?? ctx.go?.date ?? null;
    bk.trip.time = bk.trip.time ?? ctx.go?.time ?? null;
    bk.trip.bus  = bk.trip.bus  ?? ctx.go?.bus  ?? null;
    if (ctx.go?.route && !bk.trip.route) bk.trip.route = ctx.go.route;

    // RT
    const isRT = Boolean(bk.roundtrip || ctx.roundtrip);
    bk.roundtrip = isRT;
    if (isRT) {
      bk.back_trip = bk.back_trip || {};
      bk.back_trip.price = toNum(bk.back_trip.price ?? ctx.unitBack ?? ctx.unitGo ?? bk.trip.price);
      bk.back_trip.time  = bk.back_trip.time  ?? ctx.back?.time ?? null;
      bk.back_trip.bus   = bk.back_trip.bus   ?? ctx.back?.bus  ?? null;
      if (ctx.back?.route && !bk.back_trip.route) bk.back_trip.route = ctx.back.route;
      bk.back_date = bk.back_date ?? ctx.back?.date ?? null;
    }

    // total
    const qty = toNum(bk.seats ?? (Array.isArray(bk.seat_numbers) ? bk.seat_numbers.length : 0));
    const unitGo = toNum(bk.trip?.price);
    const unitBack = isRT ? toNum(bk.back_trip?.price || unitGo) : 0;
    bk.total_price = toNum(bk.total_price) || toNum(ctx.total) || qty * (unitGo + unitBack);

    bk.code = bk.code ?? ctx.code ?? code ?? null;
    return bk;
  }

  async function fetchBooking() {
    if (!code) return setErr("Thiếu mã vé.");
    try {
      setLoading(true);
      const r = await api.get("/bookings", { params: { code } });
      const list = normalizeArray(r.data);
      // nếu BE trả 2 bản ghi → merge
      const mergedApi = list.length > 1 ? mergeBookingsByCode(list) : (list[0] || null);
      const merged = mergeWithCtx(mergedApi, rtCtx);
      setBooking(merged);
      if (!merged) setErr("Không tìm thấy vé.");
    } catch (e) {
      // fallback: dùng ctx nếu có
      const merged = mergeWithCtx(null, rtCtx);
      if (merged && merged.code) setBooking(merged);
      else setErr(e?.response?.data?.message || "Không tải được vé.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBooking(); /* eslint-disable-next-line */ }, [code]);

  // countdown
  useEffect(() => {
    if (!booking) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [booking]);

  const price = useMemo(() => {
    const qty = toNum(booking?.seats) || (Array.isArray(booking?.seat_numbers) ? booking.seat_numbers.length : 0);
    const unitGo = toNum(booking?.trip?.price);
    const isRT = Boolean(booking?.roundtrip);
    const unitBack = isRT ? toNum(booking?.back_trip?.price || unitGo) : 0;
    const total = toNum(booking?.total_price) || qty * (unitGo + unitBack);
    return { qty, unitGo, unitBack, total, isRT };
  }, [booking]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  async function payNow() {
    if (!booking || price.total <= 0 || !booking?.code) return;
    try {
      setPaying(true);
      const { data } = await api.post("/pay/momo/init", { code: booking.code, amount: price.total });
      if (data?.ok === false) {
        const rc = data?.momo?.resultCode;
        const msg = data?.momo?.message || data?.message || "Tạo giao dịch thất bại.";
        setErr(`MoMo${rc ? ` (${rc})` : ""}: ${msg}`);
        return;
      }
      setLastPayUrl(data?.payUrl || data?.pay_url || "");
      setLastDeeplink(data?.deeplink || "");
      setShowLinks(true);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Không tạo được thanh toán.");
    } finally {
      setPaying(false);
    }
  }

  async function copy(text, type) {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(type);
      setTimeout(() => setCopied(""), 1200);
    } catch {}
  }

  return (
    <div className="payment-momo">
      <div className="payment-header">
        <h1 className="payment-title">Thanh toán MoMo</h1>
        <div className="code-badge">Mã vé: <b>{booking?.code || code || "—"}</b></div>
      </div>

      <div className="payment-card">
        {/* Cột 1: Thông tin vé */}
        <div className="section">
          <h2>Thông tin vé</h2>

          {err && <div className="status-error">{err}</div>}
          {loading && (
            <div className="animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
              <div className="h-5 w-52 bg-slate-200 rounded mb-3" />
            </div>
          )}

          {!loading && booking && (
            <>
              <div className="info"><span className="label">Khách hàng</span><span className="value">{booking.customer || "—"}</span></div>
              <div className="info"><span className="label">SĐT</span><span className="value">{booking.phone || "—"}</span></div>
              <div className="info"><span className="label">Ghế</span><span className="value">{SeatText(booking)}</span></div>

              {/* Lượt đi */}
              <div className="segment">
                <h3>🚌 Lượt đi</h3>
                <div className="info">
                  <span className="label">Chuyến</span>
                  <span className="value">
                    {booking.trip?.route ? `${booking.trip.route.from} → ${booking.trip.route.to}` : booking.trip?.bus || "—"}
                  </span>
                </div>
                <div className="info">
                  <span className="label">Ngày giờ</span>
                  <span className="value">
                    {booking.trip?.date || "—"} • {booking.trip?.time || "—"}{booking.trip?.bus ? ` • ${booking.trip.bus}` : ""}
                  </span>
                </div>
                <div className="info">
                  <span className="label">Tiền lượt đi</span>
                  <span className="value">{money.format(price.unitGo)}</span>
                </div>
              </div>

              {/* Lượt về nếu có */}
              {price.isRT && (
                <div className="segment">
                  <h3>🔁 Lượt về</h3>
                  <div className="info">
                    <span className="label">Chuyến</span>
                    <span className="value">
                      {booking.back_trip?.route
                        ? `${booking.back_trip.route.from} → ${booking.back_trip.route.to}`
                        : booking.back_trip?.bus || "—"}
                    </span>
                  </div>
                  <div className="info">
                    <span className="label">Ngày giờ</span>
                    <span className="value">
                      {booking.back_date || "—"} • {booking.back_trip?.time || "—"}
                      {booking.back_trip?.bus ? ` • ${booking.back_trip.bus}` : ""}
                    </span>
                  </div>
                  <div className="info">
                    <span className="label">Tiền lượt về</span>
                    <span className="value">{money.format(price.unitBack || price.unitGo)}</span>
                  </div>
                </div>
              )}

              {/* Mã vé + copy */}
              <div className="info" style={{ marginTop: 8 }}>
                <span className="label">Mã vé</span>
                <span className="value" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {booking.code || code}
                  <button onClick={() => copy(booking.code || code, "code")} className="copy-btn">Sao chép</button>
                  {copied === "code" && <span className="text-emerald-600 text-sm">Đã sao chép!</span>}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Cột 2: Thanh toán */}
        <div className="section payment-detail">
          <div className="countdown">Hết hạn trong: <b>{mm}:{ss}</b></div>
          <h2>Chi tiết thanh toán</h2>

          <div className="info"><span className="label">Hành trình</span><span className="value">{price.isRT ? "Khứ hồi" : "Một chiều"}</span></div>
          <div className="info"><span className="label">Số lượng ghế</span><span className="value">{price.qty}</span></div>

          <div className="payment-total">
            <span>Tổng thanh toán</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <b>{money.format(price.total)}</b>
              <button onClick={() => copy(price.total, "amount")} className="copy-btn">Copy</button>
            </div>
          </div>
          {copied === "amount" && <div className="mt-2 text-emerald-600 text-sm">Đã sao chép số tiền!</div>}

          <button onClick={payNow} disabled={paying || !booking?.code} className="payment-btn" type="button">
            {paying ? "Đang tạo thanh toán…" : "Thanh toán MoMo"}
          </button>

          {showLinks && (lastPayUrl || lastDeeplink) && (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {lastPayUrl && (
                <a href={lastPayUrl} target="_blank" rel="noreferrer" className="payment-btn" style={{ textAlign: "center" }}>
                  Mở trang MoMo
                </a>
              )}
              {lastDeeplink && (
                <a href={lastDeeplink} className="payment-btn confirm-btn" style={{ textAlign: "center" }}>
                  Mở app MoMo
                </a>
              )}
            </div>
          )}

          <div className="links" style={{ marginTop: 14 }}>
            <Link to="/booking">← Về trang đặt vé</Link>
            <span className="mx-2"> • </span>
            <Link to={`/tickets?code=${encodeURIComponent(booking?.code || code || "")}`}>Xem vé của tôi</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
