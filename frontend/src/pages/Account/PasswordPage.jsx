import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { changePassword } from '../../services/accountService'

/** Hiển thị biểu mẫu đổi mật khẩu và phản hồi kiểm tra từ API. */
export default function PasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  /** Cập nhật trường mật khẩu theo name của ô nhập. */
  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  /** Gửi yêu cầu đổi mật khẩu và hiển thị thông báo thành công hoặc lỗi. */
  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await changePassword(form)
      setForm({ current_password: '', password: '', password_confirmation: '' })
      setMessage('Đã đổi mật khẩu thành công.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể đổi mật khẩu.')
    }
  }

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-xl px-5 py-10"><Link to="/account" className="text-sm text-gray hover:text-dark">← Tài khoản</Link><h1 className="font-display mt-3 text-5xl">Đổi mật khẩu</h1><form onSubmit={submit} className="mt-8 rounded-3xl border border-beige bg-white p-6">{[['current_password','Mật khẩu hiện tại'],['password','Mật khẩu mới'],['password_confirmation','Nhập lại mật khẩu mới']].map(([name, label]) => <label key={name} className="mt-4 block text-sm first:mt-0"><span className="text-gray">{label}</span><input required minLength="8" type="password" name={name} value={form[name]} onChange={update} className="mt-2 w-full rounded-2xl border border-beige px-4 py-3" /></label>)}{message && <p className="mt-4 text-sm text-pastel-green">{message}</p>}{error && <p className="mt-4 text-sm text-red-500">{error}</p>}<button className="mt-6 w-full rounded-full bg-dark px-5 py-3 text-white">Cập nhật mật khẩu</button></form></main></div>
}