import { MessageSquareText, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteAdminReview, getAdminReviews } from '../../services/adminService'

/** Hiển thị các đánh giá đã đăng; quản trị viên chỉ có thể xóa nội dung không phù hợp. */
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminReviews({ per_page: 100 })
      .then((response) => setReviews(response.data?.data?.data || []))
      .catch(() => setError('Không thể tải danh sách đánh giá.'))
  }, [])

  async function removeReview(review) {
    if (!window.confirm(`Xóa đánh giá của ${review.author}?`)) return
    setBusyId(review.id)
    setError('')
    try {
      await deleteAdminReview(review.id)
      setReviews((current) => current.filter((item) => item.id !== review.id))
    } catch {
      setError('Không thể xóa đánh giá này.')
    } finally {
      setBusyId(null)
    }
  }

  return <main className="p-5 md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-gray">Nội dung từ khách hàng</p><h1 className="font-display mt-1 text-4xl">Đánh giá sản phẩm</h1></div>
      <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">{reviews.length} đánh giá</span>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      {reviews.map((review) => <article key={review.id} className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-medium">{review.product?.name}</p><p className="mt-1 text-xs text-gray">{review.author} · {review.author_email}</p></div>
          <span aria-label={`${review.rating} trên 5 sao`} className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
        </div>
        <blockquote className="mt-4 min-h-16 rounded-2xl bg-[#f7f8f5] p-4 text-sm leading-6">{review.comment || 'Khách hàng không để lại nội dung.'}</blockquote>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray">Đơn {review.order_code} · {new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
          <button type="button" disabled={busyId === review.id} onClick={() => removeReview(review)} className="rounded-xl bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50" aria-label="Xóa đánh giá"><Trash2 size={18} /></button>
        </div>
      </article>)}
      {reviews.length === 0 && <div className="rounded-3xl bg-white py-16 text-center text-sm text-gray lg:col-span-2"><MessageSquareText className="mx-auto mb-3" />Chưa có đánh giá sản phẩm.</div>}
    </section>
  </main>
}
