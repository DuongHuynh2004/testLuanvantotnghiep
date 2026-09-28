import { formatCurrency } from '../../utils/currency'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import PromotionBadge from '../../components/common/PromotionBadge'
import { getProduct } from '../../services/catalogService'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { removeWishlist, saveWishlist } from '../../services/wishlistService'

const sizes = ['S', 'M', 'L', 'XL']

/** Khởi tạo lại trạng thái chi tiết khi người dùng chuyển sang slug sản phẩm khác. */
export default function ProductDetailPage() {
  const { slug } = useParams()
  return <ProductDetail key={slug} slug={slug} />
}

/** Tải sản phẩm và quản lý ảnh, biến thể, giỏ hàng, mua ngay cùng phần đánh giá đã đăng. */
function ProductDetail({ slug }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [sizeName, setSizeName] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProduct(slug).then((response) => {
      if (cancelled) return
      const data = response.data?.data
      if (!data) throw new Error('Không tìm thấy sản phẩm.')
      setProduct(data)
      const allowed = (data.variants || []).filter((item) => sizes.includes(item.size?.name))
      const initial = allowed.find((item) => item.in_stock) || allowed[0]
      setSizeName(initial?.size.name || '')
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.response?.data?.message || 'Không tải được sản phẩm. Vui lòng thử lại.')
    })
    return () => { cancelled = true }
  }, [slug])

  if (error || !product) return <div className="min-h-svh bg-off-white"><Header /><main className="mx-auto max-w-6xl px-5 py-24 text-center"><p role={error ? 'alert' : 'status'}>{error || 'Đang tải sản phẩm...'}</p><Link to="/products" className="mt-6 inline-block underline">Về danh sách sản phẩm</Link></main><Footer /></div>

  const variants = (product.variants || []).filter((item) => sizes.includes(item.size?.name))
  const variant = variants.find((item) => item.size.name === sizeName)
  const images = product.images || []
  const activeImage = images[imageIndex]
  const price = Number(variant?.price ?? product.price)
  const originalPrice = Number(product.base_price)
  const available = Boolean(variant?.in_stock && variant.stock_quantity > 0)
  const maxQuantity = Math.min(variant?.stock_quantity || 0, 10)

  /** Đưa số lượng về 1 và xóa thông báo cũ khi thay đổi tùy chọn. */
  function resetSelection() {
    setQuantity(1)
    setAdded(false)
    setActionError('')
  }

  /** Chuyển đến đăng nhập nếu chưa có phiên; trả true khi đã chuyển hướng. */
  function requireLogin() {
    if (isAuthenticated) return false
    navigate('/login', { state: { from: `/products/${slug}` } })
    return true
  }

  /** Kiểm tra lựa chọn còn hàng rồi thêm vào giỏ, hiển thị kết quả hoặc lỗi API. */
  async function handleAddToCart() {
    if (!available || adding || requireLogin()) return
    setAdding(true)
    setActionError('')
    try {
      await addItem(variant.id, quantity)
      setAdded(true)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
    } finally { setAdding(false) }
  }

  /** Chuyển biến thể và số lượng đã chọn sang trang thanh toán mua ngay. */
  function handleBuyNow() {
    if (!available || adding || requireLogin()) return
    navigate('/checkout', { state: { buyNow: {
      fromSlug: slug, variant_id: variant.id, quantity, product_name: product.name,
      variant_name: variant.size.name, price,
    } } })
  }

  /** Thêm hoặc bỏ yêu thích, chặn thao tác lặp trong lúc chờ API. */
  async function toggleWishlist() {
    if (saving || requireLogin()) return
    setSaving(true)
    setActionError('')
    try {
      if (saved) await removeWishlist(product.id)
      else await saveWishlist(product.id)
      setSaved(!saved)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Không thể cập nhật yêu thích.')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-svh bg-off-white text-dark">
      <Header />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:pt-9">
        <nav aria-label="Đường dẫn" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-gray">
          <Link to="/products" className="inline-flex items-center gap-2 hover:text-dark"><ArrowLeft size={14} /> Sản phẩm</Link>
          <span>/</span><Link to={`/products?category=${product.category?.slug || ''}`} className="hover:text-dark">{product.category?.name}</Link>
          <span>/</span><span className="text-dark">{product.name}</span>
        </nav>
        <div className="grid items-start gap-8 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
          <section aria-label="Hình ảnh sản phẩm" className="min-w-0">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-[#efeee7]">
              <span className="absolute left-5 top-5 z-10 rounded-full bg-off-white/90 px-4 py-2 text-[10px] uppercase tracking-[0.2em]">SUNÉA / Unisex</span>
              {activeImage?.url ? <img src={activeImage.url} alt={`${product.name} — ảnh ${imageIndex + 1}`} className="aspect-[4/5] w-full object-cover" /> : <div className="flex aspect-[4/5] items-center justify-center text-sm text-gray">Chưa có hình ảnh</div>}
              {images.length > 1 && <div className="absolute bottom-4 right-4 rounded-full bg-off-white/90 px-3 py-1.5 text-xs">{imageIndex + 1} / {images.length}</div>}
            </div>
            {images.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {images.map((item, index) => <button key={item.id} type="button" onClick={() => setImageIndex(index)} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={imageIndex === index} className={`w-20 shrink-0 overflow-hidden rounded-xl border-2 p-1 transition ${imageIndex === index ? 'border-dark' : 'border-transparent hover:border-beige'}`}><img src={item.url} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" loading="lazy" /></button>)}
            </div>}
            <p className="mt-4 text-xs leading-5 text-gray">Tự do phối đồ. Tự tin là chính mình.</p>
          </section>
          <section className="lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gray">Thời trang unisex · {product.category?.name}</p>
              <button type="button" onClick={toggleWishlist} disabled={saving} aria-label={saved ? 'Bỏ yêu thích' : 'Yêu thích sản phẩm'} aria-pressed={saved} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-beige bg-white transition hover:border-dark disabled:opacity-50"><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
            </div>
            <h1 className="font-display mt-3 text-4xl leading-[1.08] sm:text-5xl lg:text-[3.4rem]">{product.name}</h1>
            <PromotionBadge promotion={product.promotion} />
            {product.promotion?.ends_at && <p className="mt-2 text-xs text-gray">Ưu đãi đến {new Date(product.promotion.ends_at).toLocaleString('vi-VN')}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-medium">{formatCurrency(price)}</p>
              {originalPrice > price && <><span className="text-sm text-gray line-through">{formatCurrency(originalPrice)}</span><span className="rounded-full bg-soft-yellow/40 px-2.5 py-1 text-xs">−{Math.round((1 - price / originalPrice) * 100)}%</span></>}
            </div>
            <p className="mt-5 text-sm leading-7 text-gray">{product.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-mint/50 px-3 py-2">{product.material || 'Phong cách thường ngày'}</span><span className="rounded-full border border-beige px-3 py-2">Dành cho mọi phong cách</span></div>

            <fieldset className="mt-7 border-t border-beige pt-5">
              <legend className="text-sm">Kích cỡ <span className="ml-2 text-gray">{sizeName}</span></legend>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sizes.map((size) => {
                  const item = variants.find((entry) => entry.size.name === size)
                  return <button key={size} type="button" disabled={!item?.in_stock} aria-pressed={sizeName === size} aria-label={`Size ${size}${item?.in_stock ? '' : ' — hết hàng'}`} onClick={() => { setSizeName(size); resetSelection() }} className={`rounded-xl border py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${sizeName === size ? 'border-dark bg-dark text-white' : 'border-beige bg-white hover:border-dark'} ${!item?.in_stock ? 'line-through' : ''}`}>{size}</button>
                })}
              </div>
              <p className={`mt-3 text-xs ${available ? 'text-pastel-green' : 'text-gray'}`} role="status">{available ? `Còn ${variant.stock_quantity} sản phẩm · Size ${variant.size.name}` : 'Size này hiện hết hàng. Hãy thử size khác.'}</p>
            </fieldset>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">Số lượng</span>
              <div className="flex items-center rounded-full border border-beige bg-white">
                <button type="button" onClick={() => { setQuantity(quantity - 1); setAdded(false) }} disabled={!available || quantity <= 1 || adding} aria-label="Giảm số lượng" className="p-3 disabled:opacity-30"><Minus size={15} /></button>
                <output aria-label="Số lượng đã chọn" className="min-w-8 text-center text-sm">{quantity}</output>
                <button type="button" onClick={() => { setQuantity(quantity + 1); setAdded(false) }} disabled={!available || quantity >= maxQuantity || adding} aria-label="Tăng số lượng" className="p-3 disabled:opacity-30"><Plus size={15} /></button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleAddToCart} disabled={adding || !available} className="inline-flex items-center justify-center gap-2 rounded-full border border-dark px-4 py-4 text-sm transition hover:bg-white disabled:opacity-40"><ShoppingBag size={16} />{adding ? 'Đang thêm...' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}</button>
              <button type="button" onClick={handleBuyNow} disabled={adding || !available} className="inline-flex items-center justify-center gap-3 rounded-full bg-dark px-4 py-4 text-sm text-white transition hover:bg-dark/90 disabled:opacity-40">Mua ngay <ArrowRight size={16} /></button>
            </div>
            {actionError && <p role="alert" className="mt-3 text-sm text-red-600">{actionError}</p>}
            {added && <p role="status" className="sr-only">Đã thêm sản phẩm vào giỏ hàng.</p>}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-beige pt-5 text-xs leading-5 text-gray"><div className="flex gap-2"><Truck size={18} className="shrink-0" />Giao hàng toàn quốc</div><div className="flex gap-2"><ShieldCheck size={18} className="shrink-0" />Đổi size trong 7 ngày</div></div>
          </section>
        </div>
        <section className="mt-14 border-y border-beige py-6">
          <details><summary className="cursor-pointer text-sm font-medium">Chất liệu & thông tin sản phẩm</summary><div className="mt-4 max-w-2xl space-y-2 text-sm leading-7 text-gray"><p>{product.description}</p>{product.material && <p>Chất liệu: {product.material}.</p>}<p>Thiết kế unisex, không phân biệt nam hay nữ. Chọn kích cỡ phù hợp với bạn.</p></div></details>
        </section>
        <section className="mt-12">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray">Cảm nhận từ khách hàng</p>
            <h2 className="font-display mt-2 text-4xl">Đánh giá sản phẩm <span className="text-2xl text-gray">({product.reviews?.length || 0})</span></h2>
            {product.reviews?.length ? <div className="mt-6 space-y-4">{product.reviews.map((item) => <article key={item.id} className="border-t border-beige pt-4"><p aria-label={`${item.rating} trên 5 sao`} className="text-sm text-pastel-green">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p><p className="mt-2 text-sm leading-6 text-gray">{item.comment || 'Không có nhận xét.'}</p><p className="mt-2 text-xs text-gray">{item.author}</p></article>)}</div> : <p className="mt-5 text-sm leading-7 text-gray">Chưa có đánh giá. Chia sẻ cảm nhận của bạn sau khi nhận sản phẩm nhé.</p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
