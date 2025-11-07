import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/client";

export default function DeleteCustomer() {
  const { id } = useParams();
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/user/${id}`);
        if (!alive) return;
        setUser(res.data || null);
      } catch {
        setMsg({ type: "err", text: "Không tải được khách hàng" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const doDelete = async () => {
    if (!window.confirm(`Xóa khách hàng #${id}?`)) return;
    setDeleting(true);
    setMsg(null);
    try {
      await api.delete(`/user/${id}`);
      setMsg({ type: "ok", text: "Đã xóa khách hàng" });
      setTimeout(() => nav("/admin/customers"), 600);
    } catch (err) {
      const m = err?.response?.data?.message || "Xóa thất bại";
      setMsg({ type: "err", text: m });
      setDeleting(false);
    }
  };

  if (loading) return <div className="card"><p>Đang tải...</p></div>;

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "24px auto", padding: 16 }}>
        <p>Không tìm thấy khách hàng.</p>
        <button className="btn" onClick={() => nav("/admin/customers")}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: "24px auto", padding: 16 }}>
      <h2>Xóa khách hàng #{id}</h2>
      {msg && <p className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>{msg.text}</p>}

      <div style={{ margin: "12px 0", lineHeight: 1.7 }}>
        <div><b>Họ tên:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
        <div><b>Điện thoại:</b> {user.phone || "-"}</div>
        <div><b>Vai trò:</b> {user.roles}</div>
        <div><b>Trạng thái:</b> {user.blocked ? "Đã khóa" : "Hoạt động"}</div>
      </div>

      <p style={{ color: "#f87171" }}>
        Hành động này sẽ xóa khách hàng khỏi hệ thống.
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn danger" onClick={doDelete} disabled={deleting}>
          {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
        </button>
        <button className="btn ghost" onClick={() => nav("/admin/customers")}>Hủy</button>
      </div>
    </div>
  );
}
