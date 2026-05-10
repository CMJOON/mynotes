import { useEffect, useState } from "react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { Crown, User } from "lucide-react"

const SUBJECTS_BY_FORM = {
  1: ["Mathematics", "Science", "Sejarah", "Bahasa Melayu", "English", "Moral", "Chinese"],
  2: ["Mathematics", "Science", "Sejarah", "Bahasa Melayu", "English", "Moral", "Chinese"],
  3: ["Mathematics", "Science", "Sejarah", "Bahasa Melayu", "English", "Moral", "Chinese"],
  4: ["Mathematics", "Physics", "Chemistry", "Biology", "Sejarah", "Bahasa Melayu", "English", "Moral", "Add Math", "Chinese"],
  5: ["Mathematics", "Physics", "Chemistry", "Biology", "Sejarah", "Bahasa Melayu", "English", "Moral", "Add Math", "Chinese"],
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [saving, setSaving] = useState(false)

  async function fetchUsers() {
    const snapshot = await getDocs(collection(db, "users"))
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleSave() {
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        role: selectedUser.role,
        paidPackage: selectedUser.paidPackage || null,
        paidSubjects: selectedUser.paidSubjects || [],
      })
      toast.success("权限已更新 / Permission updated!")
      fetchUsers()
      setSelectedUser(null)
    } catch (err) {
      toast.error("更新失败 / Update failed")
    } finally {
      setSaving(false)
    }
  }

  function toggleSubject(subject, form) {
    const key = `${subject}_form${form}`
    const current = selectedUser.paidSubjects || []
    if (current.includes(key)) {
      setSelectedUser({ ...selectedUser, paidSubjects: current.filter(s => s !== key) })
    } else {
      setSelectedUser({ ...selectedUser, paidSubjects: [...current, key] })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">用户管理 / User Management</h1>

      <div className="flex gap-6">

        {/* 用户列表 */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">用户 / User</th>
                  <th className="text-left px-4 py-3 text-gray-600">年级</th>
                  <th className="text-left px-4 py-3 text-gray-600">类型</th>
                  <th className="text-left px-4 py-3 text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">加载中...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${selectedUser?.id === u.id ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Form {u.formLevel}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded-full">Admin</span>
                      ) : u.role === "paid" ? (
                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                          <Crown size={10} /> 付费
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                          <User size={10} /> 免费
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser({ ...u })}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        编辑权限
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 权限编辑面板 */}
        {selectedUser && (
          <div className="w-80 bg-white rounded-2xl border border-gray-200 p-6 h-fit">
            <h2 className="font-bold text-gray-800 mb-1">{selectedUser.name}</h2>
            <p className="text-sm text-gray-400 mb-4">{selectedUser.email}</p>

            {/* 套餐选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">套餐 / Package</label>
              <div className="space-y-2">
                {[
                  { value: null, label: "免费用户 / Free" },
                  { value: "premium", label: "全站会员 / Premium (RM 150)" },
                  { value: "form1", label: "Form 1 套餐 (RM 100)" },
                  { value: "form2", label: "Form 2 套餐 (RM 100)" },
                  { value: "form3", label: "Form 3 套餐 (RM 100)" },
                  { value: "form4", label: "Form 4 套餐 (RM 100)" },
                  { value: "form5", label: "Form 5 套餐 (RM 100)" },
                ].map(pkg => (
                  <label key={pkg.label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="package"
                      checked={selectedUser.paidPackage === pkg.value}
                      onChange={() => setSelectedUser({
                        ...selectedUser,
                        paidPackage: pkg.value,
                        role: pkg.value ? "paid" : "free"
                      })}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{pkg.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 单科目解锁 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                单科目解锁 / Single Subject
              </label>
              {[1, 2, 3, 4, 5].map(form => (
                <div key={form} className="mb-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Form {form}</p>
                  <div className="space-y-1">
                    {SUBJECTS_BY_FORM[form].map(subject => {
                      const key = `${subject}_form${form}`
                      const checked = selectedUser.paidSubjects?.includes(key)
                      return (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked || false}
                            onChange={() => {
                              toggleSubject(subject, form)
                              if (!checked) setSelectedUser(prev => ({ ...prev, role: "paid" }))
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-xs text-gray-700">{subject}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存 / Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}