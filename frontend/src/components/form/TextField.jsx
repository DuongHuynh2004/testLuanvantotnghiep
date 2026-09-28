/** Hiển thị ô nhập có nhãn và thông báo lỗi kiểm tra dữ liệu. */
export default function TextField({
  id,
  label,
  error,
  type = 'text',
  autoComplete,
  ...props
}) {
  return (
    <label className="block text-left" htmlFor={id}>
      <span className="text-sm font-medium text-dark">{label}</span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-dark outline-none transition focus:border-pastel-green ${
          error ? 'border-red-300' : 'border-beige'
        }`}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-red-500">{error}</span>}
    </label>
  )
}
