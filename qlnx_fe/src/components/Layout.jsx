import React, { useEffect, useRef, useState, useMemo } from "react";
import { NavLink, Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import TawkChat from "@/components/TawkChat";
import ChatBot from "@/components/ChatBot";
import logo from "@/assets/logo 1.png";

/* ========= Helpers ========= */
const AUTH_PAGES = new Set(["/login", "/login1", "/register"]);

function getToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("api_token") ||
    ""
  );
}
const isAuthed = () => !!getToken();

export default function Layout() { // <-- bỏ { children }
  const nav = useNavigate();
  const { pathname, search } = useLocation();

  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(isAuthed());
  const redirectedRef = useRef(false);

  const isAuthPage = useMemo(() => AUTH_PAGES.has(pathname), [pathname]);

  useEffect(() => {
    const sync = () => setAuthed(isAuthed());
    window.addEventListener("storage", sync);
    window.addEventListener("auth:changed", sync);
    sync();
    if (!window.emitAuthChanged) {
      window.emitAuthChanged = () => window.dispatchEvent(new Event("auth:changed"));
    }
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:changed", sync);
    };
  }, []);

  useEffect(() => {
    if (!authed && !isAuthPage) {
      sessionStorage.setItem("after_login_path", pathname + search);
    }
  }, [authed, isAuthPage, pathname, search]);

  useEffect(() => {
    if (authed && isAuthPage && !redirectedRef.current) {
      redirectedRef.current = true;
      setOpen(false);
      const backTo = sessionStorage.getItem("after_login_path") || "/";
      sessionStorage.removeItem("after_login_path");
      nav(backTo, { replace: true });
    }
    if (!isAuthPage) redirectedRef.current = false;
  }, [authed, isAuthPage, nav]);

  function logout() {
    ["auth_token", "token", "access_token", "api_token"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    setAuthed(false);
    setOpen(false);
    window.emitAuthChanged?.();
    nav("/login1", { replace: true });
  }

  const linkClass = ({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`;

  return (
    <div className="site-shell font-inter">
      {/* Header */}
      <header className="site-header">
        <div className="container nav-row">
          {/* Brand */}
          <div className="brand" onClick={() => nav("/")} role="button" tabIndex={0}>
            <img src={logo} alt="HuyNamBusLines" className="brand-logo" />
            <div className="brand-text"><b>HuyNam</b>BusLines</div>
          </div>

          {/* Desktop nav */}
          {/* ❌ BỎ <Outlet /> ở đây */}
          <nav className="nav-main">
            <NavLink to="/" end className={linkClass}>Trang chủ</NavLink>
            <NavLink to="/BusNews" className={linkClass}>Tin tức</NavLink>
            <NavLink to="/contact" className={linkClass}>Liên hệ</NavLink>
            <NavLink to="/AccountPage" className={linkClass}>Tài khoản</NavLink>
          </nav>

          {/* Auth actions */}
          <div className="nav-actions">
            {!authed ? (
              <>
                <NavLink to="/login1" className="btn ghost">Đăng nhập</NavLink>
                <NavLink to="/register" className="btn primary">Đăng ký</NavLink>
              </>
            ) : (
              <button className="btn ghost" onClick={logout}>Đăng xuất</button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="hamburger"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`mobile-drawer ${open ? "open" : ""}`}>
          <NavLink onClick={() => setOpen(false)} to="/" end className={linkClass}>Trang chủ</NavLink>
          <NavLink onClick={() => setOpen(false)} to="/BusNews" className={linkClass}>Tin tức</NavLink>
          <NavLink onClick={() => setOpen(false)} to="/contact" className={linkClass}>Liên hệ</NavLink>
          <NavLink onClick={() => setOpen(false)} to="/AccountPage" className={linkClass}>Tài khoản</NavLink>

          <div className="mobile-auth">
            {!authed ? (
              <>
                <NavLink onClick={() => setOpen(false)} to="/login1" className="btn ghost block">Đăng nhập</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/register" className="btn primary block">Đăng ký</NavLink>
              </>
            ) : (
              <button className="btn ghost block" onClick={logout}>Đăng xuất</button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container content">
        <Outlet /> {/* ✅ TRANG CON RENDER Ở ĐÂY */}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container foot-row">
          <div className="foot-left">© {new Date().getFullYear()} HuyNamBusLines</div>
          {authed ? <ChatBot /> : <TawkChat />}
          <div className="foot-right">
            <NavLink to="/contact" className="foot-link">Liên hệ</NavLink>
            <NavLink to="/admin" className="foot-link" style={{ marginLeft: 12 }}>Quản trị</NavLink>
          </div>
        </div>
      </footer>

      {/* ==== STYLE ==== */}
      <style>{`
        .font-inter { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; }

        :root{
          --bg:#0c1330;
          --bg2:#111a3f;
          --panel:rgba(255,255,255,0.12);
          --line:rgba(255,255,255,0.18);
          --text:#f3f6ff;
          --sub:#c3ceff;
          --brand:#5aa2ff;
          --brand-2:#22d3ee;
          --brand-strong:#7cc4ff;
          --brand-soft:#1e40af;
          --glass:rgba(12,19,48,0.55);
        }

        body {
          background:
            radial-gradient(1200px 520px at 50% -240px, #1f2c67 10%, var(--bg) 60%),
            radial-gradient(900px 700px at -10% 20%, rgba(39,112,255,0.15), transparent 60%),
            radial-gradient(900px 700px at 110% 25%, rgba(34,211,238,0.14), transparent 60%);
          color:var(--text);
        }

        .container{ max-width:1140px; margin:0 auto; padding:0 16px; }

        /* Header */
        .site-header{
          position:sticky; top:0; z-index:40;
          background: linear-gradient(180deg, rgba(17,25,65,.75), rgba(17,25,65,.45));
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .nav-row{ display:flex; align-items:center; gap:12px; height:68px; }

         .brand-logo {
      height: 40px;            /* tùy kích thước logo của em */
      width: auto;
      object-fit: contain;
    }
        .brand-text{
          font-weight:900; letter-spacing:.3px;
          background: linear-gradient(90deg, #fff, var(--brand-strong));
          -webkit-background-clip:text; background-clip:text; color: transparent;
        }
        .brand-text.glow{
          text-shadow: 0 0 12px rgba(124,196,255,.55), 0 0 28px rgba(34,211,238,.25);
        }

        .nav-main{ display:flex; gap:4px; margin-left:8px; }
        .nav-link{
          position:relative;
          padding:10px 14px; border-radius:12px; color:var(--text); text-decoration:none;
          border:1px solid transparent; transition: transform .06s ease, box-shadow .15s, border-color .15s, background .15s;
        }
        .nav-link:hover{
          background: rgba(255,255,255,0.08);
          border-color: rgba(124,196,255,.35);
          box-shadow: 0 8px 20px rgba(90,162,255,.20);
          transform: translateY(-1px);
        }
        .nav-link.is-active{
          background: rgba(124,196,255,0.16);
          border-color: rgba(124,196,255,.55);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15), 0 8px 24px rgba(124,196,255,.25);
        }
        .nav-link::after{
          content:"";
          position:absolute; left:12px; right:12px; bottom:8px; height:2px;
          border-radius:2px; background: linear-gradient(90deg, var(--brand), var(--brand-2));
          opacity:0; transform: scaleX(.6); transition: transform .2s ease, opacity .2s;
        }
        .nav-link:hover::after, .nav-link.is-active::after{ opacity:1; transform: scaleX(1); }

        .nav-actions{ margin-left:auto; display:flex; gap:10px; align-items:center; }
        .btn{
          padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer; text-decoration:none;
          transition: transform .06s ease, box-shadow .15s, background .15s, border-color .15s, color .15s;
        }
        .btn.ghost{ background:transparent; border:1px solid var(--line); color:var(--text); }
        .btn.ghost:hover{
          background: rgba(255,255,255,0.10);
          border-color: rgba(124,196,255,.55);
          box-shadow: 0 8px 22px rgba(124,196,255,.25);
          transform: translateY(-1px);
        }
        .btn.primary{
          background: linear-gradient(90deg, var(--brand), var(--brand-2));
          border:1px solid rgba(124,196,255,.65);
          color:#fff; box-shadow: 0 10px 26px rgba(124,196,255,.35);
        }
        .btn.primary:hover{
          filter: brightness(1.08) saturate(1.05);
          transform: translateY(-1px);
          box-shadow: 0 14px 32px rgba(124,196,255,.45);
        }
        .btn.block{ width:100%; text-align:center; }

        .hamburger{
          display:none; margin-left:8px;
          background:transparent; border:1px solid var(--line); color:var(--text);
          padding:8px 10px; border-radius:12px; cursor:pointer;
        }
        .hamburger:hover{
          background: rgba(255,255,255,.08);
          border-color: rgba(124,196,255,.5);
          box-shadow: 0 8px 18px rgba(124,196,255,.25);
        }

        .mobile-drawer{
          display:none;
          border-top:1px solid var(--line);
          background: linear-gradient(180deg, rgba(15,24,70,.95), rgba(15,24,70,.88));
          padding:12px 16px;
        }
        .mobile-drawer .nav-link{ display:block; margin:6px 0; }
        .mobile-auth{ margin-top:10px; display:grid; gap:10px; }

        .content{ min-height:70vh; padding:24px 0 40px; }

        .site-footer{
          border-top:1px solid var(--line);
          background: linear-gradient(0deg, rgba(15,24,70,.7), rgba(15,24,70,.4));
        }
        .foot-row{ display:flex; align-items:center; gap:12px; height:68px; }
        .foot-left{ color:var(--sub); }
        .foot-right{ margin-left:auto; }
        .foot-link{ color:#e7f0ff; text-decoration:none; }
        .foot-link:hover{ text-decoration:underline; text-shadow: 0 0 10px rgba(124,196,255,.5); }

        @media (max-width: 900px){
          .nav-main, .nav-actions{ display:none; }
          .hamburger{ display:block; }
          .mobile-drawer{ display:block; max-height:0; overflow:hidden; transition:max-height .22s ease; }
          .mobile-drawer.open{ max-height:360px; }
        }

        @keyframes spinPulse{
          0% { transform: rotate(0deg); box-shadow: 0 0 0 3px rgba(90,162,255,.18), 0 10px 24px rgba(90,162,255,.28); }
          50%{ box-shadow: 0 0 0 5px rgba(34,211,238,.18), 0 12px 28px rgba(34,211,238,.32); }
          100%{ transform: rotate(360deg); box-shadow: 0 0 0 3px rgba(90,162,255,.18), 0 10px 24px rgba(90,162,255,.28); }
        }
      `}</style>
    </div>
  );
}
