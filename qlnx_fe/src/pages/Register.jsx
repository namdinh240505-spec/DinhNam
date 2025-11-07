// src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ====== Tiny UI Helpers ====== */
const Card = ({ children }) => (
  <div
    style={{
      maxWidth: 560,
      margin: "48px auto",
      padding: 24,
      borderRadius: 16,
      background: "linear-gradient(180deg,#ffffff,#f8fafc)",
      boxShadow: "0 12px 30px rgba(2,6,23,.08)",
      fontFamily: "Inter, system-ui",
      color: "#0f172a",
    }}
  >
    {children}
  </div>
);

const Title = ({ children }) => (
  <h2
    style={{
      textAlign: "center",
      margin: "0 0 18px",
      fontSize: 26,
      fontWeight: 900,
      color: "#1e3a8a",
    }}
  >
    {children}
  </h2>
);

const Field = ({ label, error, hint, children }) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <label
        style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: 6 }}
      >
        {label}
      </label>
    )}
    {children}
    {hint && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{hint}</div>}
    {error && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>{error}</div>}
  </div>
);

const Row2 = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
);

const Alert = ({ type = "ok", children }) => {
  const ok = type === "ok";
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 12px",
        borderRadius: 10,
        fontWeight: 700,
        background: ok ? "#e8f6ee" : "#fdecec",
        color: ok ? "#166534" : "#991b1b",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
};

/* ====== Page ====== */
const initialForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
  agree: true,
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [serverMsg, setServerMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const passwordStrength = useMemo(() => {
    const p = form.password || "";
    let score = 0;
    if (p.length >= 6) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score; // 0..4
  }, [form.password]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setServerMsg("");
    setErrors({});
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validateLocal = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ và tên.";
    if (!form.username.trim() || form.username.trim().length < 4)
      e.username = "Tên đăng nhập tối thiểu 4 ký tự.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ.";
    if (!/^0\d{9,10}$/.test(form.phone))
      e.phone = "SĐT bắt đầu bằng 0, dài 10–11 số.";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ.";
    if (!form.password || form.password.length < 6)
      e.password = "Mật khẩu tối thiểu 6 ký tự.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Mật khẩu nhập lại không khớp.";
    if (!form.agree) e.agree = "Bạn cần đồng ý với điều khoản.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg("");
    setErrors({});
    if (!validateLocal()) return;

    setLoading(true);
    try {
      // Không còn avatar: gửi JSON là đủ (BE nhận multipart cũng ok)
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
        password_confirmation: form.confirmPassword,
      };

      const res = await api.post("/register", payload);

      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
      }
      setServerMsg("Đăng ký thành công! Đang chuyển về trang chính…");
      setForm(initialForm);
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
        setServerMsg("Vui lòng kiểm tra lại thông tin.");
      } else {
        setServerMsg(err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title>Đăng ký tài khoản</Title>

      <form onSubmit={handleSubmit}>
        <Row2>
          <Field label="Họ và tên" error={firstErr(errors.name)}>
            <input
              type="text"
              name="name"
              placeholder="VD: Nguyễn Văn A"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </Field>

          <Field
            label="Tên đăng nhập"
            hint="Tối thiểu 4 ký tự, không khoảng trắng."
            error={firstErr(errors.username)}
          >
            <input
              type="text"
              name="username"
              placeholder="username"
              value={form.username}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </Field>
        </Row2>

        <Row2>
          <Field label="Email" error={firstErr(errors.email)}>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </Field>

          <Field
            label="Số điện thoại"
            hint="Bắt đầu bằng 0, dài 10–11 số."
            error={firstErr(errors.phone)}
          >
            <input
              type="text"
              name="phone"
              placeholder="09xx xxx xxx"
              value={form.phone}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </Field>
        </Row2>

        <Field label="Địa chỉ" error={firstErr(errors.address)}>
          <input
            type="text"
            name="address"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            value={form.address}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </Field>

        <Row2>
          <Field
            label="Mật khẩu"
            hint={<PasswordHint score={passwordStrength} />}
            error={firstErr(errors.password)}
          >
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
                style={inputStyle}
                autoComplete="new-password"
              />
              <ToggleEye on={showPwd} setOn={setShowPwd} />
            </div>
          </Field>

          <Field label="Nhập lại mật khẩu" error={firstErr(errors.confirmPassword)}>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd2 ? "text" : "password"}
                name="confirmPassword"
                placeholder="Nhập lại giống mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={inputStyle}
                autoComplete="new-password"
              />
              <ToggleEye on={showPwd2} setOn={setShowPwd2} />
            </div>
          </Field>
        </Row2>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 12px" }}>
          <input id="agree" type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
          <label htmlFor="agree" style={{ cursor: "pointer" }}>
            Tôi đồng ý với <b>Điều khoản</b> & <b>Chính sách</b>.
          </label>
        </div>
        {errors.agree && <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 6 }}>{errors.agree}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: loading ? "#93c5fd" : "#2563eb",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 10px 30px rgba(37,99,235,.25)",
            transition: "transform .05s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.99)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      {serverMsg && (
        <Alert type={serverMsg.includes("thành công") ? "ok" : "err"}>{serverMsg}</Alert>
      )}
    </Card>
  );
}

/* ====== Pieces ====== */
const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  outline: "none",
};

function ToggleEye({ on, setOn }) {
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-label="toggle password"
      style={{
        position: "absolute",
        right: 8,
        top: 8,
        height: 32,
        minWidth: 32,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#f8fafc",
        cursor: "pointer",
      }}
    >
      {on ? "🙈" : "👁️"}
    </button>
  );
}

function PasswordHint({ score }) {
  const bars = Array.from({ length: 4 }).map((_, i) => i < score);
  const label = ["Yếu", "Trung bình", "Khá", "Mạnh"][Math.max(score - 1, 0)] || "Rất yếu";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {bars.map((ok, i) => (
          <span
            key={i}
            style={{
              width: 26,
              height: 6,
              borderRadius: 4,
              background: ok ? "#16a34a" : "#e5e7eb",
              display: "inline-block",
            }}
          />
        ))}
      </div>
      <span style={{ color: "#64748b" }}>Độ mạnh: {label}</span>
    </div>
  );
}

function firstErr(v) {
  return Array.isArray(v) ? v[0] : v;
}
