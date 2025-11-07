import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/client";

export default function EditCustomer() {
  const { id } = useParams();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    roles: "customer",     // 'admin' | 'customer'
    blocked: false,        // FE field (BE ánh xạ sang status)
    password: "",          // tuỳ chọn đổi mật khẩu
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const emailOk = useMemo(() => (v) => /\S+@\S+\.\S+/.test(v), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/user/${id}`);
        const u = res.data || {};
        if (!alive) return;
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          roles: u.roles || "customer",
          blocked: !!(u.blocked ?? (u.status === false)),
          password: "",
        });
      } catch (err) {
        setMsg({ type: "err", text: "Không tải được khách hàng" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!form.name.trim()) return setMsg({ type: "err", text: "Tên không được để trống" });
    if (!emailOk(form.email)) return setMsg({ type: "err", text: "Email không hợp lệ" });
    if (form.password && form.password.length < 6)
      return setMsg({ type: "err", text: "Mật khẩu tối thiểu 6 ký tự" });

    try {
      await api.put(`/user/${id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        roles: form.roles,
        blocked: !!form.blocked,
        ...(form.password ? { password: form.password } : {}),
      });
      setMsg({ type: "ok", text: "Cập nhật thành công" });
      setTimeout(() => nav("/admin/customers"), 700);
    } catch (err) {
      const m = err?.response?.data?.message || "Cập nhật thất bại";
      setMsg({ type: "err", text: m });
    }
  };

  if (loading) return <div className="card"><p>Đang tải...</p></div>;

  return (
    <div className="card" style={{ maxWidth: 640, margin: "24px auto", padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Sửa khách hàng #{id}</h2>
      {msg && (
        <p className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>{msg.text}</p>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Họ tên</span>
          <input value={form.name} onChange={(e) => change("name", e.target.value)} required />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} required />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Điện thoại</span>
          <input value={form.phone} onChange={(e) => change("phone", e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
            <span>Vai trò</span>
            <select value={form.roles} onChange={(e) => change("roles", e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.blocked}
              onChange={(e) => change("blocked", e.target.checked)}
            />
            <span>Khóa tài khoản</span>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Đổi mật khẩu (tùy chọn)</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => change("password", e.target.value)}
            placeholder="Để trống nếu không đổi"
          />
          {form.password && <small>Mật khẩu mới tối thiểu 6 ký tự</small>}
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn">Lưu thay đổi</button>
          <button type="button" className="btn ghost" onClick={() => nav("/admin/customers")}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
    