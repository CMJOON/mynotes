import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import FormPage from "./pages/FormPage"
import SubjectPage from "./pages/SubjectPage"
import Dashboard from "./pages/Dashboard"
import NotFound from "./pages/NotFound"


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/form/:formId" element={<FormPage />} />
        <Route path="/form/:formId/:subjectId" element={<SubjectPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App