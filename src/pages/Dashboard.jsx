import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { User, ShoppingBag, Download, Crown } from "lucide-react"

const TABS = [
  { key: "profile", zh: "我的资料", en: "Profile", icon: User },
  { key: "purchases", zh: "我的购买", en: "Purchases", icon: ShoppingBag },
  { key: "upgrade", zh: "升级会员", en: "Upgrade", icon: Crown },
]

const PRICING = [
  {
    key: "subject",
    title: "单科目 / Single Subject",
    price: "RM 25",
    desc: "1个科目全部章节笔记与练习",
    highlight: false,
  },
  {
    key: "form",
    title: "年级套餐 / Form Package",
    price: "RM 100",
    desc: "1个年级全部科目",
    highlight: true,
  },
  {
    key: "premium",
    title: "全站会员 / Premium",
    price: "RM 150",
    desc: "Form 1-5 所有科目，永久有效",
    highlight: false,
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    async function fetchUser() {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) setUserData(userDoc.data())
      setLoading(false)
    }
    fetchUser()
  }, [user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        加载中... / Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{userData?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">{userData?.email}</span>
              {userData?.role === "paid" ? (
                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Crown size={10} /> 付费会员
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  免费用户
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <tab.icon size={15} />
              {tab.zh}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 我的资料 */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">我的资料 / My Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">姓名 / Name</label>
                <p className="font-medium text-gray-800">{userData?.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">邮箱 / Email</label>
                <p className="font-medium text-gray-800">{userData?.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">年级 / Form</label>
                <p className="font-medium text-gray-800">Form {userData?.formLevel}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">账号类型 / Account Type</label>
                <p className="font-medium text-gray-800">
                  {userData?.role === "paid" ? "付费会员 / Paid Member" : "免费用户 / Free User"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 我的购买 */}
        {activeTab === "purchases" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">我的购买 / My Purchases</h2>
            {userData?.paidSubjects?.length === 0 && !userData?.paidPackage ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p>还没有购买记录</p>
                <p className="text-sm mt-1">No purchases yet</p>
                <button
                  onClick={() => setActiveTab("upgrade")}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  立即升级 / Upgrade Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userData?.paidPackage && (
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {userData.paidPackage === "premium" ? "全站会员 / Premium" : `年级套餐 / Form Package`}
                      </p>
                      <p className="text-sm text-gray-500">永久有效 / Lifetime</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
                      有效 / Active
                    </span>
                  </div>
                )}
                {userData?.paidSubjects?.map(subject => (
                  <div key={subject} className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                    <div>
                      <p className="font-semibold text-gray-800">{subject}</p>
                      <p className="text-sm text-gray-500">单科目 / Single Subject</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
                      有效 / Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 升级会员 */}
        {activeTab === "upgrade" && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-6">升级会员 / Upgrade</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING.map(plan => (
                <div
                  key={plan.key}
                  className={`bg-white rounded-2xl p-6 text-center border-2 transition ${
                    plan.highlight
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  {plan.highlight && (
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      最受欢迎 / Popular
                    </span>
                  )}
                  <h3 className="text-base font-bold text-gray-800 mt-3">{plan.title}</h3>
                  <p className="text-3xl font-bold text-blue-600 my-3">{plan.price}</p>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                    立即购买 / Buy Now
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              支持 Touch n Go eWallet · FPX · 即将推出
            </p>
          </div>
        )}
      </div>
    </div>
  )
}