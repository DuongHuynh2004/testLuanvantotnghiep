import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GuestRoute from '../components/common/GuestRoute.jsx'
import AdminRoute from '../components/common/AdminRoute.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import AccountPage from '../pages/Account/AccountPage.jsx'
import LoginPage from '../pages/Auth/LoginPage.jsx'
import RegisterPage from '../pages/Auth/RegisterPage.jsx'
import HomePage from '../pages/Home/HomePage.jsx'
import ProductsPage from '../pages/Products/ProductsPage.jsx'
import ProductDetailPage from '../pages/ProductDetail/ProductDetailPage.jsx'
import CartPage from '../pages/Cart/CartPage.jsx'
import CheckoutPage from '../pages/Checkout/CheckoutPage.jsx'
import OrdersPage from '../pages/Orders/OrdersPage.jsx'
import WishlistPage from '../pages/Wishlist/WishlistPage.jsx'
import AddressesPage from '../pages/Account/AddressesPage.jsx'
import AdminPage from '../pages/Admin/AdminPage.jsx'
import AdminProductsPage from '../pages/Admin/AdminProductsPage.jsx'
import AdminCombosPage from '../pages/Admin/AdminCombosPage.jsx'
import AdminOrdersPage from '../pages/Admin/AdminOrdersPage.jsx'
import AdminOrderRequestsPage from '../pages/Admin/AdminOrderRequestsPage.jsx'
import AdminCustomersPage from '../pages/Admin/AdminCustomersPage.jsx'
import AdminReviewsPage from '../pages/Admin/AdminReviewsPage.jsx'
import PromotionsAdminPage from '../pages/Admin/PromotionsAdminPage.jsx'
import PasswordPage from '../pages/Account/PasswordPage.jsx'
import AboutPage from '../pages/About/AboutPage.jsx'
import SummerCollectionPage from '../pages/SummerCollection/SummerCollectionPage.jsx'

/** Khai báo URL của cửa hàng và bọc các trang cần đăng nhập bằng bộ kiểm tra phiên. */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/summer-collection" element={<SummerCollectionPage />} />
        <Route path="/promotions" element={<ProductsPage key="promotions" promotionsOnly />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="combos" element={<AdminCombosPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="order-requests" element={<AdminOrderRequestsPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="promotions" element={<PromotionsAdminPage />} />
        </Route>
        <Route path="/account/password" element={<ProtectedRoute><PasswordPage /></ProtectedRoute>} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
