import api from './api'

/** Lấy danh sách địa chỉ nhận hàng của người dùng hiện tại. */
export function getAddresses() {
  return api.get('/addresses')
}

/** Gửi địa chỉ nhận hàng mới đến API. */
export function createAddress(payload) {
  return api.post('/addresses', payload)
}

/** Cập nhật địa chỉ nhận hàng thuộc tài khoản hiện tại. */
export function updateAddress(id, payload) {
  return api.patch(`/addresses/${id}`, payload)
}

/** Xóa địa chỉ nhận hàng theo ID. */
export function deleteAddress(id) {
  return api.delete(`/addresses/${id}`)
}
