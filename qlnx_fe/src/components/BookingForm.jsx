import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import "@/styles/BookingForm.css";

export default function BookingForm() {
  const navigate = useNavigate();

  const [routes, setRoutes] = useState([]);
  const [fromList, setFromList] = useState([]);
  const [toList, setToList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState(() => {
    const last = JSON.parse(localStorage.getItem("booking_last") || "{}");
    return {
      from: last.from || "",
      to: last.to || "",
      date: last.date || todayStr,
      roundtrip: !!last.roundtrip,
    };
  });

  // --- Tải tuyến ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/routes");
        const list = Array.isArray(res.data) ? res.data : [];
        if (!alive) return;

        // Chuẩn hoá dữ liệu về chuỗi
        const safe = list.map((r) => ({
          ...r,
          from: String(r.from ?? r.start ?? "").trim(),
          to: String(r.to ?? r.end ?? "").trim(),
        }));

        setRoutes(safe);

        const froms = [...new Set(safe.map((r) => r.from))]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setFromList(froms);

        const toPool = form.from
          ? safe.filter((r) => r.from === form.from).map((r) => r.to)
          : safe.map((r) => r.to);
        setToList(
          [...new Set(toPool)].filter(Boolean).sort((a, b) => a.localeCompare(b))
        );
      } catch {
        setStatus({ type: "err", msg: "Không tải được tuyến xe. Vui lòng thử lại." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next) =>
    localStorage.setItem("booking_last", JSON.stringify(next));

  // chọn điểm đi
  const handleFromChange = (value) => {
    const next = { ...form, from: value, to: "" };
    setForm(next);
    persist(next);

    const nextTos = routes
      .filter((r) => r.from === value)
      .map((r) => r.to)
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b));
    setToList(nextTos);
  };

  const handleChange = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    persist(next);
  };

  // đảo chiều tuyến
  const swapFromTo = () => {
    if (!form.from || !form.to) return;
    const nextFrom = form.to;
    const nextTo = form.from;

    const nextToList = routes
      .filter((r) => r.from === nextFrom)
      .map((r) => r.to)
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b));
    setToList(nextToList);

    const next = { ...form, from: nextFrom, to: nextTo };
    setForm(next);
    persist(next);
  };

  // bấm tìm chuyến mới điều hướng
  const handleNext = () => {
    setStatus(null);
    const { from, to, date, roundtrip } = form;

    if (!from || !to || !date) {
      setStatus({ type: "err", msg: "Vui lòng chọn đủ điểm đi / điểm đến / ngày khởi hành." });
      return;
    }
    if (date < todayStr) {
      setStatus({ type: "err", msg: "Ngày khởi hành không thể trước hôm nay." });
      return;
    }

    // So khớp an toàn (trim + lowercase)
    const norm = (s) => String(s || "").trim().toLowerCase();
    const route = routes.find((r) => norm(r.from) === norm(from) && norm(r.to) === norm(to));

    if (!route) {
      setStatus({ type: "err", msg: "Không tìm thấy tuyến phù hợp." });
      return;
    }

    if (roundtrip) {
      const url =
        `/trips/roundtrip?go=${route.id}` +
        `&from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&date=${encodeURIComponent(date)}`;
      navigate(url);
      return;
    }

    navigate(`/trips?route=${route.id}&date=${encodeURIComponent(date)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="bf-bg font-inter">
      <div className="bf-wrap">
        <div className="bf-card">
          <div className="bf-head">
            <h2 className="bf-title">Tìm chuyến xe</h2>
            <p className="bf-sub">Chọn tuyến và ngày khởi hành bạn muốn</p>
          </div>

          {status && (
            <div className={`bf-alert ${status.type === "ok" ? "ok" : "err"}`}>
              {status.msg}
            </div>
          )}

          {loading ? (
            <div className="bf-skeleton">
              <div className="sk-line" />
              <div className="sk-grid">
                <div className="sk-box" />
                <div className="sk-box" />
              </div>
              <div className="sk-box" />
              <div className="sk-btn" />
            </div>
          ) : (
            <form className="bf-grid" onKeyDown={onKeyDown}>
              {/* From */}
              <div className="bf-field">
                <label className="bf-label">Đi từ</label>
                <div className="bf-control has-icon">
                  <span className="bf-icon">📍</span>
                  <select
                    className="bf-input"
                    value={form.from}
                    onChange={(e) => handleFromChange(e.target.value)}
                  >
                    <option value="">-- Chọn điểm đi --</option>
                    {fromList.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap */}
              <div className="bf-swap">
                <button
                  type="button"
                  className="bf-swap-btn"
                  onClick={swapFromTo}
                  title="Đổi chiều tuyến"
                  disabled={!form.from || !form.to}
                >
                  ⇅
                </button>
              </div>

              {/* To */}
              <div className="bf-field">
                <label className="bf-label">Đến</label>
                <div className="bf-control has-icon">
                  <span className="bf-icon">🎯</span>
                  <select
                    className="bf-input"
                    value={form.to}
                    onChange={(e) => handleChange("to", e.target.value)}
                    disabled={!form.from}
                  >
                    <option value="">-- Chọn điểm đến --</option>
                    {toList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="bf-field bf-date">
                <label className="bf-label">Ngày khởi hành</label>
                <div className="bf-control has-icon">
                  <span className="bf-icon">📅</span>
                  <input
                    type="date"
                    className="bf-input"
                    value={form.date}
                    min={todayStr}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>
              </div>

              {/* Roundtrip */}
              <div className="bf-field bf-round">
                <label className="bf-label">
                  <input
                    type="checkbox"
                    checked={form.roundtrip}
                    onChange={(e) => handleChange("roundtrip", e.target.checked)}
                  />{" "}
                  Vé khứ hồi (có chuyến về)
                </label>
              </div>

              {/* Action */}
              <div className="bf-action">
                <button type="button" onClick={handleNext} className="bf-btn">
                  🔎 Tìm chuyến
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
