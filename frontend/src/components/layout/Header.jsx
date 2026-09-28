import { Link, NavLink } from 'react-router-dom'
import { LogOut, ShoppingBag, UserPlus, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import BrandLogo from '../brand/BrandLogo'

const desktopNavClass = ({ isActive }) => `border-b-2 px-1 py-2 transition-colors ${isActive ? 'border-pastel-green font-semibold text-dark' : 'border-transparent hover:border-beige hover:text-dark'}`
const mobileNavClass = ({ isActive }) => `shrink-0 border-b-2 pb-2 transition-colors ${isActive ? 'border-pastel-green font-semibold text-dark' : 'border-transparent hover:text-dark'}`

/** Hiển thị điều hướng, tài khoản và số sản phẩm trong giỏ hàng. */
export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const { cart } = useCart()

  return (
    <header className="sticky top-0 z-20 border-b border-beige/80 bg-off-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-5 py-4">
        <BrandLogo prominent />

        <nav className="hidden min-w-0 items-center justify-center gap-5 text-base font-medium text-gray lg:flex">
          <NavLink to="/" className={desktopNavClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/products" className={desktopNavClass}>
            Sản phẩm
          </NavLink>
          <NavLink to="/summer-collection" className={desktopNavClass}>Bộ sưu tập hè</NavLink>
          <NavLink to="/promotions" className={desktopNavClass}>Khuyến mãi</NavLink>
          <NavLink to="/about" className={desktopNavClass}>Về SUNÉA</NavLink>
        </nav>

        <div className="flex items-center justify-end gap-2">
          {isAuthenticated && <NavLink to="/cart" aria-label="Giỏ hàng" title="Giỏ hàng" className={({ isActive }) => `relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${isActive ? 'border-dark bg-dark text-white' : 'border-beige bg-white hover:border-dark hover:text-dark'}`}>{({ isActive }) => <><ShoppingBag size={17} strokeWidth={1.8} aria-hidden="true" /><span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium ${isActive ? 'bg-soft-yellow text-dark' : 'bg-dark text-white'}`}>{cart.product_count || 0}</span></>}</NavLink>}
          {isAuthenticated ? <><NavLink to={isAdmin ? '/admin' : '/account'} aria-label={isAdmin ? 'Quản trị' : 'Tài khoản'} title={user?.name || 'Tài khoản'} className={({ isActive }) => `hidden items-center gap-2 rounded-full border px-3 py-2 text-sm transition lg:inline-flex ${isActive ? 'border-dark bg-dark text-white' : 'border-beige bg-white hover:border-dark hover:text-dark'}`}><UserRound size={16} strokeWidth={1.8} />{isAdmin ? 'Quản trị' : user?.name || 'Tài khoản'}</NavLink><button type="button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-beige bg-white transition hover:border-dark hover:text-dark"><LogOut size={17} strokeWidth={1.8} /></button></> : <><NavLink to="/login" aria-label="Đăng nhập" title="Đăng nhập" className={({ isActive }) => `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${isActive ? 'border-dark bg-dark text-white' : 'border-beige bg-white hover:border-dark hover:text-dark'}`}><UserRound size={17} strokeWidth={1.8} /></NavLink><Link to="/register" aria-label="Đăng ký" title="Đăng ký" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark text-white transition hover:bg-dark/90"><UserPlus size={17} strokeWidth={1.8} /></Link></>}
        </div>

        <nav className="col-span-3 flex min-w-0 items-center gap-6 overflow-x-auto border-t border-beige pt-3 text-base font-medium text-gray lg:hidden">
          <NavLink to="/" className={mobileNavClass}>Trang chủ</NavLink>
          <NavLink to="/products" className={mobileNavClass}>Sản phẩm</NavLink>
          <NavLink to="/summer-collection" className={mobileNavClass}>Bộ sưu tập hè</NavLink>
          <NavLink to="/promotions" className={mobileNavClass}>Khuyến mãi</NavLink>
          <NavLink to="/about" className={mobileNavClass}>Về SUNÉA</NavLink>
        </nav>
      </div>
    </header>
  )
}
