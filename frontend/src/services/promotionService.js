import api from './api'

/** Lấy mã đang phát hành và điều kiện dùng cho khách hàng. */
export const getCoupons = () => api.get('/coupons')
/** Báo giá lại từ server, dùng chung cho mua từ giỏ và mua ngay. */
export const getCheckoutQuote = (payload) => api.post('/checkout/quote', payload)
/** Lấy cấu hình khuyến mãi và thống kê lượt dùng dành cho quản trị. */
export const getAdminPromotions = () => api.get('/admin/promotions')
/** Gắn hoặc gỡ giá khuyến mãi và thời hạn của một sản phẩm. */
export const updateProductPromotion = (id, payload) => api.patch(`/admin/products/${id}/promotion`, payload)
/** Tạo mã mới hoặc lưu toàn bộ cấu hình mã đã có. */
export const saveCoupon = (id, payload) => id ? api.put(`/admin/coupons/${id}`, payload) : api.post('/admin/coupons', payload)
/** Xóa mã chưa phát sinh đơn hàng. */
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`)

/** Lấy lỗi theo trường trước, sau đó mới dùng thông báo chung của API. */
export function promotionError(error) {
  return Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || 'Không thể xử lý. Vui lòng thử lại.'
}
