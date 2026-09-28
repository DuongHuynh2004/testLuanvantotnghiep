import { useState } from 'react'
import { BadgePercent, Boxes, ExternalLink, LayoutDashboard, LogOut, Menu, MessageSquareText, Package, RefreshCcw, ShoppingBag, Users, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'
import { useAuth } from '../../hooks/useAuth'

const navigation = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Sản phẩm & kho', icon: Package },
  { to: '/admin/combos', label: 'Combo sản phẩm', icon: Boxes },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/order-requests', label: 'Hoàn tiền & đổi trả', icon: RefreshCcw },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
  { to: '/admin/reviews', label: 'Đánh giá', icon: MessageSquareText },
  { to: '/admin/promotions', label: 'Khuyến mãi', icon: BadgePercent },
]

/** Bố cục dùng chung cho toàn bộ khu quản trị với điều hướng riêng biệt khỏi cửa hàng. */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  /** Đăng xuất khỏi khu quản trị rồi trở về trang chủ công khai. */
  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const sidebar = <>
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-5"><BrandLogo light /><button type="button" onClick={() => setOpen(false)} className="text-white lg:hidden" aria-label="Đóng menu"><X size={20} /></button></div>
    <nav className="flex-1 space-y-1 px-3 py-5">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-white text-dark' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={18} />{label}</NavLink>)}</nav>
    <div className="border-t border-white/10 p-3"><Link to="/" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white"><ExternalLink size={18} />Xem cửa hàng</Link><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white"><LogOut size={18} />Đăng xuất</button></div>
  </>

  return <div className="min-h-svh bg-[#f4f5f1] text-dark">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#1d2926] lg:flex">{sidebar}</aside>
    {open && <><button type="button" className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu" /><aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1d2926] lg:hidden">{sidebar}</aside></>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-[#f4f5f1]/95 px-5 backdrop-blur md:px-8"><button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-black/10 bg-white p-2 lg:hidden" aria-label="Mở menu"><Menu size={19} /></button><div className="ml-auto text-right"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-gray">Quản trị viên</p></div></header>
      <Outlet />
    </div>
  </div>
}
