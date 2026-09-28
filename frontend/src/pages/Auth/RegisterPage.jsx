import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import TextField from '../../components/form/TextField'
import { useAuth } from '../../hooks/useAuth'

/** Chọn thông báo lỗi API phù hợp để hiển thị trên biểu mẫu xác thực. */
function getErrorMessage(error) {
  return error.response?.data?.message || 'Không đăng ký được. Vui lòng thử lại.'
}

/** Quản lý biểu mẫu đăng ký và hiển thị lỗi kiểm tra dữ liệu từ API. */
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /** Cập nhật trường biểu mẫu dựa trên name và value của ô nhập. */
  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  /** Gửi thông tin đăng ký, lưu phiên đăng nhập và chuyển khách hàng về trang chủ. */
  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (error) {
      setErrors(error.response?.data?.errors || {})
      setMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Đăng ký để lưu đơn hàng và danh sách yêu thích."
      footer={
        <p>
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-dark underline">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {message && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
        )}

        <TextField
          id="name"
          name="name"
          label="Họ tên"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name?.[0]}
          required
        />
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
          id="phone"
          name="phone"
          label="Số điện thoại"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone?.[0]}
        />
        <TextField
          id="password"
          name="password"
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
          required
        />
        <TextField
          id="password_confirmation"
          name="password_confirmation"
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={handleChange}
          error={errors.password_confirmation?.[0]}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-dark py-3 text-white disabled:opacity-60"
        >
          {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
    </AuthLayout>
  )
}
