import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth, db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function checkAdmin() {
      if (!user) { setIsAdmin(false); return }
      const userDoc = await getDoc(doc(db, "users", user.uid))
      setIsAdmin(userDoc.data()?.role === "admin")
    }
    checkAdmin()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("已登出 / Logged out")
    navigate("/")
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery("")
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

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  ⚙️ Admin
                </Link>
              )}
              <span className="text-sm text-gray-500 hidden sm:block">
                👋 {user.displayName}
              </span>
              <Link
                to="/dashboard"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                个人中心
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                登录 / Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
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