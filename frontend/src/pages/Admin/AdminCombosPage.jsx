import { Boxes, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createAdminCombo, deleteAdminCombo, getAdminCombos, getAdminProducts, updateAdminCombo } from '../../services/adminService'
import { formatCurrency } from '../../utils/currency'

const inputClass = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#32665c] focus:ring-2 focus:ring-[#32665c]/10'

/** Quản lý combo, mức giảm và các sản phẩm cấu thành combo. */
export default function AdminCombosPage() {
  const [combos, setCombos] = useState([])
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminCombos(), getAdminProducts({ per_page: 100 })])
      .then(([comboResponse, productResponse]) => {
        setCombos(comboResponse.data.data || [])
        setProducts(productResponse.data.data.data || [])
      })
      .catch(() => setError('Không thể tải dữ liệu combo.'))
  }, [])

  function startCreate() {
    setEditing({ id: null, name: '', image: '', discount_percent: 5, is_active: true, product_ids: [] })
    setMessage(''); setError('')
  }

  function chooseCombo(combo) {
    setEditing({
      id: combo.id,
      name: combo.name,
      image: combo.image || '',
      discount_percent: combo.discount_percent,
      is_active: combo.is_active ?? true,
      product_ids: combo.products.map((product) => product.id),
    })
    setMessage(''); setError('')
  }

  function toggleProduct(productId) {
    setEditing((current) => {
      const selected = current.product_ids.includes(productId)
      return { ...current, product_ids: selected ? current.product_ids.filter((id) => id !== productId) : [...current.product_ids, productId] }
    })
  }

  async function saveCombo(event) {
    event.preventDefault()
    if (!editing || busy) return
    if (editing.product_ids.length < 2) { setError('Combo cần ít nhất 2 sản phẩm.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const response = editing.id ? await updateAdminCombo(editing.id, editing) : await createAdminCombo(editing)
      const saved = response.data.data
      setCombos((current) => editing.id ? current.map((combo) => combo.id === saved.id ? saved : combo) : [...current, saved])
      chooseCombo(saved)
      setMessage(editing.id ? 'Đã cập nhật combo.' : 'Đã tạo combo.')
    } catch (requestError) {
      setError(Object.values(requestError.response?.data?.errors || {}).flat()[0] || requestError.response?.data?.message || 'Không thể lưu combo.')
    } finally { setBusy(false) }
  }

  async function removeCombo() {
    if (!editing?.id || busy || !window.confirm('Xóa combo này?')) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteAdminCombo(editing.id)
      setCombos((current) => current.filter((combo) => combo.id !== editing.id))
      setEditing(null); setMessage('Đã xóa combo.')
    } catch (requestError) { setError(requestError.response?.data?.message || 'Không thể xóa combo.') }
    finally { setBusy(false) }
  }

  return <main className="p-5 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-gray">Danh mục bán theo bộ</p><h1 className="font-display mt-1 text-4xl">Combo sản phẩm</h1><p className="mt-2 text-sm text-gray">Tạo combo, chọn sản phẩm thành phần và quản lý mức giảm giá.</p></div>
      <button type="button" onClick={startCreate} className="flex items-center gap-2 rounded-xl bg-[#1d2926] px-5 py-3 text-sm font-medium text-white"><Plus size={18} />Thêm combo</button>
    </header>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="h-fit rounded-3xl bg-white p-4 shadow-sm xl:sticky xl:top-20">
        <div className="flex items-center justify-between px-1"><h2 className="font-semibold">Danh sách combo</h2><span className="rounded-full bg-[#f4f5f1] px-3 py-1 text-xs text-gray">{combos.length} combo</span></div>
        <div className="mt-4 space-y-2">{combos.map((combo) => <button type="button" key={combo.id} onClick={() => chooseCombo(combo)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${editing?.id === combo.id ? 'border-[#32665c] bg-mint/15' : 'border-transparent hover:bg-[#f7f8f5]'}`}><div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-beige">{combo.image ? <img src={combo.image} alt="" className="h-full w-full object-cover" /> : <Boxes className="m-4 text-gray" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{combo.name}</p><p className="mt-1 text-xs text-gray">{combo.products.length} sản phẩm · Giảm {combo.discount_percent}%</p><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] ${combo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray'}`}>{combo.is_active ? 'Đang bán' : 'Đang ẩn'}</span></div></button>)}{combos.length === 0 && <p className="py-14 text-center text-sm text-gray">Chưa có combo.</p>}</div>
      </section>
      <section>{!editing ? <div className="rounded-3xl bg-white py-28 text-center text-gray shadow-sm"><Boxes className="mx-auto mb-4" size={38} /><p className="font-medium text-dark">Chưa chọn combo</p><p className="mt-1 text-sm">Chọn combo bên trái hoặc tạo combo mới.</p></div> : <div className="space-y-6">
        <form onSubmit={saveCombo} className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{editing.id ? 'Thông tin combo' : 'Tạo combo mới'}</h2><p className="mt-1 text-sm text-gray">Combo phải có ít nhất 2 sản phẩm.</p></div><button disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#1d2926] px-5 py-2.5 text-sm text-white disabled:opacity-50"><Save size={17} />{busy ? 'Đang lưu...' : 'Lưu combo'}</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm md:col-span-2">Tên combo *<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="text-sm md:col-span-2">URL ảnh combo *<input required type="url" value={editing.image} onChange={(event) => setEditing({ ...editing, image: event.target.value })} placeholder="https://..." className={`mt-1.5 ${inputClass}`} /></label><label className="text-sm">Giảm giá (%) *<input required type="number" min="0" max="100" step="0.01" value={editing.discount_percent} onChange={(event) => setEditing({ ...editing, discount_percent: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] px-4 py-3 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })} /> Đang bán combo</label></div>
        </form>
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-6"><div><h2 className="text-lg font-semibold">Sản phẩm thành phần</h2><p className="mt-1 text-sm text-gray">Chọn các sản phẩm sẽ được bán cùng trong combo.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{products.map((product) => { const selected = editing.product_ids.includes(product.id); return <label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selected ? 'border-[#32665c] bg-mint/15' : 'border-black/10 hover:bg-[#f7f8f5]'}`}><input type="checkbox" checked={selected} onChange={() => toggleProduct(product.id)} /><div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-beige">{product.primary_image && <img src={product.primary_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-gray">{formatCurrency(Number(product.base_price))}</p></div></label> })}</div></section>
        {editing.id && <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-red-100 bg-red-50/50 p-5 md:p-6"><div><h2 className="font-semibold text-red-800">Xóa combo</h2><p className="mt-1 text-sm text-red-700">Các sản phẩm thành phần sẽ không bị xóa.</p></div><button type="button" disabled={busy} onClick={removeCombo} className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm text-red-700 disabled:opacity-50"><Trash2 size={17} />Xóa combo</button></section>}
      </div>}</section>
    </div>
  </main>
}
