import api from './api'

/** Lấy các số liệu tổng quan dành cho trang quản trị. */
export function getAdminDashboard() {
  return api.get('/admin/dashboard')
}

/** Lấy danh sách đơn hàng phân trang dành cho quản trị viên. */
export function getAdminOrders(params = {}) {
  return api.get('/admin/orders', { params })
}

/** Gửi trạng thái mới cho đơn hàng theo ID. */
export function updateAdminOrderStatus(orderId, payload) {
  return api.patch(`/admin/orders/${orderId}/status`, typeof payload === 'string' ? { status: payload } : payload)
}

/** Lấy danh sách sản phẩm phân trang dành cho quản trị viên. */
export function getAdminProducts(params = {}) {
  return api.get('/admin/products', { params })
}

/** Tạo sản phẩm với tồn kho ban đầu cho bốn size S, M, L và XL. */
export function createAdminProduct(payload) {
  return api.post('/admin/products', payload)
}

/** Cập nhật trạng thái hiển thị hoặc cờ nổi bật của sản phẩm. */
export function updateAdminProduct(productId, payload) {
  return api.patch(`/admin/products/${productId}`, payload)
}

/** Xóa sản phẩm khỏi danh mục quản trị. */
export function deleteAdminProduct(productId) {
  return api.delete(`/admin/products/${productId}`)
}

/** Thay toàn bộ bộ ảnh; thứ tự file được giữ và file đầu tiên là ảnh chính. */
export function replaceAdminProductImages(productId, files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('images[]', file))

  return api.post(`/admin/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Xóa một ảnh và để server tự chọn lại ảnh chính khi cần. */
export function deleteAdminProductImage(productId, imageId) {
  return api.delete(`/admin/products/${productId}/images/${imageId}`)
}

/** Cập nhật tồn kho cho một biến thể sản phẩm. */
export function updateAdminVariant(variantId, stockQuantity) {
  return api.patch(`/admin/variants/${variantId}`, { stock_quantity: stockQuantity })
}

/** Lấy combo cùng sản phẩm thành phần dành cho quản trị viên. */
export function getAdminCombos() {
  return api.get('/admin/combos')
}

/** Tạo combo và gắn danh sách sản phẩm thành phần. */
export function createAdminCombo(payload) {
  return api.post('/admin/combos', payload)
}

/** Cập nhật thông tin và sản phẩm thành phần của combo. */
export function updateAdminCombo(comboId, payload) {
  return api.patch(`/admin/combos/${comboId}`, payload)
}

/** Xóa combo khỏi cửa hàng. */
export function deleteAdminCombo(comboId) {
  return api.delete(`/admin/combos/${comboId}`)
}

/** Lấy danh sách khách hàng cùng số đơn và tổng chi tiêu hoàn tất. */
export function getAdminCustomers(params = {}) {
  return api.get('/admin/customers', { params })
}

/** Lấy danh sách đánh giá theo trạng thái duyệt. */
export function getAdminReviews(params = {}) {
  return api.get('/admin/reviews', { params })
}

/** Cập nhật trạng thái kiểm duyệt của đánh giá. */
/** Xóa vĩnh viễn một đánh giá không còn phù hợp. */
export function deleteAdminReview(reviewId) {
  return api.delete(`/admin/reviews/${reviewId}`)
}

/** Lấy các yêu cầu hoàn tiền và đổi trả để quản trị viên xử lý. */
export function getAdminOrderRequests(params = {}) {
  return api.get('/admin/order-requests', { params })
}

/** Duyệt hoặc từ chối một yêu cầu hậu mãi và lưu ghi chú của admin. */
export function updateAdminOrderRequest(requestId, payload) {
  return api.patch(`/admin/order-requests/${requestId}`, payload)
}
