import api from './api'

/** Cập nhật họ tên, email và số điện thoại của tài khoản hiện tại. */
export function updateProfile(payload) {
  return api.patch('/user', payload)
}

/** Gửi mật khẩu hiện tại và mật khẩu mới để API kiểm tra, cập nhật. */
export function changePassword(payload) {
  return api.patch('/user/password', payload)
}
