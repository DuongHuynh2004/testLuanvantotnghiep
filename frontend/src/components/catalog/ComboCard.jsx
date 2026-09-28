import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/currency'

/** Thẻ combo dùng chung cho trang chủ và trang chọn combo. */
export default function ComboCard({ combo, interactive = false, onAdd, adding = false }) {
  const [added, setAdded] = useState(false)
  const unavailable = combo.products.some((product) => !product.variants.some((variant) => variant.stock_quantity > 0))
  const savings = Number(combo.discount || combo.original_price - combo.price)

  /** Thêm combo vào giỏ để khách chọn size cho từng món tại bước giỏ hàng. */
  async function addToCart() {
    if (unavailable || adding) return
    try {
      await onAdd(combo.id)
      setAdded(true)
    } catch {
      setAdded(false)
    }
  }

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-beige bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden bg-mint/20">
        <img src={combo.image} alt={combo.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3"><span className="rounded-full bg-dark px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">Giảm {combo.discount_percent}%</span><span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-dark backdrop-blur">Tiết kiệm {formatCurrency(savings)}</span></div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-pastel-green">SUNÉA Summer Combo</p>
        <h3 className="font-display mt-2 text-3xl">{combo.name}</h3>
        <p className="mt-2 text-sm leading-6 text-gray">{combo.products.map((product) => product.name).join(' + ')}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><strong className="text-xl">{formatCurrency(combo.price)}</strong><span className="ml-2 text-sm text-gray line-through">{formatCurrency(combo.original_price)}</span></div><span className="text-xs text-gray">{combo.products.length} món / combo</span></div>

        {interactive ? (
          <div className="mt-5 border-t border-beige pt-5">
            <button type="button" disabled={unavailable || adding} onClick={addToCart} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-dark/90 disabled:opacity-40">{added ? <><Check size={16} /> Đã thêm vào giỏ</> : adding ? 'Đang thêm...' : unavailable ? 'Combo tạm hết hàng' : <>Thêm combo vào giỏ <ArrowRight size={16} /></>}</button>
          </div>
        ) : (
          <Link to="/summer-collection" className="mt-5 inline-flex items-center gap-2 text-sm font-medium">Xem combo <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
        )}
      </div>
    </article>
  )
}
