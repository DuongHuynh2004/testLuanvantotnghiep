import { Link } from 'react-router-dom'

/** Hiển thị logo SUNÉA, có tùy chọn thu gọn và màu sáng. */
export default function BrandLogo({ compact = false, light = false, prominent = false }) {
  const textClass = light ? 'text-white' : 'text-dark'
  const markClass = light ? 'border-white/80 text-white' : 'border-dark/80 text-dark'
  const markSize = prominent ? 'h-12 w-12 border-[1.5px]' : 'h-9 w-9'
  const nameSize = prominent ? 'text-[2rem] font-semibold' : 'text-2xl'
  const taglineSize = prominent ? 'text-[10px] tracking-[0.32em]' : 'text-[9px] tracking-[0.28em]'

  return (
    <Link to="/" className={`group inline-flex items-center ${prominent ? 'gap-3.5' : 'gap-3'} ${textClass}`} aria-label="SUNÉA trang chủ">
      <span className={`relative flex items-center justify-center rounded-full border ${markSize} ${markClass} transition duration-300 group-hover:rotate-12`}>
        <span className="absolute -top-1 h-2 w-px bg-current" />
        <span className="absolute -bottom-1 h-2 w-px bg-current" />
        <span className="text-xs font-medium">S</span>
      </span>
      <span>
        <span className={`font-display block leading-none tracking-wide ${nameSize}`}>SUNÉA</span>
        {!compact && <span className={`mt-1 block uppercase opacity-60 ${taglineSize}`}>Summer, Your Way.</span>}
      </span>
    </Link>
  )
}
