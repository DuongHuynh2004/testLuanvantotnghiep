import api from './api'

/** Tạo đơn từ giỏ hàng hoặc danh sách mua ngay; server quyết định giá và kiểm tra tồn kho. */
export function createOrder(payload) {
  return api.post('/orders', payload)
}

/** Lấy một trang lịch sử đơn hàng của người dùng hiện tại. */
export function getOrders() {
  return api.get('/orders')
}

/** Hủy đơn chưa thanh toán khi đơn vẫn chưa chuyển sang khâu xử lý. */
export function cancelOrder(orderId) {
  return api.patch(`/orders/${orderId}/cancel`)
}

/** Gửi yêu cầu hoàn tiền hoặc đổi trả cho một đơn thuộc khách hàng hiện tại. */
export function createOrderRequest(orderId, payload) {
  return api.post(`/orders/${orderId}/requests`, payload)
}
