import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import FormPage from "./pages/FormPage"
import SubjectPage from "./pages/SubjectPage"
import Dashboard from "./pages/Dashboard"
import NotFound from "./pages/NotFound"
import SearchPage from "./pages/SearchPage"
import VerifyEmail from "./pages/VerifyEmail"
import CompleteProfile from "./pages/CompleteProfile"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUpload from "./pages/admin/AdminUpload"
import AdminMaterials from "./pages/admin/AdminMaterials"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminSubjects from "./pages/admin/AdminSubjects"

function RequireProfile({ children }) {
  const { user, userData, loading } = useAuth()
  const location = useLocation()

  // 数据还在加载中时不做任何跳转
  if (loading) return null

  const skipRoutes = ["/complete-profile", "/verify-email", "/login", "/register"]
  if (skipRoutes.includes(location.pathname)) return children

  // 已登录但未填写姓名，跳转到完善资料页
  if (user && userData !== null && !userData?.name) {
    return <Navigate to="/complete-profile" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <RequireProfile>
        <Routes>
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/register" element={<><Navbar /><Register /></>} />
          <Route path="/verify-email" element={<><Navbar /><VerifyEmail /></>} />
          <Route path="/complete-profile" element={<><Navbar /><CompleteProfile /></>} />
          <Route path="/form/:formId" element={<><Navbar /><FormPage /></>} />
          <Route path="/form/:formId/:subjectId" element={<><Navbar /><SubjectPage /></>} />
          <Route path="/search" element={<><Navbar /><SearchPage /></>} />
          <Route path="/dashboard" element={<><Navbar /><Dashboard /></>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="upload" element={<AdminUpload />} />
            <Route path="materials" element={<AdminMaterials />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="subjects" element={<AdminSubjects />} />
          </Route>
          <Route path="*" element={<><Navbar /><NotFound /></>} />
        </Routes>
      </RequireProfile>
    </BrowserRouter>
  )
}

export default App