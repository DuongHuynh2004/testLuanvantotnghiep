import api from './api'

/** Lấy danh mục đang hoạt động cùng số lượng sản phẩm. */
export function getCategories() {
  return api.get('/categories')
}

/** Lấy danh sách sản phẩm theo bộ lọc, thứ tự và trang được truyền vào. */
export function getProducts(params = {}) {
  return api.get('/products', { params })
}

/** Lấy chi tiết sản phẩm, ảnh, biến thể và đánh giá theo slug. */
export function getProduct(slug) {
  return api.get(`/products/${slug}`)
}