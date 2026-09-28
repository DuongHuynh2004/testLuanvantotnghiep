import { ArrowRight, ArrowUpRight, Pause, Play, RefreshCw, ShieldCheck, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PromotionBadge from '../../components/common/PromotionBadge'
import ComboCard from '../../components/catalog/ComboCard'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { getProducts } from '../../services/catalogService'
import { getCombos } from '../../services/comboService'
import { formatCurrency } from '../../utils/currency'

const visualBackgrounds = [
  'linear-gradient(145deg, #edf2ef 0%, #c8d8ce 100%)',
  'linear-gradient(145deg, #f4efe7 0%, #d1dce0 100%)',
  'linear-gradient(145deg, #fbf4df 0%, #e7d09a 100%)',
  'linear-gradient(145deg, #e7eff1 0%, #adc2c7 100%)',
]

/** Hiển thị trang chủ với video chiến dịch, sản phẩm nổi bật và bộ sưu tập mùa hè. */
export default function HomePage() {
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [videoPlaying, setVideoPlaying] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const videoRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([
      getProducts({ featured: 1, per_page: 8, sort: 'newest' }),
      getCombos(),
    ])
      .then(([productResult, comboResult]) => {
        if (cancelled) return

        if (productResult.status === 'fulfilled') {
          setProducts(productResult.value.data?.data?.items || [])
        } else {
          setError(productResult.reason?.response?.data?.message || 'Không tải được sản phẩm nổi bật.')
        }

        if (comboResult.status === 'fulfilled') {
          setCombos(comboResult.value.data?.data || [])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  /** Phát hoặc tạm dừng video quảng bá mà không làm thay đổi vị trí phát. */
  function toggleVideo() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(() => setVideoPlaying(false))
    } else {
      video.pause()
    }
  }

  return (
    <div className="min-h-svh bg-off-white text-dark">
      <Header />
      <main>
        <section className="mx-auto max-w-[90rem] px-3 pb-12 pt-3 sm:px-5 sm:pb-16 sm:pt-5">
          <div className="relative overflow-hidden rounded-[1.4rem] bg-sky-blue shadow-[0_24px_70px_rgba(38,49,46,0.12)] sm:rounded-[2.25rem]">
            <video ref={videoRef} src="/videos/banner-vid.mp4" autoPlay={videoPlaying} muted loop playsInline preload="metadata" onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} className="aspect-[4/5] w-full object-cover sm:aspect-video" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark/75 via-dark/10 to-dark/20" />
            <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-8 sm:bottom-8 lg:inset-x-12 lg:bottom-12"><p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/75 sm:text-xs">Thời trang mùa hè dành cho mọi phong cách</p><h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.9] sm:text-6xl lg:text-8xl">Summer,<br />Your Way.</h1><p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">Nhẹ nhàng hơn. Tự do hơn. Và luôn là chính bạn.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/products" className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-dark transition hover:-translate-y-0.5">Mua ngay <ArrowRight size={16} /></Link><Link to="/summer-collection" className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/60 bg-dark/25 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-dark/50">Khám phá bộ sưu tập <ArrowUpRight size={16} /></Link></div></div>
            <button type="button" onClick={toggleVideo} aria-label={videoPlaying ? 'Tạm dừng video quảng bá' : 'Phát video quảng bá'} className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-dark/55 text-white backdrop-blur transition hover:scale-105 hover:bg-dark/75 sm:bottom-7 sm:right-7">
              {videoPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
          </div>

        </section>

        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex items-end justify-between gap-4"><div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Your summer favorites</p><h2 className="font-display mt-3 text-4xl sm:text-6xl">Những thiết kế đáng chú ý nhất.</h2><p className="mt-4 max-w-xl leading-7 text-gray">Dễ mặc, dễ phối và sẵn sàng đồng hành trong mọi kế hoạch mùa hè của bạn.</p></div><Link to="/products?featured=1" className="hidden items-center gap-1 rounded-full border border-dark px-5 py-2.5 text-sm transition hover:bg-dark hover:text-white sm:inline-flex">Xem tất cả <ArrowUpRight size={16} /></Link></div>
            {error && <p className="mt-9 rounded-2xl bg-beige p-4 text-sm text-gray">{error}</p>}
            {!error && <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">{loading ? Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-beige" />) : products.slice(0, 8).map((product, index) => <Link key={product.id} to={`/products/${product.slug}`} className="group min-w-0"><div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_12px_35px_rgba(38,49,46,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_45px_rgba(38,49,46,0.15)] sm:rounded-[1.75rem]" style={{ background: visualBackgrounds[index % visualBackgrounds.length] }}><img src={product.primary_image} alt={product.name} onError={(event) => { event.currentTarget.style.display = 'none' }} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.045]" />{product.promotion && <span className="absolute left-3 top-3 rounded-full bg-dark px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-white shadow-sm">Ưu đãi</span>}<span className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-dark opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span></div><div className="px-1"><p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-pastel-green sm:text-xs">{product.category?.name}</p><h3 className="mt-1 truncate text-base font-medium sm:text-lg">{product.name}</h3><p className="mt-2 text-sm font-semibold">{formatCurrency(Number(product.price))}{product.promotion && <span className="ml-2 text-xs font-normal text-gray line-through">{formatCurrency(product.base_price)}</span>}</p><PromotionBadge promotion={product.promotion} /></div></Link>)}</div>}
            <Link to="/products?featured=1" className="mt-9 inline-flex items-center gap-2 rounded-full border border-dark px-5 py-2.5 text-sm sm:hidden">Xem bộ sưu tập <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="overflow-hidden bg-mint">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-18">
            <div><p className="text-xs font-medium uppercase tracking-[0.26em] text-dark/55">Fresh. Minimal. Comfortable. Expressive.</p><h2 className="font-display mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">Đẹp theo cách riêng.<br />Thoải mái theo cách bạn muốn.</h2><p className="mt-5 max-w-2xl leading-7 text-dark/65">SUNÉA tạo nên một tủ đồ trẻ trung, dễ phối và phù hợp với nhịp sống hiện đại — từ ngày thường trong thành phố đến những chuyến đi bất chợt.</p></div>
            <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-dark/10 sm:grid-cols-3 lg:grid-cols-1"><div className="bg-white/55 p-5 backdrop-blur"><strong className="text-sm">Tự do</strong><p className="mt-1 text-xs leading-5 text-dark/60">Không có một công thức duy nhất cho phong cách.</p></div><div className="bg-white/55 p-5 backdrop-blur"><strong className="text-sm">Thoải mái</strong><p className="mt-1 text-xs leading-5 text-dark/60">Phom dáng dễ mặc cho mọi chuyển động.</p></div><Link to="/about" className="group flex items-center justify-between bg-dark p-5 text-sm font-medium text-white">Câu chuyện SUNÉA <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Summer collection 2026</p><h2 className="font-display mt-3 text-4xl sm:text-5xl">Phối sẵn một bộ,<br className="hidden sm:block" /> tiết kiệm ngay.</h2><p className="mt-4 leading-7 text-gray">Chọn size riêng cho từng món. Giá ưu đãi được tự động tính từ giá bán hiện tại, minh bạch ngay trong giỏ hàng.</p></div><Link to="/summer-collection" className="inline-flex items-center gap-2 rounded-full border border-dark px-5 py-2.5 text-sm transition hover:bg-dark hover:text-white">Xem bộ sưu tập hè <ArrowRight size={15} /></Link></div>
          <div className="grid gap-6 md:grid-cols-3">{loading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-[2rem] bg-beige" />) : combos.map((combo) => <ComboCard key={combo.id} combo={combo} />)}</div>
        </section>

        <section className="border-y border-beige bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3">
            <div className="flex gap-4"><Truck className="mt-1 shrink-0 text-pastel-green" size={23} strokeWidth={1.6} /><div><strong className="text-sm">Giao hàng toàn quốc</strong><p className="mt-1 text-sm leading-6 text-gray">Đóng gói cẩn thận, cập nhật trạng thái rõ ràng.</p></div></div>
            <div className="flex gap-4"><RefreshCw className="mt-1 shrink-0 text-pastel-green" size={22} strokeWidth={1.6} /><div><strong className="text-sm">Đổi trả trong 7 ngày</strong><p className="mt-1 text-sm leading-6 text-gray">Hỗ trợ đổi trả đơn giản khi sản phẩm chưa phù hợp.</p></div></div>
            <div className="flex gap-4"><ShieldCheck className="mt-1 shrink-0 text-pastel-green" size={23} strokeWidth={1.6} /><div><strong className="text-sm">Mua sắm an tâm</strong><p className="mt-1 text-sm leading-6 text-gray">Thông tin sản phẩm và đơn hàng luôn minh bạch.</p></div></div>
          </div>
        </section>

        <section className="bg-dark text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-16 md:flex-row md:items-center md:justify-between">
            <div><p className="text-xs font-medium uppercase tracking-[0.24em] text-white/55">Made for your summer</p><h2 className="font-display mt-3 max-w-2xl text-4xl sm:text-5xl">Thoải mái để chuyển động. Đủ khác biệt để là chính bạn.</h2></div>
            <Link to="/products" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-dark transition hover:-translate-y-0.5">Bắt đầu mua sắm <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
