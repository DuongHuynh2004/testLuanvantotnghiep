import { Check, RefreshCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAdminOrderRequests, updateAdminOrderRequest } from '../../services/adminService'
import { formatCurrency } from '../../utils/currency'

const labels = { refund: 'Hoàn tiền', return: 'Đổi / trả hàng' }
const statuses = { pending: 'Chờ xử lý', approved: 'Đã chấp thuận', rejected: 'Đã từ chối' }

/** Cho admin lọc, đọc lý do và duyệt hoặc từ chối yêu cầu hậu mãi của khách. */
export default function AdminOrderRequestsPage() {
  const [filters, setFilters] = useState({ status: 'pending', type: '' })
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminOrderRequests(filters).then((response) => setItems(response.data.data.data || [])).catch(() => setError('Không thể tải yêu cầu hậu mãi.'))
  }, [filters])

  /** Gửi kết quả xử lý và giữ danh sách đúng với bộ lọc đang chọn. */
  async function resolve(item, status) {
    setBusyId(item.id); setError('')
    try {
      const response = await updateAdminOrderRequest(item.id, { status, admin_note: notes[item.id] || null })
      const updated = response.data.data
      setItems((current) => filters.status && filters.status !== status ? current.filter((entry) => entry.id !== item.id) : current.map((entry) => entry.id === item.id ? updated : entry))
    } catch (requestError) { setError(requestError.response?.data?.message || 'Không thể xử lý yêu cầu.') }
    finally { setBusyId(null) }
  }

  return <main className="p-5 md:p-8"><div><p className="text-sm text-gray">Chăm sóc sau bán</p><h1 className="font-display mt-1 text-4xl">Hoàn tiền & đổi trả</h1></div>
    <div className="mt-6 flex flex-wrap gap-2">{[['pending', 'Chờ xử lý'], ['approved', 'Đã duyệt'], ['rejected', 'Đã từ chối'], ['', 'Tất cả']].map(([value, label]) => <button type="button" key={label} onClick={() => setFilters({ ...filters, status: value })} className={`rounded-full px-4 py-2 text-sm ${filters.status === value ? 'bg-[#1d2926] text-white' : 'bg-white text-gray shadow-sm'}`}>{label}</button>)}<select aria-label="Loại yêu cầu" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} className="rounded-full border-0 bg-white px-4 py-2 text-sm shadow-sm"><option value="">Mọi loại</option><option value="refund">Hoàn tiền</option><option value="return">Đổi / trả hàng</option></select></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="mt-6 grid gap-4 xl:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{labels[item.type]} · {item.order?.order_code}</p><p className="mt-1 text-xs text-gray">{item.user?.name} · {item.user?.email}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">{statuses[item.status]}</span></div><p className="mt-4 rounded-2xl bg-[#f7f8f5] p-4 text-sm leading-6">{item.reason}</p><div className="mt-3 text-sm text-gray"><p>Giá trị đơn: {formatCurrency(Number(item.order?.total || 0))}</p><p>Trạng thái đơn: {item.order?.status} · Thanh toán: {item.order?.payment_status}</p></div>{item.status === 'pending' ? <><textarea rows="2" value={notes[item.id] || ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} className="mt-4 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" placeholder="Phản hồi cho khách hàng (không bắt buộc)" /><div className="mt-3 flex gap-2"><button type="button" disabled={busyId === item.id} onClick={() => resolve(item, 'approved')} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 disabled:opacity-50"><Check size={17} />Chấp thuận</button><button type="button" disabled={busyId === item.id} onClick={() => resolve(item, 'rejected')} className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 disabled:opacity-50"><X size={17} />Từ chối</button></div></> : item.admin_note && <p className="mt-4 text-sm text-[#32665c]">Phản hồi: {item.admin_note}</p>}</article>)}{items.length === 0 && <div className="rounded-3xl bg-white py-16 text-center text-sm text-gray xl:col-span-2"><RefreshCcw className="mx-auto mb-3" />Không có yêu cầu phù hợp.</div>}</section>
  </main>
}
