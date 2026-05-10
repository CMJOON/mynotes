import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase"
import { useAuth } from "../../context/AuthContext"
import { LayoutDashboard, Upload, FileText, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase"

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) { navigate("/login"); return }
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.data()?.role !== "admin") { navigate("/"); return }
      setChecking(false)
    }
    checkAdmin()
  }, [user, navigate])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      验证权限中... / Checking permissions...
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 font-bold text-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1"/>
              <rect x="14" y="3" width="7" height="18" rx="1"/>
              <line x1="3" y1="9" x2="10" y2="9"/>
              <line x1="14" y1="9" x2="21" y2="9"/>
            </svg>
            MyNotes
          </div>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition text-sm"
          >
            <LayoutDashboard size={16} /> 概览 / Overview
          </Link>
          <Link
            to="/admin/upload"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition text-sm"
          >
            <Upload size={16} /> 上传资料 / Upload
          </Link>
          <Link
            to="/admin/materials"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition text-sm"
          >
            <FileText size={16} /> 管理资料 / Materials
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut(auth).then(() => navigate("/"))}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <LogOut size={14} /> 登出 / Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}