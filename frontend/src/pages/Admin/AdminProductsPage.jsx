import { Check, ImagePlus, PackageSearch, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminProductImage,
  getAdminProducts,
  replaceAdminProductImages,
  updateAdminProduct,
  updateAdminVariant,
} from '../../services/adminService'
import { getCategories } from '../../services/catalogService'
import { formatCurrency } from '../../utils/currency'

const inputClass = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#32665c] focus:ring-2 focus:ring-[#32665c]/10'
const sizes = ['S', 'M', 'L', 'XL']
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

/** Quản lý sản phẩm, tồn kho và bộ ảnh trong một luồng chỉnh sửa thống nhất. */
export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ search: '', status: '', category: '' })
  const [editing, setEditing] = useState(null)
  const [pendingImages, setPendingImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminProducts({ per_page: 100 }).then((response) => setProducts(response.data.data.data || [])).catch(() => setError('Không thể tải danh sách sản phẩm.'))
    getCategories().then((response) => setCategories(response.data.data || []))
  }, [])

  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls])

  /** Tải lại sản phẩm theo từ khóa, trạng thái và danh mục. */
  async function loadProducts(params = filters) {
    setError('')
    try {
      const response = await getAdminProducts({ ...params, per_page: 100 })
      setProducts(response.data.data.data || [])
    } catch { setError('Không thể tải danh sách sản phẩm.') }
  }

  /** Xóa danh sách file chờ và giải phóng URL xem trước khỏi bộ nhớ. */
  function clearPendingImages() {
    setPendingImages([])
    setPreviewUrls([])
  }

  /** Nạp sản phẩm vào bảng chỉnh sửa mà không thay đổi dữ liệu server. */
  function chooseProduct(product) {
    clearPendingImages()
    setEditing({ ...product, category_id: product.category?.id, variants: product.variants.map((variant) => ({ ...variant })) })
    setMessage(''); setError('')
  }

  /** Mở biểu mẫu mới với đủ bốn size được cửa hàng hỗ trợ. */
  function startCreate() {
    clearPendingImages()
    setEditing({
      id: null, name: '', description: '', material: '', base_price: '', category_id: categories[0]?.id || '',
      status: 'active', featured: false, images: [], variants: sizes.map((name) => ({ size: { name }, stock_quantity: 0 })),
    })
    setMessage(''); setError('')
  }

  /** Kiểm tra file ngay trên trình duyệt và tạo ảnh xem trước theo đúng thứ tự chọn. */
  function selectImages(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length > 6) { setError('Mỗi sản phẩm được chọn tối đa 6 ảnh.'); return }
    if (files.some((file) => !acceptedTypes.includes(file.type))) {
      setError('Chỉ nhận định dạng ảnh JPG, PNG hoặc WebP.'); return
    }
    setError(''); setMessage('')
    setPendingImages(files)
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)))
  }

  /** Đồng bộ sản phẩm mới hoặc thông tin sản phẩm đang chọn. */
  async function saveProduct(event) {
    event.preventDefault()
    if (!editing || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const common = {
        name: editing.name, description: editing.description || null, material: editing.material || null,
        base_price: Number(editing.base_price), category_id: Number(editing.category_id), status: editing.status, featured: editing.featured,
      }
      let response = editing.id
        ? await updateAdminProduct(editing.id, common)
        : await createAdminProduct({ ...common, stocks: Object.fromEntries(editing.variants.map((variant) => [variant.size.name, Number(variant.stock_quantity)])) })
      let updated = response.data.data
      if (!editing.id && pendingImages.length) {
        response = await replaceAdminProductImages(updated.id, pendingImages)
        updated = response.data.data
      }
      setProducts((current) => editing.id ? current.map((product) => product.id === updated.id ? updated : product) : [updated, ...current])
      chooseProduct(updated)
      setMessage(editing.id ? 'Đã lưu thông tin sản phẩm.' : 'Đã tạo sản phẩm mới.')
    } catch (requestError) {
      setError(Object.values(requestError.response?.data?.errors || {}).flat()[0] || requestError.response?.data?.message || 'Không thể lưu sản phẩm.')
    } finally { setBusy(false) }
  }

  /** Thay bộ ảnh hiện tại bằng danh sách file đã chọn. */
  async function saveImages() {
    if (!editing?.id || !pendingImages.length || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = (await replaceAdminProductImages(editing.id, pendingImages)).data.data
      setProducts((current) => current.map((product) => product.id === updated.id ? updated : product))
      chooseProduct(updated)
      setMessage('Đã thay bộ ảnh. Các file ảnh cũ đã được xóa.')
    } catch (requestError) {
      setError(Object.values(requestError.response?.data?.errors || {}).flat()[0] || requestError.response?.data?.message || 'Không thể tải ảnh lên.')
    } finally { setBusy(false) }
  }

  /** Xóa một ảnh và dùng phản hồi server để cập nhật ảnh chính mới. */
  async function removeImage(image) {
    if (!editing?.id || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = (await deleteAdminProductImage(editing.id, image.id)).data.data
      setProducts((current) => current.map((product) => product.id === updated.id ? updated : product))
      setEditing({ ...updated, category_id: updated.category?.id, variants: updated.variants.map((variant) => ({ ...variant })) })
      setMessage('Đã xóa ảnh khỏi sản phẩm.')
    } catch (requestError) { setError(requestError.response?.data?.message || 'Không thể xóa ảnh.') }
    finally { setBusy(false) }
  }

  /** Cập nhật tồn kho riêng cho một size. */
  async function saveStock(variant) {
    setBusy(true); setError(''); setMessage('')
    try {
      const stock = (await updateAdminVariant(variant.id, Number(variant.stock_quantity))).data.data.stock_quantity
      setEditing((current) => ({ ...current, variants: current.variants.map((item) => item.id === variant.id ? { ...item, stock_quantity: stock } : item) }))
      setProducts((current) => current.map((product) => product.id === editing.id ? { ...product, variants: product.variants.map((item) => item.id === variant.id ? { ...item, stock_quantity: stock } : item) } : product))
      setMessage(`Đã cập nhật tồn kho size ${variant.size?.name}.`)
    } catch { setError('Không thể cập nhật tồn kho.') } finally { setBusy(false) }
  }

  /** Xóa sản phẩm và toàn bộ file ảnh của sản phẩm đó. */
  async function removeProduct() {
    if (!editing?.id || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteAdminProduct(editing.id)
      setProducts((current) => current.filter((item) => item.id !== editing.id))
      setEditing(null); clearPendingImages(); setMessage('Đã xóa sản phẩm và các file ảnh liên quan.')
    } catch (requestError) { setError(requestError.response?.data?.message || 'Không thể xóa sản phẩm.') }
    finally { setBusy(false) }
  }

  const shownImages = pendingImages.length
    ? previewUrls.map((url, index) => ({ id: `preview-${index}`, url, is_primary: index === 0, preview: true }))
    : editing?.images || []

  return <main className="p-5 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-gray">Danh mục hàng hóa</p><h1 className="font-display mt-1 text-4xl">Sản phẩm & tồn kho</h1><p className="mt-2 text-sm text-gray">Quản lý thông tin, ảnh và số lượng từng size tại một nơi.</p></div>
      <button type="button" onClick={startCreate} className="flex items-center gap-2 rounded-xl bg-[#1d2926] px-5 py-3 text-sm font-medium text-white shadow-sm"><Plus size={18} />Thêm sản phẩm</button>
    </header>

    <form onSubmit={(event) => { event.preventDefault(); loadProducts(filters) }} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
      <label className="relative"><Search className="pointer-events-none absolute left-3 top-3 text-gray" size={17} /><input aria-label="Tìm sản phẩm" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tên, slug hoặc SKU" className={`${inputClass} pl-10`} /></label>
      <select aria-label="Trạng thái" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={inputClass}><option value="">Mọi trạng thái</option><option value="active">Đang bán</option><option value="inactive">Đang ẩn</option></select>
      <select aria-label="Danh mục" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className={inputClass}><option value="">Mọi danh mục</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select>
      <button className="rounded-xl border border-black/10 bg-[#f7f8f5] px-5 py-2.5 text-sm font-medium hover:bg-beige">Áp dụng</button>
    </form>

    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

    <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="h-fit rounded-3xl bg-white p-4 shadow-sm xl:sticky xl:top-20">
        <div className="flex items-center justify-between px-1"><h2 className="font-semibold">Danh sách sản phẩm</h2><span className="rounded-full bg-[#f4f5f1] px-3 py-1 text-xs text-gray">{products.length} sản phẩm</span></div>
        <div className="mt-4 max-h-[calc(100vh-245px)] space-y-2 overflow-y-auto pr-1">{products.map((product) => {
          const stock = product.variants.reduce((sum, variant) => sum + Number(variant.stock_quantity), 0)
          return <button type="button" key={product.id} onClick={() => chooseProduct(product)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${editing?.id === product.id ? 'border-[#32665c] bg-mint/15 shadow-sm' : 'border-transparent hover:bg-[#f7f8f5]'}`}>
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-beige">{product.primary_image ? <img src={product.primary_image} alt="" className="h-full w-full object-cover" /> : <PackageSearch className="m-4 text-gray" />}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-gray">{formatCurrency(Number(product.base_price))} · Tồn {stock}</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-[#f4f5f1] px-2 py-0.5 text-[11px]">{product.category?.name}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray'}`}>{product.status === 'active' ? 'Đang bán' : 'Đang ẩn'}</span></div></div>
          </button>
        })}{products.length === 0 && <p className="py-14 text-center text-sm text-gray">Không tìm thấy sản phẩm.</p>}</div>
      </section>

      <section className="min-w-0">{!editing ? <div className="rounded-3xl bg-white py-28 text-center text-gray shadow-sm"><PackageSearch className="mx-auto mb-4" size={38} /><p className="font-medium text-dark">Chưa chọn sản phẩm</p><p className="mt-1 text-sm">Chọn một sản phẩm bên trái hoặc tạo sản phẩm mới.</p></div> : <div className="space-y-6">
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Hình ảnh sản phẩm</h2><p className="mt-1 text-sm text-gray">Tối đa 6 ảnh. Ảnh đầu tiên luôn là ảnh chính.</p></div><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-[#f7f8f5]"><ImagePlus size={18} />Chọn nhiều ảnh<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectImages} /></label></div>
          {shownImages.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{shownImages.map((image, index) => <figure key={image.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-beige"><img src={image.url} alt={`Ảnh ${index + 1} của ${editing.name}`} className="h-full w-full object-cover" />{image.is_primary && <figcaption className="absolute left-2 top-2 rounded-full bg-dark/90 px-2.5 py-1 text-[11px] text-white">Ảnh chính</figcaption>}{!image.preview && <button type="button" disabled={busy} onClick={() => removeImage(image)} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-600 opacity-100 shadow-sm transition hover:bg-white md:opacity-0 md:group-hover:opacity-100" aria-label={`Xóa ảnh ${index + 1}`}><Trash2 size={16} /></button>}</figure>)}</div> : <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-black/10 px-6 py-12 text-center hover:border-[#32665c]/40 hover:bg-mint/5"><ImagePlus size={34} className="text-gray" /><span className="mt-3 text-sm font-medium">Sản phẩm chưa có ảnh</span><span className="mt-1 text-xs text-gray">Bấm để chọn JPG, PNG hoặc WebP</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectImages} /></label>}
          {pendingImages.length > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4"><div><p className="text-sm font-medium">Đã chọn {pendingImages.length} ảnh mới</p><p className="mt-1 text-xs text-gray">Khi lưu, toàn bộ file ảnh cũ sẽ được xóa tự động.</p></div><div className="flex gap-2"><button type="button" onClick={clearPendingImages} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm"><X size={16} />Bỏ chọn</button>{editing.id && <button type="button" disabled={busy} onClick={saveImages} className="flex items-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm text-white disabled:opacity-50"><Upload size={16} />{busy ? 'Đang tải...' : 'Thay bộ ảnh'}</button>}</div></div>}
        </section>

        <form onSubmit={saveProduct} className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{editing.id ? 'Thông tin sản phẩm' : 'Tạo sản phẩm mới'}</h2><p className="mt-1 text-sm text-gray">Các trường có dấu * là bắt buộc.</p></div><button disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#1d2926] px-5 py-2.5 text-sm text-white disabled:opacity-50"><Save size={17} />{busy ? 'Đang lưu...' : editing.id ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm md:col-span-2">Tên sản phẩm *<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="text-sm">Danh mục *<select required value={editing.category_id} onChange={(event) => setEditing({ ...editing, category_id: event.target.value })} className={`mt-1.5 ${inputClass}`}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-sm">Giá gốc (VND) *<input required type="number" min="1" value={editing.base_price} onChange={(event) => setEditing({ ...editing, base_price: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="text-sm">Chất liệu<input value={editing.material || ''} onChange={(event) => setEditing({ ...editing, material: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="text-sm">Trạng thái<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })} className={`mt-1.5 ${inputClass}`}><option value="active">Đang bán</option><option value="inactive">Đang ẩn</option></select></label><label className="text-sm md:col-span-2">Mô tả<textarea rows="4" value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} className={`mt-1.5 ${inputClass}`} /></label><label className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] px-4 py-3 text-sm md:col-span-2"><input type="checkbox" checked={editing.featured} onChange={(event) => setEditing({ ...editing, featured: event.target.checked })} /> Hiển thị trong nhóm sản phẩm nổi bật</label></div>
        </form>

        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-6"><div><h2 className="text-lg font-semibold">Tồn kho theo size</h2><p className="mt-1 text-sm text-gray">Nhập số lượng và lưu riêng từng size.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{editing.variants.map((variant) => <div key={variant.id || variant.size.name} className="flex items-center gap-3 rounded-2xl bg-[#f7f8f5] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-semibold">{variant.size?.name}</span><label className="min-w-0 flex-1 text-xs text-gray">Số lượng<input aria-label={`Tồn kho ${variant.size?.name}`} type="number" min="0" value={variant.stock_quantity} onChange={(event) => setEditing({ ...editing, variants: editing.variants.map((item) => item === variant ? { ...item, stock_quantity: event.target.value } : item) })} className={`mt-1 ${inputClass}`} /></label>{editing.id && <button type="button" disabled={busy} onClick={() => saveStock(variant)} className="mt-5 rounded-xl bg-white p-2.5 text-[#32665c] shadow-sm" aria-label={`Lưu tồn kho size ${variant.size?.name}`}><Check size={18} /></button>}</div>)}</div></section>

        {editing.id && <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-red-100 bg-red-50/50 p-5 md:p-6"><div><h2 className="font-semibold text-red-800">Xóa sản phẩm</h2><p className="mt-1 text-sm text-red-700">Sản phẩm và toàn bộ file ảnh sẽ bị xóa khỏi hệ thống.</p></div><button type="button" disabled={busy} onClick={removeProduct} className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm text-red-700 disabled:opacity-50"><Trash2 size={17} />Xóa sản phẩm</button></section>}
      </div>}</section>
    </div>
  </main>
}
