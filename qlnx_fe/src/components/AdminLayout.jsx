// src/components/AdminLayout.jsx
import React, { useEffect, useMemo } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import bg from "@/assets/adminbg.png";
/* --- Palette & tiny helpers --- */
const C = {
  bg: "#0b1224",
  panel: "rgba(17, 24, 39, .55)",
  glass: "rgba(13, 23, 46, .55)",
  line: "rgba(255,255,255,.08)",
  text: "#e5e7eb",
  sub: "#9ca3af",
  brand: "#1e90ff",
  brandSoft: "rgba(30,144,255,.15)",
};

export default function AdminLayout({ children }) {
  const nav = useNavigate();

  const isAdmin = useMemo(() => {
    const token =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const role =
      localStorage.getItem("user_role") || sessionStorage.getItem("user_role");
    return !!token && role === "admin";
  }, []);

  useEffect(() => {
    if (!isAdmin) nav("/login", { replace: true });
  }, [isAdmin, nav]);

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_role");
    nav("/login", { replace: true });
  }

  return (
    <div
  className="admin-shell"
  style={{
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gridTemplateRows: "64px 1fr",
    background: `url(${bg}) center/cover no-repeat fixed, radial-gradient(1200px 420px at 30% -160px, #16223e 0%, #0b1224 60%)`,
    color: C.text,
    fontFamily: "Inter, system-ui",
  }}
    >
      {/* Header */}
      <header
        style={{
          gridColumn: "1 / -1",
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          borderBottom: `1px solid ${C.line}`,
          background: "linear-gradient(180deg, rgba(8,13,27,.6), rgba(8,13,27,.3))",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background:
                "conic-gradient(from 180deg at 50% 50%, #60a5fa, #22d3ee, #60a5fa)",
              boxShadow: "0 6px 16px rgba(96,165,250,.35)",
            }}
          />
          <div>
            <div style={{ fontWeight: 900, letterSpacing: .2 }}>
              HuyNamBusLines <span style={{ color: C.sub }}>• Admin</span>
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>Bảng điều khiển</div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <NavLink to="/" style={btnGhost}>
            ⤶ Trang khách
          </NavLink>
          <button onClick={logout} style={btnGhost}>
            ⏻ Đăng xuất
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        style={{
          borderRight: `1px solid ${C.line}`,
          background: C.panel,
          backdropFilter: "blur(10px)",
          padding: 12,
          overflowY: "auto",
        }}
      >
        <nav style={{ display: "grid", gap: 6 }}>
          <SectionLabel>Quản lý</SectionLabel>
          <AdminLink to="/admin/routes">
            Routes
          </AdminLink>
          <AdminLink to="/admin/trips">
            Trips
          </AdminLink>
          <AdminLink to="/admin/buses">
            Buses
          </AdminLink>
          <AdminLink to="/admin/drivers">
            Drivers
          </AdminLink>
          <AdminLink to="/admin/bookings">
            Bookings
          </AdminLink>
          <AdminLink to="/admin/customers">
            Customers
          </AdminLink>
          <AdminLink to="/admin/news">
            News
          </AdminLink>

          <SectionLabel style={{ marginTop: 12 }}>Báo cáo</SectionLabel>
          <AdminLink to="/admin/reports">
            Reports
          </AdminLink>
        </nav>
      </aside>

      {/* Content */}
      <main
        style={{
          padding: 18,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))",
        }}
      >
        <div
          style={{
            minHeight: "calc(100vh - 96px)",
            background: "rgba(255,255,255,.02)",
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(2,6,23,.35)",
            padding: 16,
          }}
        >
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
}

/* --- Sub components --- */
function SectionLabel({ children, style }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: C.sub,
        padding: "8px 10px 4px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function AdminLink({ to, children, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${isActive ? C.brandSoft : C.line}`,
        background: isActive ? C.brandSoft : "transparent",
        textDecoration: "none",
        color: C.text,
        fontWeight: isActive ? 800 : 600,
        position: "relative",
        overflow: "hidden",
        transition: "border-color .2s, background .2s, transform .06s",
        boxShadow: isActive ? "inset 0 0 0 1px rgba(30,144,255,.12)" : "none",
      })}
      className={({ isActive }) =>
        "admin-link" + (isActive ? " admin-link--active" : "")
      }
    >
      <span
        aria-hidden
        style={{
          width: 22,
          textAlign: "center",
          opacity: 0.9,
          filter: "drop-shadow(0 2px 6px rgba(30,144,255,.35))",
        }}
      >
        {icon || "•"}
      </span>
      <span>{children}</span>
    </NavLink>
  );
}

/* --- Buttons --- */
const btnGhost = {
  border: `1px solid ${C.line}`,
  background: "transparent",
  color: C.text,
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 800,
  transition: "background .15s, border-color .15s",
};
