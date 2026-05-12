import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"
import { Search, LogOut, User, Shield } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import toast from "react-hot-toast"

export default function Navbar() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const isAdmin = userData?.role === "admin"
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery("")
  }

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("已登出 / Logged out")
    navigate("/")
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="1"/>
            <rect x="14" y="3" width="7" height="18" rx="1"/>
            <line x1="3" y1="9" x2="10" y2="9"/>
            <line x1="14" y1="9" x2="21" y2="9"/>
          </svg>
          MyNotes
        </Link>

        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记、试卷... / Search materials..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Shield size={15} /> Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <User size={15} />
                {userData?.name?.split(" ")[0] || "Profile"}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
              >
                <LogOut size={15} />
                登出
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                登录 / Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                注册 / Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}