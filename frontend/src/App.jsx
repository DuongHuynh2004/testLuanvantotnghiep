import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

/** Cung cấp phiên đăng nhập, giỏ hàng và hệ thống điều hướng cho toàn ứng dụng. */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
