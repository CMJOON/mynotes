import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { Lock, Download, Eye } from "lucide-react"
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

const TABS = [
  { key: "all", zh: "全部", en: "All" },
  { key: "note", zh: "笔记", en: "Notes" },
  { key: "exercise", zh: "练习", en: "Exercise" },
  { key: "trial", zh: "Trial", en: "Trial" },
  { key: "pastyear", zh: "Past Year", en: "Past Year" },
]

export default function SubjectPage() {
  const { formId, subjectId } = useParams()
  const { user } = useAuth()
  const [subject, setSubject] = useState(null)
  const [materials, setMaterials] = useState([])
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const subjectDoc = await getDoc(doc(db, "subjects", subjectId))
      if (subjectDoc.exists()) setSubject({ id: subjectDoc.id, ...subjectDoc.data() })

      const q = query(
        collection(db, "materials"),
        where("form", "==", parseInt(formId)),
        where("subjectName", "==", subjectDoc.data()?.name)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (a.chapter || a.year) - (b.chapter || b.year))
      setMaterials(data)

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) setUserData(userDoc.data())
      }

      setLoading(false)
    }
    fetchData()
  }, [formId, subjectId, user])

const handleDownload = async (material) => {
  console.log("handleDownload called", material)
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
    if (!response.ok) throw new Error("Fetch failed: " + response.status)
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
    console.error("Download error:", err)
    toast.error("下载失败: " + err.message)
  }
}

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

  const filtered = activeTab === "all"
    ? materials
    : materials.filter(m => m.type === activeTab)

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
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中... / Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无资料 / No materials found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(material => {
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {TYPE_LABELS[material.type]?.zh} / {TYPE_LABELS[material.type]?.en}
                        </span>
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
                      <button
                        onClick={() => setShowPaywall(true)}
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Lock size={14} />
                        解锁
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              解锁完整内容 🔓
            </h2>
            <p className="text-gray-500 mb-6">
              购买后即可访问所有章节的笔记与练习
            </p>
            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 cursor-pointer transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">单科目 / Single Subject</p>
                    <p className="text-sm text-gray-500">全部章节笔记与练习</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">RM 25</p>
                </div>
              </div>
              <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-4 cursor-pointer transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">年级套餐 / Form Package</p>
                    <p className="text-sm text-gray-500">Form {formId} 全部科目</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">RM 100</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaywall(false)}
               className="flex-1 border border-gray-200 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition"
              >
                稍后再说
              </button>
              <a
                href="https://wa.me/60XXXXXXXXX?text=Hi%2C%20I%20want%20to%20purchase%20MyNotes%20package"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-center font-semibold hover:bg-green-600 transition"
              >
                WhatsApp 购买
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}