// src/pages/PaymentResult.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import api from "@/api/client";
import "@/styles/payment-result.css";

function isPaid(b) {
  if (!b) return false;
  const p = b.paid ?? b.payment_status ?? "";
  if (typeof p === "boolean") return p;
  const s = String(p).toLowerCase();
  return s === "paid" || s === "1" || s === "true" || s === "đã thanh toán";
}

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const code = params.get("code") || "";
  const resultCode = params.get("resultCode") || ""; // MoMo: "0" = success

  const [status, setStatus] = useState("loading"); // loading | success | fail | error
  const [msg, setMsg] = useState("Đang xác minh giao dịch…");
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const tries = useRef(0);
  const maxTries = 8; // ~16s (2s/lần)

  async function fetchBookingPaidState() {
    try {
      const r = await api.get("/bookings", { params: { code } });
      const list = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
      const bk = list?.[0];
      return isPaid(bk);
    } catch {
      return null;
    }
  }

  async function verifyOnce() {
    // 1) Cho BE “chốt” nếu cần
    try {
      const { data } = await api.get("/pay/momo/return" + location.search);
      if (data?.message) setMsg(String(data.message));
    } catch { /* im lặng */ }

    // 2) Trạng thái DB là nguồn sự thật
    const paid = await fetchBookingPaidState();
    if (paid === true) {
      setStatus("success");
      setMsg("Thanh toán thành công!");
      if (code) localStorage.setItem("last_booking_code", code);
      return true;
    }
    if (paid === false) return false;
    return false;
  }

  async function verify() {
    if (!code) {
      setStatus("error");
      setMsg("Thiếu mã vé để xác minh.");
      return;
    }

    setChecking(true);
    setStatus("loading");
    setMsg("Đang xác minh giao dịch…");

    try {
      const ok = await verifyOnce();
      if (ok) return;

      const shouldPoll = resultCode === "0";
      if (!shouldPoll) {
        setStatus("fail");
        setMsg("Thanh toán thất bại hoặc bị hủy.");
        return;
      }

      tries.current = 0;
      while (tries.current < maxTries) {
        await new Promise((r) => setTimeout(r, 2000));
        const ok2 = await verifyOnce();
        if (ok2) return;
        tries.current += 1;
      }

      setStatus("fail");
      setMsg("Chưa xác minh được thanh toán. Vui lòng thử lại sau ít phút.");
    } catch {
      setStatus("error");
      setMsg("Không xác minh được giao dịch. Vui lòng thử lại.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { verify(); /* eslint-disable-next-line */ }, []);

  const badge = {
    loading: { cls: "pr-badge pr-badge--loading", text: "ĐANG XÁC MINH…" },
    success: { cls: "pr-badge pr-badge--success", text: "ĐÃ THANH TOÁN" },
    fail:    { cls: "pr-badge pr-badge--fail",    text: "KHÔNG THÀNH CÔNG" },
    error:   { cls: "pr-badge pr-badge--error",   text: "LỖI XÁC MINH" },
  }[status];

  const copy = async () => {
    if (!code || !navigator.clipboard) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="pr-wrap">
      <div className="pr-card">
        <div className="pr-surface">
          {/* Header */}
          <div className="pr-head">
            <div className="pr-head__left">
              <div className="pr-icon">💸</div>
              <div>
                <h1 className="pr-title">Kết quả thanh toán</h1>
                <div className={badge.cls}>{badge.text}</div>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="pr-btn pr-btn--ghost sm"
              title="Quay lại trang trước"
            >
              ← Quay lại
            </button>
          </div>

          {/* Message */}
          <div className="pr-msg">{msg}</div>

          {/* Booking code */}
          {code && (
            <div className="pr-code">
              <div className="pr-code__label">Mã vé</div>
              <div className="pr-code__value">{code}</div>
              <button onClick={copy} className="pr-btn pr-btn--ghost sm">
                📋 {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          )}

          {/* Result details (nhỏ) */}
          {resultCode !== "" && (
            <div className="pr-small">
              Mã phản hồi (MoMo): <span className="text-strong">{resultCode}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pr-actions">
            <Link to="/booking" className="pr-btn pr-btn--ghost">← Về trang đặt vé</Link>

            {/* Đổi “Xem vé của tôi” về /booking */}
            <Link
              to="/booking"
              className={`pr-btn ${status === "success" ? "pr-btn--green" : "pr-btn--indigo"}`}
            >
              🎟 Xem vé của tôi
            </Link>

            {status === "success" && (
              <Link to="/" className="pr-btn pr-btn--pink">🏠 Về trang chủ</Link>
            )}

            {(status === "fail" || status === "error") && (
              <>
                <Link
                  to={code ? `/payment/momo?code=${encodeURIComponent(code)}` : "/booking"}
                  className="pr-btn pr-btn--pink"
                >
                  🔁 Thanh toán lại
                </Link>
                <button
                  onClick={verify}
                  disabled={checking}
                  className={`pr-btn pr-btn--ghost ${checking ? "is-loading" : ""}`}
                >
                  {checking ? "Đang kiểm tra…" : "Kiểm tra lại trạng thái"}
                </button>
              </>
            )}
          </div>

          <div className="pr-tip">
            Nếu MoMo chưa tự chuyển hướng, bạn vẫn có thể bấm <b>“Kiểm tra lại trạng thái”</b> sau vài giây.
          </div>
        </div>
      </div>
    </div>
  );
}
