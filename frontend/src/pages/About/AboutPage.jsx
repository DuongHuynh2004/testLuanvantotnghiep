import { ArrowRight, Compass, Heart, Sparkles, Sun, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'

const brandMeaning = [
  { icon: Sun, word: 'SUN', label: 'Ánh nắng', copy: 'Nguồn năng lượng, sự trẻ trung và cảm hứng cho những ngày luôn chuyển động.' },
  { icon: Waves, word: 'SEA', label: 'Biển', copy: 'Cảm giác tự do, thư giãn và tinh thần sẵn sàng cho những hành trình mới.' },
  { icon: Heart, word: 'YOU', label: 'Chính bạn', copy: 'Điều quan trọng nhất của SUNÉA: phong cách riêng và sự tự tin của người mặc.' },
]

const values = [
  ['01', 'Tự do', 'Không có một công thức duy nhất cho phong cách. Hãy mặc theo cách khiến bạn là chính mình.'],
  ['02', 'Thoải mái', 'Phom dáng dễ mặc và tính ứng dụng cao để bạn luôn tự nhiên trong từng chuyển động.'],
  ['03', 'Cá tính', 'Mỗi thiết kế đủ linh hoạt để bạn phối đồ và kể câu chuyện riêng qua trang phục.'],
  ['04', 'Hiện đại', 'Ngôn ngữ thiết kế trẻ trung, tinh gọn, cân bằng giữa xu hướng và đời sống.'],
  ['05', 'Trải nghiệm', 'Hành trình mua sắm rõ ràng, thuận tiện từ lúc khám phá đến khi nhận sản phẩm.'],
]

/** Kể câu chuyện, ý nghĩa tên gọi và các giá trị cốt lõi của thương hiệu SUNÉA. */
export default function AboutPage() {
  return (
    <div className="min-h-svh bg-off-white text-dark">
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:pb-24 lg:pt-16">
          <div className="relative z-10">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-pastel-green">Về SUNÉA · Est. 2026</p>
            <h1 className="font-display mt-5 max-w-2xl text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">Mùa hè không chỉ là một mùa.<br /><em className="font-normal text-pastel-green">Đó là một tinh thần.</em></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-gray sm:text-lg sm:leading-8">SUNÉA mang tinh thần mùa hè hiện đại, trẻ trung và tự do vào những thiết kế dễ mặc, thoải mái và linh hoạt — để mỗi người tự tin thể hiện phong cách riêng.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-dark px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5">Khám phá sản phẩm <ArrowRight size={16} /></Link>
              <Link to="/summer-collection" className="inline-flex items-center gap-2 rounded-full border border-dark px-6 py-3 text-sm font-medium transition hover:bg-dark hover:text-white">Chase the sun <Compass size={16} /></Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-mint shadow-[0_28px_80px_rgba(38,49,46,0.14)] sm:rounded-[3rem]">
              <img src="/images/about-sunea-editorial.png" alt="Phong cách thời trang mùa hè unisex của SUNÉA" className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]" />
            </div>
            <div className="absolute -bottom-5 left-5 rounded-2xl bg-white/95 px-5 py-4 shadow-lg backdrop-blur sm:left-8"><p className="text-[10px] uppercase tracking-[0.24em] text-gray">Brand attitude</p><p className="font-display mt-1 text-2xl">Fresh. Free. You.</p></div>
          </div>
        </section>

        <section className="bg-dark text-white">
          <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
            <Sparkles className="mx-auto text-soft-yellow" size={28} strokeWidth={1.5} />
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-white/55">Our point of view</p>
            <h2 className="font-display mx-auto mt-5 max-w-4xl text-4xl leading-tight sm:text-6xl">Chúng tôi không quyết định bạn phải mặc như thế nào.</h2>
            <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/65">SUNÉA mang đến những lựa chọn để bạn tự tạo nên phong cách của mình. Một chiếc áo vừa vặn, một chất liệu dễ chịu hay đơn giản là một bộ trang phục khiến bạn tự tin bước ra ngoài.</p>
            <p className="font-display mt-8 text-2xl italic text-soft-yellow sm:text-3xl">This is your summer. Wear it your way.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.28em] text-pastel-green">Tên gọi SUNÉA</p><h2 className="font-display mt-4 text-4xl sm:text-5xl">Được tạo nên từ nắng, biển và chính bạn.</h2></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {brandMeaning.map(({ icon: Icon, word, label, copy }) => <article key={word} className="group rounded-[2rem] border border-beige bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"><div className="flex items-center justify-between"><Icon className="text-pastel-green" size={26} strokeWidth={1.5} /><span className="font-display text-5xl text-dark/10 transition group-hover:text-pastel-green/25">{word}</span></div><h3 className="mt-8 text-xl font-medium">{word} — {label}</h3><p className="mt-3 text-sm leading-6 text-gray">{copy}</p></article>)}
          </div>
        </section>

        <section className="border-y border-beige bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="overflow-hidden rounded-[2rem] bg-sky-blue"><img src="/images/about-sunea-story.png" alt="Những người trẻ tận hưởng chuyến đi mùa hè cùng SUNÉA" className="aspect-[4/3] w-full object-cover" /></div>
            <div className="lg:pl-8"><p className="text-xs font-medium uppercase tracking-[0.28em] text-pastel-green">Câu chuyện của chúng tôi</p><h2 className="font-display mt-4 text-4xl sm:text-5xl">Đẹp không cần phải phức tạp.</h2><div className="mt-6 space-y-4 leading-7 text-gray"><p>SUNÉA được hình thành từ tình yêu dành cho những ngày đầy nắng, những chuyến đi bất chợt và cảm giác tự do khi được mặc đúng với phong cách của chính mình.</p><p>Lấy cảm hứng từ ánh nắng, biển xanh và nhịp sống trẻ, chúng tôi xây dựng một tủ đồ hiện đại, tối giản nhưng vẫn có điểm nhấn — dễ mặc, dễ phối và sẵn sàng cho mọi kế hoạch.</p></div><div className="mt-8 grid grid-cols-3 gap-3 border-t border-beige pt-6 text-center"><div><strong className="font-display block text-2xl">Fresh</strong><span className="text-xs text-gray">Tươi mới</span></div><div><strong className="font-display block text-2xl">Minimal</strong><span className="text-xs text-gray">Tinh gọn</span></div><div><strong className="font-display block text-2xl">Expressive</strong><span className="text-xs text-gray">Cá tính</span></div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.28em] text-pastel-green">Giá trị thương hiệu</p><h2 className="font-display mt-4 text-4xl sm:text-5xl">Điều SUNÉA luôn theo đuổi</h2></div><p className="max-w-md text-sm leading-6 text-gray">Mỗi quyết định của chúng tôi bắt đầu từ người mặc và trải nghiệm trong đời sống hàng ngày.</p></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-beige bg-beige sm:grid-cols-2 lg:grid-cols-5">{values.map(([number, title, copy]) => <article key={number} className="bg-white p-6"><span className="text-xs font-medium text-pastel-green">{number}</span><h3 className="font-display mt-12 text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-gray">{copy}</p></article>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-mint px-6 py-12 sm:px-12 sm:py-16 lg:px-20"><div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[50px] border-white/30" /><div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.28em] text-dark/55">Unisex by SUNÉA</p><h2 className="font-display mt-4 text-5xl sm:text-6xl">Không giới hạn phong cách.</h2><p className="mt-6 max-w-2xl leading-7 text-dark/65">SUNÉA hướng đến thời trang linh hoạt, không bị giới hạn bởi những quy tắc phối đồ cứng nhắc. Hãy chọn trang phục dựa trên điều quan trọng nhất: bạn thích nó và bạn cảm thấy tự tin khi mặc nó.</p></div><Link to="/products" className="inline-flex w-fit items-center gap-2 rounded-full bg-dark px-6 py-3 text-sm font-medium text-white lg:justify-self-end">Tìm phong cách của bạn <ArrowRight size={16} /></Link></div></div>
        </section>

        <section className="border-y border-beige bg-white">
          <div className="mx-auto grid max-w-6xl gap-px bg-beige md:grid-cols-2"><article className="bg-white px-5 py-14 md:pr-12"><p className="text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Sứ mệnh</p><h2 className="font-display mt-4 text-4xl">Thời trang đẹp trong đời sống thật.</h2><p className="mt-5 leading-7 text-gray">Tạo ra sản phẩm mùa hè hiện đại, dễ mặc và dễ phối; cân bằng thiết kế, sự thoải mái, tính ứng dụng, chất lượng và mức giá phù hợp.</p></article><article className="bg-white px-5 py-14 md:pl-12"><p className="text-xs font-medium uppercase tracking-[0.24em] text-pastel-green">Tầm nhìn</p><h2 className="font-display mt-4 text-4xl">Một trải nghiệm luôn tiến về phía trước.</h2><p className="mt-5 leading-7 text-gray">Kết hợp thời trang, thương mại điện tử và công nghệ để hành trình mua sắm ngày càng trực quan, thuận tiện và gần gũi với từng khách hàng.</p></article></div>
        </section>

        <section className="bg-dark text-white"><div className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-16 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.28em] text-white/55">Made for your summer</p><h2 className="font-display mt-3 max-w-2xl text-4xl sm:text-5xl">Mùa hè này, mặc theo cách của bạn.</h2></div><Link to="/products" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-dark transition hover:-translate-y-0.5">Bắt đầu khám phá <ArrowRight size={16} /></Link></div></section>
      </main>
      <Footer />
    </div>
  )
}
