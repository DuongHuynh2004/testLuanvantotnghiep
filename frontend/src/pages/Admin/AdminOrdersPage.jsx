import { Search, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminOrders, updateAdminOrderStatus } from '../../services/adminService'
import { formatCurrency } from '../../utils/currency'

const statuses = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' }
const paymentStatuses = { unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại', refunded: 'Đã hoàn tiền' }
const inputClass = 'rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#32665c]'

/** Quản lý tiến trình xử lý và trạng thái thanh toán của đơn hàng. */
export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const [filters, setFilters] = useState({ search: '', status: initialStatus, payment_status: '' })
  const [orders, setOrders] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  /** Lấy tối đa 100 đơn phù hợp với bộ lọc. */
  async function loadOrders(params = filters) {
    setError('')
    try {
      const response = await getAdminOrders({ ...params, per_page: 100 })
      setOrders(response.data.data.data || [])
    } catch { setError('Không thể tải danh sách đơn hàng.') }
  }

  useEffect(() => {
    getAdminOrders({ status: initialStatus, per_page: 100 })
      .then((response) => setOrders(response.data.data.data || []))
      .catch(() => setError('Không thể tải danh sách đơn hàng.'))
  }, [initialStatus])

  /** Lưu trạng thái mới rồi cập nhật đúng dòng đơn hàng. */
  async function updateOrder(order, payload) {
    setBusyId(order.id); setError(''); setMessage('')
    try {
      const response = await updateAdminOrderStatus(order.id, payload)
      setOrders((current) => current.map((item) => item.id === order.id ? response.data.data : item))
      setMessage(`Đã cập nhật đơn ${order.order_code}.`)
    } catch { setError(`Không thể cập nhật đơn ${order.order_code}.`) }
    finally { setBusyId(null) }
  }

  return <main className="p-5 md:p-8">
    <div><p className="text-sm text-gray">Vận hành bán hàng</p><h1 className="font-display mt-1 text-4xl">Đơn hàng</h1></div>
    <form onSubmit={(event) => { event.preventDefault(); loadOrders(filters) }} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px_auto]">
      <input aria-label="Tìm đơn hàng" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Mã đơn, tên hoặc số điện thoại" className={inputClass} />
      <select aria-label="Trạng thái đơn" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={inputClass}><option value="">Mọi trạng thái</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Trạng thái thanh toán" value={filters.payment_status} onChange={(event) => setFilters({ ...filters, payment_status: event.target.value })} className={inputClass}><option value="">Mọi thanh toán</option>{Object.entries(paymentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button className="flex items-center justify-center gap-2 rounded-xl bg-[#1d2926] px-5 text-sm text-white"><Search size={16} />Lọc</button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <section className="mt-6 space-y-3">
      {orders.map((order) => <article key={order.id} className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_190px_190px]">
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{order.order_code}</h2><span className="rounded-full bg-[#f1f3ef] px-2.5 py-1 text-xs">{order.items?.length || 0} sản phẩm</span></div><p className="mt-2 text-sm">{order.shipping_name} · {order.shipping_phone}</p><p className="mt-1 text-xs leading-5 text-gray">{order.shipping_address}</p></div>
          <div><p className="text-lg font-semibold">{formatCurrency(Number(order.total))}</p><p className="mt-1 text-xs text-gray">{new Date(order.created_at).toLocaleString('vi-VN')} · {order.payment_method}</p>{order.coupon_code && <p className="mt-1 text-xs text-[#32665c]">Mã: {order.coupon_code}</p>}</div>
          <label className="text-xs text-gray">Trạng thái đơn<select disabled={busyId === order.id} value={order.status} onChange={(event) => updateOrder(order, { status: event.target.value })} className={`mt-1 w-full ${inputClass}`}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs text-gray">Thanh toán<select disabled={busyId === order.id} value={order.payment_status} onChange={(event) => updateOrder(order, { payment_status: event.target.value })} className={`mt-1 w-full ${inputClass}`}>{Object.entries(paymentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <details className="mt-4 border-t border-black/5 pt-3"><summary className="cursor-pointer text-sm text-[#32665c]">Xem sản phẩm và ghi chú</summary><div className="mt-3 grid gap-2 text-sm md:grid-cols-2">{order.items?.map((item) => <div key={item.id} className="rounded-xl bg-[#f7f8f5] p-3"><p className="font-medium">{item.product_name}</p><p className="text-xs text-gray">{item.variant_name} · SL {item.quantity} · {formatCurrency(Number(item.subtotal))}</p></div>)}</div>{order.note && <p className="mt-3 text-sm text-gray">Ghi chú: {order.note}</p>}</details>
      </article>)}
      {orders.length === 0 && <div className="rounded-3xl bg-white py-16 text-center text-sm text-gray"><ShoppingBag className="mx-auto mb-3" />Không có đơn hàng phù hợp.</div>}
    </section>
  </main>
}
