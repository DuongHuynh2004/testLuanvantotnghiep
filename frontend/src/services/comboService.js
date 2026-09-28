import api from './api'

/** Lấy các combo hè đang bán cùng sản phẩm và size khả dụng. */
export function getCombos() {
  return api.get('/combos')
}

/** Thêm trọn bộ combo với size đã chọn vào giỏ hàng. */
export function addCombo(payload) {
  return api.post('/cart/combos', payload)
}
