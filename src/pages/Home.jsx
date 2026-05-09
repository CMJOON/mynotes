import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const FORMS = [
  { id: 1, label: "Form 1" },
  { id: 2, label: "Form 2" },
  { id: 3, label: "Form 3" },
  { id: 4, label: "Form 4" },
  { id: 5, label: "Form 5" },
]

const PRICING = [
  {
    title: "单科目 / Single Subject",
    price: "RM 25",
    desc: "1个年级的1个科目全部笔记与练习 / All notes & exercises for 1 subject",
    highlight: false,
  },
  {
    title: "年级套餐 / Form Package",
    price: "RM 100",
    desc: "1个年级全部科目 / All subjects for 1 form",
    highlight: true,
  },
  {
    title: "全站会员 / Premium",
    price: "RM 150",
    desc: "Form 1-5 所有科目 / All subjects Form 1-5",
    highlight: false,
  },
]

const STATS = [
  { value: "500+", label: "份学习资料 / Materials" },
  { value: "11", label: "热门科目 / Subjects" },
  { value: "RM 25", label: "起步价格 / Starting Price" },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>

      {/* Hero */}
      <section className="text-center px-4 py-24" style={{ backgroundColor: "#e8eef4" }}>
        <span className="inline-block bg-blue-100 text-blue-600 text-sm px-4 py-1 rounded-full mb-6 font-medium">
          专为马来西亚学生打造 / Built for Malaysian Students
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          找到你需要的学习资料
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          SPM Trial · Past Year · 笔记 · 练习，简洁易懂
        </p>
        {user ? (
          <div className="flex justify-center gap-4">
            <Link
              to="/form/5"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              浏览资料 / Browse Materials
            </Link>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              免费注册 / Register Free
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              了解更多 / Learn More
            </Link>
          </div>
        )}
      </section>

      {/* 统计数字 */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-200">
          {STATS.map((s) => (
            <div key={s.label} className="text-center py-10">
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 年级入口 */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          选择年级 / Select Your Form
        </h2>
        <p className="text-gray-500 mb-8">点击年级查看所有科目资料</p>
        <div className="flex justify-center gap-6 flex-wrap">
          {FORMS.map((f) => (
            <Link
              key={f.id}
              to={`/form/${f.id}`}
              className="w-28 h-28 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 flex flex-col items-center justify-center font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition shadow-sm"
            >
              <span className="text-2xl font-bold">{f.id}</span>
              <span className="text-sm mt-1">Form {f.id}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 套餐定价 */}
      <section className="bg-white py-16 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            套餐定价 / Pricing
          </h2>
          <p className="text-gray-500 mb-8">SPM Trial & Past Year 永久免费</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.title}
                className={`rounded-2xl p-6 text-center border-2 transition ${
                  plan.highlight
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    最受欢迎 / Popular
                  </span>
                )}
                <h3 className="text-base font-bold text-gray-800 mt-3">{plan.title}</h3>
                <p className="text-3xl font-bold text-blue-600 my-3">{plan.price}</p>
                <p className="text-sm text-gray-500">{plan.desc}</p>
                {!user && (
                  <Link
                    to="/register"
                    className="mt-4 inline-block w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
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
      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-200">
        © 2026 MyNotes · 专为马来西亚中学生而设
      </footer>
    </div>
  )
}