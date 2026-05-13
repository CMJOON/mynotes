import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { collection, getDocs, query as firestoreQuery, limit } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { Lock, Download, Eye, Search } from "lucide-react"
import toast from "react-hot-toast"
import { canAccess } from "../utils/access"

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const { user, userData } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const q = firestoreQuery(collection(db, "materials"), limit(200))
        const snapshot = await getDocs(q)
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        const filtered = all.filter(m =>
          m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.type?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setResults(filtered)
      } catch (error) {
        console.error("搜索失败:", error)
        toast.error("搜索失败 / Search failed")
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchQuery])

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
          <h1 className="text-3xl font-bold text-gray-900">"{searchQuery}"</h1>
          <p className="text-gray-500 mt-1">找到 {results.length} 个结果 / Found {results.length} results</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">搜索中... / Searching...</div>
        ) : searchQuery.trim().length < 2 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>请输入至少2个字符 / Enter at least 2 characters</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>没有找到相关资料 / No results found</p>
            <p className="text-sm mt-1">试试其他关键词 / Try different keywords</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(material => {
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
        )}
      </div>
    </div>
  )
}