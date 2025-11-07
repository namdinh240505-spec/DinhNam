import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";

/* ========== TOKEN MÀU ========== */
const C = {
  bg: "#fff",
  panel: "#f8fafc",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  blue: "#1677ff",
  blueSoft: "#e6f0ff",
  danger: "#ef4444",
};

/* ========== INPUT, LABEL, ROW COMPONENT ========== */
function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: props.disabled ? "#f3f4f6" : C.bg,
        color: C.text,
        outline: "none",
        transition: "border-color .15s, box-shadow .15s",
        ...(props.style || {}),
      }}
      onFocus={(e) => {
        if (!props.disabled) {
          e.currentTarget.style.borderColor = C.blue;
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,119,255,.15)";
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}
function Label({ children }) {
  return (
    <label style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
      {children}
    </label>
  );
}
function Row({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */
export default function Account() {
  const navigate = useNavigate();

  const localSnapshot = useMemo(
    () => ({
      name: localStorage.getItem("user_name") || "",
      email: localStorage.getItem("user_email") || "",
      role: localStorage.getItem("user_role") || "customer",
      phone: localStorage.getItem("user_phone") || "",
      address: localStorage.getItem("user_address") || "",
      gender: localStorage.getItem("user_gender") || "male",
      birthday: localStorage.getItem("user_birthday") || "",
    }),
    []
  );

  const token = localStorage.getItem("auth_token");
  const [profile, setProfile] = useState(localSnapshot);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 Password states
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);

  /* ========== REDIRECT IF NO TOKEN ========== */
  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  /* ========== FETCH USER PROFILE ========== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/me");
        const u = res.data?.user || res.data || {};
        if (cancelled) return;
        const merged = {
          name: u.name ?? profile.name,
          email: u.email ?? profile.email,
          role: (u.role ?? u.roles) ?? profile.role,
          phone: u.phone ?? profile.phone,
          address: u.address ?? profile.address,
          gender: (u.gender ?? profile.gender) || "male",
          birthday: (u.birthday ?? u.date_of_birth ?? profile.birthday) || "",
        };
        setProfile(merged);
        Object.entries({
          user_name: merged.name,
          user_email: merged.email,
          user_role: merged.role,
          user_phone: merged.phone,
          user_address: merged.address,
          user_gender: merged.gender,
          user_birthday: merged.birthday,
        }).forEach(([k, v]) => localStorage.setItem(k, v ?? ""));
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
    // eslint-disable-next-line
  }, []);

  function setField(k, v) {
    setDirty(true);
    setProfile((p) => ({ ...p, [k]: v }));
  }

  /* ========== SAVE PROFILE ========== */
  async function saveProfile(e) {
    e?.preventDefault();
    setStatus(null);

    if (!profile.name?.trim())
      return setStatus({ type: "err", text: "Vui lòng nhập họ và tên." });
    if (profile.phone && !/^0\d{9,10}$/.test(profile.phone))
      return setStatus({ type: "err", text: "Số điện thoại không hợp lệ." });

    setSaving(true);
    try {
      const payload = {
        name: profile.name.trim(),
        phone: profile.phone?.trim(),
        address: profile.address?.trim(),
        gender: profile.gender,
        birthday: profile.birthday || null,
      };
      const res = await api.put("/user/me", payload);
      setStatus({ type: "ok", text: res.data?.message || "Đã lưu thay đổi." });
      setDirty(false);
    } catch (err) {
      setStatus({ type: "err", text: err?.response?.data?.message || "Cập nhật thất bại." });
    } finally {
      setSaving(false);
    }
  }

  /* ========== LOGOUT ========== */
  function logout() {
    try { api.post("/logout").catch(() => {}); } catch {}
    ["auth_token","user_name","user_email","user_role","user_phone","user_address","user_gender","user_birthday"]
      .forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  }

  /* ========== SIDEBAR ACTIONS ========== */
  function handleSidebarClick(label) {
    if (label === "Đơn hàng của tôi") return navigate("/booking");
    if (label === "Nhận xét chuyến đi") return navigate("/TripReviews");
    if (label === "Đăng xuất") return logout();
  }

  /* ========== CHANGE PASSWORD ========== */
  // Helper: lấy message đẹp từ lỗi Laravel 422
function getErrMsg(err) {
  const msg = err?.response?.data?.message;
  const errs = err?.response?.data?.errors;
  if (errs && typeof errs === "object") {
    const first = Object.values(errs).flat()[0];
    return first || msg || "Đổi mật khẩu thất bại.";
  }
  return msg || "Đổi mật khẩu thất bại.";
}

async function changePassword(e) {
  e?.preventDefault();
  setPwMsg(null);

  const current = pw.current.trim();
  const next = pw.next.trim();
  const confirm = pw.confirm.trim();

  if (!current || !next)
    return setPwMsg({ type: "err", text: "Nhập đầy đủ mật khẩu hiện tại và mới." });
  if (next.length < 6)
    return setPwMsg({ type: "err", text: "Mật khẩu mới phải ≥ 6 ký tự." });
  if (next !== confirm)
    return setPwMsg({ type: "err", text: "Xác nhận mật khẩu không khớp." });

  setPwBusy(true);
  try {
    // ✅ GỌI ĐÚNG 1 ENDPOINT + ĐÚNG TÊN FIELD
    const r = await api.post("/auth/change-password", {
      current_password: current,
      new_password: next,
      new_password_confirm: confirm,
    });

    setPwMsg({ type: "ok", text: r?.data?.message || "Đổi mật khẩu thành công." });
    setPw({ current: "", next: "", confirm: "" });
  } catch (err) {
    setPwMsg({ type: "err", text: getErrMsg(err) });
  } finally {
    setPwBusy(false);
  }
}


  /* ========== UI ========== */
  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px", fontFamily: "Inter, system-ui", color: C.text }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 12, color: C.sub }}>
        <b style={{ color: "#ff7442ff" }}>Trang chủ</b> <span style={{ opacity: .6 }}>›</span>{" "}
        <span>Thông tin tài khoản</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        {/* Sidebar */}
        <aside style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 2px 8px rgba(2,6,23,.04)" }}>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {[
              ["Thông tin tài khoản", "👤"],
              ["Thành viên Bạc", "🏷️"],
              ["Đơn hàng của tôi", "🎟️"],
              ["Nhận xét chuyến đi", "📝"],
              ["Đăng xuất", "⏻"],
            ].map(([label, icon], i) => {
              const active = i === 0;
              const clickable = ["Đơn hàng của tôi","Nhận xét chuyến đi","Đăng xuất"].includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSidebarClick(label)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10, border: "1px solid transparent",
                    background: active ? C.blueSoft : "transparent",
                    color: active ? C.text : C.sub, textAlign: "left",
                    cursor: clickable ? "pointer" : "default",
                  }}
                >
                  <span style={{ width: 22, textAlign: "center" }}>{icon}</span>
                  <span style={{ fontWeight: active ? 800 : 600 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 2px 8px rgba(2,6,23,.04)", padding: 18 }}>
          <h2 style={{ margin: "6px 6px 16px", fontWeight: 900 }}>Thông tin tài khoản</h2>

          {status && (
            <div style={{ margin: "0 6px 12px" }}>
              <div
                style={{
                  padding: "10px 12px", borderRadius: 10, fontWeight: 700,
                  background: status.type === "ok" ? "#e8f6ee" : "#fdecec",
                  color: status.type === "ok" ? "#166534" : "#991b1b",
                  border: `1px solid ${status.type === "ok" ? "#b7ebc6" : "#f3b7b7"}`
                }}
              >
                {status.text}
              </div>
            </div>
          )}

          {/* Profile form */}
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 14 }}>
              <Label>Họ và tên<span style={{ color: "#ef4444" }}>*</span></Label>
              <Input value={profile.name} onChange={(e) => setField("name", e.target.value)} required />
            </div>

            <Row>
              <div>
                <Label>Số điện thoại</Label>
                <Input value={profile.phone} disabled placeholder="Chưa cập nhật" />
              </div>
              <div>
                <Label>Ngày sinh</Label>
                <Input type="date" value={profile.birthday || ""} onChange={(e) => setField("birthday", e.target.value)} />
              </div>
            </Row>

            {/* Giới tính */}
            <div style={{ marginTop: 16 }}>
              <Label>Giới tính</Label>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden"
              }}>
                {[
                  ["male", "Nam"],
                  ["female", "Nữ"],
                  ["other", "Khác"],
                ].map(([val, label], idx) => {
                  const active = profile.gender === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setField("gender", val)}
                      style={{
                        padding: "12px 0", fontWeight: 800,
                        background: active ? C.blue : "#fff",
                        color: active ? "#fff" : C.text,
                        borderRight: idx < 2 ? `1px solid ${C.border}` : "none",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Label>Địa chỉ</Label>
              <Input value={profile.address} onChange={(e) => setField("address", e.target.value)} />
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                disabled={saving || !dirty}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                  background: saving || !dirty ? "#e5e7eb" : C.blue,
                  color: saving || !dirty ? "#94a3b8" : "#fff",
                  fontWeight: 900,
                  cursor: saving || !dirty ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>

          {/* Đổi mật khẩu */}
          <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <h3 style={{ marginBottom: 12, fontWeight: 900 }}>Đổi mật khẩu</h3>

            {pwMsg && (
              <div style={{
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 10,
                fontWeight: 700,
                background: pwMsg.type === "ok" ? "#e8f6ee" : "#fdecec",
                color: pwMsg.type === "ok" ? "#166534" : "#991b1b",
                border: `1px solid ${pwMsg.type === "ok" ? "#b7ebc6" : "#f3b7b7"}`
              }}>
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={changePassword}>
              <Row>
                <div>
                  <Label>Mật khẩu hiện tại</Label>
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pw.current}
                    onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Mật khẩu mới</Label>
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pw.next}
                    onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))}
                  />
                </div>
              </Row>

              <div style={{ marginTop: 12 }}>
                <Label>Nhập lại mật khẩu mới</Label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={pw.confirm}
                  onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.sub }}>
                  <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Hiện mật khẩu
                </label>
                <button
                  type="submit"
                  disabled={pwBusy}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: pwBusy ? "#1353d3ff" : C.blue,
                    color: pwBusy ? "#2f6cc2ff" : "#fff",
                    fontWeight: 900, cursor: pwBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {pwBusy ? "Đang đổi…" : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
