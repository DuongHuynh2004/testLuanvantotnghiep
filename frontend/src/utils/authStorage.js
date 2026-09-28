const TOKEN_KEY = 'auth_token'

/** Đọc token xác thực đang lưu trong localStorage. */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** Lưu token mới; xóa token cũ nếu giá trị truyền vào rỗng. */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(TOKEN_KEY)
}

/** Xóa token khỏi trình duyệt khi phiên kết thúc hoặc không còn hợp lệ. */
export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}
