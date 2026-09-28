import { Link } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'

/** Dùng chung bố cục, tiêu đề và liên kết chân trang cho đăng nhập/đăng ký. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="min-h-svh bg-off-white">
      <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2">
        <section className="hidden lg:block">
          <BrandLogo />
          <p className="mt-6 text-sm uppercase tracking-[0.28em] text-gray">Summer, your way.</p>
          <p className="mt-4 max-w-md text-gray">
            Thời trang mùa hè hiện đại để bạn thoải mái thể hiện phong cách riêng.
          </p>
          <div className="relative mt-8 h-64 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#c8d8ce,#d1dce0_52%,#e7d09a)]"><div className="absolute -bottom-14 -right-10 h-52 w-52 rounded-full border-[18px] border-white/50" /><div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-dark/20" /><p className="absolute bottom-6 left-6 text-sm uppercase tracking-[0.2em] text-dark/60">Made for your summer</p></div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-beige bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo compact />
            <Link to="/" className="rounded-full border border-beige px-3 py-2 text-xs text-gray transition hover:border-dark hover:text-dark">
              ← Về trang chủ
            </Link>
          </div>
          <h2 className="mt-4 text-2xl font-medium text-dark">{title}</h2>
          <p className="mt-2 text-sm text-gray">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-gray">{footer}</div>}
        </section>
      </div>
    </main>
  )
}
