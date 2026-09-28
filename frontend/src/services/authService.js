import api from './api'

/** Gửi thông tin đăng ký tài khoản đến API. */
export function register(payload) {
  return api.post('/register', payload)
}

/** Gửi email và mật khẩu đến API đăng nhập. */
export function login(payload) {
  return api.post('/login', payload)
}

/** Yêu cầu API thu hồi token của phiên hiện tại. */
export function logout() {
  return api.post('/logout')
}

/** Lấy hồ sơ của người dùng đang được xác thực bằng token. */
export function getCurrentUser() {
  return api.get('/user')
}
