import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { Trash2 } from "lucide-react"

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchMaterials() {
    const snapshot = await getDocs(collection(db, "materials"))
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    data.sort((a, b) => a.form - b.form)
    setMaterials(data)
    setLoading(false)
  }

  useEffect(() => { fetchMaterials() }, [])

  async function handleDelete(id) {
    if (!confirm("确定要删除这份资料吗？/ Are you sure?")) return
    await deleteDoc(doc(db, "materials", id))
    toast.success("已删除 / Deleted")
    fetchMaterials()
  }

  const TYPE_COLORS = {
    note: "bg-blue-100 text-blue-600",
    exercise: "bg-green-100 text-green-600",
    trial: "bg-purple-100 text-purple-600",
    pastyear: "bg-orange-100 text-orange-600",
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">管理资料 / Manage Materials</h1>
      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">标题 / Title</th>
                <th className="text-left px-4 py-3 text-gray-600">类型</th>
                <th className="text-left px-4 py-3 text-gray-600">年级</th>
                <th className="text-left px-4 py-3 text-gray-600">科目</th>
                <th className="text-left px-4 py-3 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[m.type]}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Form {m.form}</td>
                  <td className="px-4 py-3 text-gray-600">{m.subjectName}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}