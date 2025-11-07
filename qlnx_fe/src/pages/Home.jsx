import React, { useRef } from "react";
import BookingForm from "@/components/BookingForm";
import bannerImg from "@/assets/banner.png";

export default function Home() {
  const bookingRef = useRef(null);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page">
      {/* Banner */}
      <div className="banner">
        <img src={bannerImg} alt="HuyNamBusLines Banner" className="banner-img" />
        <div className="banner-gradient" />
        <div className="banner-overlay">
          <div className="hero-content">
            <h1>
              HuyNam<span>BusLines</span>
            </h1>
            <p>Đặt vé trực tuyến — Nhanh chóng · Minh bạch · An tâm</p>

            <div className="cta">
              <button className="btn primary" onClick={scrollToBooking} aria-label="Đặt vé ngay">
                Đặt vé ngay
              </button>
              <a className="btn ghost" href="#routes" aria-label="Xem các tuyến">
                Xem các tuyến
              </a>
            </div>

            <div className="trust">
              <div className="trust-item">
                <IconShield />
                <span>Bảo mật thanh toán</span>
              </div>
              <div className="trust-item">
                <IconClock />
                <span>Đúng giờ cam kết</span>
              </div>
              <div className="trust-item">
                <IconSupport />
                <span>Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>

          <div className="scroll-cue" onClick={scrollToBooking} title="Cuộn xuống đặt vé" />
        </div>
      </div>

      {/* Stats strip */}
      <section className="stats">
        <div className="stat">
          <div className="num">4.9★</div>
          <div className="label">Đánh giá trung bình</div>
        </div>
        <div className="divider" />
        <div className="stat">
          <div className="num">120+</div>
          <div className="label">Chuyến mỗi ngày</div>
        </div>
        <div className="divider" />
        <div className="stat">
          <div className="num">50k+</div>
          <div className="label">Khách tin dùng</div>
        </div>
      </section>

      {/* Nội dung chính */}
      <div className="container">
        <section className="card booking" ref={bookingRef}>
          <h2>Đặt vé xe trực tuyến</h2>
          <p className="subtle">Chọn tuyến · Chọn ghế · Thanh toán nhanh chóng</p>
          <hr className="sep" />
          <BookingForm />
          <div className="notice">
            <IconInfo />
            <span>
              Lưu ý: Vui lòng đến điểm đón trước giờ khởi hành <b>15 phút</b> để làm thủ tục.
            </span>
          </div>
        </section>

        {/* Điểm mạnh */}
        <section className="card features">
          <h3>Tại sao chọn HuyNamBusLines?</h3>
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-icon"><IconTag /></div>
              <div className="feature-title">Giá minh bạch</div>
              <div className="feature-desc">Hiển thị đầy đủ phí — không “phát sinh” khó chịu.</div>
            </div>
            <div className="feature">
              <div className="feature-icon"><IconBus /></div>
              <div className="feature-title">Xe sạch & đúng giờ</div>
              <div className="feature-desc">Bảo dưỡng định kỳ, theo dõi lịch trình theo thời gian thực.</div>
            </div>
            <div className="feature">
              <div className="feature-icon"><IconPhone /></div>
              <div className="feature-title">CSKH 24/7</div>
              <div className="feature-desc">Hỗ trợ nhanh qua điện thoại, email, Facebook.</div>
            </div>
          </div>
        </section>

        {/* Routes quick chips */}
        <section className="card routes" id="routes" aria-label="Các tuyến phổ biến">
          <h3>Tuyến phổ biến</h3>
          <div className="chips">
            {[
              "TP.HCM ⇄ Lâm Đồng",
              "TP.HCM ⇄ Nha Trang",
              "TP.HCM ⇄ Đà Lạt",
              "Hà Nội ⇄ Đà Nẵng",
              "Hà Nội ⇄ Sapa",
              "Đà Nẵng ⇄ Huế",
            ].map((r) => (
              <a key={r} className="chip" href="#" onClick={(e)=>{e.preventDefault(); scrollToBooking();}}>
                {r}
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* CSS */}
      <style>{`
        :root{
          --brand:#2563eb;
          --ink:#e5e7eb;
          --muted:#94a3b8;
          --card:rgba(255,255,255,.06);
          --line:rgba(148,163,184,.18);
          --shell:linear-gradient(145deg, #0f172a, #1e293b);
        }

        .home-page{
          display:flex; flex-direction:column; align-items:center; background:var(--shell);
        }

        /* Banner */
        .banner{ position:relative; width:100%; height:72vh; min-height:520px; max-height:760px; overflow:hidden; }
        .banner-img{ width:100%; height:100%; object-fit:cover; filter:brightness(.7) saturate(1.05); transform:scale(1.02); }
        .banner-gradient{
          position:absolute; inset:0;
          background:
            radial-gradient(60% 60% at 50% 35%, rgba(59,130,246,.35), transparent 60%),
            linear-gradient(to bottom, rgba(2,6,23,0) 40%, rgba(2,6,23,.7) 70%, rgba(2,6,23,1) 100%);
          pointer-events:none;
        }
        .banner-overlay{
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; text-align:center; padding:0 16px;
        }
        .hero-content{ max-width:960px; }
        .hero-content h1{
          font-size: clamp(34px, 6vw, 64px);
          margin:0 0 8px 0; font-weight:900; letter-spacing:.3px;
        }
        .hero-content h1 span{ color:#bfdbfe; }
        .hero-content p{ margin:0 0 16px 0; font-size: clamp(16px, 2.5vw, 20px); color:#e0e7ff; opacity:.95; }

        .cta{ display:flex; gap:12px; justify-content:center; margin-top:12px; flex-wrap:wrap; }
        .btn{
          padding:12px 16px; border-radius:12px; font-weight:900; text-decoration:none; cursor:pointer; transition:transform .08s ease, box-shadow .2s ease, opacity .2s;
        }
        .btn.primary{ background:var(--brand); color:#fff; border:none; box-shadow:0 10px 24px rgba(37,99,235,.30); }
        .btn.primary:hover{ transform:translateY(-1px); box-shadow:0 14px 32px rgba(37,99,235,.34); }
        .btn.ghost{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4); }
        .btn.ghost:hover{ background:rgba(255,255,255,.06); }

        .trust{ display:flex; gap:18px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
        .trust-item{ display:flex; gap:8px; align-items:center; padding:8px 12px; border-radius:999px; background:rgba(15,23,42,.45); border:1px solid rgba(255,255,255,.12); font-size:14px; }

        .scroll-cue{
          position:absolute; left:50%; bottom:20px; transform:translateX(-50%);
          width:26px; height:42px; border:2px solid rgba(255,255,255,.8); border-radius:16px; opacity:.85; cursor:pointer;
        }
        .scroll-cue::after{
          content:""; position:absolute; left:50%; top:8px; width:4px; height:8px; background:#fff; border-radius:2px; transform:translateX(-50%);
          animation: drop 1.6s infinite;
        }
        @keyframes drop{ 0%{opacity:0; transform:translate(-50%,0)} 30%{opacity:1} 80%{opacity:0; transform:translate(-50%,12px)} 100%{opacity:0; } }

        /* Stats strip */
        .stats{
          width:100%; max-width:1140px;
          display:grid; grid-template-columns:1fr auto 1fr auto 1fr; gap:0;
          padding:14px; margin-top:-36px;
          backdrop-filter: blur(10px);
          background:rgba(30,41,59,.55);
          border:1px solid var(--line); border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.35);
        }
        .stat{ text-align:center; color:var(--ink); }
        .stat .num{ font-weight:900; font-size: clamp(18px, 3.5vw, 28px); }
        .stat .label{ color:var(--muted); font-size:14px; }
        .divider{ width:1px; background:var(--line); }

        /* Main container */
        .container{ width:100%; max-width:1140px; display:grid; gap:16px; grid-template-columns:1fr; padding:24px 16px 48px; }

        /* Card */
        .card{
          background:var(--card); border:1px solid var(--line); border-radius:16px;
          padding:18px; color:var(--ink); backdrop-filter: blur(10px);
          box-shadow:0 8px 24px rgba(0,0,0,.35);
        }
        .card h2, .card h3{ margin:0 0 8px 0; font-weight:900; }
        .subtle{ color:var(--muted); margin:0 0 8px 0; }
        .sep{ border:none; height:1px; background:var(--line); margin:12px 0; }

        /* Booking notice */
        .notice{ display:flex; gap:8px; align-items:flex-start; margin-top:12px; padding:10px 12px; border:1px dashed var(--line); border-radius:12px; background:rgba(2,6,23,.35); color:#cbd5e1; font-size:14px; }

        /* Features */
        .features .feature-grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-top:8px; }
        .feature{ padding:14px; border:1px solid var(--line); border-radius:14px; background:rgba(15,23,42,.35); }
        .feature-icon{ width:36px; height:36px; display:grid; place-items:center; border-radius:10px; background:rgba(59,130,246,.12); margin-bottom:8px; }
        .feature-title{ font-weight:800; margin-bottom:4px; }
        .feature-desc{ color:var(--muted); font-size:14px; }

        /* Routes chips */
        .routes .chips{ display:flex; gap:10px; flex-wrap:wrap; overflow:auto; padding-top:2px; }
        .chip{
          display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
          border:1px solid var(--line); background:rgba(255,255,255,.04); color:#dbeafe; text-decoration:none;
          white-space:nowrap; transition: background .15s ease, transform .08s ease;
        }
        .chip:hover{ background:rgba(59,130,246,.12); transform: translateY(-1px); }

        /* Responsive */
        @media (max-width: 992px){
          .stats{ grid-template-columns: 1fr; row-gap:8px; text-align:center; }
          .divider{ display:none; }
          .features .feature-grid{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ====== Inline SVG Icons (không cần thư viện) ====== */
function IconShield(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconClock(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconSupport(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9a6 6 0 0112 0v6a4 4 0 01-4 4h-2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 15h2v-6H6a2 2 0 00-2 2v2a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 9v6h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}
function IconInfo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 8.5h.01M11 11h2v5h-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconTag(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 10l-8 8-8-8V4h6l10 10z" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}
function IconBus(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 16v2M17 16v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}
function IconPhone(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h3l2 5-2 1a12 12 0 005 5l1-2 5 2v3a2 2 0 01-2 2A15 15 0 016 6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}
