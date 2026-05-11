import { useEffect, useState } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { Lock, Download, Eye, Search } from "lucide-react"
import toast from "react-hot-toast"

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        const response = await fetch("http://localhost:3001/api/materials")
        const all = await response.json()
        const filtered = all.filter(m =>
          m.title?.toLowerCase().includes(query.toLowerCase()) ||
          m.subjectName?.toLowerCase().includes(query.toLowerCase()) ||
          m.type?.toLowerCase().includes(query.toLowerCase())
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
  }, [query])

  const handleView = async (material) => {
    try {
      const url = `http://localhost:3001/api/download/${material.filePath}`
      window.open(url, "_blank")
    } catch (err) {
      toast.error("查阅失败 / View failed")
    }
  }

  const handleDownload = async (material) => {
    try {
      const url = `http://localhost:3001/api/download/${material.filePath}`

      // 用 <a> 标签直接触发浏览器下载
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", material.title + ".pdf")
      link.setAttribute("target", "_blank")
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => document.body.removeChild(link), 100)
      toast.success("下载已开始！/ Download started!")
    } catch (err) {
      toast.error("下载失败 / Download failed")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0f4f8" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">搜索中... / Searching...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Search size={20} />
            <span className="text-sm">搜索结果</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">"{query}" 的搜索结果</h1>
          <p className="text-gray-500 mt-1">找到 {results.length} 个结果</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关资料</h3>
            <p className="text-gray-500">尝试使用不同的关键词搜索</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((material) => (
              <div key={material.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {TYPE_LABELS[material.type]?.zh || material.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Form {material.form} · {material.subjectName}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{material.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {material.chapter && <p>章节: {material.chapter}</p>}
                      {material.year && <p>年份: {material.year}</p>}
                      {material.state && <p>州属: {material.state}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleView(material)}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Eye size={16} />
                      查看
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Download size={16} />
                      下载
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
            找到 {results.length} 个结果 / Found {results.length} results
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">搜索中... / Searching...</div>
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
              const isFree = material.type === "trial" || material.type === "pastyear" || material.chapter <= 3

              return (
                <div
                  key={material.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-3">
                    {accessible ? (
                      <span className="text-green-500"><Eye size={18} /></span>
                    ) : (
                      <span className="text-gray-400"><Lock size={18} /></span>
                    )}
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
                        {isFree ? (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                            免费 / Free
                          </span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            付费 / Paid
                          </span>
                        )}
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
                          <Eye size={14} />
                          查阅
                        </button>
                        <button
                          onClick={() => handleDownload(material)}
                          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
                        >
                          <Download size={14} />
                          下载
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/form/${material.form}`}
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Lock size={14} />
                        解锁
                      </Link>
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