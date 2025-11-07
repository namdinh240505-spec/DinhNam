// src/pages/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ==== tiny UI helpers (không cần lib) ==== */
function Card({ children, max = 420 }) {
  return (
    <div
      className="card"
      style={{
        maxWidth: max,
        margin: "56px auto",
        padding: 22,
        borderRadius: 16,
        background: "linear-gradient(135deg,#ffffff,#f8fafc)",
        boxShadow: "0 12px 30px rgba(2,6,23,.08)",
        fontFamily: "Inter, system-ui",
        color: "#0f172a",
      }}
    >
      {children}
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontWeight: 700, marginBottom: 6, color: "#334155" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
function Alert({ type = "ok", children }) {
  const ok = type === "ok";
  return (
    <div
      className={`alert ${ok ? "ok" : "err"}`}
      style={{
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 10,
        fontWeight: 700,
        background: ok ? "#e8f6ee" : "#fdecec",
        color: ok ? "#166534" : "#991b1b",
      }}
    >
      {children}
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();

  // snapshot từ localStorage nếu đã từng đăng nhập
  const stored = useMemo(
    () => ({
      token: localStorage.getItem("auth_token") || "",
      name: localStorage.getItem("user_name") || "",
      avatar: localStorage.getItem("user_avatar") || "/default-avatar.png",
      role: localStorage.getItem("user_role") || "customer",
      email: localStorage.getItem("user_email") || "",
    }),
    []
  );

  const [email, setEmail] = useState(stored.email || "");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', msg:''}
  const [user, setUser] = useState(
    stored.token && stored.name
      ? { name: stored.name, avatar: stored.avatar, role: stored.role }
      : null
  );
  const [loading, setLoading] = useState(false);

  // Nếu đã có token + tên => hiển thị thẻ chào (giống code cũ)
  useEffect(() => {
    // bạn có thể auto điều hướng luôn: if (stored.token) nav('/');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!email || !password) {
      setMsg({ type: "err", msg: "Vui lòng nhập email và mật khẩu" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      const token = res.data?.token;
      const userData = res.data?.user || {};

      if (!token) {
        setMsg({ type: "err", msg: "Không nhận được token từ máy chủ" });
        return;
      }

      const role = userData.role || userData.roles || "customer";
      const avatar = userData.avatar || "/default-avatar.png";

      // Lưu/ghi nhớ đăng nhập
      if (remember) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user_name", userData.name || "");
        localStorage.setItem("user_email", userData.email || email);
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_avatar", avatar);
      } else {
        // nếu không ghi nhớ thì chỉ lưu tối thiểu cho phiên hiện tại
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user_role", role);
      }

      setUser({ name: userData.name || "", avatar, role });
      setMsg({ type: "ok", msg: "Đăng nhập thành công" });

      // Điều hướng theo role (ưu tiên admin)
      if (role === "admin") {
        nav("/admin");
      } else {
        nav("/");
      }
    } catch (err) {
      setMsg({
        type: "err",
        msg: err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    // optional: gọi /logout
    try {
      api.post("/logout").catch(() => {});
    } catch {}
    ["auth_token", "user_name", "user_email", "user_avatar", "user_role"].forEach((k) =>
      localStorage.removeItem(k)
    );
    setUser(null);
    setMsg({ type: "ok", msg: "Đã đăng xuất" });
  }

  // ĐÃ ĐĂNG NHẬP -> thẻ chào
  if (user) {
    return (
      <Card max={440}>
        <div style={{ textAlign: "center" }}>
          <img
            src={user.avatar}
            alt="avatar"
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 10,
              border: "2px solid rgba(0,0,0,.06)",
            }}
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.png";
            }}
          />
          <h2 style={{ margin: "6px 0 4px", fontWeight: 900 }}>Xin chào, {user.name || "bạn"}!</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            Vai trò: <b>{user.role}</b>
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              className="btn"
              onClick={() => nav(user.role === "admin" ? "/admin" : "/")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Vào trang {user.role === "admin" ? "Admin" : "Chủ"}
            </button>
            <button
              className="btn"
              onClick={logout}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Đăng xuất
            </button>
          </div>
          {msg && <Alert type={msg.type}>{msg.msg}</Alert>}
        </div>
      </Card>
    );
  }

  // CHƯA ĐĂNG NHẬP -> form
  return (
    <Card max={440}>
      <h2 style={{ margin: 0, textAlign: "center", fontWeight: 900, color: "#1e3a8a" }}>
        Đăng nhập
      </h2>
      <p style={{ textAlign: "center", color: "#64748b", marginTop: 6 }}>
        Chào mừng quay lại 👋
      </p>

      <form onSubmit={submit} style={{ marginTop: 18 }}>
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#0f172a",
            }}
          />
        </Field>

        <Field label="Mật khẩu">
          <div style={{ position: "relative" }}>
            <input
              type={showPwd ? "text" : "password"}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "12px 44px 12px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
              }}
            />
            <button
              type="button"
              aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: 6,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                color: "#334155",
              }}
            >
              {showPwd ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </Field>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "8px 0 14px",
          }}
        >
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#334155" }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span style={{ fontSize: 14 }}>Ghi nhớ đăng nhập</span>
          </label>
          <span
            style={{ fontSize: 14, color: "#2563eb", cursor: "pointer" }}
            onClick={() => nav("/forgot-password")}
            title="Quên mật khẩu?"
          >
            Quên mật khẩu?
          </span>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: loading ? "#93c5fd" : "#2563eb",
            color: "#fff",
            fontWeight: 900,
            letterSpacing: 0.3,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 8px 18px rgba(37,99,235,.25)",
          }}
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>

        {msg && <Alert type={msg.type}>{msg.msg}</Alert>}

        <p style={{ marginTop: 12, textAlign: "center", color: "#475569" }}>
          Chưa có tài khoản?{" "}
          <span
            onClick={() => nav("/register")}
            style={{ color: "#2563eb", fontWeight: 800, cursor: "pointer" }}
          >
            Đăng ký
          </span>
        </p>
      </form>
    </Card>
  );
}
