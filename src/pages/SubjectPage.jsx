import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { Lock, Download, Eye, Star, CheckCircle2, Filter, X } from "lucide-react"
import toast from "react-hot-toast"
import PurchaseModal from "./PurchaseModal"
import { canAccess } from "../utils/access"
import { buildDownloadUrl, getMaterialFileUrl } from "../utils/materialFiles"
import { EXAM_YEARS, MALAYSIA_STATES, PAPER_TYPES } from "../utils/constants"
import {
  completeMaterialForUser,
  loadCompletedMaterialIds,
  loadSavedMaterialIds,
  recordRecentMaterial,
  removeCompletedMaterial,
  removeSavedMaterial,
  saveMaterialForUser,
} from "../utils/userMaterials"

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

const TABS = [
  { key: "all", zh: "全部", en: "All" },
  { key: "note", zh: "笔记", en: "Notes" },
  { key: "exercise", zh: "练习", en: "Exercise" },
  { key: "trial", zh: "Trial", en: "Trial" },
  { key: "pastyear", zh: "Past Year", en: "Past Year" },
]

const ANSWER_OPTIONS = [
  { value: "", label: "全部答案状态 / Any Answer" },
  { value: "yes", label: "有答案 / Has Answer" },
  { value: "no", label: "无答案 / No Answer" },
]

function getPaperTypeLabel(value) {
  return PAPER_TYPES.find(paper => paper.value === value)?.label || value
}

function getAnswerSchemeLabel(hasAnswerScheme) {
  return hasAnswerScheme ? "有答案 / Answer" : "无答案 / No Answer"
}

export default function SubjectPage() {
  const { formId, subjectId } = useParams()
  const { user, userData } = useAuth()
  const [subject, setSubject] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [purchaseMaterial, setPurchaseMaterial] = useState(null)
  const [busyAction, setBusyAction] = useState("")
  const [savedMaterialIds, setSavedMaterialIds] = useState(new Set())
  const [completedMaterialIds, setCompletedMaterialIds] = useState(new Set())
  const [savingMaterialId, setSavingMaterialId] = useState("")
  const [completingMaterialId, setCompletingMaterialId] = useState("")
  const [examFilters, setExamFilters] = useState({
    year: "",
    state: "",
    paperType: "",
    answer: "",
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const subjectDoc = await getDoc(doc(db, "subjects", subjectId))
        if (subjectDoc.exists()) {
          setSubject({ id: subjectDoc.id, ...subjectDoc.data() })
        }

        const q = query(
          collection(db, "materials"),
          where("form", "==", parseInt(formId)),
          where("subjectId", "==", subjectId)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => (a.chapter || a.year || 0) - (b.chapter || b.year || 0))
        setMaterials(data)
      } catch (error) {
        console.error("获取数据失败:", error)
        toast.error("获取数据失败 / Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [formId, subjectId])

  useEffect(() => {
    async function fetchUserMaterialState() {
      try {
        const [savedIds, completedIds] = await Promise.all([
          loadSavedMaterialIds(user),
          loadCompletedMaterialIds(user),
        ])
        setSavedMaterialIds(savedIds)
        setCompletedMaterialIds(completedIds)
      } catch {
        setSavedMaterialIds(new Set())
        setCompletedMaterialIds(new Set())
      }
    }
    fetchUserMaterialState()
  }, [user])

  const handleView = async (material) => {
    if (!canAccess(user, userData, material)) {
      setPurchaseMaterial(material)
      return
    }
    setBusyAction(`view-${material.id}`)
    try {
      const fileUrl = await getMaterialFileUrl(material, user, userData)
      recordRecentMaterial(user, material, "view").catch(() => {})
      window.open(fileUrl, "_blank")
    } catch {
      toast.error("文件不存在 / File not found")
    } finally {
      setBusyAction("")
    }
  }

  const handleDownload = async (material) => {
    if (!canAccess(user, userData, material)) {
      setPurchaseMaterial(material)
      return
    }
    setBusyAction(`download-${material.id}`)
    try {
      const fileUrl = await getMaterialFileUrl(material, user, userData)
      recordRecentMaterial(user, material, "download").catch(() => {})
      const link = document.createElement("a")
      link.href = buildDownloadUrl(fileUrl, material.title)
      link.setAttribute("download", material.title + ".pdf")
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => document.body.removeChild(link), 100)
      toast.success("下载已开始！/ Download started!")
    } catch {
      toast.error("下载失败 / Download failed")
    } finally {
      setBusyAction("")
    }
  }

  const handleToggleSaved = async (material) => {
    if (!user) {
      toast.error("请先登录后收藏 / Please login to save materials")
      return
    }

    const isSaved = savedMaterialIds.has(material.id)
    setSavingMaterialId(material.id)
    try {
      if (isSaved) {
        await removeSavedMaterial(user, material.id)
        setSavedMaterialIds(prev => {
          const next = new Set(prev)
          next.delete(material.id)
          return next
        })
        toast.success("已取消收藏 / Removed from saved")
      } else {
        await saveMaterialForUser(user, material)
        setSavedMaterialIds(prev => new Set(prev).add(material.id))
        toast.success("已收藏 / Saved")
      }
    } catch {
      toast.error("收藏失败 / Failed to update saved materials")
    } finally {
      setSavingMaterialId("")
    }
  }

  const handleToggleCompleted = async (material) => {
    if (!user) {
      toast.error("请先登录后记录进度 / Please login to track progress")
      return
    }

    if (!canAccess(user, userData, material)) {
      setPurchaseMaterial(material)
      return
    }

    const isCompleted = completedMaterialIds.has(material.id)
    setCompletingMaterialId(material.id)
    try {
      if (isCompleted) {
        await removeCompletedMaterial(user, material.id)
        setCompletedMaterialIds(prev => {
          const next = new Set(prev)
          next.delete(material.id)
          return next
        })
        toast.success("已取消完成 / Marked as not completed")
      } else {
        await completeMaterialForUser(user, material)
        setCompletedMaterialIds(prev => new Set(prev).add(material.id))
        toast.success("已标记完成 / Marked as completed")
      }
    } catch {
      toast.error("更新进度失败 / Failed to update progress")
    } finally {
      setCompletingMaterialId("")
    }
  }

  const filtered = activeTab === "all"
    ? materials
    : materials.filter(m => m.type === activeTab)

  const filteredMaterials = filtered.filter(material => {
    if (activeTab === "note" || activeTab === "exercise") return true

    if (examFilters.year && Number(material.year || 0) !== Number(examFilters.year)) return false
    if (activeTab !== "pastyear" && examFilters.state && material.state !== examFilters.state) return false
    if (examFilters.paperType && material.paperType !== examFilters.paperType) return false
    if (examFilters.answer === "yes" && !material.hasAnswerScheme) return false
    if (examFilters.answer === "no" && material.hasAnswerScheme) return false
    return true
  })

  const showExamFilters = activeTab === "all" || activeTab === "trial" || activeTab === "pastyear"

  function updateExamFilter(name, value) {
    setExamFilters(prev => ({ ...prev, [name]: value }))
  }

  function clearExamFilters() {
    setExamFilters({
      year: "",
      state: "",
      paperType: "",
      answer: "",
    })
  }

  const subjectName = subject?.name || ""

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <Link to={`/form/${formId}`} className="text-sm text-blue-600 hover:underline">
            Back to Form {formId}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-4xl">{subject?.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{subject?.name}</h1>
              <p className="text-gray-500">{subject?.nameZh} · Form {formId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.zh} / {tab.en}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {showExamFilters && (
          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter size={16} className="text-blue-600" />
                试卷筛选 / Exam Filters
              </div>
              {(examFilters.year || examFilters.state || examFilters.paperType || examFilters.answer) && (
                <button
                  onClick={clearExamFilters}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                >
                  <X size={13} /> 清除 / Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={examFilters.year}
                onChange={event => updateExamFilter("year", event.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部年份 / Any Year</option>
                {EXAM_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={examFilters.state}
                onChange={event => updateExamFilter("state", event.target.value)}
                disabled={activeTab === "pastyear"}
                title="Only applies to Trial Paper"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">全部州属 / Any State</option>
                {MALAYSIA_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <select
                value={examFilters.paperType}
                onChange={event => updateExamFilter("paperType", event.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部试卷 / Any Paper</option>
                {PAPER_TYPES.map(paper => (
                  <option key={paper.value} value={paper.value}>{paper.label}</option>
                ))}
              </select>

              <select
                value={examFilters.answer}
                onChange={event => updateExamFilter("answer", event.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ANSWER_OPTIONS.map(answer => (
                  <option key={answer.value || "all"} value={answer.value}>{answer.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中... / Loading...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无资料 / No materials found</div>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map(material => {
              const accessible = canAccess(user, userData, material)
              const isFree = material.type === "trial" || material.type === "pastyear" || material.isFree
              const isSaved = savedMaterialIds.has(material.id)
              const isCompleted = completedMaterialIds.has(material.id)

              return (
                <div
                  key={material.id}
                  className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {accessible
                      ? <span className="text-green-500"><Eye size={18} /></span>
                      : <span className="text-gray-400"><Lock size={18} /></span>
                    }
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 break-words">{material.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {TYPE_LABELS[material.type]?.zh} / {TYPE_LABELS[material.type]?.en}
                        </span>
                        {material.chapter > 0 && (
                          <span className="text-xs text-gray-400">· 第{material.chapter}章</span>
                        )}
                        {material.year > 0 && (
                          <span className="text-xs text-gray-400">· {material.year}</span>
                        )}
                        {material.state && (
                          <span className="text-xs text-gray-400">· {material.state}</span>
                        )}
                        {material.paperType && (
                          <span className="text-xs text-gray-400">· {getPaperTypeLabel(material.paperType)}</span>
                        )}
                        {(material.type === "trial" || material.type === "pastyear") && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              material.hasAnswerScheme
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {getAnswerSchemeLabel(material.hasAnswerScheme)}
                          </span>
                        )}
                        {isFree
                          ? <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">免费 / Free</span>
                          : <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">付费 / Paid</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleToggleSaved(material)}
                      disabled={savingMaterialId === material.id}
                      className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        isSaved
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={isSaved ? "取消收藏" : "收藏资料"}
                    >
                      <Star size={14} fill={isSaved ? "currentColor" : "none"} />
                      {isSaved ? "已收藏" : "收藏"}
                    </button>
                    <button
                      onClick={() => handleToggleCompleted(material)}
                      disabled={completingMaterialId === material.id}
                      className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        isCompleted
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={isCompleted ? "取消完成" : "标记完成"}
                    >
                      <CheckCircle2 size={14} />
                      {isCompleted ? "已完成" : "完成"}
                    </button>
                    {accessible ? (
                      <>
                        <button
                          onClick={() => handleView(material)}
                          disabled={busyAction === `view-${material.id}`}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          <Eye size={14} /> {busyAction === `view-${material.id}` ? "打开中" : "查阅"}
                        </button>
                        <button
                          onClick={() => handleDownload(material)}
                          disabled={busyAction === `download-${material.id}`}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          <Download size={14} /> {busyAction === `download-${material.id}` ? "下载中" : "下载"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setPurchaseMaterial(material)}
                        className="flex w-full sm:w-auto items-center justify-center gap-1.5 bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Lock size={14} /> 解锁 / Unlock
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PurchaseModal
        open={!!purchaseMaterial}
        onClose={() => setPurchaseMaterial(null)}
        userData={userData}
        defaultForm={formId}
        defaultSubject={purchaseMaterial?.subjectName || subjectName}
        defaultPackage="subject"
      />
    </div>
  )
}
