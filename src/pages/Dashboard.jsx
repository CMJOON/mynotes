import { useState, useRef, useCallback, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { User, ShoppingBag, Crown, BookOpen, Package, Star, RefreshCw, Clock, Trash2, CheckCircle2, BarChart3 } from "lucide-react"
import PurchaseModal from "./PurchaseModal"
import { PRICING } from "../utils/constants"
import toast from "react-hot-toast"
import { db } from "../firebase"
import { loadUserMaterialList, removeCompletedMaterial, removeSavedMaterial } from "../utils/userMaterials"

const TABS = [
  { key: "profile", zh: "我的资料", en: "Profile", icon: User },
  { key: "saved", zh: "我的收藏", en: "Saved", icon: Star },
  { key: "recent", zh: "最近查看", en: "Recent", icon: Clock },
  { key: "progress", zh: "学习进度", en: "Progress", icon: BarChart3 },
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

function getMaterialMeta(material) {
  const parts = [
    material.type,
    material.form ? `Form ${material.form}` : "",
    material.subjectName,
  ]

  if (material.chapter > 0) parts.push(`第${material.chapter}章`)
  if (material.year > 0) parts.push(material.year)
  if (material.state) parts.push(material.state)

  return parts.filter(Boolean).join(" · ")
}

function formatTimestamp(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return ""

  return date.toLocaleDateString("en-MY", {
    month: "short",
    day: "numeric",
  })
}

function MaterialList({ items, emptyIcon: EmptyIcon, emptyTitle, emptyDesc, onRemoveSaved, onRemoveCompleted }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <EmptyIcon size={40} className="mx-auto mb-3 opacity-30" />
        <p>{emptyTitle}</p>
        <p className="text-sm mt-1">{emptyDesc}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(material => (
        <div
          key={material.id}
          className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 break-words">{material.title}</p>
            <p className="text-xs text-gray-400 mt-1">{getMaterialMeta(material)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {material.savedAt ? `收藏于 / Saved ${formatTimestamp(material.savedAt)}` : ""}
              {material.viewedAt ? `最近查看 / Viewed ${formatTimestamp(material.viewedAt)}` : ""}
              {material.completedAt ? `完成于 / Completed ${formatTimestamp(material.completedAt)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            {onRemoveSaved && (
              <button
                onClick={() => onRemoveSaved(material.id)}
                className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 text-sm px-3 py-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 transition"
              >
                <Trash2 size={14} /> 移除
              </button>
            )}
            {onRemoveCompleted && (
              <button
                onClick={() => onRemoveCompleted(material.id)}
                className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 text-sm px-3 py-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 transition"
              >
                <Trash2 size={14} /> 撤销
              </button>
            )}
            {material.form && material.subjectId && (
              <Link
                to={`/form/${material.form}/${material.subjectId}`}
                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                前往科目
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function getProgressKey(material) {
  return `${material.form || 0}__${material.subjectId || material.subjectName || "unknown"}`
}

function buildSubjectProgress(allMaterials, completedMaterials) {
  const rows = new Map()

  for (const material of allMaterials) {
    const key = getProgressKey(material)
    const current = rows.get(key) || {
      key,
      form: material.form || 0,
      subjectName: material.subjectName || "Unknown",
      total: 0,
      completed: 0,
    }
    current.total += 1
    rows.set(key, current)
  }

  const completedIds = new Set(completedMaterials.map(material => material.materialId || material.id))
  for (const material of allMaterials) {
    if (!completedIds.has(material.id)) continue
    const key = getProgressKey(material)
    const current = rows.get(key)
    if (current) current.completed += 1
  }

  for (const material of completedMaterials) {
    const key = getProgressKey(material)
    if (rows.has(key)) continue
    rows.set(key, {
      key,
      form: material.form || 0,
      subjectName: material.subjectName || "Unknown",
      total: 1,
      completed: 1,
    })
  }

  return Array.from(rows.values())
    .filter(row => row.total > 0)
    .map(row => ({
      ...row,
      percent: Math.round((row.completed / row.total) * 100),
    }))
    .sort((a, b) => a.form - b.form || a.subjectName.localeCompare(b.subjectName))
}

export default function Dashboard() {
  const { user, userData, loading, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPurchase, setShowPurchase] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [savedMaterials, setSavedMaterials] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])
  const [completedMaterials, setCompletedMaterials] = useState([])
  const [allMaterials, setAllMaterials] = useState([])
  const lastRefreshRef = useRef(0)

  const handleRefresh = useCallback(async () => {
    const now = Date.now()
    const COOLDOWN = 30000 // 30秒冷却
    const remaining = Math.ceil((COOLDOWN - (now - lastRefreshRef.current)) / 1000)

    if (now - lastRefreshRef.current < COOLDOWN) {
      toast.error(`请等待 ${remaining} 秒后再刷新 / Please wait ${remaining}s`)
      return
    }

    lastRefreshRef.current = now
    setRefreshing(true)
    try {
      await refreshUserData()
      toast.success("权限已刷新 / Permissions refreshed!")
    } catch {
      toast.error("刷新失败 / Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }, [refreshUserData])

  const loadLibraryLists = useCallback(async () => {
    if (!user) return

    setLibraryLoading(true)
    try {
      const [saved, recent, completed, materialsSnapshot] = await Promise.all([
        loadUserMaterialList(user, "savedMaterials"),
        loadUserMaterialList(user, "recentMaterials"),
        loadUserMaterialList(user, "completedMaterials", 100),
        getDocs(collection(db, "materials")),
      ])
      setSavedMaterials(saved)
      setRecentMaterials(recent)
      setCompletedMaterials(completed)
      setAllMaterials(materialsSnapshot.docs.map(item => ({ id: item.id, ...item.data() })))
    } catch {
      toast.error("学习记录加载失败 / Failed to load learning records")
    } finally {
      setLibraryLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadLibraryLists()
  }, [loadLibraryLists])

  const handleRemoveSaved = async (materialId) => {
    try {
      await removeSavedMaterial(user, materialId)
      setSavedMaterials(prev => prev.filter(material => material.id !== materialId))
      toast.success("已移除收藏 / Removed from saved")
    } catch {
      toast.error("移除失败 / Failed to remove saved material")
    }
  }

  const handleRemoveCompleted = async (materialId) => {
    try {
      await removeCompletedMaterial(user, materialId)
      setCompletedMaterials(prev => prev.filter(material => material.id !== materialId))
      toast.success("已撤销完成 / Completion removed")
    } catch {
      toast.error("撤销失败 / Failed to update progress")
    }
  }

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
  const subjectProgress = buildSubjectProgress(allMaterials, completedMaterials)
  const completedCount = completedMaterials.length
  const totalMaterialCount = allMaterials.length
  const overallPercent = totalMaterialCount
    ? Math.round((completedCount / totalMaterialCount) * 100)
    : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
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

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 bg-white px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "刷新中..." : "刷新权限 / Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
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

        {/* 我的收藏 */}
        {activeTab === "saved" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">我的收藏 / Saved Materials</h2>
            <p className="text-sm text-gray-400 mb-5">把常用资料留在这里，之后可以快速回到对应科目。</p>
            {libraryLoading ? (
              <div className="text-center py-12 text-gray-400">加载中... / Loading...</div>
            ) : (
              <MaterialList
                items={savedMaterials}
                emptyIcon={Star}
                emptyTitle="还没有收藏资料"
                emptyDesc="Save useful materials for quick access"
                onRemoveSaved={handleRemoveSaved}
              />
            )}
          </div>
        )}

        {/* 最近查看 */}
        {activeTab === "recent" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">最近查看 / Recent Materials</h2>
            <p className="text-sm text-gray-400 mb-5">打开或下载资料后，会自动记录在这里。</p>
            {libraryLoading ? (
              <div className="text-center py-12 text-gray-400">加载中... / Loading...</div>
            ) : (
              <MaterialList
                items={recentMaterials}
                emptyIcon={Clock}
                emptyTitle="还没有查看记录"
                emptyDesc="Viewed materials will appear here"
              />
            )}
          </div>
        )}

        {/* 学习进度 */}
        {activeTab === "progress" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">学习进度 / Learning Progress</h2>
              <p className="text-sm text-gray-400 mb-5">在资料卡点击“完成”，这里会自动更新。</p>

              {libraryLoading ? (
                <div className="text-center py-12 text-gray-400">加载中... / Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-400">总完成度 / Overall</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{overallPercent}%</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-400">已完成 / Completed</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{completedCount}</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-400">资料总数 / Materials</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{totalMaterialCount}</p>
                    </div>
                  </div>

                  {subjectProgress.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
                      <p>还没有进度记录</p>
                      <p className="text-sm mt-1">Mark materials as completed to track progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subjectProgress.map(row => (
                        <div key={row.key} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">Form {row.form} · {row.subjectName}</p>
                              <p className="text-xs text-gray-400">{row.completed} / {row.total} completed</p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{row.percent}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">已完成资料 / Completed Materials</h2>
              <p className="text-sm text-gray-400 mb-5">你可以撤销完成状态，进度会同步更新。</p>
              {libraryLoading ? (
                <div className="text-center py-12 text-gray-400">加载中... / Loading...</div>
              ) : (
                <MaterialList
                  items={completedMaterials}
                  emptyIcon={CheckCircle2}
                  emptyTitle="还没有完成资料"
                  emptyDesc="Completed materials will appear here"
                  onRemoveCompleted={handleRemoveCompleted}
                />
              )}
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
