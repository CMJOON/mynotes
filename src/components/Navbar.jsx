import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("已登出 / Logged out")
    navigate("/")
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <rect x="3" y="3" width="7" height="18" rx="1"/>
           <rect x="14" y="3" width="7" height="18" rx="1"/>
           <line x1="3" y1="9" x2="10" y2="9"/>
           <line x1="14" y1="9" x2="21" y2="9"/>
         </svg>
         MyNotes
       </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
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
                联系购买 / Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}