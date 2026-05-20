// src/pages/SearchPage.jsx
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  collection,
  getDocs,
  query as firestoreQuery,
  where,
} from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Lock,
  Search,
  X,
} from "lucide-react"
import toast from "react-hot-toast"
import PurchaseModal from "./PurchaseModal"
import { canAccess } from "../utils/access"
import { buildDownloadUrl, getMaterialFileUrl } from "../utils/materialFiles"

const PAGE_SIZE = 10
const CACHE_TTL = 5 * 60 * 1000
const materialsCache = new Map()

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

const TYPE_OPTIONS = [
  { value: "", label: "全部类型 / All Types" },
  { value: "note", label: "笔记 / Notes" },
  { value: "exercise", label: "练习 / Exercise" },
  { value: "trial", label: "Trial Paper" },
  { value: "pastyear", label: "Past Year" },
]

function normalize(value) {
  return String(value || "").trim().toLowerCase()
}

function getCacheKey(filters) {
  return [
    filters.form || "all-forms",
    filters.subjectId || "all-subjects",
    filters.type || "all-types",
  ].join("|")
}

function matchesKeyword(material, keyword) {
  if (!keyword) return true

  const haystack = [
    material.title,
    material.subjectName,
    material.type,
    material.state,
    material.year,
    material.form ? `form ${material.form}` : "",
    material.chapter ? `chapter ${material.chapter}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(keyword)
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const queryText = searchParams.get("q") || ""
  const { user, userData } = useAuth()
  const [allResults, setAllResults] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [purchaseMaterial, setPurchaseMaterial] = useState(null)
  const [busyAction, setBusyAction] = useState("")
  const [filters, setFilters] = useState({
    form: searchParams.get("form") || "",
    subjectId: searchParams.get("subjectId") || "",
    type: searchParams.get("type") || "",
  })

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey)
    setFilters({
      form: nextParams.get("form") || "",
      subjectId: nextParams.get("subjectId") || "",
      type: nextParams.get("type") || "",
    })
  }, [searchParamsKey])

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const snapshot = await getDocs(collection(db, "subjects"))
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setSubjects(data.sort((a, b) => (a.form || 0) - (b.form || 0) || a.name.localeCompare(b.name)))
      } catch {
        setSubjects([])
      }
    }
    fetchSubjects()
  }, [])

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      setCurrentPage(1)
      try {
        const normalizedQuery = normalize(queryText)
        const hasActiveSearch = normalizedQuery || filters.form || filters.subjectId || filters.type

        if (!hasActiveSearch) {
          setAllResults([])
          return
        }

        const cacheKey = getCacheKey(filters)
        const cached = materialsCache.get(cacheKey)
        const now = Date.now()
        let baseResults

        if (cached && now - cached.timestamp < CACHE_TTL) {
          baseResults = cached.data
        } else {
          const constraints = []
          if (filters.form) constraints.push(where("form", "==", parseInt(filters.form)))
          if (filters.subjectId) constraints.push(where("subjectId", "==", filters.subjectId))
          if (filters.type) constraints.push(where("type", "==", filters.type))

          const materialsQuery = constraints.length
            ? firestoreQuery(collection(db, "materials"), ...constraints)
            : collection(db, "materials")

          const snapshot = await getDocs(materialsQuery)
          baseResults = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          materialsCache.set(cacheKey, { data: baseResults, timestamp: now })
        }

        const filtered = baseResults
          .filter(material => matchesKeyword(material, normalizedQuery))
          .sort((a, b) => {
            if ((a.form || 0) !== (b.form || 0)) return (a.form || 0) - (b.form || 0)
            if ((a.subjectName || "") !== (b.subjectName || "")) {
              return (a.subjectName || "").localeCompare(b.subjectName || "")
            }
            return (a.chapter || a.year || 0) - (b.chapter || b.year || 0)
          })

        setAllResults(filtered)
      } catch {
        toast.error("搜索失败 / Search failed")
        setAllResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [queryText, filters])

  const visibleSubjects = useMemo(() => {
    const formNumber = parseInt(filters.form)
    return subjects.filter(subject => !filters.form || subject.form === formNumber)
  }, [filters.form, subjects])

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE)
  const paginatedResults = allResults.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearchParam(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(name, value)
    else next.delete(name)

    if (name === "form") next.delete("subjectId")
    setSearchParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams)
    next.delete("form")
    next.delete("subjectId")
    next.delete("type")
    setSearchParams(next)
  }

  async function handleOpenMaterial(material, mode) {
    if (!canAccess(user, userData, material)) {
      setPurchaseMaterial(material)
      return
    }

    const actionKey = `${mode}-${material.id}`
    const popup = mode === "view" ? window.open("", "_blank") : null
    setBusyAction(actionKey)

    try {
      const fileUrl = await getMaterialFileUrl(material, user, userData)

      if (mode === "view") {
        if (popup) popup.location.href = fileUrl
        else window.open(fileUrl, "_blank")
        return
      }

      const link = document.createElement("a")
      link.href = buildDownloadUrl(fileUrl, material.title)
      link.setAttribute("download", material.title + ".pdf")
      link.setAttribute("target", "_blank")
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => document.body.removeChild(link), 100)
      toast.success("下载已开始！/ Download started!")
    } catch {
      if (popup) popup.close()
      toast.error(mode === "view" ? "文件不存在 / File not found" : "下载失败 / Download failed")
    } finally {
      setBusyAction("")
    }
  }

  const hasFilters = filters.form || filters.subjectId || filters.type
  const heading = queryText ? `"${queryText}"` : "筛选资料 / Filter Materials"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Search size={20} />
            <span className="text-sm">搜索结果 / Search Results</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{heading}</h1>
          <p className="text-gray-500 mt-1">
            找到 {allResults.length} 个结果 / Found {allResults.length} results
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter size={16} className="text-blue-600" />
              筛选资料 / Filters
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
              >
                <X size={13} /> 清除 / Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filters.form}
              onChange={event => updateSearchParam("form", event.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部年级 / All Forms</option>
              {[1, 2, 3, 4, 5].map(form => (
                <option key={form} value={form}>Form {form}</option>
              ))}
            </select>

            <select
              value={filters.subjectId}
              onChange={event => updateSearchParam("subjectId", event.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部科目 / All Subjects</option>
              {visibleSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  Form {subject.form} · {subject.name}
                </option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={event => updateSearchParam("type", event.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_OPTIONS.map(type => (
                <option key={type.value || "all"} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">搜索中... / Searching...</div>
        ) : allResults.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>没有找到相关资料 / No results found</p>
            <p className="text-sm mt-1">试试其他关键词或筛选条件 / Try different keywords or filters</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedResults.map(material => {
                const accessible = canAccess(user, userData, material)
                const isFree = material.type === "trial" || material.type === "pastyear" || material.isFree

                return (
                  <div
                    key={material.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {accessible
                        ? <span className="text-green-500 mt-0.5 sm:mt-0"><Eye size={18} /></span>
                        : <span className="text-gray-400 mt-0.5 sm:mt-0"><Lock size={18} /></span>
                      }
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 break-words">{material.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {TYPE_LABELS[material.type]?.zh} / {TYPE_LABELS[material.type]?.en}
                          </span>
                          <span className="text-xs text-gray-400">· Form {material.form}</span>
                          <span className="text-xs text-gray-400">· {material.subjectName}</span>
                          {material.chapter > 0 && (
                            <span className="text-xs text-gray-400">· 第{material.chapter}章</span>
                          )}
                          {material.year > 0 && (
                            <span className="text-xs text-gray-400">· {material.year}</span>
                          )}
                          {material.state && (
                            <span className="text-xs text-gray-400">· {material.state}</span>
                          )}
                          {isFree
                            ? <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">免费 / Free</span>
                            : <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">付费 / Paid</span>
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {accessible ? (
                        <>
                          <button
                            onClick={() => handleOpenMaterial(material, "view")}
                            disabled={busyAction === `view-${material.id}`}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            <Eye size={14} /> {busyAction === `view-${material.id}` ? "打开中" : "查阅"}
                          </button>
                          <button
                            onClick={() => handleOpenMaterial(material, "download")}
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

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <p className="text-sm text-gray-400">
                  第 {currentPage} / {totalPages} 页，共 {allResults.length} 个结果
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0) }}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <ChevronLeft size={14} /> 上一页
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) acc.push("...")
                      acc.push(page)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={idx} className="text-gray-400 px-1">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => { setCurrentPage(item); window.scrollTo(0, 0) }}
                          className={`w-8 h-8 text-sm rounded-lg transition shrink-0 ${
                            currentPage === item
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )
                  }

                  <button
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0) }}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    下一页 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PurchaseModal
        open={!!purchaseMaterial}
        onClose={() => setPurchaseMaterial(null)}
        userData={userData}
        defaultForm={purchaseMaterial?.form?.toString() || userData?.formLevel?.toString() || ""}
        defaultSubject={purchaseMaterial?.subjectName || ""}
        defaultPackage="subject"
      />
    </div>
  )
}
