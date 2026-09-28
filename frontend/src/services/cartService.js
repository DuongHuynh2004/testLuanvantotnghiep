import api from './api'

/** Lấy giỏ hàng và tổng tiền của người dùng hiện tại. */
export function getCart() {
  return api.get('/cart')
}

/** Gửi biến thể và số lượng cần thêm vào giỏ hàng. */
export function addCartItem(payload) {
  return api.post('/cart/items', payload)
}

/** Thêm combo vào giỏ; size sẽ được khách xác nhận tại trang giỏ hàng. */
export function addCartCombo(payload) {
  return api.post('/cart/combos', payload)
}

/** Đổi biến thể size của một dòng giỏ hàng. */
export function updateCartItemVariant(itemId, variantId) {
  return api.patch(`/cart/items/${itemId}/variant`, { variant_id: variantId })
}

/** Gửi số lượng mới của một dòng giỏ hàng. */
export function updateCartItem(itemId, quantity) {
  return api.patch(`/cart/items/${itemId}`, { quantity })
}

/** Xóa một dòng khỏi giỏ hàng qua API. */
export function removeCartItem(itemId) {
  return api.delete(`/cart/items/${itemId}`)
}
