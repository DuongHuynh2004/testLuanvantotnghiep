import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'

/** Hiển thị liên kết hỗ trợ và biểu mẫu nhận tin của giao diện. */
export default function Footer() {
  const [subscribed, setSubscribed] = useState(false)

  /** Mô phỏng đăng ký nhận tin trên giao diện; hiện chưa gửi hoặc lưu email qua API. */
  function subscribe(event) {
    event.preventDefault()
    setSubscribed(true)
    event.currentTarget.reset()
  }

  return (
    <footer className="border-t border-beige bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div><BrandLogo /><p className="mt-3 max-w-xs text-sm leading-6 text-gray">Thời trang mùa hè hiện đại dành cho những người trẻ yêu sự tự do, thoải mái và phong cách riêng.</p></div>
        <div><p className="text-xs uppercase tracking-[0.2em] text-gray">Khám phá</p><div className="mt-4 space-y-3 text-sm"><Link to="/products" className="block hover:text-gray">Sản phẩm</Link><Link to="/summer-collection" className="block hover:text-gray">Bộ sưu tập hè</Link><Link to="/promotions" className="block hover:text-gray">Khuyến mãi</Link><Link to="/about" className="block hover:text-gray">Về SUNÉA</Link></div></div>
        <div><p className="text-xs uppercase tracking-[0.2em] text-gray">Hỗ trợ</p><div className="mt-4 space-y-3 text-sm"><span className="block text-gray">Đổi trả trong 7 ngày</span><span className="block text-gray">Giao hàng toàn quốc</span></div></div>
        <div><p className="text-xs uppercase tracking-[0.2em] text-gray">Stay in the sun</p><p className="mt-4 text-sm leading-6 text-gray">Nhận thông tin về sản phẩm, bộ sưu tập và chương trình đặc biệt từ SUNÉA.</p>{subscribed ? <p className="mt-4 text-sm text-pastel-green">Đã đăng ký thành công.</p> : <form onSubmit={subscribe} className="mt-4 flex border-b border-dark pb-2"><input required type="email" aria-label="Email nhận tin" placeholder="Email của bạn" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="submit" className="text-sm">Đăng ký →</button></form>}</div>
      </div>
      <div className="border-t border-beige"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-xs text-gray"><span>© 2026 SUNÉA. All rights reserved.</span><span>Summer, Your Way.</span></div></div>
    </footer>
  )
}
