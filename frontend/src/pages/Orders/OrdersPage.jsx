import { CalendarDays, Check, ChevronDown, MapPin, Package, Pencil, RotateCcw, Star, Trash2, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { cancelOrder, createOrderRequest, getOrders } from '../../services/orderService'
import { createReview, deleteReview, updateReview } from '../../services/reviewService'
import { formatCurrency } from '../../utils/currency'

const statuses = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang chuẩn bị', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' }
const statusStyles = { pending: 'bg-soft-yellow/25 text-[#80651e]', confirmed: 'bg-sky-blue/55 text-dark', processing: 'bg-mint/45 text-dark', shipping: 'bg-[#dcebf7] text-[#315d7b]', completed: 'bg-[#dceee4] text-[#32665c]', cancelled: 'bg-red-50 text-red-600' }
const requestLabels = { refund: 'Hoàn tiền', return: 'Đổi / trả hàng' }
const requestStatuses = { pending: 'Đang chờ xử lý', approved: 'Đã chấp thuận', rejected: 'Đã từ chối' }
const ratingLabels = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng']
const progressSteps = [
  { label: 'Xác nhận', icon: Check },
  { label: 'Chuẩn bị', icon: Package },
  { label: 'Đang giao', icon: Truck },
  { label: 'Hoàn tất', icon: Check },
]

function statusProgress(status) {
  return ({ pending: -1, confirmed: 0, processing: 1, shipping: 2, completed: 3 })[status] ?? -1
}

function StarPicker({ value, hoverValue, onChange, onHover }) {
  const shownValue = hoverValue || value
  return <div>
    <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Chọn số sao">
      {[1, 2, 3, 4, 5].map((rating) => <button
        key={rating}
        type="button"
        role="radio"
        aria-checked={value === rating}
        aria-label={`${rating} sao - ${ratingLabels[rating]}`}
        onClick={() => onChange(rating)}
        onMouseEnter={() => onHover(rating)}
        onMouseLeave={() => onHover(0)}
        onFocus={() => onHover(rating)}
        onBlur={() => onHover(0)}
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-2xl transition duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#d39e2f]/40 ${rating <= shownValue ? 'border-[#e4bd65] bg-amber-50 text-[#d39e2f] shadow-sm' : 'border-beige bg-white text-[#c7c7c0]'}`}
      >★</button>)}
    </div>
    <p className="mt-2 text-sm font-medium text-[#80651e]">{shownValue}/5 · {ratingLabels[shownValue]}</p>
  </div>
}

/** Hiển thị danh sách đơn thu gọn và mở từng đơn để quản lý hậu mãi, đánh giá. */
export default function OrdersPage() {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [requestForm, setRequestForm] = useState(null)
  const [reviewForm, setReviewForm] = useState(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getOrders().then((response) => {
      if (!cancelled) setOrders(response.data?.data?.data || [])
    }).catch(() => {
      if (!cancelled) setError('Không tải được lịch sử đơn hàng.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  function replaceOrder(updated) {
    setOrders((current) => current.map((order) => order.id === updated.id ? updated : order))
  }

  function closeForms() {
    setRequestForm(null)
    setReviewForm(null)
    setHoverRating(0)
  }

  async function handleCancel(order) {
    setBusyId(order.id); setError(''); setMessage('')
    try {
      replaceOrder((await cancelOrder(order.id)).data.data)
      setMessage(`Đã hủy đơn ${order.order_code}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể hủy đơn hàng này.')
    } finally { setBusyId(null) }
  }

  async function submitRequest(event) {
    event.preventDefault()
    if (!requestForm || busyId) return
    setBusyId(requestForm.orderId); setError(''); setMessage('')
    try {
      const response = await createOrderRequest(requestForm.orderId, { type: requestForm.type, reason: requestForm.reason })
      setOrders((current) => current.map((order) => order.id === requestForm.orderId ? { ...order, requests: [...(order.requests || []), response.data.data] } : order))
      setMessage('Yêu cầu đã được gửi đến quản trị viên.')
      setRequestForm(null)
    } catch (requestError) {
      setError(Object.values(requestError.response?.data?.errors || {}).flat()[0] || requestError.response?.data?.message || 'Không thể gửi yêu cầu.')
    } finally { setBusyId(null) }
  }

  async function submitReview(event) {
    event.preventDefault()
    if (!reviewForm || busyId) return
    setBusyId(reviewForm.orderId); setError(''); setMessage('')
    try {
      const response = reviewForm.reviewId
        ? await updateReview(reviewForm.reviewId, { rating: reviewForm.rating, comment: reviewForm.comment })
        : await createReview(reviewForm.slug, { order_id: reviewForm.orderId, rating: reviewForm.rating, comment: reviewForm.comment })
      const saved = { ...response.data.data, product_id: reviewForm.productId }
      setOrders((current) => current.map((order) => {
        if (order.id !== reviewForm.orderId) return order
        const reviews = reviewForm.reviewId
          ? (order.reviews || []).map((item) => item.id === reviewForm.reviewId ? saved : item)
          : [...(order.reviews || []), saved]
        return { ...order, reviews }
      }))
      setMessage(reviewForm.reviewId ? 'Đã cập nhật đánh giá.' : 'Đánh giá đã được đăng.')
      setReviewForm(null)
      setHoverRating(0)
    } catch (requestError) {
      setError(Object.values(requestError.response?.data?.errors || {}).flat()[0] || requestError.response?.data?.message || 'Không thể lưu đánh giá.')
    } finally { setBusyId(null) }
  }

  async function removeReview(orderId, reviewId) {
    if (!window.confirm('Bạn muốn xóa đánh giá này?')) return
    setBusyId(orderId); setError(''); setMessage('')
    try {
      await deleteReview(reviewId)
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, reviews: (order.reviews || []).filter((item) => item.id !== reviewId) } : order))
      setReviewForm(null)
      setMessage('Đã xóa đánh giá.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa đánh giá.')
    } finally { setBusyId(null) }
  }

  function openReviewForm(order, item, review = null) {
    setReviewForm({
      reviewId: review?.id || null,
      orderId: order.id,
      productId: item.product.id,
      slug: item.product.slug,
      productName: item.product_name,
      rating: review?.rating || 5,
      comment: review?.comment || '',
    })
    setHoverRating(0)
  }

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><Link to="/account" className="text-sm text-gray hover:text-dark">← Tài khoản</Link><p className="mt-5 text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Order history</p><h1 className="font-display mt-2 text-5xl md:text-6xl">Đơn hàng của bạn</h1></div>
      <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">{orders.length} đơn hàng</span>
    </div>
    {location.state?.created && <p className="mt-6 rounded-2xl bg-mint/40 px-5 py-4 text-sm">Đặt hàng thành công. Cảm ơn bạn đã mua sắm cùng SUNÉA.</p>}
    {message && <p role="status" className="mt-5 rounded-2xl bg-mint/40 px-5 py-4 text-sm">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</p>}
    {loading && <div className="mt-8 space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-3xl bg-beige" />)}</div>}
    {!loading && orders.length === 0 && <div className="mt-10 rounded-[2rem] border border-dashed border-beige bg-white py-16 text-center"><Package className="mx-auto text-pastel-green" size={36} /><h2 className="font-display mt-4 text-3xl">Chưa có đơn hàng</h2><Link to="/products" className="mt-6 inline-flex rounded-full bg-dark px-6 py-3 text-sm text-white">Bắt đầu mua sắm</Link></div>}
    <div className="mt-8 space-y-4">{orders.map((order) => {
      const isExpanded = expandedOrderId === order.id
      const canCancel = ['pending', 'confirmed'].includes(order.status) && order.payment_status === 'unpaid'
      const canRefund = order.payment_status === 'paid' && order.status !== 'cancelled' && !order.requests?.some((item) => item.type === 'refund')
      const canReturn = order.status === 'completed' && !order.requests?.some((item) => item.type === 'return')
      const progress = statusProgress(order.status)
      const firstItem = order.items?.[0]
      return <article key={order.id} className="overflow-hidden rounded-3xl border border-beige bg-white shadow-[0_8px_28px_rgba(38,49,46,0.05)]">
        <header className="flex items-center gap-4 p-4 md:px-6">
          {firstItem?.product?.image && <img src={firstItem.product.image} alt="" className="h-16 w-14 shrink-0 rounded-xl bg-beige object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{order.order_code}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[order.status] || 'bg-beige'}`}>{statuses[order.status] || order.status}</span></div>
            <p className="mt-1 truncate text-sm text-gray">{firstItem?.product_name || 'Đơn hàng'}{order.items?.length > 1 ? ` và ${order.items.length - 1} sản phẩm khác` : ''}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray"><CalendarDays size={13} /> {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="hidden text-right sm:block"><p className="text-xs text-gray">Tổng cộng</p><p className="mt-1 font-semibold">{formatCurrency(Number(order.total))}</p></div>
          <button type="button" aria-expanded={isExpanded} onClick={() => { setExpandedOrderId(isExpanded ? null : order.id); closeForms() }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-beige transition hover:border-dark" aria-label={isExpanded ? 'Thu gọn đơn hàng' : 'Xem chi tiết đơn hàng'}><ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
        </header>
        {isExpanded && <div className="border-t border-beige">
          <div className="border-b border-beige px-5 py-5 md:px-8"><div className="grid grid-cols-4">{progressSteps.map(({ label, icon: Icon }, index) => { const active = progress >= index; return <div key={label} className="relative text-center before:absolute before:left-0 before:right-0 before:top-4 before:h-px before:bg-beige first:before:left-1/2 last:before:right-1/2"><div className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border ${active ? 'border-dark bg-dark text-white' : 'border-beige bg-white text-gray'}`}><Icon size={14} /></div><p className={`mt-2 text-[11px] ${active ? 'font-medium' : 'text-gray'}`}>{label}</p></div> })}</div></div>
          <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1fr_270px]">
            <div className="divide-y divide-beige">{order.items?.map((item) => {
              const review = order.reviews?.find((entry) => entry.product_id === item.product?.id)
              const formOpen = reviewForm?.orderId === order.id && reviewForm?.productId === item.product?.id
              return <div key={item.id} className="py-4 first:pt-0">
                <div className="flex gap-4"><Link to={item.product?.slug ? `/products/${item.product.slug}` : '#'}><img src={item.product?.image} alt={item.product_name} className="h-24 w-20 rounded-2xl bg-beige object-cover" /></Link><div className="min-w-0 flex-1">
                  <Link to={item.product?.slug ? `/products/${item.product.slug}` : '#'} className="font-medium hover:underline">{item.product_name}</Link>
                  <p className="mt-1 text-sm text-gray">Size {item.variant_name} · Số lượng {item.quantity}</p><p className="mt-2 text-sm font-medium">{formatCurrency(Number(item.subtotal))}</p>
                  {order.status === 'completed' && item.product && <div className="mt-3">{review ? <div>
                    <p aria-label={`${review.rating} trên 5 sao`} className="text-lg text-[#d39e2f]">{'★'.repeat(review.rating)}<span className="text-[#d8d8d1]">{'★'.repeat(5 - review.rating)}</span></p>
                    {review.comment && <p className="mt-1 text-sm text-gray">{review.comment}</p>}
                    <div className="mt-2 flex gap-2"><button type="button" onClick={() => openReviewForm(order, item, review)} className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"><Pencil size={13} /> Sửa</button><button type="button" disabled={busyId === order.id} onClick={() => removeReview(order.id, review.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"><Trash2 size={13} /> Xóa</button></div>
                  </div> : <button type="button" onClick={() => openReviewForm(order, item)} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-xs font-medium transition hover:border-[#d39e2f] hover:bg-amber-50"><Star size={14} /> Đánh giá sản phẩm</button>}</div>}
                </div></div>
                {formOpen && <form onSubmit={submitReview} className="mt-4 rounded-2xl border border-[#ead49d] bg-[#fffaf0] p-4"><p className="font-medium">{reviewForm.reviewId ? 'Sửa đánh giá' : 'Đánh giá'} {reviewForm.productName}</p><StarPicker value={reviewForm.rating} hoverValue={hoverRating} onHover={setHoverRating} onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))} /><textarea maxLength={1000} rows="3" value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Chia sẻ cảm nhận về sản phẩm..." className="mt-3 w-full rounded-xl border border-beige bg-white px-3 py-2 text-sm outline-none focus:border-[#d39e2f]" /><div className="mt-3 flex gap-2"><button disabled={busyId === order.id} className="rounded-full bg-dark px-5 py-2 text-xs text-white disabled:opacity-50">{reviewForm.reviewId ? 'Lưu thay đổi' : 'Đăng đánh giá'}</button><button type="button" onClick={() => setReviewForm(null)} className="rounded-full border border-beige px-5 py-2 text-xs">Hủy</button></div></form>}
              </div>
            })}</div>
            <aside className="space-y-4"><div className="rounded-2xl bg-off-white p-4"><p className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} /> Giao đến</p><p className="mt-3 text-sm font-medium">{order.shipping_name} · {order.shipping_phone}</p><p className="mt-1 text-sm leading-6 text-gray">{order.shipping_address}</p></div><div className="rounded-2xl border border-beige p-4 text-sm"><div className="flex justify-between"><span className="text-gray">Tạm tính</span><span>{formatCurrency(Number(order.subtotal))}</span></div>{Number(order.discount) > 0 && <div className="mt-2 flex justify-between text-pastel-green"><span>Ưu đãi</span><span>−{formatCurrency(Number(order.discount))}</span></div>}<div className="mt-3 flex justify-between border-t border-beige pt-3 font-semibold"><span>Tổng cộng</span><span>{formatCurrency(Number(order.total))}</span></div></div></aside>
          </div>
          {!!order.requests?.length && <div className="mx-5 mb-5 space-y-3 rounded-2xl bg-[#f7f8f5] p-4 md:mx-7">{order.requests.map((item) => <div key={item.id} className="text-sm"><div className="flex justify-between gap-2"><strong>{requestLabels[item.type]}</strong><span>{requestStatuses[item.status]}</span></div><p className="mt-1 text-gray">{item.reason}</p>{item.admin_note && <p className="mt-1 text-[#32665c]">Phản hồi: {item.admin_note}</p>}</div>)}</div>}
          {(canCancel || canRefund || canReturn) && <div className="flex flex-wrap gap-2 border-t border-beige px-5 py-4 md:px-7">{canCancel && <button type="button" disabled={busyId === order.id} onClick={() => handleCancel(order)} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50">Hủy đơn</button>}{canRefund && <button type="button" onClick={() => setRequestForm({ orderId: order.id, type: 'refund', reason: '' })} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-sm"><RotateCcw size={14} /> Yêu cầu hoàn tiền</button>}{canReturn && <button type="button" onClick={() => setRequestForm({ orderId: order.id, type: 'return', reason: '' })} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-sm"><RotateCcw size={14} /> Yêu cầu đổi / trả</button>}</div>}
          {requestForm?.orderId === order.id && <form onSubmit={submitRequest} className="mx-5 mb-5 rounded-2xl border border-beige p-4 md:mx-7"><label className="text-sm font-medium">Lý do {requestLabels[requestForm.type].toLowerCase()}<textarea required minLength={10} maxLength={1000} rows="3" value={requestForm.reason} onChange={(event) => setRequestForm({ ...requestForm, reason: event.target.value })} className="mt-2 w-full rounded-xl border border-beige px-3 py-2 outline-none" placeholder="Mô tả rõ vấn đề" /></label><div className="mt-3 flex gap-2"><button disabled={busyId === order.id} className="rounded-full bg-dark px-5 py-2 text-sm text-white">Gửi yêu cầu</button><button type="button" onClick={() => setRequestForm(null)} className="rounded-full border border-beige px-5 py-2 text-sm">Đóng</button></div></form>}
        </div>}
      </article>
    })}</div>
  </main><Footer /></div>
}
