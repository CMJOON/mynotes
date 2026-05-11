import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { User, ShoppingBag, Crown, BookOpen, Package, Star } from "lucide-react"
import PurchaseModal from "./PurchaseModal"

const TABS = [
  { key: "profile", zh: "我的资料", en: "Profile", icon: User },
  { key: "purchases", zh: "我的购买", en: "Purchases", icon: ShoppingBag },
  { key: "upgrade", zh: "升级会员", en: "Upgrade", icon: Crown },
]

function getPackageLabel(paidPackage) {
  if (!paidPackage) return null
  if (paidPackage === "premium") return { zh: "全站会员", en: "Premium — All Forms (1–5)" }
  const match = paidPackage.match(/^form(\d)$/)
  if (match) return { zh: `Form ${match[1]} 年级套餐`, en: `Form ${match[1]} Package — All Subjects` }
  return { zh: paidPackage, en: paidPackage }
}

function parseSubjectKey(key) {
  const match = key.match(/^(.+)_form(\d)$/)
  if (!match) return { subject: key, form: null }
  return { subject: match[1], form: match[2] }
}

function groupSubjectsByForm(paidSubjects = []) {
  const groups = {}
  for (const key of paidSubjects) {
    const { subject, form } = parseSubjectKey(key)
    if (!form) continue
    if (!groups[form]) groups[form] = []
    groups[form].push(subject)
  }
  return groups
}

const PRICING = [
  {
    key: "subject",
    title: "单科目",
    titleEn: "Single Subject",
    price: "RM 25",
    desc: "1个科目全部章节笔记与练习",
    descEn: "All notes & exercises for 1 subject",
    highlight: false,
    emoji: "📚",
  },
  {
    key: "form",
    title: "年级套餐",
    titleEn: "Form Package",
    price: "RM 100",
    desc: "1个年级全部科目",
    descEn: "All subjects for 1 form",
    highlight: true,
    emoji: "📦",
  },
  {
    key: "premium",
    title: "全站会员",
    titleEn: "Premium",
    price: "RM 150",
    desc: "Form 1-5 所有科目，永久有效",
    descEn: "All subjects Form 1–5, lifetime",
    highlight: false,
    emoji: "⭐",
  },
]

export default function Dashboard() {
  const { user, userData, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPurchase, setShowPurchase] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        加载中... / Loading...
      </div>
    )
  }

  if (!user) {
    navigate("/login")
    return null
  }

  const packageLabel = getPackageLabel(userData?.paidPackage)
  const subjectGroups = groupSubjectsByForm(userData?.paidSubjects)
  const hasSubjects = Object.keys(subjectGroups).length > 0
  const hasPurchases = !!packageLabel || hasSubjects

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

            {!hasPurchases ? (
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
              <div className="space-y-4">
                {packageLabel && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      套餐 / Package
                    </p>
                    <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-blue-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          {userData?.paidPackage === "premium"
                            ? <Star size={18} className="text-blue-600" />
                            : <Package size={18} className="text-blue-600" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{packageLabel.zh}</p>
                          <p className="text-sm text-gray-500">{packageLabel.en}</p>
                          <p className="text-xs text-gray-400 mt-0.5">永久有效 / Lifetime</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium shrink-0">
                        有效 / Active
                      </span>
                    </div>
                  </div>
                )}

                {hasSubjects && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      单科目解锁 / Single Subjects
                    </p>
                    <div className="space-y-3">
                      {Object.keys(subjectGroups).sort().map(form => (
                        <div key={form} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center">
                              <BookOpen size={14} className="text-gray-500" />
                            </div>
                            <p className="font-semibold text-gray-700 text-sm">Form {form}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {subjectGroups[form].map(subject => (
                              <div
                                key={subject}
                                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                <span className="text-sm text-gray-700">{subject}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 升级会员 */}
        {activeTab === "upgrade" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">升级会员 / Upgrade Membership</h2>
            <p className="text-sm text-gray-400 mb-6">
              选择配套，填写资料后通过 WhatsApp 完成购买 · Select a plan and complete purchase via WhatsApp.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING.map(plan => (
                <button
                  key={plan.key}
                  onClick={() => setShowPurchase(plan.key)}
                  className={`rounded-2xl p-6 text-center border-2 transition hover:shadow-lg w-full ${
                    plan.highlight
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white shadow-sm hover:border-blue-300"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      最受欢迎 / Most Popular
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 opacity-0 select-none">·</span>
                  )}
                  <h3 className="text-base font-bold text-gray-800 mt-3">
                    {plan.title} / {plan.titleEn}
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 my-3">{plan.price}</p>
                  <p className="text-sm text-gray-500">{plan.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{plan.descEn}</p>
                  <div className="mt-5 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-150">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.057 23.882a.5.5 0 0 0 .612.612l6.057-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.002-1.368l-.36-.214-3.713.91.934-3.626-.235-.373A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                    通过 WhatsApp 购买 / Buy
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              支持 Touch n Go eWallet · FPX · 更多即将推出 · Coming soon
            </p>
          </div>
        )}
      </div>

      <PurchaseModal
        open={!!showPurchase}
        onClose={() => setShowPurchase(false)}
        userData={userData}
        defaultForm={userData?.formLevel?.toString() || ""}
        defaultPackage={showPurchase || "subject"}
      />
    </div>
  )
}