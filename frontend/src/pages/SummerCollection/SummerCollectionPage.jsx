import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ComboCard from '../../components/catalog/ComboCard'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { getCombos } from '../../services/comboService'

/** Hiển thị bộ sưu tập combo hè; size của từng món được chọn sau trong giỏ hàng. */
export default function SummerCollectionPage() {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [error, setError] = useState('')
  const { isAuthenticated } = useAuth()
  const { addCombo } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    getCombos().then((response) => {
      if (!cancelled) setCombos(response.data?.data || [])
    }).catch(() => {
      if (!cancelled) setError('Không tải được bộ sưu tập combo.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  /** Yêu cầu đăng nhập hoặc thêm combo đã chọn vào giỏ. */
  async function handleAdd(comboId) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setAddingId(comboId)
    setError('')
    try {
      await addCombo(comboId)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể thêm combo vào giỏ hàng.')
      throw requestError
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="min-h-svh bg-off-white text-dark">
      <Header />
      <main>
        <section className="border-b border-beige bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1fr_0.7fr] md:items-end md:py-20"><div><p className="text-xs font-medium uppercase tracking-[0.25em] text-pastel-green">Summer collection 2026</p><h1 className="font-display mt-4 text-5xl leading-none sm:text-7xl">Combo mùa hè</h1></div><div className="max-w-md"><p className="leading-7 text-gray">Chọn combo yêu thích, sau đó chọn size riêng cho từng món trong giỏ hàng. Giá combo đã trừ ưu đãi, không cần nhập mã.</p><p className="mt-3 text-sm font-medium text-dark">Mua đủ bộ, mặc trọn mùa.</p></div></div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          {error && <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {loading ? <div className="grid gap-6 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-[2rem] bg-beige" />)}</div> : <div className="grid gap-6 md:grid-cols-3">{combos.map((combo) => <ComboCard key={combo.id} combo={combo} interactive onAdd={handleAdd} adding={addingId === combo.id} />)}</div>}
        </section>
      </main>
      <Footer />
    </div>
  )
}
