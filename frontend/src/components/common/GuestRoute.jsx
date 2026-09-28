import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Chỉ hiển thị trang cho khách; chuyển người đã đăng nhập đến tài khoản. */
export default function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="min-h-svh bg-off-white" />
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }

  return children
}
