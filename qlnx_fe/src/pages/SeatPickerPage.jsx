// src/pages/SeatPickerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ---------------- Helpers ---------------- */
const normalizeSeats = (input) => {
  if (!input) return [];
  // string: "1,2 ; 3"
  if (typeof input === "string")
    return input
      .split(/[,;\s]+/)
      .map((x) => Number(String(x).replace(/\D+/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);

  // number
  if (typeof input === "number") return Number.isFinite(input) && input > 0 ? [input] : [];

  // array
  if (Array.isArray(input)) {
    const out = [];
    for (const it of input) {
      if (typeof it === "number") {
        if (Number.isFinite(it) && it > 0) out.push(it);
        continue;
      }
      if (typeof it === "string") {
        const n = Number(String(it).replace(/\D+/g, ""));
        if (Number.isFinite(n) && n > 0) out.push(n);
        continue;
      }
      if (it && typeof it === "object") {
        const cand =
          it.seat_number ??
          it.seatNo ??
          it.seat ??
          it.number ??
          it.no ??
          it.idSeat ??
          it.id_seat ??
          it.id;
        const n = Number(String(cand ?? "").replace(/\D+/g, ""));
        if (Number.isFinite(n) && n > 0) out.push(n);
      }
    }
    return Array.from(new Set(out)).sort((a, b) => a - b);
  }

  // plain object
  if (typeof input === "object") return normalizeSeats([input]);

  return [];
};

const seatsFromBookingsPayload = (payload) => {
  // chấp mọi kiểu backend trả về: {booked:[..]} | [{seat_numbers:..}, ..]
  if (!payload) return [];
  // case 1: { booked: [...] }
  if (Array.isArray(payload.booked)) return normalizeSeats(payload.booked);
  // case 2: Array bookings
  if (Array.isArray(payload)) {
    const bag = [];
    for (const b of payload) {
      if (b?.seat_numbers) bag.push(...normalizeSeats(b.seat_numbers));
      else if (b?.seats_list) bag.push(...normalizeSeats(b.seats_list));
      else if (b?.seats) bag.push(...normalizeSeats(b.seats));
      else bag.push(...normalizeSeats(b));
    }
    return Array.from(new Set(bag)).sort((a, b) => a - b);
  }
  return [];
};

const tryNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const deriveTotalSeats = (trip, state) =>
  tryNum(state?.totalSeats) ??
  tryNum(trip?.totalSeats) ??
  tryNum(trip?.bus?.seats) ??
  tryNum(trip?.seats) ??
  40;

/* 2 tầng — 3 ghế, 2 lối đi: [seat,null,seat,null,seat] */
function buildBusLayout(totalSeats) {
  const lowerSeats = Math.ceil(totalSeats / 2);
  const upperSeats = totalSeats - lowerSeats;

  const makeLayer = (count, startNo) => {
    const rows = [];
    let n = startNo;
    const end = startNo + count - 1;
    while (n <= end) {
      const a = n <= end ? n++ : null;
      const b = n <= end ? n++ : null;
      const c = n <= end ? n++ : null;
      rows.push([a, null, b, null, c]);
    }
    return rows;
  };

  return {
    lower: makeLayer(lowerSeats, 1),
    upper: makeLayer(upperSeats, lowerSeats + 1),
  };
}

/* ---------------- Main Page ---------------- */
export default function SeatPickerPage() {
  const nav = useNavigate();
  const { state } = useLocation();

  // Dự phòng khứ hồi
  const rtCtx = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("rtCtx") || "null");
    } catch {
      return null;
    }
  })();

  // Ưu tiên state → rtCtx
  const tripId = state?.tripId || state?.trip?.id || rtCtx?.goId;
  const date = state?.date || state?.trip?.date || rtCtx?.goDate || "";
  const initialTrip = state?.trip || null;

  const initialBooked = normalizeSeats(state?.bookedSeats);
  const initialSelected = normalizeSeats(state?.selectedSeats);

  const [trip, setTrip] = useState(initialTrip);
  const [booked, setBooked] = useState(initialBooked);
  const [selected, setSelected] = useState(initialSelected);
  const [warn, setWarn] = useState(null);

  // Thiếu info → quay lại
  useEffect(() => {
    if (!tripId || !date) nav("/booking1", { replace: true });
  }, [tripId, date, nav]);

  // Load Trip + Booked seats từ API /bookings
  useEffect(() => {
    let alive = true;
    if (!tripId || !date) return;

    (async () => {
      try {
        // Trip (kèm booked_seats nếu có)
        const resTrip = await api.get(`/trips/${tripId}`, { params: { date } });
        if (!alive) return;
        const t = resTrip.data || {};
        setTrip((p) => p || t);

        // Booked thực tế từ bảng vé
        const resBooked = await api.get(`/bookings`, { params: { tripId, date } });
        const bookedFromAPI = seatsFromBookingsPayload(resBooked.data);

        // Phòng khi trip cũng có booked_seats
        const bookedFromTrip = normalizeSeats(t.booked_seats);

        const merged = Array.from(new Set([...initialBooked, ...bookedFromTrip, ...bookedFromAPI])).sort(
          (a, b) => a - b
        );
        if (!alive) return;
        setBooked(merged);
      } catch {
        setWarn("Không tải được dữ liệu mới nhất, dùng dữ liệu hiện có.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [tripId, date]); // load theo chuyến & ngày

  const capacity = useMemo(() => deriveTotalSeats(trip, state), [trip, state]);
  const { lower, upper } = useMemo(() => buildBusLayout(capacity), [capacity]);

  // Khi có booked/capacity thay đổi → lọc lại selected cho an toàn
  useEffect(() => {
    const bookedSet = new Set(booked);
    setSelected((prev) =>
      prev.filter((s) => s >= 1 && s <= capacity && !bookedSet.has(s))
    );
  }, [booked, capacity]);

  const toggle = (no) => {
    if (!no) return;
    if (booked.includes(no)) return; // ❌ ghế đã đặt: không cho chọn
    setSelected((prev) => (prev.includes(no) ? prev.filter((x) => x !== no) : [...prev, no]));
  };

  // Xác nhận → trả state + lưu rtCtx chống mất context
  const confirm = () => {
    const safe = selected
      .filter((s) => s >= 1 && s <= capacity && !booked.includes(s))
      .sort((a, b) => a - b);

    try {
      sessionStorage.setItem("seatSelection", JSON.stringify(safe));
    } catch {}

    const goTrip = state?.go || state?.trip || trip || null;
    const goDate = state?.goDate || date || rtCtx?.goDate || "";
    const backTrip = state?.back || rtCtx?.back || null;
    const backDate = state?.backDate || rtCtx?.backDate || null;

    try {
      sessionStorage.setItem(
        "rtCtx",
        JSON.stringify({
          goId: tripId,
          goDate,
          backId: backTrip?.id || null,
          backDate,
          selectedSeats: safe,
        })
      );
    } catch {}

    nav("/booking1", {
      replace: true,
      state: {
        go: goTrip,
        goDate,
        back: backTrip,
        backDate,
        tripId,
        date: goDate,
        selectedSeats: safe,
      },
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "28px auto",
        padding: "0 16px",
        fontFamily: "Inter, system-ui",
        color: "#0f172a",
      }}
    >
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          color: "#1e3a8a",
        }}
      >
        🪑 Chọn Ghế
      </h2>

      {/* Trip info */}
      {trip && (
        <div
          style={{
            border: "1px solid #e2e8f0",
            padding: 12,
            borderRadius: 12,
            background: "#f8fafc",
            margin: "0 auto 18px",
            maxWidth: 860,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <div>
            <b>Chuyến:</b>{" "}
            {trip?.route ? `${trip.route.from} → ${trip.route.to}` : `#${tripId}`}
          </div>
          <div>
            <b>Ngày:</b> {date}
          </div>
          <div>
            <b>Giờ:</b> {trip?.time || trip?.depart_time || "—"}
          </div>
          <div>
            <b>Xe:</b> {trip?.bus?.name || trip?.bus || "—"}{" "}
            <span style={{ color: "#64748b" }}>({capacity} ghế)</span>
          </div>
        </div>
      )}

      {warn && (
        <div
          style={{
            margin: "0 auto 12px",
            maxWidth: 860,
            padding: "10px 12px",
            borderRadius: 10,
            textAlign: "center",
            background: "#fff8e1",
            color: "#92400e",
            border: "1px solid #fde68a",
            fontWeight: 700,
          }}
        >
          {warn}
        </div>
      )}

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 24 }}>
        <Legend />
        <Deck title="Tầng dưới" layout={lower} onToggle={toggle} selected={selected} booked={booked} />
        <Deck title="Tầng trên" layout={upper} onToggle={toggle} selected={selected} booked={booked} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ color: "#334155", fontWeight: 800 }}>
          Đã chọn:{" "}
          <span style={{ color: "#0d9488" }}>
            {selected.length ? selected.slice().sort((a, b) => a - b).join(", ") : "—"}
          </span>{" "}
          <span style={{ color: "#64748b", fontWeight: 700 }}>({selected.length} ghế)</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setSelected([])}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Bỏ chọn
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={selected.length === 0}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: selected.length ? "#2563eb" : "#cbd5e1",
              color: "#fff",
              fontWeight: 800,
              cursor: selected.length ? "pointer" : "not-allowed",
            }}
          >
            ✅ Xác nhận ghế ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */
function Seat({ no, booked, selected, onToggle }) {
  const locked = booked.includes(no);   // ✅ ghế đã đặt
  const picked = selected.includes(no);

  const style = {
    width: 46,
    height: 58,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: locked ? "#e2e8f0" : picked ? "#fef9c3" : "#fff",
    border: locked
      ? "2px solid #cbd5e1"
      : picked
      ? "2px solid #facc15"
      : "2px solid #8b5cf6",
    color: locked ? "#9ca3af" : "#0f172a",
    fontWeight: 600,
    cursor: locked ? "not-allowed" : "pointer",
  };

  return (
    <button
      onClick={() => !locked && onToggle(no)}
      style={{ background: "none", border: "none", padding: 0 }}
      disabled={locked}
      title={locked ? "Ghế đã được đặt" : `Ghế ${no}`}
    >
      <div style={style}>{locked ? "✕" : no}</div>
    </button>
  );
}

function Deck({ title, layout, booked, selected, onToggle }) {
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 24, padding: 18 }}>
      <div style={{ fontWeight: 800, textAlign: "center", marginBottom: 12 }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, max-content)",
          gap: 16,
          justifyContent: "center",
        }}
      >
        {layout.flat().map((no, i) =>
          no ? (
            <Seat key={no} no={no} booked={booked} selected={selected} onToggle={onToggle} />
          ) : (
            <div key={`gap-${i}`} style={{ width: 20 }} />
          )
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 14 }}>Chú thích</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 46,
            height: 58,
            borderRadius: 10,
            background: "#e2e8f0",
            border: "2px solid #cbd5e1",
            display: "grid",
            placeItems: "center",
            color: "#9ca3af",
            fontWeight: 700,
          }}
        >
          ✕
        </div>
        <div>Ghế đã đặt (không thể chọn)</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 46,
            height: 58,
            borderRadius: 10,
            border: "2px solid #8b5cf6",
            background: "#fff",
          }}
        />
        <div>Còn trống</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 58,
            border: "2px solid #facc15",
            background: "#fef9c3",
            borderRadius: 10,
          }}
        />
        <div>Đang chọn</div>
      </div>
    </div>
  );
}
