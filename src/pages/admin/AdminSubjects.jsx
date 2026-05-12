import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { Trash2, Plus } from "lucide-react"

const EMPTY_FORM = {
  name: "",
  nameZh: "",
  form: "5",
  icon: "",
}

const ICON_OPTIONS = ["📐", "➕", "⚛️", "🧪", "🧬", "📝", "🔤", "📜", "🌟", "🀄", "📊", "🖥️", "🎨", "🏃", "🎵"]

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterForm, setFilterForm] = useState("all")

  async function fetchSubjects() {
    try {
      const snapshot = await getDocs(collection(db, "subjects"))
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => a.form - b.form || a.name.localeCompare(b.name))
      setSubjects(data)
    } catch {
      toast.error("加载失败 / Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubjects() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.nameZh.trim()) {
      toast.error("请填写科目名称 / Please fill in subject name")
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, "subjects"), {
        name: form.name.trim(),
        nameZh: form.nameZh.trim(),
        form: parseInt(form.form),
        icon: form.icon || "📚",
      })
      toast.success("科目已添加 / Subject added!")
      setForm(EMPTY_FORM)
      fetchSubjects()
    } catch {
      toast.error("添加失败 / Failed to add")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm("确定要删除这个科目吗？/ Are you sure?")) return
    try {
      await deleteDoc(doc(db, "subjects", id))
      toast.success("已删除 / Deleted")
      fetchSubjects()
    } catch {
      toast.error("删除失败 / Failed to delete")
    }
  }

  const filtered = filterForm === "all"
    ? subjects
    : subjects.filter(s => s.form === parseInt(filterForm))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">科目管理 / Manage Subjects</h1>

      <div className="flex gap-6 items-start">

        {/* 添加科目表单 */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={16} /> 添加科目 / Add Subject
            </h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">年级 / Form</label>
                <select
                  value={form.form}
                  onChange={e => setForm({ ...form, form: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5].map(f => (
                    <option key={f} value={f}>Form {f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  科目名 (English) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  科目名 (中文) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nameZh}
                  onChange={e => setForm({ ...form, nameZh: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 数学"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">图标 / Icon</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 text-xl rounded-lg border-2 transition ${
                        form.icon === icon
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="或输入 emoji / or type emoji"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "添加中..." : "添加 / Add"}
              </button>
            </form>
          </div>
        </div>

        {/* 科目列表 */}
        <div className="flex-1">
          {/* 年级筛选 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterForm("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filterForm === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
              }`}
            >
              全部
            </button>
            {[1,2,3,4,5].map(f => (
              <button
                key={f}
                onClick={() => setFilterForm(String(f))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  filterForm === String(f)
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
                }`}
              >
                Form {f}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无科目 / No subjects</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">科目 / Subject</th>
                    <th className="text-left px-4 py-3 text-gray-600">年级 / Form</th>
                    <th className="text-left px-4 py-3 text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{s.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.nameZh}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Form {s.form}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}