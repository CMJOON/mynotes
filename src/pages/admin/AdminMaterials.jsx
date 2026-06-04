// src/pages/admin/AdminMaterials.jsx
import { useEffect, useState } from "react"
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { ChevronLeft, ChevronRight, Pencil, ShieldCheck, Trash2 } from "lucide-react"
import { buildMaterialFileData } from "../../utils/materialFiles"
import { MALAYSIA_STATES, PAPER_TYPES } from "../../utils/constants"

const PAGE_SIZE = 10

const TYPE_COLORS = {
  note: "bg-blue-100 text-blue-600",
  exercise: "bg-green-100 text-green-600",
  trial: "bg-purple-100 text-purple-600",
  pastyear: "bg-orange-100 text-orange-600",
}

function getPaperTypeLabel(value) {
  return PAPER_TYPES.find(paper => paper.value === value)?.label || value
}

function toEditableMaterial(material) {
  return {
    ...material,
    form: String(material.form || ""),
    chapter: material.chapter ? String(material.chapter) : "",
    year: material.year ? String(material.year) : "",
    state: material.state || "",
    paperType: material.paperType || "",
    hasAnswerScheme: !!material.hasAnswerScheme,
    isFree: !!material.isFree,
  }
}

function toMaterialUpdate(form) {
  const formNumber = parseInt(form.form)

  return {
    title: form.title || "",
    type: form.type || "note",
    form: formNumber,
    subjectId: form.subjectId || "",
    subjectName: form.subjectName || "",
    chapter: form.type === "note" || form.type === "exercise" ? parseInt(form.chapter) || 0 : 0,
    year: form.type === "trial" || form.type === "pastyear" ? parseInt(form.year) || 0 : 0,
    state: form.type === "trial" ? form.state || "" : "",
    paperType: form.type === "trial" || form.type === "pastyear" ? form.paperType || "" : "",
    hasAnswerScheme: form.type === "trial" || form.type === "pastyear" ? !!form.hasAnswerScheme : false,
    isFree: !!form.isFree,
    accessKey: `${form.subjectName}_form${formNumber}`,
    formPackage: `form${formNumber}`,
    updatedAt: serverTimestamp(),
  }
}

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagecursors, setPageCursors] = useState([null])
  const [hasMore, setHasMore] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  async function fetchPage(cursorDoc, pageNumber = currentPage) {
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

      if (snapshot.docs.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        setPageCursors(prev => {
          const updated = [...prev]
          updated[pageNumber] = lastDoc
          return updated
        })
      }
    } catch (error) {
      toast.error("加载失败 / Failed to load: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(pagecursors[currentPage - 1], currentPage)
    // Pagination cursors are updated by fetchPage; currentPage is the fetch trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const snapshot = await getDocs(collection(db, "subjects"))
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setSubjects(data)
      } catch {
        setSubjects([])
      }
    }
    fetchSubjects()
  }, [])

  const filteredSubjects = selectedMaterial?.form
    ? subjects.filter(subject => subject.form === parseInt(selectedMaterial.form))
    : []

  async function refreshCurrentPage() {
    await fetchPage(pagecursors[currentPage - 1], currentPage)
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, "materialFiles", id))
      await deleteDoc(doc(db, "materials", id))
      toast.success("已删除 / Deleted")
      setConfirmDeleteId(null)
      await refreshCurrentPage()
    } catch {
      toast.error("删除失败 / Delete failed")
    }
  }

  async function handleSaveEdit() {
    if (!selectedMaterial) return
    if (!selectedMaterial.title?.trim()) {
      toast.error("请输入标题 / Please enter a title")
      return
    }
    if (!selectedMaterial.subjectId) {
      toast.error("请选择科目 / Please select a subject")
      return
    }

    setSaving(true)
    try {
      const update = toMaterialUpdate(selectedMaterial)
      await updateDoc(doc(db, "materials", selectedMaterial.id), update)
      await setDoc(doc(db, "materialFiles", selectedMaterial.id), {
        ...buildMaterialFileData(update),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      toast.success("资料已更新 / Material updated")
      setSelectedMaterial(null)
      await refreshCurrentPage()
    } catch (error) {
      toast.error("保存失败 / Save failed: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMigrateLegacyFiles() {
    setMigrating(true)
    try {
      const snapshot = await getDocs(collection(db, "materials"))
      let migrated = 0

      for (const materialDoc of snapshot.docs) {
        const data = materialDoc.data()
        if (!data.fileUrl) continue

        const update = toMaterialUpdate({ ...data, id: materialDoc.id })
        await setDoc(doc(db, "materialFiles", materialDoc.id), {
          ...buildMaterialFileData(update, data.fileUrl),
          createdAt: data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
        await updateDoc(doc(db, "materials", materialDoc.id), {
          fileUrl: deleteField(),
          accessKey: update.accessKey,
          formPackage: update.formPackage,
          updatedAt: serverTimestamp(),
        })
        migrated += 1
      }

      toast.success(
        migrated
          ? `已迁移 ${migrated} 份资料 / Migrated ${migrated} materials`
          : "没有需要迁移的旧资料 / No legacy files found"
      )
      await refreshCurrentPage()
    } catch (error) {
      if (error.code === "permission-denied") {
        toast.error("迁移被拒绝：请先部署 Firestore rules，并确认当前账号 role 是 admin / Permission denied")
      } else {
        toast.error("迁移失败 / Migration failed: " + error.message)
      }
    } finally {
      setMigrating(false)
    }
  }

  function handleEditChange(event) {
    const { name, value } = event.target
    setSelectedMaterial(prev => {
      if (!prev) return prev
      if (name === "form") {
        return { ...prev, form: value, subjectId: "", subjectName: "" }
      }
      return { ...prev, [name]: value }
    })
  }

  function handleSubjectChange(event) {
    const subjectId = event.target.value
    const subject = subjects.find(item => item.id === subjectId)
    setSelectedMaterial(prev => ({
      ...prev,
      subjectId,
      subjectName: subject?.name || "",
    }))
  }

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(page => page - 1)
  }

  const handleNext = () => {
    if (hasMore) setCurrentPage(page => page + 1)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">管理资料 / Manage Materials</h1>
          <p className="text-sm text-gray-400 mt-1">
            编辑资料信息，并把旧 fileUrl 迁移到受保护集合。
          </p>
        </div>
        <button
          onClick={handleMigrateLegacyFiles}
          disabled={migrating}
          className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition disabled:opacity-50"
        >
          <ShieldCheck size={16} />
          {migrating ? "迁移中..." : "迁移旧链接 / Migrate"}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-gray-400">加载中...</div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-600">标题 / Title</th>
                        <th className="text-left px-4 py-3 text-gray-600">类型</th>
                        <th className="text-left px-4 py-3 text-gray-600">年级</th>
                        <th className="text-left px-4 py-3 text-gray-600">科目</th>
                        <th className="text-left px-4 py-3 text-gray-600">状态</th>
                        <th className="text-left px-4 py-3 text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            暂无资料 / No materials
                          </td>
                        </tr>
                      ) : (
                        materials.map(material => (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                              <p className="truncate">{material.title}</p>
                              {material.fileUrl && (
                                <p className="text-xs text-orange-500 mt-1">旧链接待迁移 / Legacy fileUrl</p>
                              )}
                              {(material.year > 0 || material.state || material.paperType || material.type === "trial" || material.type === "pastyear") && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {material.year > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{material.year}</span>
                                  )}
                                  {material.state && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{material.state}</span>
                                  )}
                                  {material.paperType && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{getPaperTypeLabel(material.paperType)}</span>
                                  )}
                                  {(material.type === "trial" || material.type === "pastyear") && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${material.hasAnswerScheme ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                      {material.hasAnswerScheme ? "有答案" : "无答案"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[material.type]}`}>
                                {material.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">Form {material.form}</td>
                            <td className="px-4 py-3 text-gray-600">{material.subjectName}</td>
                            <td className="px-4 py-3">
                              {material.isFree || material.type === "trial" || material.type === "pastyear" ? (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Free</span>
                              ) : (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Paid</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {confirmDeleteId === material.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDelete(material.id)}
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
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setSelectedMaterial(toEditableMaterial(material))}
                                    className="text-blue-600 hover:text-blue-700 transition"
                                    title="编辑资料"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(material.id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="删除资料"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
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

        {selectedMaterial && (
          <div className="w-full xl:w-80 bg-white rounded-2xl border border-gray-200 p-6 h-fit xl:sticky xl:top-4">
            <h2 className="font-bold text-gray-800 mb-1">编辑资料 / Edit Material</h2>
            <p className="text-sm text-gray-400 mb-4">保存后会同步更新受保护文件索引。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">标题 / Title</label>
                <input
                  name="title"
                  value={selectedMaterial.title || ""}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">类型</label>
                  <select
                    name="type"
                    value={selectedMaterial.type || "note"}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="note">Note</option>
                    <option value="exercise">Exercise</option>
                    <option value="trial">Trial</option>
                    <option value="pastyear">Past Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">年级</label>
                  <select
                    name="form"
                    value={selectedMaterial.form}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(form => (
                      <option key={form} value={form}>Form {form}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">科目 / Subject</label>
                <select
                  value={selectedMaterial.subjectId || ""}
                  onChange={handleSubjectChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择科目 / Select subject</option>
                  {filteredSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.nameZh}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedMaterial.type === "note" || selectedMaterial.type === "exercise") && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1">章节 / Chapter</label>
                  <input
                    type="number"
                    name="chapter"
                    value={selectedMaterial.chapter}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {(selectedMaterial.type === "trial" || selectedMaterial.type === "pastyear") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">年份</label>
                    <input
                      type="number"
                      name="year"
                      value={selectedMaterial.year}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">州属</label>
                    {selectedMaterial.type === "trial" ? (
                      <select
                        name="state"
                        value={selectedMaterial.state}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">未指定</option>
                        {MALAYSIA_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value="N/A"
                        disabled
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {(selectedMaterial.type === "trial" || selectedMaterial.type === "pastyear") && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">试卷类型 / Paper Type</label>
                    <select
                      name="paperType"
                      value={selectedMaterial.paperType || ""}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">未指定 / Not specified</option>
                      {PAPER_TYPES.map(paper => (
                        <option key={paper.value} value={paper.value}>{paper.label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedMaterial.hasAnswerScheme}
                      onChange={event => setSelectedMaterial(prev => ({
                        ...prev,
                        hasAnswerScheme: event.target.checked,
                      }))}
                    />
                    有答案 / Has answer scheme
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-500 mb-2">访问权限 / Access</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial(prev => ({ ...prev, isFree: true }))}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      selectedMaterial.isFree
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    免费
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial(prev => ({ ...prev, isFree: false }))}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      !selectedMaterial.isFree
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    付费
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存 / Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
