import { Link } from 'react-router-dom'
import { useState } from 'react'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { useCart } from '../../hooks/useCart'
import { formatCurrency } from '../../utils/currency'

/** Gom các dòng thuộc cùng một lần mua combo, không phụ thuộc size đã chọn. */
function groupItems(items) {
  return Object.values(items.reduce((groups, item) => {
    const key = item.combo
      ? `combo-${item.combo.id}-${item.combo.group || 'legacy'}`
      : `product-${item.variant.product.id}`
    if (!groups[key]) {
      groups[key] = {
        key,
        combo: item.combo,
        product: item.combo ? null : item.variant.product,
        items: [],
      }
    }
    groups[key].items.push(item)
    return groups
  }, {}))
}

/** Tính giá gốc của một nhóm trước khi áp dụng ưu đãi combo. */
function groupSubtotal(group) {
  return group.items.reduce((total, item) => total + Number(item.subtotal), 0)
}

/** Tính riêng số tiền được giảm của nhóm combo. */
function groupDiscount(group) {
  return group.combo ? groupSubtotal(group) * group.combo.discount_percent / 100 : 0
}

/** Tính thành tiền hiển thị của nhóm sau ưu đãi combo nếu có. */
function groupTotal(group) {
  return groupSubtotal(group) - groupDiscount(group)
}

/** Hiển thị một nhóm combo hoặc sản phẩm mua lẻ trong giỏ hàng. */
function CartGroup({ group, updateItem, updateItemVariant, removeItem }) {
  if (group.combo) {
    const firstItem = group.items[0]
    return (
      <article className="rounded-[2rem] border border-beige bg-white p-5">
        <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-mint/45 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]">Combo giảm {group.combo.discount_percent}%</span><h2 className="font-display mt-3 text-2xl">{group.combo.name}</h2></div><button type="button" onClick={() => removeItem(firstItem.id)} className="text-sm text-gray hover:text-red-600">Xóa combo</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{group.items.map((item) => <div key={item.id} className={`flex gap-3 rounded-2xl border p-3 ${item.size_confirmed ? 'border-transparent bg-off-white' : 'border-soft-yellow bg-soft-yellow/10'}`}><img src={item.variant.product.image} alt={item.variant.product.name} className="h-24 w-20 rounded-xl bg-beige object-cover" /><div className="min-w-0 flex-1"><Link to={`/products/${item.variant.product.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">{item.variant.product.name}</Link><label className="mt-2 block"><span className="sr-only">Chọn size {item.variant.product.name}</span><select value={item.size_confirmed ? item.variant.id : ''} onChange={(event) => updateItemVariant(item.id, Number(event.target.value))} className={`w-full rounded-xl border bg-white px-3 py-2 text-sm ${item.size_confirmed ? 'border-beige' : 'border-soft-yellow font-medium'}`}><option value="" disabled>Chọn size</option>{item.variant.available_variants.map((variant) => <option key={variant.id} value={variant.id}>Size {variant.size}</option>)}</select></label><p className="mt-2 text-sm">{formatCurrency(Number(item.variant.price))}</p></div></div>)}</div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-beige pt-4"><label className="flex items-center gap-3 text-sm text-gray">Số lượng combo <select aria-label={`Số lượng ${group.combo.name}`} value={firstItem.quantity} onChange={(event) => updateItem(firstItem.id, Number(event.target.value))} className="rounded-xl border border-beige bg-white px-3 py-2 text-dark">{Array.from({ length: Math.min(...group.items.map((item) => item.variant.stock_quantity), 10) }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label><div className="text-right"><span className="mr-2 text-xs text-gray line-through">{formatCurrency(groupSubtotal(group))}</span><strong>{formatCurrency(groupTotal(group))}</strong></div></div>
      </article>
    )
  }

  return (
    <article className="rounded-[2rem] border border-beige bg-white p-4 md:p-5">
      <div className="flex gap-4"><Link to={`/products/${group.product.slug}`} className="shrink-0"><img src={group.items[0].variant.product.image} alt={group.product.name} className="h-32 w-24 rounded-2xl bg-beige object-cover transition hover:opacity-80 md:h-40 md:w-32" /></Link><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.16em] text-gray">Sản phẩm</p><Link to={`/products/${group.product.slug}`} className="mt-1 block text-lg font-medium hover:underline">{group.product.name}</Link></div></div>
      <div className="mt-5 border-t border-beige pt-3">{group.items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-beige/70 py-3 last:border-0"><p className="text-sm font-medium">Size {item.variant.size}</p><p className="text-sm">{formatCurrency(Number(item.variant.price))}</p><div className="flex items-center gap-2"><select aria-label={`Số lượng size ${item.variant.size}`} value={item.quantity} onChange={(event) => updateItem(item.id, Number(event.target.value))} className="rounded-xl border border-beige bg-white px-2 py-2 text-sm">{Array.from({ length: Math.min(item.variant.stock_quantity, 10) }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select><button type="button" onClick={() => removeItem(item.id)} aria-label={`Xóa size ${item.variant.size}`} className="rounded-full px-2 text-lg text-gray hover:bg-red-50 hover:text-red-500">×</button></div></div>)}</div>
    </article>
  )
}

/** Hiển thị giỏ hàng, giữ các món trong combo thành một nhóm thống nhất. */
export default function CartPage() {
  const { cart, loading, updateItem, updateItemVariant, removeItem } = useCart()
  const [error, setError] = useState('')
  const groups = groupItems(cart.items)

  /** Đổi size và hiển thị lỗi tồn kho ngay tại giỏ hàng nếu API từ chối. */
  async function handleSizeChange(itemId, variantId) {
    setError('')
    try {
      await updateItemVariant(itemId, variantId)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật size đã chọn.')
    }
  }

  return <div className="min-h-svh bg-off-white text-dark">
    <Header />
    <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.2em] text-gray">Your selection</p><h1 className="font-display mt-2 text-5xl">Giỏ hàng</h1></div><Link to="/products" className="text-sm text-gray hover:text-dark">← Tiếp tục mua sắm</Link></div>
      {error && <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {loading ? <p className="py-16 text-center text-gray">Đang tải giỏ hàng...</p> : groups.length === 0 ? <div className="mt-10 rounded-[2rem] border border-beige bg-white p-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-2xl">∅</div><h2 className="font-display mt-5 text-3xl">Giỏ hàng đang trống</h2><p className="mt-2 text-sm text-gray">Những ngày hè đẹp hơn khi bắt đầu từ một lựa chọn đúng.</p><Link to="/products" className="mt-6 inline-block rounded-full bg-dark px-6 py-3 text-sm text-white">Khám phá sản phẩm</Link></div> : <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">{cart.requires_size_selection && <div className="rounded-2xl border border-soft-yellow bg-soft-yellow/15 px-5 py-4"><p className="font-medium">Chọn size để tiếp tục</p><p className="mt-1 text-sm text-gray">Vui lòng chọn size cho từng sản phẩm trong combo trước khi thanh toán.</p></div>}{groups.map((group) => <CartGroup key={group.key} group={group} updateItem={updateItem} updateItemVariant={handleSizeChange} removeItem={removeItem} />)}</div>
        <aside className="h-fit rounded-[2rem] border border-beige bg-white p-6 lg:sticky lg:top-32"><p className="text-xs uppercase tracking-[0.2em] text-gray">Order summary</p><h2 className="font-display mt-2 text-3xl">Tạm tính</h2><div className="mt-6 space-y-4 border-b border-beige pb-5 text-sm">{groups.map((group) => <div key={group.key} className="space-y-2"><div className="flex items-start justify-between gap-4"><span className="max-w-[65%] text-gray">{group.combo?.name || group.product.name}</span><span className="font-medium">{formatCurrency(groupSubtotal(group))}</span></div>{group.combo && <div className="flex items-center justify-between gap-4 pl-3 text-xs text-pastel-green"><span>Giảm combo {group.combo.discount_percent}%</span><span>−{formatCurrency(groupDiscount(group))}</span></div>}{group.combo && <div className="flex items-center justify-between gap-4 pl-3 text-sm font-medium"><span>Thành tiền combo</span><span>{formatCurrency(groupTotal(group))}</span></div>}</div>)}<div className="flex justify-between"><span className="text-gray">Vận chuyển</span><span className="text-pastel-green">Miễn phí</span></div></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Giá sản phẩm</dt><dd>{formatCurrency(Number(cart.subtotal))}</dd></div>{Number(cart.combo_discount) > 0 && <div className="flex justify-between text-pastel-green"><dt>Tổng giảm combo</dt><dd>−{formatCurrency(Number(cart.combo_discount))}</dd></div>}<div className="flex justify-between border-t border-beige pt-4 text-lg"><dt className="font-bold">Tổng cộng</dt><dd className="font-bold">{formatCurrency(Number(cart.total))}</dd></div></dl>{cart.requires_size_selection ? <div className="mt-6 rounded-full bg-beige px-5 py-3 text-center text-sm text-gray">Hãy chọn đủ size để thanh toán</div> : <Link to="/checkout" className="mt-6 block w-full rounded-full bg-dark px-5 py-3 text-center text-sm text-white transition hover:bg-dark/90">Tiến hành thanh toán</Link>}<p className="mt-4 text-center text-xs leading-5 text-gray">Đổi size trong 7 ngày · Hỗ trợ tư vấn chọn size</p></aside>
      </div>}
    </main>
    <Footer />
  </div>
}
