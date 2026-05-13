// src/pages/admin/AdminMaterials.jsx
import { useEffect, useState } from "react"
import {
  collection, getDocs, deleteDoc, doc,
  query, orderBy, limit, startAfter
} from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 10

const TYPE_COLORS = {
  note: "bg-blue-100 text-blue-600",
  exercise: "bg-green-100 text-green-600",
  trial: "bg-purple-100 text-purple-600",
  pastyear: "bg-orange-100 text-orange-600",
}

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagecursors, setPageCursors] = useState([null]) // index = 页码-1，值 = startAfter cursor
  const [hasMore, setHasMore] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function fetchPage(cursorDoc) {
    setLoading(true)
    try {
      const q = cursorDoc
        ? query(
            collection(db, "materials"),
            orderBy("createdAt", "desc"),
            startAfter(cursorDoc),
            limit(PAGE_SIZE)
          )
        : query(
            collection(db, "materials"),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
          )

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMaterials(data)
      setHasMore(snapshot.docs.length === PAGE_SIZE)

      // 保存这一页最后一条作为下一页的 cursor
      if (snapshot.docs.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        setPageCursors(prev => {
          const updated = [...prev]
          updated[currentPage] = lastDoc
          return updated
        })
      }
    } catch (err) {
      toast.error("加载失败 / Failed to load: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(pagecursors[currentPage - 1])
  }, [currentPage])

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, "materials", id))
      toast.success("已删除 / Deleted")
      setConfirmDeleteId(null)
      fetchPage(pagecursors[currentPage - 1])
    } catch (err) {
      toast.error("删除失败 / Delete failed")
    }
  }

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1)
  }

  const handleNext = () => {
    if (hasMore) setCurrentPage(p => p + 1)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">管理资料 / Manage Materials</h1>

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <>
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
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      暂无资料 / No materials
                    </td>
                  </tr>
                ) : (
                  materials.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                        {m.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[m.type]}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Form {m.form}</td>
                      <td className="px-4 py-3 text-gray-600">{m.subjectName}</td>
                      <td className="px-4 py-3">
                        {confirmDeleteId === m.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                            >
                              确认删除
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页控制 */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              第 {currentPage} 页，每页 {PAGE_SIZE} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> 上一页
              </button>
              <span className="text-sm text-gray-600 px-2">{currentPage}</span>
              <button
                onClick={handleNext}
                disabled={!hasMore}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}