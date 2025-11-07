// src/pages/Contact.jsx
import React from "react";
import mapImg from "@/assets/map.png"; // <- đổi thành ảnh map của bạn

export default function Contact() {
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.headerCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900 }}>Liên hệ HuyNamBusLines</h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              Chúng tôi hỗ trợ 24/7 — vui lòng gọi hoặc nhắn tin khi cần trợ giúp.
            </p>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div style={S.grid}>
        {/* Info card */}
        <aside style={S.card}>
          <h3 style={S.h3}>Thông tin liên hệ</h3>
          <ul style={S.list}>
            <li>
              <span style={S.k}>Điện thoại:</span>{" "}
              <a href="tel:0336671981" style={S.link}>033 667 1981</a> •{" "}
              <a href="tel:0377394217" style={S.link}>037 739 4217</a>{" "}
              <span style={S.badge}>24/24</span>
            </li>
            <li>
              <span style={S.k}>Gmail:</span>{" "}
              <a href="mailto:namdinh240505@gmail.com" style={S.link}>
                namdinh240505@gmail.com
              </a>
            </li>
            <li>
              <span style={S.k}>Facebook:</span>{" "}
              <a
                href="https://www.facebook.com/dinhnam.2405"
                target="_blank"
                rel="noreferrer"
                style={S.link}
              >
                facebook.com/dinhnam.2405
              </a>
            </li>
            <li>
              <span style={S.k}>Địa chỉ:</span> Đang cập nhật
            </li>
          </ul>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <a href="tel:0336671981" style={S.primaryBtn}>Gọi ngay</a>
            <a href="mailto:namdinh240505@gmail.com" style={S.ghostBtn}>Gửi email</a>
            <a
              href="https://www.facebook.com/dinhnam.2405"
              target="_blank"
              rel="noreferrer"
              style={S.ghostBtn}
            >
              Mở Facebook
            </a>
          </div>

          <div style={S.note}>
            <strong>Lưu ý:</strong> Nếu bận máy, vui lòng để lại tin nhắn — chúng tôi sẽ
            gọi lại trong thời gian sớm nhất.
          </div>
        </aside>

        {/* Map card */}
        <aside style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 12px 0 12px" }}>
            <h3 style={{ ...S.h3, marginBottom: 10 }}>Bản đồ</h3>
          </div>

          <div style={{ position: "relative" }}>
            <img
              src={mapImg}
              alt="Bản đồ vị trí HuyNamBusLines"
              style={S.mapImg}
            />
            {/* Marker giả lập (nếu ảnh map là tĩnh) */}
            <div style={S.pinWrap}>
              <div style={S.pinPulse} />
              <div style={S.pinDot} />
              <div style={S.pinLabel}>Vị trí văn phòng</div>
            </div>
          </div>

          <div style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              style={S.primaryBtn}
              title="Mở trên Google Maps"
            >
              Xem trên Google Maps
            </a>
            <button
              type="button"
              style={S.ghostBtn}
              title="Sao chép địa chỉ"
              onClick={() => {
                navigator.clipboard.writeText("HuyNamBusLines — Địa chỉ: (cập nhật)");
                alert("Đã sao chép địa chỉ!");
              }}
            >
              Sao chép địa chỉ
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== Styles ===== */
const C = {
  bg: "linear-gradient(145deg, #0f172a, #1e293b)",
  card: "rgba(255,255,255,.05)",
  line: "rgba(148,163,184,.2)",
  brand: "#3b82f6",
};

const S = {
  page: {
    color: "#e5e7eb",
    fontFamily: "Inter, system-ui",
    background: C.bg,
    minHeight: "100vh",
    padding: "20px 24px",
  },
  headerCard: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: "rgba(30,41,59,.6)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 24px rgba(0,0,0,.4)",
  },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "conic-gradient(from 0deg, #60a5fa, #22d3ee, #60a5fa)",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr 1.2fr",
  },
  card: {
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: "rgba(30,41,59,.6)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 24px rgba(0,0,0,.4)",
  },
  h3: { margin: 0, fontWeight: 900 },
  list: {
    margin: "10px 0 0 0",
    padding: 0,
    listStyle: "none",
    lineHeight: 1.8,
  },
  k: { color: "#94a3b8" },
  link: { color: "#bfdbfe", textDecoration: "none" },
  badge: {
    background: "#e8f6ee",
    color: "#166534",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    marginLeft: 6,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: C.brand,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,.25)",
    textDecoration: "none",
    display: "inline-block",
  },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: "transparent",
    color: "#e5e7eb",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  note: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: "rgba(2,6,23,.35)",
    color: "#cbd5e1",
    fontSize: 13,
  },
  mapImg: {
    display: "block",
    width: "100%",
    height: 360,
    objectFit: "cover",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  pinWrap: {
    position: "absolute",
    left: "55%",
    top: "48%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#ef4444",
    border: "2px solid #fff",
    margin: "0 auto",
    boxShadow: "0 0 0 4px rgba(239,68,68,.35)",
  },
  pinPulse: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 60,
    height: 60,
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: "0 0 0 0 rgba(239,68,68,.45)",
    animation: "pulse 1.8s infinite",
  },
  pinLabel: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    color: "#e5e7eb",
    textShadow: "0 1px 2px rgba(0,0,0,.6)",
  },
};

/* Mini CSS keyframes (thêm vào global CSS nếu bạn có) 
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,.45); }
  70% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
*/
