// src/pages/SearchPage.jsx
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { Lock, Download, Eye, Search } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import { canAccess } from "../utils/access"

const PAGE_SIZE = 10

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

// 模块级缓存，组件卸载后依然保留
const materialsCache = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const { user, userData } = useAuth()
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      setCurrentPage(1)
      try {
        // 检查缓存是否有效
        const now = Date.now()
        let all
        if (materialsCache.data && now - materialsCache.timestamp < CACHE_TTL) {
          all = materialsCache.data
        } else {
          const snapshot = await getDocs(collection(db, "materials"))
          all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          materialsCache.data = all
          materialsCache.timestamp = now
        }

        const filtered = all.filter(m =>
          m.title?.toLowerCase().includes(query.toLowerCase()) ||
          m.subjectName?.toLowerCase().includes(query.toLowerCase()) ||
          m.type?.toLowerCase().includes(query.toLowerCase())
        )
        setAllResults(filtered)
      } catch {
        toast.error("搜索失败 / Search failed")
      } finally {
        setLoading(false)
      }
    }
    if (query) fetchResults()
    else {
      setAllResults([])
      setLoading(false)
    }
  }, [query])

  // 前端分页计算
  const totalPages = Math.ceil(allResults.length / PAGE_SIZE)
  const paginatedResults = allResults.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleView = (material) => {
    if (!material.fileUrl) { toast.error("文件不存在 / File not found"); return }
    window.open(material.fileUrl, "_blank")
  }

  const handleDownload = (material) => {
    if (!material.fileUrl) { toast.error("文件不存在 / File not found"); return }
    const link = document.createElement("a")
    link.href = material.fileUrl
    link.setAttribute("download", material.title + ".pdf")
    link.setAttribute("target", "_blank")
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    setTimeout(() => document.body.removeChild(link), 100)
    toast.success("下载已开始！/ Download started!")
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Search size={20} />
            <span className="text-sm">搜索结果 / Search Results</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">"{query}"</h1>
          <p className="text-gray-500 mt-1">
            找到 {allResults.length} 个结果 / Found {allResults.length} results
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">搜索中... / Searching...</div>
        ) : allResults.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>没有找到相关资料 / No results found</p>
            <p className="text-sm mt-1">试试其他关键词 / Try different keywords</p>
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
                    className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      {accessible
                        ? <span className="text-green-500"><Eye size={18} /></span>
                        : <span className="text-gray-400"><Lock size={18} /></span>
                      }
                      <div>
                        <p className="font-medium text-gray-800">{material.title}</p>
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
                          {isFree
                            ? <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">免费 / Free</span>
                            : <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">付费 / Paid</span>
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {accessible ? (
                        <>
                          <button
                            onClick={() => handleView(material)}
                            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Eye size={14} /> 查阅
                          </button>
                          <button
                            onClick={() => handleDownload(material)}
                            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            <Download size={14} /> 下载
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-lg">
                          <Lock size={14} /> 付费内容
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-400">
                  第 {currentPage} / {totalPages} 页，共 {allResults.length} 个结果
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0) }}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} /> 上一页
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={idx} className="text-gray-400 px-1">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => { setCurrentPage(item); window.scrollTo(0, 0) }}
                          className={`w-8 h-8 text-sm rounded-lg transition ${
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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    下一页 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}