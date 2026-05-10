import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { BookOpen, FileText, Download, Star } from "lucide-react"

const FORMS = [1, 2, 3, 4, 5]

const PRICING = [
  {
    title: "单科目",
    titleEn: "Single Subject",
    price: "RM 20",
    desc: "1个科目全部章节笔记与练习",
    descEn: "All notes & exercises for 1 subject",
    highlight: false,
  },
  {
    title: "年级套餐",
    titleEn: "Form Package",
    price: "RM 100",
    desc: "1个年级全部科目",
    descEn: "All subjects for 1 form",
    highlight: true,
  },
  {
    title: "全站会员",
    titleEn: "Premium",
    price: "RM 150",
    desc: "Form 1-5 所有科目，永久有效",
    descEn: "All subjects Form 1-5, lifetime",
    highlight: false,
  },
]

const FEATURES = [
  { icon: FileText, title: "SPM Trial Papers", desc: "历年各州试卷，完全免费下载", descEn: "All states, free download" },
  { icon: BookOpen, title: "Past Year Papers", desc: "SPM历年真题，完全免费", descEn: "SPM past years, free" },
  { icon: Download, title: "笔记与练习", desc: "系统化笔记，前3章免费", descEn: "Structured notes, first 3 chapters free" },
  { icon: Star, title: "低价解锁", desc: "单科目只需 RM 20", descEn: "Single subject from RM 20" },
]

const STATS = [
  { value: "500+", label: "份学习资料", labelEn: "Materials" },
  { value: "11", label: "热门科目", labelEn: "Subjects" },
  { value: "RM 20", label: "起步价格", labelEn: "Starting Price" },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section style={{ backgroundColor: "#eef2f7" }} className="px-4 py-20 text-center border-b border-gray-200">
        <span className="inline-block bg-blue-100 text-blue-600 text-xs px-4 py-1.5 rounded-full mb-6 font-medium tracking-wide">
          专为马来西亚学生打造 · Built for Malaysian Students
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          找到你需要的<br />
          <span className="text-blue-600">学习资料</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          SPM Trial · Past Year · 笔记 · 练习<br />
          免费起步，低价解锁完整内容
        </p>
        {user ? (
          <Link
            to="/form/5"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
          >
            浏览资料 / Browse Materials
          </Link>
        ) : (
          <div className="flex justify-center gap-3">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              免费注册 / Register Free
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              登录 / Login
            </Link>
          </div>
        )}
      </section>

      {/* 统计数字 */}
      <section className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-200">
          {STATS.map((s) => (
            <div key={s.label} className="text-center py-8">
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label} / {s.labelEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 年级入口 */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">选择年级 / Select Your Form</h2>
          <p className="text-gray-500 mt-2">点击年级查看所有科目资料</p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          {FORMS.map((f) => (
            <Link
              key={f}
              to={`/form/${f}`}
              className="w-32 h-32 rounded-2xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition shadow-sm group"
            >
              <span className="text-3xl font-bold group-hover:text-blue-600 text-gray-800">{f}</span>
              <span className="text-sm mt-1 text-gray-500 group-hover:text-blue-500">Form {f}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 功能特点 */}
      <section style={{ backgroundColor: "#eef2f7" }} className="py-16 px-4 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">我们提供什么 / What We Offer</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon size={24} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
                <p className="text-xs text-gray-400">{f.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 套餐定价 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">套餐定价 / Pricing</h2>
            <p className="text-gray-500 mt-2">SPM Trial & Past Year 永久免费 · Trial & Past Year papers are always free</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.title}
                className={`rounded-2xl p-6 text-center border-2 transition ${
                  plan.highlight
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    最受欢迎 / Popular
                  </span>
                )}
                <h3 className="text-base font-bold text-gray-800 mt-3">
                  {plan.title} / {plan.titleEn}
                </h3>
                <p className="text-4xl font-bold text-blue-600 my-4">{plan.price}</p>
                <p className="text-sm text-gray-500">{plan.desc}</p>
                <p className="text-xs text-gray-400 mt-1">{plan.descEn}</p>
                {!user && (
                  <Link
                    to="/register"
                    className="mt-5 inline-block w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    立即开始 / Get Started
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        <p>© 2026 MyNotes · 专为马来西亚中学生而设</p>
        <p className="mt-1">Made with ❤️ for Malaysian students</p>
      </footer>
    </div>
  )
}