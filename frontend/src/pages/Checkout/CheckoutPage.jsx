import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { createOrder } from '../../services/orderService'
import { getAddresses } from '../../services/addressService'
import { getCheckoutQuote, promotionError } from '../../services/promotionService'
import { formatCurrency } from '../../utils/currency'

/** Thanh toán bằng báo giá server; mã ưu đãi được kiểm tra lại khi đơn được tạo. */
export default function CheckoutPage() {
  const { user } = useAuth()
  const { cart, refresh } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const directItem = location.state?.buyNow || null
  const [form, setForm] = useState({ shipping_name: user?.name || '', shipping_phone: user?.phone || '', shipping_address: '', payment_method: 'cod', note: '' })
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('new')
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [quoteResult, setQuoteResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isDirect = Boolean(directItem)
  const itemsKey = JSON.stringify(directItem ? [{ variant_id: directItem.variant_id, quantity: directItem.quantity }] : cart.items.map((item) => ({ variant_id: item.variant.id, quantity: item.quantity, combo_group: item.combo?.group || null })))
  const requestKey = JSON.stringify([itemsKey, appliedCode, isDirect])
  const quote = quoteResult?.key === requestKey ? quoteResult.quote : null
  const quoteError = quoteResult?.key === requestKey ? quoteResult.error : ''
  const loadingQuote = quoteResult?.key !== requestKey

  useEffect(() => {
    let cancelled = false
    getAddresses().then((response) => {
      if (cancelled) return
      const savedAddresses = response.data?.data || []
      setAddresses(savedAddresses)
      const selected = savedAddresses.find((address) => address.is_default) || savedAddresses[0]
      if (selected) {
        setSelectedAddressId(String(selected.id))
        setForm((current) => ({ ...current, shipping_name: selected.receiver_name, shipping_phone: selected.phone, shipping_address: selected.full_address }))
      }
    }).finally(() => {
      if (!cancelled) setLoadingAddresses(false)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const payload = { coupon_code: appliedCode || null, ...(isDirect ? { items: JSON.parse(itemsKey) } : {}) }
    getCheckoutQuote(payload).then((response) => {
      if (!cancelled) setQuoteResult({ key: requestKey, quote: response.data.data, error: '' })
    }).catch((requestError) => {
      if (!cancelled) setQuoteResult({ key: requestKey, quote: null, error: promotionError(requestError) })
    })
    return () => { cancelled = true }
  }, [itemsKey, appliedCode, isDirect, requestKey])

  /** Cập nhật thông tin giao hàng từ trường nhập tương ứng. */
  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  /** Điền thông tin giao hàng từ địa chỉ đã lưu hoặc chuyển sang biểu mẫu địa chỉ mới. */
  function selectAddress(value) {
    setSelectedAddressId(value)
    if (value === 'new') {
      setForm((current) => ({ ...current, shipping_name: user?.name || '', shipping_phone: user?.phone || '', shipping_address: '' }))
      return
    }
    const address = addresses.find((item) => String(item.id) === value)
    if (address) setForm((current) => ({ ...current, shipping_name: address.receiver_name, shipping_phone: address.phone, shipping_address: address.full_address }))
  }

  /** Áp dụng mã sau khi chuẩn hóa; báo giá cũ không còn được dùng trong lúc kiểm tra mã mới. */
  function applyCoupon() {
    setAppliedCode(couponInput.trim().toUpperCase())
    setError('')
  }

  /** Gửi đơn từ giỏ hoặc mua ngay, không gửi giá/tiền giảm do trình duyệt tự tính. */
  async function submit(event) {
    event.preventDefault()
    if (submitting || loadingQuote || !quote) return
    setSubmitting(true)
    setError('')
    try {
      await createOrder({ ...form, coupon_code: quote.coupon_code, ...(isDirect ? { items: JSON.parse(itemsKey) } : {}) })
      // Đơn đã tạo thành công không được coi là thất bại chỉ vì tải lại giỏ gặp lỗi.
      await refresh().catch(() => {})
      navigate('/orders', { replace: true, state: { created: true } })
    } catch (requestError) {
      setError(promotionError(requestError))
    } finally { setSubmitting(false) }
  }

  if (!directItem && cart.items.length === 0) return <><Header /><main className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="font-display text-5xl">Giỏ hàng đang trống</h1><Link to="/products" className="mt-6 inline-block rounded-full bg-dark px-5 py-3 text-white">Quay lại sản phẩm</Link></main><Footer /></>

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <Link to={directItem ? `/products/${directItem.fromSlug}` : '/cart'} className="text-sm text-gray hover:text-dark">← Quay lại {directItem ? 'sản phẩm' : 'giỏ hàng'}</Link>
    <h1 className="font-display mt-3 text-5xl">Thanh toán</h1>
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4 rounded-[2rem] border border-beige bg-white p-6 md:p-8">
        <h2 className="font-display text-3xl">Thông tin nhận hàng</h2>
        {loadingAddresses ? <div className="h-24 animate-pulse rounded-2xl bg-beige" /> : addresses.length > 0 && <div><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">Địa chỉ đã lưu</p><Link to="/addresses" className="text-xs text-gray underline hover:text-dark">Quản lý địa chỉ</Link></div><div className="mt-3 grid gap-3">{addresses.map((address) => <label key={address.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${selectedAddressId === String(address.id) ? 'border-dark bg-mint/15' : 'border-beige hover:border-dark/40'}`}><input type="radio" name="saved_address" value={address.id} checked={selectedAddressId === String(address.id)} onChange={(event) => selectAddress(event.target.value)} className="mt-1 accent-[#26312e]" /><span className="min-w-0"><span className="flex flex-wrap items-center gap-2 text-sm font-medium">{address.receiver_name} · {address.phone}{address.is_default && <span className="rounded-full bg-mint/50 px-2 py-0.5 text-[10px] uppercase tracking-wide">Mặc định</span>}</span><span className="mt-1 block text-sm leading-6 text-gray">{address.full_address}</span></span></label>)}<label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition ${selectedAddressId === 'new' ? 'border-dark bg-mint/15' : 'border-beige hover:border-dark/40'}`}><input type="radio" name="saved_address" value="new" checked={selectedAddressId === 'new'} onChange={(event) => selectAddress(event.target.value)} className="accent-[#26312e]" />Giao đến địa chỉ khác</label></div></div>}
        {(addresses.length === 0 || selectedAddressId === 'new') && <div className="space-y-4 border-t border-beige pt-5"><div><h3 className="font-medium">Địa chỉ giao hàng mới</h3><p className="mt-1 text-xs text-gray">Địa chỉ này chỉ dùng cho đơn hàng hiện tại. Bạn có thể lưu địa chỉ tại trang quản lý địa chỉ.</p></div>{[['shipping_name', 'Họ tên người nhận', 'text'], ['shipping_phone', 'Số điện thoại', 'tel'], ['shipping_address', 'Địa chỉ nhận hàng', 'text']].map(([name, label, type]) => <label key={name} className="block text-sm"><span className="text-gray">{label}</span><input required name={name} type={type} value={form[name]} onChange={updateField} className="mt-2 w-full rounded-2xl border border-beige px-4 py-3 outline-none focus:border-dark" /></label>)}</div>}
        <label className="block text-sm"><span className="text-gray">Phương thức thanh toán</span><select name="payment_method" value={form.payment_method} onChange={updateField} className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3"><option value="cod">Thanh toán khi nhận hàng</option><option value="bank_transfer">Chuyển khoản ngân hàng</option></select></label>
        <label className="block text-sm"><span className="text-gray">Ghi chú</span><textarea name="note" value={form.note} onChange={updateField} rows="3" className="mt-2 w-full rounded-2xl border border-beige px-4 py-3" /></label>
      </section>
      <aside className="h-fit rounded-[2rem] border border-beige bg-white p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-3xl">Đơn hàng của bạn</h2>
        <div className="mt-5 rounded-2xl bg-mint/20 p-4">
          <label htmlFor="coupon-code" className="text-sm font-medium">Mã giảm giá</label>
          <div className="mt-2 flex gap-2"><input id="coupon-code" maxLength={40} value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (!loadingQuote && !submitting) applyCoupon() } }} placeholder="Nhập mã ưu đãi" className="min-w-0 flex-1 rounded-xl border border-beige bg-white px-3 py-2 text-sm" /><button type="button" onClick={applyCoupon} disabled={loadingQuote || submitting || !couponInput.trim()} className="rounded-xl bg-dark px-3 py-2 text-xs text-white disabled:opacity-40">Áp dụng</button></div>
          {appliedCode && <button type="button" disabled={submitting} onClick={() => { setAppliedCode(''); setCouponInput(''); setError('') }} className="mt-2 text-xs underline">Bỏ mã {appliedCode}</button>}
          <Link to="/promotions" className="mt-3 block text-xs text-gray underline">Xem mã và điều kiện sử dụng</Link>
        </div>
        {loadingQuote && <p role="status" className="py-6 text-sm">Đang kiểm tra giá và ưu đãi...</p>}
        {quoteError && <p role="alert" className="mt-4 text-sm text-red-600">{quoteError}</p>}
        {quote && <>
          <div className="mt-6 space-y-4 border-b border-beige pb-5 text-sm">{quote.items.map((item) => <div key={`${item.variant_id}-${item.combo_group || 'single'}`} className="flex justify-between gap-4"><span className="max-w-[65%] text-gray">{item.product_name}{item.combo_name && <span className="block text-xs font-medium text-pastel-green">{item.combo_name}</span>}<span className="block text-xs">{item.variant_name} · SL {item.quantity}</span></span><span>{formatCurrency(item.subtotal)}</span></div>)}</div>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Tạm tính</dt><dd>{formatCurrency(quote.subtotal)}</dd></div><div className="flex justify-between"><dt>Vận chuyển</dt><dd>{formatCurrency(quote.shipping_fee)}</dd></div>{Number(quote.combo_discount) > 0 && <div className="flex justify-between gap-2 text-pastel-green"><dt>Ưu đãi combo</dt><dd>−{formatCurrency(quote.combo_discount)}</dd></div>}{quote.coupon_code && <div className="flex justify-between gap-2 text-pastel-green"><dt>Mã {quote.coupon_code}</dt><dd>−{formatCurrency(quote.coupon_discount)}</dd></div>}<div className="flex justify-between border-t border-beige pt-4 text-lg font-medium"><dt>Tổng cộng</dt><dd>{formatCurrency(quote.total)}</dd></div></dl>
          {quote.coupon_code && <p role="status" className="mt-3 text-xs text-pastel-green">Đã áp dụng mã giảm giá.</p>}
        </>}
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <button disabled={submitting || loadingQuote || !quote} className="mt-6 w-full rounded-full bg-dark px-5 py-4 text-sm font-medium text-white disabled:opacity-40">{submitting ? 'Đang tạo đơn...' : 'Đặt hàng'}</button>
      </aside>
    </form>
  </main><Footer /></div>
}
