import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { db, auth } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

export default function CompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    formLevel: "5"
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      toast.error("请输入姓名 / Please enter your name")
      return
    }
    if (form.phone.length < 9) {
      toast.error("请输入有效的电话号码 / Please enter a valid phone number")
      return
    }
    setLoading(true)
    try {
      await updateProfile(auth.currentUser, { displayName: form.name })
      await setDoc(doc(db, "users", user.uid), {
        name: form.name,
        email: user.email || "",
        phone: form.phone.replace(/^0/, "").replace(/[^0-9]/g, ""), // ← 加这个格式化
        formLevel: parseInt(form.formLevel),
        role: "free",
        paidSubjects: [],
        paidPackage: null,
        createdAt: new Date()
      })
      toast.success("设置完成！/ Profile completed!")
      // ✅ 修复：使用 React Router navigate，不强制刷新整个页面
      navigate("/", { replace: true })
    } catch (err) {
      console.error(err)
      toast.error("保存失败 / Failed to save: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">MyNotes</h1>
        <p className="text-center text-gray-500 mb-2">欢迎！/ Welcome!</p>
        <p className="text-center text-sm text-gray-400 mb-6">
          请填写以下资料完成注册<br />
          Please complete your profile
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 / Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              电话号码 / Phone Number
            </label>
            <div className="flex gap-2">
              <span className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                +60
              </span>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="11-12345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年级 / Form
            </label>
            <select
              name="formLevel"
              value={form.formLevel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Form 1</option>
              <option value="2">Form 2</option>
              <option value="3">Form 3</option>
              <option value="4">Form 4</option>
              <option value="5">Form 5</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "保存中..." : "完成注册 / Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  )
}