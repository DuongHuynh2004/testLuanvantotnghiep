import api from './api'

/** Đăng đánh giá cho sản phẩm thuộc đơn hàng đã hoàn tất. */
export function createReview(slug, payload) {
  return api.post(`/products/${slug}/reviews`, payload)
}

/** Sửa số sao và nội dung đánh giá của khách hàng đang đăng nhập. */
export function updateReview(reviewId, payload) {
  return api.patch(`/reviews/${reviewId}`, payload)
}

/** Xóa đánh giá thuộc về khách hàng đang đăng nhập. */
export function deleteReview(reviewId) {
  return api.delete(`/reviews/${reviewId}`)
}
