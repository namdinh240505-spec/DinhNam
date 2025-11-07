import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('123456')
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await api.post('/login', { email, password })
      const token = res.data?.token
      const user = res.data?.user

      if (!token || !user) {
        setMsg({ type: 'err', msg: 'Không nhận được token hoặc thông tin user' })
        return
      }

      // 🔒 Kiểm tra role
      if (user.roles !== 'admin') {
        setMsg({ type: 'err', msg: 'Chỉ admin mới được phép đăng nhập' })
        return
      }

      // ✅ Lưu token và thông tin
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_role', user.roles)

      setMsg({ type: 'ok', msg: 'Đăng nhập thành công!' })
      nav('/admin')
    } catch (err) {
      setMsg({
        type: 'err',
        msg: err?.response?.data?.message || 'Đăng nhập thất bại'
      })
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Đăng nhập quản trị</h2>
      <form onSubmit={submit} className="row" style={{ marginTop: 12 }}>
        <div>
          <label className="small">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="small">Mật khẩu</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn" type="submit">
          Đăng nhập
        </button>
      </form>

      {msg && (
        <p
          className={`alert ${msg.type === 'ok' ? 'ok' : 'err'}`}
          style={{ marginTop: 10 }}
        >
          {msg.msg}
        </p>
      )}
    </div>
  )
}
