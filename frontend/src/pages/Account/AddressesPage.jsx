import { MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../../services/addressService'

const emptyForm = { receiver_name: '', phone: '', province: '', district: '', ward: '', address_detail: '', is_default: false }
const fields = [['receiver_name', 'Người nhận'], ['phone', 'Số điện thoại'], ['province', 'Tỉnh / thành phố'], ['district', 'Quận / huyện'], ['ward', 'Phường / xã'], ['address_detail', 'Địa chỉ cụ thể']]

/** Cho phép khách thêm, sửa, xóa và chọn địa chỉ nhận hàng mặc định. */
export default function AddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAddresses = useCallback(async () => {
    const response = await getAddresses()
    setAddresses(response.data?.data || [])
  }, [])

  useEffect(() => {
    let cancelled = false
    getAddresses()
      .then((response) => {
        if (!cancelled) setAddresses(response.data?.data || [])
      })
      .catch(() => {
        if (!cancelled) setError('Không tải được sổ địa chỉ.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  function updateField(event) {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [event.target.name]: value }))
  }

  function startEdit(address) {
    setEditingId(address.id)
    setForm(fields.reduce((values, [name]) => ({ ...values, [name]: address[name] || '' }), { is_default: address.is_default }))
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) await updateAddress(editingId, form)
      else await createAddress(form)
      await loadAddresses()
      resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu địa chỉ.')
    } finally { setSaving(false) }
  }

  async function remove(id) {
    setError('')
    try {
      await deleteAddress(id)
      await loadAddresses()
      if (editingId === id) resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa địa chỉ.')
    }
  }

  return <div className="min-h-svh bg-off-white text-dark"><Header /><main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <Link to="/account" className="text-sm text-gray hover:text-dark">← Tài khoản</Link>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Delivery book</p><h1 className="font-display mt-2 text-5xl md:text-6xl">Địa chỉ nhận hàng</h1><p className="mt-4 max-w-xl leading-7 text-gray">Lưu những địa chỉ bạn thường dùng để thanh toán nhanh hơn.</p></div><span className="rounded-full bg-mint/40 px-4 py-2 text-sm">{addresses.length} địa chỉ</span></div>
    {error && <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
      <section>{loading && <div className="space-y-4">{[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-[2rem] bg-beige" />)}</div>}{!loading && addresses.length === 0 && <div className="rounded-[2rem] border border-dashed border-beige bg-white px-6 py-14 text-center"><MapPin className="mx-auto text-pastel-green" size={32} strokeWidth={1.5} /><h2 className="font-display mt-4 text-3xl">Chưa có địa chỉ</h2><p className="mt-2 text-sm text-gray">Thêm địa chỉ đầu tiên bằng biểu mẫu bên cạnh.</p></div>}<div className="space-y-4">{addresses.map((address) => <article key={address.id} className={`rounded-[2rem] border bg-white p-5 transition md:p-6 ${editingId === address.id ? 'border-pastel-green shadow-md' : 'border-beige hover:border-dark/30'}`}><div className="flex items-start gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${address.is_default ? 'bg-dark text-white' : 'bg-mint/40 text-dark'}`}>{address.is_default ? <Star size={18} fill="currentColor" /> : <MapPin size={19} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{address.receiver_name}</h2>{address.is_default && <span className="rounded-full bg-mint/45 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide">Mặc định</span>}</div><p className="mt-1 text-sm text-gray">{address.phone}</p><p className="mt-3 text-sm leading-6 text-gray">{address.full_address}</p></div></div><div className="mt-5 flex gap-2 border-t border-beige pt-4"><button type="button" onClick={() => startEdit(address)} className="inline-flex items-center gap-2 rounded-full border border-beige px-4 py-2 text-sm transition hover:border-dark"><Pencil size={14} /> Chỉnh sửa</button><button type="button" onClick={() => remove(address.id)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray transition hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /> Xóa</button></div></article>)}</div></section>
      <form onSubmit={submit} className="h-fit rounded-[2rem] border border-beige bg-white p-6 lg:sticky lg:top-28"><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-gray">{editingId ? 'Update address' : 'New address'}</p><h2 className="font-display mt-1 text-3xl">{editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'}</h2></div>{editingId ? <button type="button" onClick={resetForm} aria-label="Hủy chỉnh sửa" className="flex h-9 w-9 items-center justify-center rounded-full border border-beige"><X size={16} /></button> : <Plus className="text-pastel-green" />}</div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{fields.map(([name, label], index) => <label key={name} className={`block text-sm ${index > 1 ? 'sm:col-span-2 lg:col-span-1' : ''}`}><span className="text-gray">{label}</span><input required name={name} value={form[name]} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-beige px-3 py-2.5 outline-none transition focus:border-dark" /></label>)}</div><label className="mt-5 flex items-center gap-3 rounded-2xl bg-off-white p-4 text-sm"><input type="checkbox" name="is_default" checked={form.is_default} onChange={updateField} className="h-4 w-4 accent-[#26312e]" /><span>Đặt làm địa chỉ mặc định</span></label><button disabled={saving} className="mt-5 w-full rounded-full bg-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-dark/90 disabled:opacity-50">{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}</button></form>
    </div>
  </main><Footer /></div>
}
