import axios from 'axios'
import { clearAuthToken, getAuthToken } from '../utils/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Gắn token hiện tại vào từng yêu cầu, tránh dùng token cũ sau khi đăng nhập lại.
api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Xóa token hết hiệu lực khi API trả 401; lỗi nhập sai ở đăng nhập/đăng ký do biểu mẫu xử lý.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthAttempt = url.includes('/login') || url.includes('/register')

    if (error.response?.status === 401 && !isAuthAttempt) {
      clearAuthToken()
    }

    return Promise.reject(error)
  },
)

export default api
