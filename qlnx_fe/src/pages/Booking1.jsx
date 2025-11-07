// src/pages/Booking1.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/client";

/* ===== Helpers ===== */
const cacheKey = (id, date) => `tripCache:${id}:${date}`;
const moneyFmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function Booking1() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  /* ===== 1) Lấy dữ liệu cũ (một chiều) ===== */
  const savedTrip = (() => {
    try {
      return JSON.parse(localStorage.getItem("selectedTrip") || "{}");
    } catch {
      return {};
    }
  })();

  /* ===== 2) Cache ===== */
  const cached = (() => {
    if (!savedTrip?.id || !savedTrip?.date) return null;
    try {
      return JSON.parse(
        sessionStorage.getItem(cacheKey(savedTrip.id, savedTrip.date)) || "null"
      );
    } catch {
      return null;
    }
  })();

  /* ===== 3) Lượt đi ===== */
  const [trip, setTrip] = useState(cached || savedTrip || null);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    tripId: savedTrip?.id || "",
    date: savedTrip?.date || "",
    name: "",
    phone: "",
    selectedSeats: [],
  });

  /* ===== 4) Bảo vệ: phải có goId ở state/query/local ===== */
  useEffect(() => {
    const anyGoId =
      savedTrip?.id || location.state?.go?.id || sp.get("go") || form.tripId;
    if (!anyGoId) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 5) Nhận ghế từ SeatPickerPage ===== */
  useEffect(() => {
    const fromPicker = location.state?.selectedSeats;
    if (Array.isArray(fromPicker)) {
      const uniqSorted = Array.from(new Set(fromPicker.map(Number)))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b);
      setForm((f) => ({ ...f, selectedSeats: uniqSorted }));
      // Xoá state để không re-apply ở lần render sau
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  /* ===== 6) Ưu tiên dữ liệu từ RoundTrip (nếu có) ===== */
  const goFromState = location.state?.go || null;
  const backFromState = location.state?.back || null;
  const goIdFromQS = sp.get("go");
  const backIdFromQS = sp.get("back");
  const goDateFromQS = sp.get("goDate");
  const backDateFromQS = sp.get("backDate");

  useEffect(() => {
    const goTrip = goFromState || null;
    const goId = goTrip?.id || goIdFromQS || savedTrip?.id || form.tripId;
    const goDate = (
      location.state?.goDate ||
      goDateFromQS ||
      savedTrip?.date ||
      form.date ||
      ""
    ).toString();

    if (goId) setForm((f) => ({ ...f, tripId: goId, date: goDate }));
    if (goTrip) setTrip((prev) => (prev ? { ...prev, ...goTrip } : goTrip));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 7) Fetch dữ liệu chuyến đi theo form ===== */
  useEffect(() => {
    const id = form.tripId || savedTrip?.id;
    const date = form.date || savedTrip?.date;
    if (!id || !date) return;

    const ctrl = new AbortController();
    setSyncing(true);
    api
      .get(`/trips/${id}`, { params: { date }, signal: ctrl.signal })
      .then((res) => {
        const data = res?.data || savedTrip || null;
        if (!data) return;
        setTrip((prev) => (prev ? { ...prev, ...data } : data));
        sessionStorage.setItem(cacheKey(id, date), JSON.stringify(data));
      })
      .catch(() => {})
      .finally(() => setSyncing(false));

    return () => ctrl.abort();
  }, [form.tripId, form.date]);

  /* ===== 8) Meta lượt đi ===== */
  const meta = useMemo(() => {
    const seats = Number(trip?.seats ?? trip?.bus?.seats ?? 40);
    const bookedList = Array.isArray(trip?.booked_seats) ? trip.booked_seats : [];
    const bookedCount = bookedList.length || Number(trip?.booked ?? 0);
    const available = Math.max(seats - bookedCount, 0);

    return {
      seats,
      available,
      time: trip?.time || trip?.depart_time || "—",
      arriveTime: trip?.arrive_time || "—",
      departSta: trip?.depart_station || trip?.route?.from || "Điểm đón",
      arriveSta: trip?.arrive_station || trip?.route?.to || "Điểm trả",
      routeText: trip?.route ? `${trip.route.from} → ${trip.route.to}` : "Chuyến xe",
      busText: trip?.bus?.name || trip?.bus || "—",
      priceEach: Number(trip?.price ?? 0),
      priceText: moneyFmt.format(Number(trip?.price ?? 0)),
    };
  }, [trip]);

  /* ===== 9) Lượt về (tùy chọn) ===== */
  const [backTrip, setBackTrip] = useState(backFromState || null);
  const [backSyncing, setBackSyncing] = useState(false);

  // Fetch chuyến về khi có backId trong state hoặc query
  useEffect(() => {
    const id = backFromState?.id || backIdFromQS;
    const date = backDateFromQS || location.state?.backDate || null;

    if (!id || backTrip?.id) return;

    let alive = true;
    (async () => {
      try {
        setBackSyncing(true);
        const r = await api.get(`/trips/${id}`, { params: { date } });
        if (!alive) return;
        const data = r?.data?.data || r?.data || null;
        if (data) setBackTrip((prev) => (prev ? { ...prev, ...data } : data));
      } catch {
        /* ignore */
      } finally {
        if (alive) setBackSyncing(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [backFromState, backIdFromQS, backDateFromQS, location.state, backTrip?.id]);

  const backMeta = useMemo(() => {
    if (!backTrip) return null;
    return {
      routeText: backTrip?.route
        ? `${backTrip.route.from} → ${backTrip.route.to}`
        : "Chuyến về",
      date: location.state?.backDate || backDateFromQS || backTrip?.date || "",
      time: backTrip?.time || backTrip?.depart_time || "—",
      arriveTime: backTrip?.arrive_time || "—",
      departSta: backTrip?.depart_station || backTrip?.route?.from || "—",
      arriveSta: backTrip?.arrive_station || backTrip?.route?.to || "—",
      priceEach: Number(backTrip?.price ?? 0),
    };
  }, [backTrip, location.state, backDateFromQS]);

  /* ===== 10) Tổng tiền (giá về = giá thật của chuyến về nếu có, không thì = giá đi) ===== */
  const totalPrice = useMemo(() => {
    const unitGo = Number(meta.priceEach || 0);
    const unitBack = backTrip
      ? Number(backTrip?.price ?? unitGo)
      : 0;
    const seats = form.selectedSeats.length || 0;
    return seats * (unitGo + unitBack);
  }, [form.selectedSeats.length, meta.priceEach, backTrip]);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* ===== 11) Chọn ghế (lượt đi) ===== */
  const goPickSeats = () => {
    if (!form.tripId || !form.date) {
      setStatus({ type: "err", msg: "Thiếu thông tin chuyến đi để chọn ghế." });
      return;
    }
    navigate("/SeatPickerPage", {
      state: {
        tripId: form.tripId,
        date: form.date,
        totalSeats: meta.seats,
        bookedSeats: trip?.booked_seats ?? [],
        selectedSeats: form.selectedSeats,
        trip,
        // truyền kèm back để giữ ngữ cảnh khứ hồi khi quay lại:
        back: backTrip || null,
        backDate: backMeta?.date || "",
        goDate: form.date,
      },
    });
  };

  /* ===== 12) Submit ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!form.name || !form.phone)
      return setStatus({ type: "err", msg: "Vui lòng nhập họ tên và điện thoại" });
    if (form.selectedSeats.length === 0)
      return setStatus({ type: "err", msg: "Bạn chưa chọn ghế" });
    if (form.selectedSeats.length > meta.available)
      return setStatus({ type: "err", msg: "Số ghế chọn vượt quá số ghế trống" });

    try {
      const unitGo = Number(meta.priceEach || 0);
      const unitBack = backTrip ? Number(backTrip?.price ?? unitGo) : 0;

      const payload = {
        customer: form.name,
        phone: form.phone,
        tripId: Number(form.tripId),
        date: form.date,
        seats: form.selectedSeats.length,
        seat_numbers: form.selectedSeats,
        roundtrip: !!backTrip,
        back_trip_id: backTrip?.id || null,
        back_date: backTrip ? (backMeta?.date || "") : null,
        unit_price_go: unitGo,
        unit_price_back: unitBack,
        total_price: Number(form.selectedSeats.length * (unitGo + unitBack)),
        paid: false,
      };

      const res = await api.post("/bookings", payload);
      const booking = res.data?.data || res.data;

      // optional: lưu ngữ cảnh cho PaymentMomo đọc nhanh
      const rtCtx = {
        code: booking?.code || null,
        customer: form.name,
        phone: form.phone,
        seats: form.selectedSeats.length,
        seat_numbers: form.selectedSeats,
        roundtrip: !!backTrip,
        go: {
          id: Number(form.tripId),
          date: form.date,
          time: meta.time,
          bus: meta.busText,
          route: trip?.route || { from: meta.departSta, to: meta.arriveSta },
          price: unitGo,
        },
        back: backTrip
          ? {
              id: backTrip.id,
              date: backMeta?.date || "",
              time: backMeta?.time || "",
              bus: backTrip?.bus?.name || backTrip?.bus || "",
              route: backTrip?.route || null,
              price: unitBack || unitGo,
            }
          : null,
        unitGo,
        unitBack,
        total: form.selectedSeats.length * (unitGo + unitBack),
      };
      try {
        sessionStorage.setItem("rtCtx", JSON.stringify(rtCtx));
      } catch {}

      setStatus({ type: "ok", msg: "Đặt vé thành công, chuyển đến thanh toán..." });
      localStorage.removeItem("selectedTrip");

      const code =
        booking?.code ||
        res.data?.code ||
        res.data?.data?.code ||
        null;

      if (code) {
        localStorage.setItem("last_booking_code", code);
        navigate(`/payment/momo?code=${encodeURIComponent(code)}`);
      } else {
        // fallback nếu BE chưa trả code nhưng PaymentMomo vẫn có thể đọc rtCtx
        navigate(`/payment/momo`);
      }
    } catch (err) {
      const be = err?.response?.data;
      let msg = be?.message || "Có lỗi xảy ra khi đặt vé";
      if (be?.errors) {
        const firstField = Object.keys(be.errors)[0];
        if (firstField) msg = be.errors[firstField][0];
      }
      setStatus({ type: "err", msg });
    }
  };

  /* ===== 13) UI ===== */
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 28,
        borderRadius: 16,
        background: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        fontFamily: "Inter, system-ui",
        color: "#0f172a",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 24,
          fontSize: 26,
          fontWeight: 800,
          color: "#1e3a8a",
        }}
      >
        🎫 Đặt Vé {backTrip ? "Khứ Hồi" : "Một Chiều"}{" "}
        {(syncing || backSyncing) && (
          <small style={{ color: "#64748b" }}>· đồng bộ…</small>
        )}
      </h2>

      {status && (
        <p
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 10,
            background: status.type === "ok" ? "#e8f6ee" : "#fdecec",
            color: status.type === "ok" ? "#166534" : "#991b1b",
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          {status.msg}
        </p>
      )}

      {/* Lượt đi */}
      {trip && (
        <div
          style={{
            border: "1px solid #e2e8f0",
            padding: 16,
            borderRadius: 12,
            background: "#f8fafc",
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            🚌 {meta.routeText} (Lượt đi)
          </div>
          <div>
            Ngày:{" "}
            <b style={{ color: "#1e40af" }}>{form.date || trip.date}</b>
          </div>
          <div>
            Giờ khởi hành: <b>{meta.time}</b>
          </div>
          <div>
            Giờ đến: <b>{meta.arriveTime}</b>
          </div>
          <div>
            Điểm đón: <b>{meta.departSta}</b>
          </div>
          <div>
            Điểm trả: <b>{meta.arriveSta}</b>
          </div>
          <div>
            Xe: <b>{meta.busText}</b>
          </div>
          <div>
            Giá vé: <b style={{ color: "#16a34a" }}>{meta.priceText}</b>
          </div>
        </div>
      )}

      {/* Lượt về (nếu có) */}
      {backTrip && (
        <div
          style={{
            border: "1px solid #e2e8f0",
            padding: 16,
            borderRadius: 12,
            background: "#f8fafc",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            🔁 {backMeta?.routeText || "Chuyến về"}
          </div>
          <div>
            Ngày về:{" "}
            <b style={{ color: "#1e40af" }}>{backMeta?.date || "—"}</b>
          </div>
          <div>
            Giờ khởi hành: <b>{backMeta?.time}</b>
          </div>
          <div>
            Giờ đến: <b>{backMeta?.arriveTime}</b>
          </div>
          <div>
            Điểm đón: <b>{backMeta?.departSta}</b>
          </div>
          <div>
            Điểm trả: <b>{backMeta?.arriveSta}</b>
          </div>
          <div>
            Giá vé lượt về:{" "}
            <b style={{ color: "#16a34a" }}>
              {moneyFmt.format(Number(backMeta?.priceEach || meta.priceEach || 0))}
            </b>
          </div>
        </div>
      )}

      {/* Thông tin KH + Ghế */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label>Họ tên</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nguyễn Văn A"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Điện thoại</label>
          <input
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="09xx xxx xxx"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: 14,
          border: "1px dashed #cbd5e1",
          borderRadius: 12,
          background: "#f9fafb",
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>
          Ghế đã chọn (lượt đi):{" "}
          <span style={{ color: "#0d9488" }}>
            {form.selectedSeats.length
              ? form.selectedSeats.join(", ")
              : "Chưa chọn"}
          </span>
          {!!form.selectedSeats.length && (
            <span style={{ marginLeft: 8, color: "#16a34a" }}>
              • Tổng: <b>{moneyFmt.format(totalPrice)}</b>
              {backTrip && (
                <small style={{ marginLeft: 6, color: "#065f46" }}>
                  (khứ hồi: cộng giá hai chiều)
                </small>
              )}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={goPickSeats}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🎟️ Chọn ghế (lượt đi)
        </button>
      </div>

      <button
        type="submit"
        disabled={form.selectedSeats.length === 0}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 12,
          border: "none",
          background:
            form.selectedSeats.length === 0 ? "#cbd5e1" : "#22c55e",
          color: "#fff",
          fontWeight: 800,
          fontSize: 16,
          cursor:
            form.selectedSeats.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        ✅ Xác nhận Đặt vé ({form.selectedSeats.length} ghế ·{" "}
        {moneyFmt.format(totalPrice)})
      </button>
    </form>
  );
}
