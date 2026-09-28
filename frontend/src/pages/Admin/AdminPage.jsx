import { AlertTriangle, ArrowRight, BadgeDollarSign, Boxes, MessageSquareText, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboard, getAdminOrders } from '../../services/adminService'
import { formatCurrency } from '../../utils/currency'

const orderStatus = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' }

/** Hiển thị các chỉ số vận hành và công việc cần xử lý của cửa hàng. */
export default function AdminPage() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminDashboard(), getAdminOrders({ per_page: 5 })])
      .then(([dashboardResponse, ordersResponse]) => {
        setSummary(dashboardResponse.data.data)
        setOrders(ordersResponse.data.data.data || [])
      })
      .catch(() => setError('Không thể tải dữ liệu quản trị. Vui lòng thử lại.'))
  }, [])

  if (error) return <main className="p-5 md:p-8"><p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p></main>
  if (!summary) return <main className="p-8 text-sm text-gray">Đang tải tổng quan...</main>

  const stats = [
    ['Doanh thu hoàn tất', formatCurrency(Number(summary.revenue)), BadgeDollarSign],
    ['Tổng giá trị đơn', formatCurrency(Number(summary.order_value)), ShoppingBag],
    ['Sản phẩm đang bán', summary.active_products, Boxes],
    ['Khách hàng', summary.customers, Users],
  ]
  const tasks = [
    { to: '/admin/orders?status=pending', label: 'Đơn chờ xác nhận', value: summary.pending_orders, icon: ShoppingBag, tone: 'bg-amber-50 text-amber-700' },
    { to: '/admin/products', label: 'Biến thể sắp hết hàng', value: summary.low_stock_variants, icon: AlertTriangle, tone: 'bg-orange-50 text-orange-700' },
    { to: '/admin/products', label: 'Biến thể hết hàng', value: summary.out_of_stock_variants, icon: Boxes, tone: 'bg-red-50 text-red-700' },
    { to: '/admin/reviews', label: 'Đánh giá đã đăng', value: summary.reviews, icon: MessageSquareText, tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return <main className="p-5 md:p-8">
    <div><p className="text-sm text-gray">Trung tâm vận hành</p><h1 className="font-display mt-1 text-4xl md:text-5xl">Tổng quan cửa hàng</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray">Theo dõi doanh thu, đơn hàng, tồn kho và nội dung khách hàng từ một nơi.</p></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <article key={label} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-gray">{label}</p><span className="rounded-xl bg-mint/30 p-2 text-[#32665c]"><Icon size={18} /></span></div><p className="mt-4 text-2xl font-semibold">{value}</p></article>)}</section>
    <section className="mt-7"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Việc cần xử lý</h2><span className="text-xs text-gray">Cập nhật theo dữ liệu hiện tại</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tasks.map(({ to, label, value, icon: Icon, tone }) => <Link key={label} to={to} className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={`inline-flex rounded-xl p-2 ${tone}`}><Icon size={18} /></span><p className="mt-4 text-3xl font-semibold">{value}</p><div className="mt-2 flex items-center justify-between text-sm text-gray"><span>{label}</span><ArrowRight size={16} className="transition group-hover:translate-x-1" /></div></Link>)}</div></section>
    <section className="mt-7 rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Đơn hàng gần đây</h2><p className="mt-1 text-sm text-gray">Năm đơn mới nhất trên hệ thống.</p></div><Link to="/admin/orders" className="text-sm font-medium text-[#32665c]">Xem tất cả →</Link></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray"><tr><th className="pb-3">Mã đơn</th><th className="pb-3">Khách nhận</th><th className="pb-3">Ngày tạo</th><th className="pb-3">Trạng thái</th><th className="pb-3 text-right">Tổng tiền</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-black/5 last:border-0"><td className="py-4 font-medium">{order.order_code}</td><td className="py-4">{order.shipping_name}</td><td className="py-4 text-gray">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td><td className="py-4"><span className="rounded-full bg-[#f1f3ef] px-3 py-1 text-xs">{orderStatus[order.status]}</span></td><td className="py-4 text-right font-medium">{formatCurrency(Number(order.total))}</td></tr>)}</tbody></table>{orders.length === 0 && <p className="py-8 text-center text-sm text-gray">Chưa có đơn hàng.</p>}</div></section>
  </main>
}
