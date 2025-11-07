import React, { useEffect, useRef, useState } from "react";
import api from "@/api/client";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "👋 Xin chào! Mình là trợ lý HuyNam — bạn cần hỗ trợ gì ạ?" },
  ]);

  const boxRef = useRef(null);
  const bottomRef = useRef(null);

  /* ===== Scroll behavior ===== */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ===== Send message ===== */
  async function send(textOpt) {
    const text = (textOpt ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      const res = await api.post("/rag/chat", { message: text });
      const reply =
        res?.data?.reply?.trim() ||
        "🤖 Mình nhận được rồi! AI đang cập nhật để trả lời chính xác hơn.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "❌ Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  /* ===== Handle Enter ===== */
  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button className="chat-fab" onClick={() => setOpen((o) => !o)}>
        💬
      </button>

      {open && (
        <div className="chat-box">
          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">HN</div>
              <div>
                <h4 className="chat-title">HuyNam Assistant</h4>
                <span className="chat-status">
                  <span className="dot" /> Online
                </span>
              </div>
            </div>
            <button
              className="chat-close"
              onClick={() => setOpen(false)}
              title="Đóng"
            >
              ✕
            </button>
          </header>

          {/* Body */}
          <div className="chat-body" ref={boxRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role}`}>
                {m.role === "bot" && <div className="msg-avatar">🤖</div>}
                <div className={`msg-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            {busy && (
              <div className="msg-row bot">
                <div className="msg-avatar">🤖</div>
                <div className="msg-bubble bot">
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <footer className="chat-input">
            <textarea
              value={input}
              placeholder="Nhập câu hỏi... (Enter để gửi)"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={busy}
              rows={2}
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="send-btn"
            >
              {busy ? "..." : "Gửi"}
            </button>
          </footer>
        </div>
      )}

      {/* ======================= CSS ======================= */}
      <style>{`
:root {
  --brand: #2563eb;
  --brand2: #7c3aed;
  --bot: #f4f6fb;
  --user-grad: linear-gradient(135deg, #2563eb, #7c3aed);
  --bg-blur: rgba(255, 255, 255, 0.75);
}

/* Floating chat button */
.chat-fab {
  position: fixed;
  bottom: 22px;
  right: 22px;
  background: linear-gradient(145deg, #2563eb, #22c55e);
  color: white;
  border: none;
  border-radius: 50%;
  width: 58px;
  height: 58px;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 9999;
}
.chat-fab:hover {
  transform: scale(1.07);
  filter: brightness(1.1);
}

/* Chat Box */
.chat-box {
  position: fixed;
  right: 20px;
  bottom: 95px;
  width: 380px;
  max-width: 95vw;
  height: 540px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  background: var(--bg-blur);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: fadeInUp 0.3s ease-out;
}
@keyframes fadeInUp {
  from { transform: translateY(15px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, var(--brand), var(--brand2));
  color: white;
}
.chat-avatar {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 800;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
}
.chat-title {
  font-weight: 700;
  margin: 0;
  font-size: 15px;
}
.chat-status {
  font-size: 12px;
  color: #dbeafe;
}
.dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  display: inline-block;
  border-radius: 50%;
  margin-right: 4px;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
}
.chat-close {
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
  color: #f8fafc;
  transition: transform 0.2s;
}
.chat-close:hover {
  transform: rotate(90deg);
}

/* Messages */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: rgba(250, 251, 253, 0.8);
}
.msg-row {
  display: flex;
  margin: 8px 0;
  gap: 8px;
  align-items: flex-end;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #e0e7ff;
  font-size: 14px;
}
.msg-bubble {
  padding: 10px 12px;
  border-radius: 14px;
  max-width: 70%;
  line-height: 1.45;
  font-size: 14px;
  white-space: pre-wrap;
}
.msg-bubble.user {
  background: var(--user-grad);
  color: #fff;
  border-top-right-radius: 4px;
}
.msg-bubble.bot {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top-left-radius: 4px;
  color: #111827;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

/* Typing animation */
.typing i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 3px;
  border-radius: 50%;
  background: #cbd5e1;
  animation: typing 1s infinite;
}
.typing i:nth-child(2) { animation-delay: 0.15s; }
.typing i:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing {
  0%, 80%, 100% { transform: translateY(0); opacity: .5; }
  40% { transform: translateY(-5px); opacity: 1; }
}

/* Input area */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
.chat-input textarea {
  flex: 1;
  resize: none;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}
.chat-input textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
.send-btn {
  background: var(--user-grad);
  border: none;
  border-radius: 10px;
  color: white;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(124, 58, 237, 0.25);
  transition: 0.2s;
}
.send-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}
.send-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

/* Mobile */
@media (max-width: 480px) {
  .chat-box {
    right: 10px;
    bottom: 80px;
    width: 95vw;
    height: 75vh;
  }
}

      `}</style>
    </>
  );
}
