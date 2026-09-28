import { Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAdminCustomers } from '../../services/adminService'
import { formatCurrency } from '../../utils/currency'

/** Tra cứu hồ sơ khách hàng, số đơn và tổng chi tiêu đã hoàn tất. */
export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')

  /** Tải khách hàng theo tên, email hoặc số điện thoại. */
  async function loadCustomers(term = search) {
    setError('')
    try { const response = await getAdminCustomers({ search: term, per_page: 100 }); setCustomers(response.data.data.data || []) }
    catch { setError('Không thể tải danh sách khách hàng.') }
  }
  useEffect(() => {
    getAdminCustomers({ per_page: 100 })
      .then((response) => setCustomers(response.data.data.data || []))
      .catch(() => setError('Không thể tải danh sách khách hàng.'))
  }, [])

  return <main className="p-5 md:p-8"><div><p className="text-sm text-gray">Thông tin người mua</p><h1 className="font-display mt-1 text-4xl">Khách hàng</h1></div><form onSubmit={(event) => { event.preventDefault(); loadCustomers(search) }} className="mt-6 flex gap-3 rounded-3xl bg-white p-4 shadow-sm"><input aria-label="Tìm khách hàng" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, email hoặc số điện thoại" className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#32665c]" /><button className="flex items-center gap-2 rounded-xl bg-[#1d2926] px-5 text-sm text-white"><Search size={16} />Tìm</button></form>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f7f8f5] text-xs uppercase tracking-wide text-gray"><tr><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4 text-center">Số đơn</th><th className="px-5 py-4 text-right">Đã chi tiêu</th><th className="px-5 py-4">Ngày tham gia</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-black/5"><td className="px-5 py-4 font-medium">{customer.name}</td><td className="px-5 py-4"><p>{customer.email}</p><p className="mt-1 text-xs text-gray">{customer.phone || 'Chưa cập nhật SĐT'}</p></td><td className="px-5 py-4 text-center">{customer.orders_count}</td><td className="px-5 py-4 text-right font-medium">{formatCurrency(Number(customer.completed_spend || 0))}</td><td className="px-5 py-4 text-gray">{new Date(customer.created_at).toLocaleDateString('vi-VN')}</td></tr>)}</tbody></table></div>{customers.length === 0 && <div className="py-16 text-center text-sm text-gray"><Users className="mx-auto mb-3" />Không tìm thấy khách hàng.</div>}</section>
  </main>
}
