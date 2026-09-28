import { Pencil, Save, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile } from '../../services/accountService'

const menu = [
  { label: 'Thông tin cá nhân', key: 'profile', href: '/account' },
  { label: 'Đơn hàng', key: 'orders', href: '/orders' },
  { label: 'Địa chỉ nhận hàng', key: 'addresses', href: '/addresses' },
  { label: 'Danh sách yêu thích', key: 'wishlist', href: '/wishlist' },
  { label: 'Đổi mật khẩu', key: 'password', href: '/account/password' },
]

/** Hiển thị và cho phép cập nhật hồ sơ cá nhân, trừ vai trò tài khoản. */
export default function AccountPage() {
  const { user, logout, isAdmin, updateCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/', { replace: true })
  }

  function cancelEdit() {
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
    setEditing(false)
    setError('')
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await updateProfile(form)
      updateCurrentUser(response.data.data)
      setEditing(false)
      setMessage('Thông tin cá nhân đã được cập nhật.')
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors
      setError(validationErrors ? Object.values(validationErrors).flat()[0] : requestError.response?.data?.message || 'Không thể cập nhật thông tin.')
    } finally { setSaving(false) }
  }

  const initials = user?.name?.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase() || 'S'

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-gray">My SUNÉA</p><h1 className="font-display mt-3 text-5xl md:text-6xl">Không gian của bạn.</h1></div><Link to="/products" className="text-sm text-gray transition hover:text-dark">Tiếp tục mua sắm →</Link></div>
    <section className="mt-8 overflow-hidden rounded-[2rem] bg-dark text-white"><div className="relative flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-10"><div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[28px] border-white/10" /><div className="relative flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-yellow font-display text-2xl text-dark">{initials}</div><div><p className="text-sm uppercase tracking-[0.2em] text-white/60">Xin chào</p><h2 className="mt-1 text-2xl font-medium">{user?.name}</h2><p className="mt-1 text-sm text-white/60">{isAdmin ? 'Tài khoản quản trị' : 'Thành viên SUNÉA'}</p></div></div><div className="relative flex flex-wrap gap-3 text-sm"><span className="rounded-full border border-white/20 px-4 py-2">Email đã xác thực</span><span className="rounded-full border border-white/20 px-4 py-2">Summer member</span></div></div></section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit space-y-2 rounded-3xl border border-beige bg-white p-3">{menu.map((item) => <Link key={item.key} to={item.href} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${item.key === 'profile' ? 'bg-mint font-medium text-dark' : 'text-gray hover:bg-off-white hover:text-dark'}`}><span>{item.label}</span><span className="text-xs opacity-50">→</span></Link>)}{isAdmin && <Link to="/admin" className="mt-2 flex items-center justify-between rounded-2xl border-t border-beige px-4 py-4 text-sm text-gray hover:text-dark"><span>Quản trị cửa hàng</span><span>→</span></Link>}<button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-2 w-full rounded-2xl bg-dark px-4 py-3 text-sm text-white transition hover:bg-dark/90 disabled:opacity-60">{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</button></aside>
      <section className="space-y-8">
        <form onSubmit={saveProfile} className="rounded-3xl border border-beige bg-white p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.2em] text-gray">Profile</p><h2 className="font-display mt-2 text-3xl">Thông tin cá nhân</h2></div><div className="flex gap-2">{editing ? <><button type="button" onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-sm"><X size={15} /> Hủy</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-dark px-4 py-2 text-sm text-white disabled:opacity-50"><Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu'}</button></> : <button type="button" onClick={() => { setEditing(true); setMessage('') }} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-sm transition hover:border-dark"><Pencil size={15} /> Chỉnh sửa</button>}</div></div>
          {message && <p role="status" className="mt-5 rounded-2xl bg-mint/25 px-4 py-3 text-sm text-pastel-green">{message}</p>}{error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <div className="mt-8 grid gap-6 border-t border-beige pt-6 sm:grid-cols-2">{[['name', 'Họ tên', 'text'], ['email', 'Email', 'email'], ['phone', 'Số điện thoại', 'tel']].map(([name, label, type]) => <label key={name} className="block"><span className="text-xs uppercase tracking-wide text-gray">{label}</span>{editing ? <input required={name !== 'phone'} name={name} type={type} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="mt-2 w-full rounded-xl border border-beige px-3 py-2.5 outline-none focus:border-dark" /> : <span className="mt-2 block text-lg break-all">{user?.[name] || 'Chưa cập nhật'}</span>}</label>)}<div><span className="text-xs uppercase tracking-wide text-gray">Vai trò</span><span className="mt-2 block text-lg">{isAdmin ? 'Admin' : 'Khách hàng'}</span><span className="mt-1 block text-xs text-gray">Vai trò do hệ thống quản lý.</span></div></div>
        </form>
      </section>
    </div>
  </main><Footer /></div>
}
