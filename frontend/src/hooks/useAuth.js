import { useContext } from 'react'
import AuthContext from '../context/auth-context'

/** Đọc trạng thái xác thực; báo lỗi nếu component nằm ngoài AuthProvider. */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
