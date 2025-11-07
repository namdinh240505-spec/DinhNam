// src/pages/HomeTrips.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/api/client";
import "@/styles/trips.css";

/* Ảnh fallback: đặt 1 file sẵn ở src/images/images.jpg
   (nếu bạn muốn dùng ảnh trong public thì thay bằng "/images/news-placeholder.jpg") */
import fallbackImg from "@/images/images.jpg";

export default function HomeTrips() {
  const [trips, setTrips] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);

  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("route");
  const navigate = useNavigate();

  const money = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }),
    []
  );

  /* ===== Helpers ===== */
  const normDateStr = (d) =>
    typeof d === "string" && d.length >= 10 ? d.slice(0, 10) : "";
  const isNumericId = /^\d+$/.test(String(routeId || ""));
  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const countBooked = (t) => {
    if (Array.isArray(t.booked_seats)) return t.booked_seats.length;
    if (Array.isArray(t.seatsBooked)) return t.seatsBooked.length;
    if (Array.isArray(t.bookings)) return t.bookings.length;
    return toInt(t.booked ?? t.tickets_sold ?? t.sold);
  };

  const getCapacity = (t) =>
    toInt(t.totalSeats) ??
    toInt(t.seats) ??
    toInt(t.bus_capacity) ??
    toInt(t.bus?.seats);

  const getAvailable = (t) => {
    const avail = toInt(t.availableSeats ?? t.avail);
    if (avail !== undefined) return Math.max(avail, 0);
    const cap = getCapacity(t);
    const booked = countBooked(t);
    if (cap !== undefined && booked !== undefined)
      return Math.max(cap - booked, 0);
    return undefined;
  };

  const matchByRoute = (t) => {
    if (!routeId || !isNumericId) return true;
    const tripRouteId = t.route_id ?? t.route?.id ?? t.routeId;
    return String(tripRouteId || "") === String(routeId);
  };

  const normCities = (t) => {
    const fromCity = t?.route?.from ?? t.from ?? t.origin ?? "Điểm đi";
    const toCity = t?.route?.to ?? t.to ?? t.destination ?? "Điểm đến";
    return { fromCity, toCity };
  };

  // Lấy danh sách chuyến (không lọc ngày)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMsg(null);
    setRouteInfo(null);

    api
      .get("/trips", { params: { routeId: routeId || undefined } })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const filtered = list.filter(matchByRoute);
        setTrips(filtered);
        if (filtered.length > 0) {
          const r = filtered[0]?.route;
          if (r?.from || r?.to)
            setRouteInfo({ from: r?.from || "", to: r?.to || "" });
        }
      })
      .catch(
        (err) =>
          alive &&
          setMsg(err?.response?.data?.message || "Không tải được chuyến xe")
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [routeId]);

  // Lấy tên tuyến nếu chỉ có id
  useEffect(() => {
    let alive = true;
    if (!routeId || !isNumericId) return;
    if (routeInfo?.from || routeInfo?.to) return;

    api
      .get(`/routes/${routeId}`)
      .then((res) => {
        if (!alive) return;
        const r = res?.data;
        if (r?.from || r?.to)
          setRouteInfo({ from: r?.from || "", to: r?.to || "" });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [routeId, isNumericId, routeInfo?.from, routeInfo?.to]);

  // Ảnh hiển thị
  const getImage = (t) => {
    if (t?.image_url) return t.image_url;
    if (t?.image) return `http://localhost:8000/storage/${t.image}`;
    return fallbackImg;
  };

  const handleBooking = (t) => {
    try {
      const tripDate = normDateStr(t.date || t.depart_date || "");
      const capacity = getCapacity(t);
      const bookedCnt = countBooked(t);
      localStorage.setItem(
        "selectedTrip",
        JSON.stringify({
          id: t.id,
          date: tripDate,
          time: t.depart_time || t.time,
          bus: t.bus,
          seats: capacity,
          booked: bookedCnt,
          price: t.price,
          status: t.status,
          route: t.route,
          from: t.from,
          to: t.to,
          image: t.image,
          image_url: t.image_url,
          route_id: t.route_id ?? t.route?.id ?? t.routeId,
        })
      );
    } catch {}
    navigate("/booking1", { state: { trip: t } });
  };

  const Skeleton = () => (
    <div className="trip-card p-4">
      <div className="trip-skel h-5 w-24 rounded mb-4" />
      <div className="trip-skel h-20 rounded mb-4" />
      <div className="trip-skel h-4 w-40 rounded mb-2" />
      <div className="trip-skel h-4 w-56 rounded mb-5" />
      <div className="trip-skel h-10 rounded" />
    </div>
  );

  return (
    <div className="trips-bg font-inter">
      <div className="trips-container">
        {/* Header */}
        <div className="gradient-frame mb-5">
          <div className="gradient-inner text-center">
            <h2 className="page-title">🚍 Danh sách chuyến xe</h2>

            {routeId && (
              <p className="page-sub">
                Tuyến:{" "}
                <b className="text-strong">
                  {routeInfo?.from ||
                    (trips[0] && (trips[0].route?.from || trips[0].from)) ||
                    "—"}
                  {" → "}
                  {routeInfo?.to ||
                    (trips[0] && (trips[0].route?.to || trips[0].to)) || "—"}
                </b>
              </p>
            )}
          </div>
        </div>

        {msg && <div className="alert error">{msg}</div>}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        )}

        {!loading && trips.length === 0 && !msg && (
          <div className="empty">
            <div className="emoji">🗓️</div>
            <h3>Không có chuyến phù hợp</h3>
            <p>Hãy thử đổi tuyến khác.</p>
          </div>
        )}

        {!loading && trips.length > 0 && (
          <div className="space-y-5">
            {trips.map((t) => {
              const { fromCity, toCity } = normCities(t);
              const departTime = t.depart_time || t.time || "—";
              const arriveTime = t.arrive_time || "—";
              const departSta = t.depart_station || fromCity;
              const arriveSta = t.arrive_station || toCity;
              const operator = t.operator || t.bus_company || "Nhà xe";
              const busName = t.bus_name || "";

              const capacity = getCapacity(t);
              const available = getAvailable(t);
              const soldOut =
                available !== undefined
                  ? available <= 0
                  : (t.status || "").toLowerCase() === "full";

              const seatLabel =
                available !== undefined
                  ? `${available} chỗ trống`
                  : capacity !== undefined
                  ? `${capacity} chỗ`
                  : (t.seat_type || "").trim();

              const priceNum = Number.isFinite(+t.price) ? +t.price : null;
              const oldNum = Number.isFinite(+t.old_price) ? +t.old_price : null;
              const price = priceNum != null ? money.format(priceNum) : "Liên hệ";
              const oldPrice = oldNum != null ? money.format(oldNum) : null;
              const discount =
                priceNum != null && oldNum > priceNum
                  ? Math.round(100 - (priceNum / oldNum) * 100)
                  : null;

              const rating = t.rating ?? 4.7;
              const ratingCount = t.rating_count ?? t.reviews ?? 17030;

              const durationLabel = t.duration_min
                ? formatDuration(t.duration_min)
                : t.duration || t.travel_time || "";

              const crossPlusOne = crossesMidnight(
                departTime,
                t.duration_min
              );

              const features = Array.isArray(t.features)
                ? t.features
                : [
                    ...(t.allow_pay_later ? ["Không cần thanh toán trước"] : []),
                    ...(t.pickup_at_door ? ["Đón tận nơi"] : []),
                    ...(t.instant_confirm ? ["Xác nhận tức thì"] : []),
                  ];

              return (
                <div key={t.id} className="trip-card vxr">
                  {/* Row 1 */}
                  <div className="vxr-row1">
                    <div className="vxr-left">
                      <span className="vendor">{operator}</span>
                      <span className="rating">
                        <span className="star">★</span>
                        {rating.toFixed(1)} ({ratingCount})
                      </span>
                      <span className="coupon small">
                        ⚡ Giảm 20%, tối đa 250k
                      </span>
                    </div>
                    <div className="vxr-right">
                      <div className="price-box">
                        {discount ? (
                          <span className="percent-badge">-{discount}%</span>
                        ) : null}
                        <div className="price">{price}</div>
                        {oldPrice && (
                          <div className="old-price strike">{oldPrice}</div>
                        )}
                        <div className="remain">
                          {available !== undefined
                            ? `Còn ${available} chỗ trống`
                            : t.status ?? "Open"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="vxr-row2">
                    {/* Timeline */}
                    <div className="timeline">
                      <div className="time-col">
                        <div className="hour-start">{departTime}</div>
                        <div className="duration">{durationLabel || " "}</div>
                        <div className="hour-end">
                          {arriveTime}{" "}
                          {crossPlusOne ? (
                            <span className="plus1">(+1)</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="sta-col">
                        <div className="sta-line">
                          <span className="dot dot-start" />
                          <div className="stainfo">
                            <div className="sta-strong">{departSta}</div>
                            <div className="sta-chip">Bến đón</div>
                            <div className="sta-muted">{fromCity}</div>
                          </div>
                        </div>
                        <div className="rail" />
                        <div className="sta-line">
                          <span className="dot dot-end" />
                          <div className="stainfo">
                            <div className="sta">{arriveSta}</div>
                            <div className="sta-chip sta-chip--green">
                              Bến trả
                            </div>
                            <div className="sta-muted">{toCity}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ảnh + meta + CTA */}
                    <div className="vxr-main">
                      <div className="thumb">
                        <img
                          src={getImage(t)}
                          alt="bus"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = fallbackImg;
                          }}
                          style={{ objectFit: "cover" }}
                        />
                      </div>

                      <div className="meta">
                        <div className="brand">{operator}</div>
                        <div className="sub">
                          {[busName, seatLabel].filter(Boolean).join(" · ")}
                        </div>
                        <div className="badges">
                          {renderFeatures(features)}
                        </div>
                        <div className="more">
                          <button className="link">
                            Thông tin chi tiết ▾
                          </button>
                        </div>
                      </div>

                      <div className="cta-col">
                        <button
                          onClick={() => handleBooking(t)}
                          disabled={soldOut}
                          className={`choose-btn ${
                            soldOut ? "is-disabled" : ""
                          }`}
                        >
                          {soldOut ? "Hết chỗ" : "Chọn chuyến"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Icon & feature helpers ===== */
function renderFeatures(features = []) {
  if (!features.length) return <span className="feat-muted">—</span>;
  const mapIcon = (txt) => {
    if (/thanh toán|pay/i.test(txt))
      return { icon: CopIcon(), cls: "feat feat-pay" };
    if (/đón|pickup|tận nơi/i.test(txt))
      return { icon: PhoneIcon(), cls: "feat feat-pick" };
    if (/xác nhận|instant/i.test(txt))
      return { icon: BoltIcon(), cls: "feat feat-fast" };
    return { icon: CheckIcon(), cls: "feat" };
  };
  return features.slice(0, 3).map((f, i) => {
    const { icon, cls } = mapIcon(f);
    return (
      <span key={i} className={cls}>
        {icon}
        {f}
      </span>
    );
  });
}
function CopIcon() {
  return <span className="chip">COP</span>;
}
function PhoneIcon() {
  return <span>📞</span>;
}
function BoltIcon() {
  return <span>⚡</span>;
}
function CheckIcon() {
  return <span>✅</span>;
}

/* ===== Thời lượng & qua ngày ===== */
function formatDuration(min) {
  if (!Number.isFinite(+min) || min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
function crossesMidnight(departHHmm, durationMin) {
  if (!durationMin || !departHHmm || !/^\d{2}:\d{2}$/.test(departHHmm))
    return false;
  const [hh, mm] = departHHmm.split(":").map(Number);
  const start = hh * 60 + mm;
  const end = start + Number(durationMin);
  return end >= 24 * 60;
}
