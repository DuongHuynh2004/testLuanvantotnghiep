import { formatCurrency } from '../../utils/currency'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import PromotionBadge from '../../components/common/PromotionBadge'
import CouponList from '../../components/common/CouponList'
import { getCategories, getProducts } from '../../services/catalogService'


/** Hiển thị danh sách sản phẩm theo bộ lọc và phân trang trên URL. */
export default function ProductsPage({ promotionsOnly = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [requestResult, setRequestResult] = useState(null)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const featured = searchParams.get('featured') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = searchParams.get('page') || '1'
  const requestKey = JSON.stringify([search, category, featured, sort, page, promotionsOnly])
  const loading = requestResult?.key !== requestKey
  const result = loading ? null : requestResult.data
  const error = loading ? '' : requestResult.error

  useEffect(() => {
    getCategories().then((response) => setCategories(response.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    getProducts({ search: search || undefined, category: category || undefined, featured: featured || undefined, promotion: promotionsOnly ? 1 : undefined, sort, page, per_page: 12 })
      .then((response) => {
        if (!cancelled) setRequestResult({ key: requestKey, data: response.data?.data || null, error: '' })
      })
      .catch((requestError) => {
        if (!cancelled) setRequestResult({ key: requestKey, data: null, error: requestError.response?.data?.message || 'Không tải được sản phẩm.' })
      })

    return () => { cancelled = true }
  }, [search, category, featured, sort, page, promotionsOnly, requestKey])

  /** Đồng bộ bộ lọc sản phẩm vào URL và đặt lại trang khi đổi bộ lọc. */
  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const products = result?.items || []

  return (
    <div className="min-h-svh bg-off-white text-dark">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray">Catalog</p>
            <h1 className="font-display mt-2 text-5xl">{promotionsOnly ? 'Khuyến mãi' : 'Tất cả sản phẩm'}</h1>
          </div>
          <Link to="/" className="text-sm text-gray hover:text-dark">Về trang chủ</Link>
        </div>

        {promotionsOnly && <CouponList />}
        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input value={search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Tìm sản phẩm..." className="rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-dark" />
          <select value={category} onChange={(event) => updateFilter('category', event.target.value)} className="rounded-2xl border border-beige bg-white px-4 py-3">
            <option value="">Tất cả danh mục</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)} className="rounded-2xl border border-beige bg-white px-4 py-3">
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>

        {loading && <p className="py-16 text-center text-gray">Đang tải sản phẩm...</p>}
        {error && <p className="py-16 text-center text-red-500">{error}</p>}
        {!loading && !error && products.length === 0 && <p className="py-12 text-center text-gray">Chưa có sản phẩm phù hợp.</p>}
        {!loading && !error && <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.slug}`} className="group overflow-hidden rounded-3xl border border-beige bg-white">
              <div className="aspect-[4/5] bg-beige"><img src={product.primary_image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-4"><p className="text-xs uppercase tracking-wide text-gray">{product.category?.name}</p><h2 className="mt-1 font-medium">{product.name}</h2><p className="mt-3 text-sm">{formatCurrency(Number(product.price))}{product.promotion && <span className="ml-2 text-xs text-gray line-through">{formatCurrency(product.base_price)}</span>}</p><PromotionBadge promotion={product.promotion} /></div>
            </Link>
          ))}
        </div>}

        {!loading && !error && result?.pagination?.last_page > 1 && <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: result.pagination.last_page }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => updateFilter('page', String(number))} className={`h-10 w-10 rounded-full ${number === result.pagination.current_page ? 'bg-dark text-white' : 'border border-beige bg-white'}`}>{number}</button>)}
        </div>}
      </main>
      <Footer />
    </div>
  )
}
