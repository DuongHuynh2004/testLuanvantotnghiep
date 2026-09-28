import { useEffect, useState } from 'react'
import { getCoupons, promotionError } from '../../services/promotionService'
import { formatCurrency } from '../../utils/currency'

/** Hiển thị các mã đang phát hành; sao chép mã để khách nhập tại thanh toán. */
export default function CouponList() {
  const [coupons, setCoupons] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let cancelled = false
    getCoupons().then((response) => { if (!cancelled) setCoupons(response.data.data) })
      .catch((error) => { if (!cancelled) setMessage(promotionError(error)) })
    return () => { cancelled = true }
  }, [])

  /** Sao chép mã và thông báo kết quả, hỗ trợ cả trình duyệt không cấp quyền clipboard. */
  async function copyCode(code) {
    try { await navigator.clipboard.writeText(code); setMessage(`Đã sao chép ${code}.`) }
    catch { setMessage(`Bạn có thể nhập mã ${code} tại trang thanh toán.`) }
  }

  return <section className="my-8 rounded-3xl bg-mint/25 p-5 md:p-7">
    <h2 className="font-display text-3xl">Mã ưu đãi dành cho bạn</h2>
    <p className="mt-2 text-sm leading-6 text-gray">Mỗi đơn dùng một mã. Giá trị tối thiểu được tính sau ưu đãi sản phẩm.</p>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    {!coupons && !message && <p className="mt-4 text-sm">Đang tải mã ưu đãi...</p>}
    {coupons?.length === 0 && <p className="mt-4 text-sm text-gray">Chưa có mã đang phát hành. Bạn vẫn có thể mua các sản phẩm khuyến mãi bên dưới.</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{coupons?.map((coupon) => <article key={coupon.code} className="flex flex-col rounded-2xl border border-beige bg-white p-5">
      <p className="text-lg font-medium">{coupon.discount_type === 'percent' ? `Giảm ${Number(coupon.discount_value)}%` : `Giảm ${formatCurrency(coupon.discount_value)}`}</p>
      <p className="mt-1 text-sm">{coupon.name}</p>
      <p className="mt-3 text-xs leading-6 text-gray">Đơn từ {formatCurrency(coupon.minimum_order)}{coupon.maximum_discount && <> · Giảm tối đa {formatCurrency(coupon.maximum_discount)}</>}{coupon.per_user_limit && <> · {coupon.per_user_limit} lượt/khách</>}</p>
      <p className="mb-4 text-xs leading-6 text-gray">{coupon.ends_at ? `Hết hạn: ${new Date(coupon.ends_at).toLocaleString('vi-VN')}` : 'Chưa có ngày kết thúc'}</p>
      <button type="button" onClick={() => copyCode(coupon.code)} className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-dashed border-pastel-green px-3 py-2 text-sm"><strong>{coupon.code}</strong><span>Sao chép</span></button>
    </article>)}</div>
  </section>
}
