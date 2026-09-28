import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Chỉ cho tài khoản admin truy cập giao diện quản trị; backend vẫn kiểm tra lại mọi API. */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <div className="min-h-svh bg-[#f4f5f1]" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}
