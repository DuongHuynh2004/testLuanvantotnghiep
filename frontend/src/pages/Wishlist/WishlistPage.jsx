import PromotionBadge from '../../components/common/PromotionBadge'
import { formatCurrency } from '../../utils/currency'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { getWishlist, removeWishlist } from '../../services/wishlistService'


/** Hiển thị sản phẩm yêu thích và cho phép bỏ lưu từng sản phẩm. */
export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWishlist().then((response) => setProducts(response.data?.data || [])).finally(() => setLoading(false))
  }, [])

  /** Bỏ yêu thích qua API rồi loại sản phẩm khỏi danh sách hiện tại. */
  async function remove(productId) {
    await removeWishlist(productId)
    setProducts((current) => current.filter((product) => product.id !== productId))
  }

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-6xl px-5 py-10"><Link to="/account" className="text-sm text-gray hover:text-dark">← Tài khoản</Link><h1 className="font-display mt-3 text-5xl">Wishlist</h1>{loading ? <p className="py-16 text-center text-gray">Đang tải...</p> : products.length === 0 ? <p className="py-16 text-center text-gray">Bạn chưa lưu sản phẩm nào.</p> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-3xl border border-beige bg-white"><Link to={`/products/${product.slug}`}><img src={product.primary_image} alt={product.name} className="aspect-[4/5] w-full bg-beige object-cover" /></Link><div className="p-4"><Link to={`/products/${product.slug}`} className="font-medium">{product.name}</Link><p className="mt-2 text-sm">{formatCurrency(Number(product.price))}{product.promotion && <span className="ml-2 text-xs text-gray line-through">{formatCurrency(product.base_price)}</span>}</p><PromotionBadge promotion={product.promotion} /><button type="button" onClick={() => remove(product.id)} className="mt-4 text-sm text-gray hover:text-red-500">Bỏ lưu</button></div></article>)}</div>}</main></div>
}