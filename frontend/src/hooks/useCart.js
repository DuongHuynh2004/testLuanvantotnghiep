import { useContext } from 'react'
import CartContext from '../context/cart-context'

/** Đọc giỏ hàng dùng chung; báo lỗi nếu component nằm ngoài CartProvider. */
export function useCart() {
  const context = useContext(CartContext)

  if (!context) throw new Error('useCart must be used within CartProvider')

  return context
}
