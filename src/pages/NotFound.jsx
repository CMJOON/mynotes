// src/pages/NotFound.jsx
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-blue-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">页面不存在</h1>
        <p className="text-gray-500 mb-8">
          Page not found. The page you are looking for does not exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            返回首页 / Back to Home
          </Link>
          <Link
            to="/form/5"
            className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            浏览资料 / Browse Materials
          </Link>
        </div>
      </div>
    </div>
  )
}