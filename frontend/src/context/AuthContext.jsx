import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/authStorage'
import AuthContext from './auth-context'

/** Lấy dữ liệu người dùng và token từ cấu trúc phản hồi API. */
function extractAuthPayload(response) {
  return response.data?.data ?? {}
}

/** Quản lý người dùng hiện tại, khôi phục phiên và chia sẻ thao tác đăng nhập/đăng xuất. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()))

  /** Lưu token vào trình duyệt và cập nhật người dùng của phiên hiện tại. */
  const persistSession = useCallback((payload) => {
    setAuthToken(payload.token)
    setUser(payload.user ?? null)
  }, [])

  /** Khôi phục người dùng từ token đã lưu; xóa phiên nếu API không xác thực được. */
  const bootstrap = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const response = await authService.getCurrentUser()
      setUser(response.data?.data ?? null)
    } catch {
      clearAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getAuthToken()) return undefined

    let cancelled = false
    authService.getCurrentUser()
      .then((response) => {
        if (!cancelled) setUser(response.data?.data ?? null)
      })
      .catch(() => {
        clearAuthToken()
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  /** Đăng ký qua API, lưu token và người dùng rồi trả phản hồi cho trang gọi. */
  const register = useCallback(async (payload) => {
    const response = await authService.register(payload)
    persistSession(extractAuthPayload(response))
    return response.data
  }, [persistSession])

  /** Đăng nhập qua API, lưu token và người dùng rồi trả phản hồi cho trang gọi. */
  const login = useCallback(async (payload) => {
    const response = await authService.login(payload)
    persistSession(extractAuthPayload(response))
    return response.data
  }, [persistSession])

  /** Thu hồi token qua API và luôn xóa phiên trong trình duyệt kể cả khi API lỗi. */
  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await authService.logout()
      }
    } finally {
      clearAuthToken()
      setUser(null)
    }
  }, [])

  /** Thay hồ sơ hiện tại bằng dữ liệu mới do API đã xác thực và trả về. */
  const updateCurrentUser = useCallback((nextUser) => {
    setUser(nextUser)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      register,
      login,
      logout,
      updateCurrentUser,
      refresh: bootstrap,
    }),
    [user, loading, register, login, logout, updateCurrentUser, bootstrap],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
