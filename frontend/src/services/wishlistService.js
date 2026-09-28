import api from './api'

/** Lấy các sản phẩm người dùng đã lưu yêu thích. */
export function getWishlist() {
  return api.get('/wishlist')
}

/** Thêm sản phẩm vào danh sách yêu thích theo ID. */
export function saveWishlist(productId) {
  return api.post('/wishlist', { product_id: productId })
}

/** Bỏ sản phẩm khỏi danh sách yêu thích theo ID. */
export function removeWishlist(productId) {
  return api.delete(`/wishlist/${productId}`)
}