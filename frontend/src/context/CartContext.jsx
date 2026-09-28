import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as cartService from '../services/cartService'
import CartContext from './cart-context'
const emptyCart = { items: [], item_count: 0, product_count: 0, subtotal: 0, combo_discount: 0, total: 0 }

/** Lấy giỏ hàng từ phản hồi API; dùng giỏ rỗng nếu phản hồi không có dữ liệu. */
function cartFromResponse(response) {
  return response.data?.data || emptyCart
}

/** Đồng bộ giỏ hàng với API và cung cấp các thao tác thêm, sửa, xóa sản phẩm. */
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(emptyCart)
  const [loading, setLoading] = useState(false)

  /** Tải lại giỏ hàng từ server; đưa về giỏ rỗng nếu người dùng chưa đăng nhập. */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart)
      return
    }

    setLoading(true)
    try {
      const response = await cartService.getCart()
      setCart(cartFromResponse(response))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    let cancelled = false
    cartService.getCart()
      .then((response) => {
        if (!cancelled) setCart(cartFromResponse(response))
      })
      .catch(() => {
        if (!cancelled) setCart(emptyCart)
      })

    return () => { cancelled = true }
  }, [isAuthenticated])

  /** Thêm biến thể với số lượng yêu cầu rồi cập nhật giỏ hàng từ kết quả server. */
  const addItem = useCallback(async (variantId, quantity = 1) => {
    const response = await cartService.addCartItem({ variant_id: variantId, quantity })
    const nextCart = cartFromResponse(response)
    setCart(nextCart)
    return nextCart
  }, [])

  /** Thêm đủ sản phẩm của combo; khách sẽ xác nhận size tại giỏ hàng. */
  const addCombo = useCallback(async (comboId, quantity = 1) => {
    const response = await cartService.addCartCombo({ combo_id: comboId, quantity })
    const nextCart = cartFromResponse(response)
    setCart(nextCart)
    return nextCart
  }, [])

  /** Đổi size của một món và đồng bộ lại toàn bộ giỏ hàng. */
  const updateItemVariant = useCallback(async (itemId, variantId) => {
    const response = await cartService.updateCartItemVariant(itemId, variantId)
    setCart(cartFromResponse(response))
  }, [])

  /** Cập nhật số lượng một dòng hàng rồi đồng bộ lại giỏ hàng. */
  const updateItem = useCallback(async (itemId, quantity) => {
    const response = await cartService.updateCartItem(itemId, quantity)
    setCart(cartFromResponse(response))
  }, [])

  /** Xóa một dòng hàng và đồng bộ giỏ hàng từ phản hồi API. */
  const removeItem = useCallback(async (itemId) => {
    const response = await cartService.removeCartItem(itemId)
    setCart(cartFromResponse(response))
  }, [])

  const visibleCart = isAuthenticated ? cart : emptyCart
  const value = useMemo(() => ({ cart: visibleCart, loading, refresh, addItem, addCombo, updateItem, updateItemVariant, removeItem }), [visibleCart, loading, refresh, addItem, addCombo, updateItem, updateItemVariant, removeItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
