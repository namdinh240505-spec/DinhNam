// src/pages/admin/Trips.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "@/api/client";

const C = {
  bg: "linear-gradient(145deg, #0f172a, #1e293b)", // nền tổng thể
  card: "rgba(255, 255, 255, 0.05)",              // nền các thẻ
  line: "rgba(148, 163, 184, 0.2)",               // viền nhẹ
  okBg: "#e8f6ee",
  okText: "#166534",
  errBg: "#fdecec",
  errText: "#991b1b",
  brand: "#3b82f6",                               // xanh chủ đạo
};

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:''}

  const [form, setForm] = useState({
    route_id: "",
    date: "",
    time: "",
    bus: "",
    driver_id: "",
    seats: 40,
    price: 0,
  });
  const [editingId, setEditingId] = useState(null);

  // money fmt
  const money = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }),
    []
  );

  // ---------- Loaders ----------
  const loadTrips = async () => {
    try {
      const res = await api.get("/trips");
      setTrips(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMsg({ type: "err", text: "Không tải được danh sách chuyến." });
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const res = await api.get("/routes");
      const list = Array.isArray(res.data) ? res.data : [];
      setRoutes(list);
      if (list.length) {
        setForm((f) => ({ ...f, route_id: f.route_id || list[0].id }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadRoutes(), loadTrips()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      route_id: routes[0]?.id || "",
      date: "",
      time: "",
      bus: "",
      driver_id: "",
      seats: 40,
      price: 0,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // Nhẹ nhàng validate
    if (!form.route_id || !form.date || !form.time || !form.bus) {
      setMsg({ type: "err", text: "Vui lòng điền đủ tuyến, ngày, giờ và biển số." });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/trips/${editingId}`, form);
        setMsg({ type: "ok", text: "Cập nhật chuyến thành công." });
      } else {
        await api.post("/trips", form);
        setMsg({ type: "ok", text: "Thêm chuyến thành công." });
      }
      resetForm();
      loadTrips();
    } catch (err) {
      setMsg({
        type: "err",
        text: err?.response?.data?.message || "Có lỗi khi lưu chuyến.",
      });
    }
  };

  const handleEdit = (t) => {
    setForm({
      route_id: t.route_id,
      date: t.date || "",
      time: t.time || "",
      bus: t.bus || "",
      driver_id: t.driver_id || "",
      seats: t.seats ?? 40,
      price: t.price ?? 0,
    });
    setEditingId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc muốn xóa chuyến này?")) return;
    try {
      await api.delete(`/trips/${id}`);
      setMsg({ type: "ok", text: "Xóa chuyến thành công." });
      loadTrips();
    } catch {
      setMsg({ type: "err", text: "Xóa thất bại." });
    }
  };

  // ---------- UI ----------
  return (
    <div
  style={{
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui",
    background: C.bg,
    minHeight: "100vh",
    padding: "20px 24px",
    backdropFilter: "blur(10px)",
  }}
>
      {/* Header card */}
      <div
        style={{
          marginBottom: 14,
          padding: 14,
          borderRadius: 14,
         border: `1px solid ${C.line}`,
         background: C.card,
          boxShadow: "0 12px 36px rgba(2,6,23,.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background:
                "conic-gradient(from 0deg, #60a5fa, #22d3ee, #60a5fa)",
            }}
          />
          <div>
            <h2 style={{ margin: 0, fontWeight: 900 }}>Quản lý chuyến xe</h2>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Tạo mới, chỉnh sửa và xóa chuyến.
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 12,
           border: `1px solid ${C.line}`,
           background: C.card,
            color: msg.type === "ok" ? C.okText : C.errText,
            fontWeight: 800,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: 16,
          padding: 14,
          borderRadius: 14,
          border: `1px solid ${C.line}`,
          background: C.card,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr 0.8fr 1fr",
          }}
        >
          {/* Route */}
          <div>
            <Label>Tuyến</Label>
            <select
              name="route_id"
              value={form.route_id}
              onChange={handleChange}
              style={selectStyle}
              required
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.from} → {r.to}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <Label>Ngày</Label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Time */}
          <div>
            <Label>Giờ</Label>
            <input
              name="time"
              type="text"
              placeholder="HH:mm"
              value={form.time}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Bus */}
          <div>
            <Label>Biển số</Label>
            <input
              name="bus"
              placeholder="VD: 51B-123.45"
              value={form.bus}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Driver */}
          <div>
            <Label>Tài xế ID</Label>
            <input
              name="driver_id"
              placeholder="VD: 12"
              value={form.driver_id}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Seats */}
          <div>
            <Label>Ghế</Label>
            <input
              name="seats"
              type="number"
              min={1}
              value={form.seats}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Price */}
          <div>
            <Label>Giá vé</Label>
            <input
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="submit" style={primaryBtn}>
            {editingId ? "Cập nhật" : "Thêm chuyến"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={ghostBtn}
              title="Hủy chỉnh sửa"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* Table card */}
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${C.line}`,
background: "rgba(30, 41, 59, 0.6)",
backdropFilter: "blur(10px)",
boxShadow: "0 8px 24px rgba(0,0,0,.4)",

        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: 14,
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                backdropFilter: "blur(6px)",
              }}
            >
              <tr>
                {[
                  "ID",
                  "Tuyến",
                  "Ngày",
                  "Giờ",
                  "Xe",
                  "Driver",
                  "Ghế",
                  "Giá",
                  "Hành động",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Giá" ? "right" : "left",
                      padding: "10px 12px",
                      borderBottom: `1px solid ${C.line}`,
                      color: "#cbd5e1",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 16, color: "#94a3b8" }}>
                    Đang tải…
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 16, color: "#94a3b8" }}>
                    Chưa có chuyến nào.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={td}>#{t.id}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 800 }}>
                        {t.route?.from} → {t.route?.to}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {t.depart_station || "—"} • {t.arrive_station || "—"}
                      </div>
                    </td>
                    <td style={td}>{t.date}</td>
                    <td style={td}>{t.time}</td>
                    <td style={td}>{t.bus}</td>
                    <td style={td}>{t.driver_id || "—"}</td>
                    <td style={td}>{t.seats}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>
                      {Number.isFinite(+t.price) ? money.format(+t.price) : "—"}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => handleEdit(t)} style={miniBtn}>
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        style={{ ...miniBtn, background: "#ef4444" }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny UI atoms ---------- */
function Label({ children }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontWeight: 800,
        color: "#cbd5e1",
        fontSize: 13,
      }}
    >
      {children}
    </label>
  );
}

const inputBase = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "rgba(45, 114, 194, 0.05)",
  color: "#e5e7eb",
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
};
const inputStyle = {
  ...inputBase,
};
const selectStyle = {
  ...inputBase,
  appearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, #94a3b8 50%), linear-gradient(135deg, #94a3b8 50%, transparent 50%), linear-gradient(to right, transparent, transparent)",
  backgroundPosition: "calc(100% - 18px) 50%, calc(100% - 12px) 50%, 0 0",
  backgroundSize: "6px 6px, 6px 6px, 100% 100%",
  backgroundRepeat: "no-repeat",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: C.brand,
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(37,99,235,.25)",
};

const ghostBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "transparent",
  color: "#e5e7eb",
  fontWeight: 800,
  cursor: "pointer",
};

const miniBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  marginRight: 8,
};

const td = { padding: "10px 12px", verticalAlign: "top" };
