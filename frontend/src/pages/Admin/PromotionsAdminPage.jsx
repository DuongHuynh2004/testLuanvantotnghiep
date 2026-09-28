import { useEffect, useState } from 'react'
import { deleteCoupon, getAdminPromotions, promotionError, saveCoupon, updateProductPromotion } from '../../services/promotionService'
import { formatCurrency } from '../../utils/currency'

const inputClass = 'mt-1 w-full rounded-xl border border-beige bg-white px-3 py-2 text-sm'
const emptyCoupon = { code: '', name: '', discount_type: 'percent', discount_value: '', minimum_order: 0, maximum_discount: '', starts_at: '', ends_at: '', usage_limit: '', per_user_limit: '', is_active: true }

/** Đổi mốc ISO của server thành thời gian địa phương dùng cho datetime-local. */
function localDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** Kiểm tra trạng thái thời hạn để quản trị biết ưu đãi đang chạy hay chỉ được cấu hình. */
function promotionStatus(product) {
  if (product.sale_price === null) return 'Chưa gắn ưu đãi'
  if (product.promotion_starts_at && new Date(product.promotion_starts_at) > new Date()) return 'Sắp bắt đầu'
  if (product.promotion_ends_at && new Date(product.promotion_ends_at) <= new Date()) return 'Đã hết hạn'
  return 'Đang ưu đãi'
}

/** Quản lý khuyến mãi sản phẩm và mã giảm giá; quyền thực tế được kiểm tra lại ở API. */
export default function PromotionsAdminPage() {
  const [data, setData] = useState(null)
  const [productForm, setProductForm] = useState(null)
  const [couponForm, setCouponForm] = useState(emptyCoupon)
  const [couponId, setCouponId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    getAdminPromotions().then((response) => { if (!cancelled) setData(response.data.data) })
      .catch((requestError) => { if (!cancelled) setError(promotionError(requestError)) })
    return () => { cancelled = true }
  }, [])

  /** Nạp giá và thời hạn của sản phẩm vào biểu mẫu, không thay đổi database. */
  function chooseProduct(product) {
    setProductForm(product ? { ...product, sale_price: product.sale_price ?? '', promotion_name: product.promotion_name || '', promotion_starts_at: localDate(product.promotion_starts_at), promotion_ends_at: localDate(product.promotion_ends_at) } : null)
    setError('')
    setMessage('')
  }

  /** Lưu hoặc gỡ ưu đãi và cập nhật danh sách từ phản hồi server. */
  async function submitProduct(event, remove = false) {
    event.preventDefault()
    if (busy || !productForm) return
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await updateProductPromotion(productForm.id, remove ? { sale_price: null } : {
        sale_price: Number(productForm.sale_price), promotion_name: productForm.promotion_name || null,
        promotion_starts_at: productForm.promotion_starts_at ? new Date(productForm.promotion_starts_at).toISOString() : null,
        promotion_ends_at: productForm.promotion_ends_at ? new Date(productForm.promotion_ends_at).toISOString() : null,
      })
      const updated = response.data.data
      setData((current) => ({ ...current, products: current.products.map((product) => product.id === updated.id ? updated : product) }))
      chooseProduct(updated)
      setMessage(remove ? 'Đã gỡ ưu đãi sản phẩm.' : 'Đã lưu ưu đãi sản phẩm.')
    } catch (requestError) { setError(promotionError(requestError)) }
    finally { setBusy(false) }
  }

  /** Nạp cấu hình mã để chỉnh sửa; số lượt đã dùng không bị đặt lại. */
  function editCoupon(coupon) {
    setCouponId(coupon.id)
    setCouponForm({ ...coupon, maximum_discount: coupon.maximum_discount ?? '', starts_at: localDate(coupon.starts_at), ends_at: localDate(coupon.ends_at), usage_limit: coupon.usage_limit ?? '', per_user_limit: coupon.per_user_limit ?? '' })
    setMessage(''); setError('')
    document.getElementById('coupon-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /** Chuẩn hóa dữ liệu số/ngày trước khi tạo hoặc cập nhật mã. */
  async function submitCoupon(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = {
        code: couponForm.code, name: couponForm.name, discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value), minimum_order: Number(couponForm.minimum_order),
        maximum_discount: couponForm.maximum_discount === '' ? null : Number(couponForm.maximum_discount),
        usage_limit: couponForm.usage_limit === '' ? null : Number(couponForm.usage_limit),
        per_user_limit: couponForm.per_user_limit === '' ? null : Number(couponForm.per_user_limit),
        starts_at: couponForm.starts_at ? new Date(couponForm.starts_at).toISOString() : null,
        ends_at: couponForm.ends_at ? new Date(couponForm.ends_at).toISOString() : null,
        is_active: couponForm.is_active,
      }
      const response = await saveCoupon(couponId, payload)
      setData((current) => ({ ...current, coupons: couponId ? current.coupons.map((coupon) => coupon.id === couponId ? response.data.data : coupon) : [response.data.data, ...current.coupons] }))
      setCouponId(null); setCouponForm(emptyCoupon); setMessage('Đã lưu mã giảm giá.')
    } catch (requestError) { setError(promotionError(requestError)) }
    finally { setBusy(false) }
  }

  /** Xóa mã chưa phát sinh đơn; mã đã dùng cần tắt để bảo toàn lịch sử. */
  async function removeCoupon(coupon) {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteCoupon(coupon.id)
      setData((current) => ({ ...current, coupons: current.coupons.filter((item) => item.id !== coupon.id) }))
      if (couponId === coupon.id) { setCouponId(null); setCouponForm(emptyCoupon) }
      setMessage(`Đã xóa mã ${coupon.code}.`)
    } catch (requestError) { setError(promotionError(requestError)) }
    finally { setBusy(false) }
  }

  return <main className="p-5 md:p-8">
    <div><p className="text-sm text-gray">Chiến dịch bán hàng</p><h1 className="font-display mt-1 text-4xl">Khuyến mãi</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray">Điều chỉnh giá sản phẩm hoặc tạo mã giảm giá cho giỏ hàng. Trạng thái và thời hạn được hiển thị ngay trong danh sách.</p></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-5 rounded-xl bg-mint/40 p-4 text-sm">{message}</p>}
    {!data && !error && <p className="py-12">Đang tải cấu hình...</p>}
    {data && <>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-beige bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-3xl">Ưu đãi sản phẩm</h2><p className="mt-2 text-sm text-gray">Chọn sản phẩm để đặt giá giảm, tên chương trình và thời gian áp dụng.</p></div><span className="rounded-full bg-mint/50 px-3 py-1.5 text-xs">{data.products.filter((product) => product.sale_price !== null).length} đang cấu hình</span></div><div className="mt-5 max-h-[480px] overflow-y-auto">{data.products.map((product) => <div key={product.id} className="flex items-center justify-between gap-4 border-t border-beige py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{product.name}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray"><span>{promotionStatus(product)}</span><span>·</span><span>Giá gốc {formatCurrency(product.base_price)}</span>{product.sale_price !== null && <><span>·</span><span className="font-medium text-dark">{formatCurrency(product.sale_price)}</span></>}</div></div><button type="button" disabled={busy} onClick={() => chooseProduct(product)} className="shrink-0 rounded-xl border border-beige px-3 py-2 text-xs transition hover:border-dark disabled:opacity-40">Chỉnh sửa</button></div>)}</div></div>
        <form onSubmit={submitProduct} className="h-fit rounded-3xl border border-beige bg-white p-6 lg:sticky lg:top-20"><h2 className="text-lg font-medium">Cấu hình sản phẩm</h2><p className="mt-1 text-sm text-gray">Chọn một sản phẩm ở danh sách hoặc từ đây để bắt đầu.</p>
          <label className="mt-4 block text-sm">Sản phẩm<select aria-label="Sản phẩm áp dụng" value={productForm?.id || ''} disabled={busy} onChange={(event) => chooseProduct(data.products.find((product) => product.id === Number(event.target.value)))} className={inputClass}><option value="">Chọn sản phẩm</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          {productForm && <fieldset disabled={busy} className="mt-4 space-y-4">
            <label className="block text-sm">Tên ưu đãi<input maxLength={120} value={productForm.promotion_name} onChange={(event) => setProductForm({ ...productForm, promotion_name: event.target.value })} className={inputClass} placeholder="Ví dụ: Ưu đãi mùa hè" /></label>
            <label className="block text-sm">Giá khuyến mãi (VND)<input required type="number" min="0" max={Number(productForm.base_price) - 0.01} step="0.01" value={productForm.sale_price} onChange={(event) => setProductForm({ ...productForm, sale_price: event.target.value })} className={inputClass} /></label>
            {[['promotion_starts_at', 'Bắt đầu'], ['promotion_ends_at', 'Kết thúc']].map(([key, label]) => <label key={key} className="block text-sm">{label}<input type="datetime-local" value={productForm[key]} onChange={(event) => setProductForm({ ...productForm, [key]: event.target.value })} className={inputClass} /></label>)}
            <p className="text-xs leading-5 text-gray">Thời gian theo múi giờ trên thiết bị. Để trống nếu không giới hạn.</p>
            <button className="w-full rounded-full bg-dark px-4 py-3 text-sm text-white">{busy ? 'Đang lưu...' : 'Lưu ưu đãi'}</button>
            <button type="button" onClick={(event) => submitProduct(event, true)} className="w-full rounded-full border border-beige px-4 py-3 text-sm">Gỡ ưu đãi</button>
          </fieldset>}
        </form>
      </section>
      <section className="mt-8 rounded-3xl border border-beige bg-white p-6 md:p-8" id="coupon-editor">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-3xl">{couponId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá'}</h2>
        <p className="mt-2 text-sm leading-6 text-gray">Một mã mỗi đơn, áp dụng sau khuyến mãi sản phẩm. Lượt dùng được ghi nhận khi tạo đơn và không hoàn lại khi hủy.</p>
        </div><span className="rounded-full bg-soft-yellow/60 px-3 py-1.5 text-xs">Mã giảm giá</span></div>
        <form onSubmit={submitCoupon} className="mt-5"><fieldset disabled={busy} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">Mã<input required maxLength={40} pattern="[A-Za-z0-9_-]+" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: HE2026" className={inputClass} /></label>
          <label className="text-sm">Tên ưu đãi<input required maxLength={120} value={couponForm.name} onChange={(event) => setCouponForm({ ...couponForm, name: event.target.value })} className={inputClass} /></label>
          <label className="text-sm">Loại giảm<select value={couponForm.discount_type} onChange={(event) => setCouponForm({ ...couponForm, discount_type: event.target.value })} className={inputClass}><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền (VND)</option></select></label>
          {[['discount_value', couponForm.discount_type === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm (VND)', true], ['minimum_order', 'Đơn tối thiểu (VND)', true], ['maximum_discount', 'Giảm tối đa (VND)', false], ['usage_limit', 'Tổng lượt sử dụng', false], ['per_user_limit', 'Lượt mỗi khách', false]].map(([key, label, required]) => <label key={key} className="text-sm">{label}<input required={required} type="number" min={key === 'minimum_order' ? 0 : key.includes('limit') ? 1 : 0.01} max={key === 'discount_value' && couponForm.discount_type === 'percent' ? 100 : 999999999} step={key.includes('limit') ? 1 : 0.01} value={couponForm[key]} onChange={(event) => setCouponForm({ ...couponForm, [key]: event.target.value })} placeholder={required ? '' : 'Không giới hạn'} className={inputClass} /></label>)}
          {[['starts_at', 'Bắt đầu'], ['ends_at', 'Kết thúc']].map(([key, label]) => <label key={key} className="text-sm">{label}<input type="datetime-local" value={couponForm[key]} onChange={(event) => setCouponForm({ ...couponForm, [key]: event.target.value })} className={inputClass} /></label>)}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={couponForm.is_active} onChange={(event) => setCouponForm({ ...couponForm, is_active: event.target.checked })} /> Cho phép sử dụng mã</label>
          <div className="flex flex-wrap gap-3 md:col-span-2 lg:col-span-3"><button className="rounded-full bg-dark px-6 py-3 text-sm text-white">{busy ? 'Đang lưu...' : 'Lưu mã giảm giá'}</button>{couponId && <button type="button" onClick={() => { setCouponId(null); setCouponForm(emptyCoupon) }} className="rounded-full border border-beige px-5 py-3 text-sm">Hủy chỉnh sửa</button>}</div>
        </fieldset></form>
      </section>
      <section className="mt-8 rounded-3xl border border-beige bg-white p-6"><h2 className="font-display text-3xl">Mã đã tạo ({data.coupons.length})</h2><div className="mt-4 space-y-3">{data.coupons.map((coupon) => <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-beige pt-4"><div><p className="font-medium">{coupon.code} · {coupon.name}</p><p className="mt-1 text-xs text-gray">{coupon.is_active ? 'Đã bật' : 'Đã tắt'} · {coupon.discount_type === 'percent' ? `${Number(coupon.discount_value)}%` : formatCurrency(coupon.discount_value)} · Đã dùng {coupon.orders_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}{coupon.ends_at && ` · Hết hạn ${new Date(coupon.ends_at).toLocaleString('vi-VN')}`}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => editCoupon(coupon)} className="rounded-full border border-beige px-4 py-2 text-sm disabled:opacity-40">Sửa / bật tắt</button><button type="button" disabled={busy || coupon.orders_count > 0} title={coupon.orders_count > 0 ? 'Mã đã dùng chỉ có thể tắt' : 'Xóa mã'} onClick={() => removeCoupon(coupon)} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Xóa</button></div></div>)}{!data.coupons.length && <p className="text-sm text-gray">Chưa có mã. Tạo mã đầu tiên bằng biểu mẫu phía trên.</p>}</div></section>
    </>}
  </main>
}
