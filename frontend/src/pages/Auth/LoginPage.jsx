import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import TextField from '../../components/form/TextField'
import { useAuth } from '../../hooks/useAuth'

/** Chọn thông báo lỗi API phù hợp để hiển thị trên biểu mẫu xác thực. */
function getErrorMessage(error) {
  return (
    error.response?.data?.errors?.email?.[0] ||
    error.response?.data?.message ||
    'Không đăng nhập được. Vui lòng thử lại.'
  )
}

/** Quản lý biểu mẫu đăng nhập và điều hướng sau khi xác thực thành công. */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /** Cập nhật trường biểu mẫu dựa trên name và value của ô nhập. */
  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  /** Gửi thông tin đăng nhập; admin vào quản trị, khách hàng trở về trang chủ. */
  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const response = await login(form)
      const destination = response?.data?.user?.role === 'admin' ? '/admin' : '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrors(error.response?.data?.errors || {})
      setMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản SUNÉA để mua sắm."
      footer={
        <p>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-dark underline">
            Đăng ký
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {message && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
        )}

        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0]}
          required
        />
        <TextField
          id="password"
          name="password"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-dark py-3 text-white disabled:opacity-60"
        >
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  )
}
