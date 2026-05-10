import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import FormPage from "./pages/FormPage"
import SubjectPage from "./pages/SubjectPage"
import Dashboard from "./pages/Dashboard"
import NotFound from "./pages/NotFound"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUpload from "./pages/admin/AdminUpload"
import AdminMaterials from "./pages/admin/AdminMaterials"
import SearchPage from "./pages/SearchPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 普通页面 */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/register" element={<><Navbar /><Register /></>} />
        <Route path="/form/:formId" element={<><Navbar /><FormPage /></>} />
        <Route path="/form/:formId/:subjectId" element={<><Navbar /><SubjectPage /></>} />
        <Route path="/dashboard" element={<><Navbar /><Dashboard /></>} />
        <Route path="/search" element={<><Navbar /><SearchPage /></>} />

        {/* 后台管理 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="materials" element={<AdminMaterials />} />
        </Route>

        <Route path="*" element={<><Navbar /><NotFound /></>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App