/** Nhãn chỉ xuất hiện khi backend xác nhận ưu đãi đang có hiệu lực. */
export default function PromotionBadge({ promotion }) {
  if (!promotion) return null
  return <span className="mt-2 inline-flex rounded-full bg-soft-yellow/40 px-3 py-1 text-xs font-medium text-dark">{promotion.name} · −{promotion.discount_percent}%</span>
}
