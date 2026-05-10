import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { Lock, Download, Eye, Search } from "lucide-react"
import { supabaseAdmin } from "../supabase"
import toast from "react-hot-toast"

function canAccess(user, userData, material) {
  if (material.type === "trial" || material.type === "pastyear") return true
  if (material.chapter <= 3) return true
  if (!user) return false
  if (userData?.role === "paid") {
    if (userData?.paidPackage === "premium") return true
    if (userData?.paidPackage === `form${material.form}`) return true
    if (userData?.paidSubjects?.includes(material.subjectName + "_form" + material.form)) return true
  }
  return false
}

const TYPE_LABELS = {
  note: { zh: "笔记", en: "Notes" },
  exercise: { zh: "练习", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) setUserData(userDoc.data())
      }

      const snapshot = await getDocs(collection(db, "materials"))
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      const filtered = all.filter(m =>
        m.title?.toLowerCase().includes(query.toLowerCase()) ||
        m.subjectName?.toLowerCase().includes(query.toLowerCase()) ||
        m.type?.toLowerCase().includes(query.toLowerCase())
      )

      setResults(filtered)
      setLoading(false)
    }
    fetchResults()
  }, [query, user])

  const handleView = async (material) => {
    try {
      if (material.filePath) {
        const { data } = supabaseAdmin.storage
          .from("materials")
          .getPublicUrl(material.filePath)
        window.open(data.publicUrl, "_blank")
      } else {
        window.open(material.fileUrl, "_blank")
      }
    } catch (err) {
      toast.error("查阅失败 / View failed")
    }
  }

  const handleDownload = async (material) => {
    try {
      let url = ""
      if (material.filePath) {
        const { data } = supabaseAdmin.storage
          .from("materials")
          .getPublicUrl(material.filePath)
        url = data.publicUrl
      } else {
        url = material.fileUrl
      }
      toast.loading("下载中... / Downloading...")
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", material.title + ".pdf")
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
      toast.dismiss()
      toast.success("下载成功！/ Downloaded!")
    } catch (err) {
      toast.dismiss()
      toast.error("下载失败 / Download failed")
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Search size={18} />
            <span className="text-sm font-medium">搜索结果 / Search Results</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">"{query}"</h1>
          <p className="text-gray-500 mt-1">
            找到 {results.length} 个结果 / Found {results.length} results
          </p>
        </div>
      </div>

      {/* 结果列表 */}
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