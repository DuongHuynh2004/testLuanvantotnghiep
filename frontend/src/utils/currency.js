const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

/** Định dạng giá trị tiền theo đồng Việt Nam, dùng chung cho các trang bán hàng. */
export function formatCurrency(value) {
  return formatter.format(value)
}
