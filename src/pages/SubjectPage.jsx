import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { Lock, Download, Eye } from "lucide-react"
import toast from "react-hot-toast"
import PurchaseModal from "./PurchaseModal"
import { canAccess } from "../utils/access"
import { buildDownloadUrl, getMaterialFileUrl } from "../utils/materialFiles"

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
  const { user, userData } = useAuth()
  const [subject, setSubject] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [purchaseMaterial, setPurchaseMaterial] = useState(null)
  const [busyAction, setBusyAction] = useState("")

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

  const handleView = async (material) => {
    if (!canAccess(user, userData, material)) {
      setPurchaseMaterial(material)
      return
    }
    setBusyAction(`view-${material.id}`)
    try {
      const fileUrl = await getMaterialFileUrl(material, user, userData)
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

  const filtered = activeTab === "all"
    ? materials
    : materials.filter(m => m.type === activeTab)

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
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中... / Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无资料 / No materials found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(material => {
              const accessible = canAccess(user, userData, material)
              const isFree = material.type === "trial" || material.type === "pastyear" || material.isFree

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
