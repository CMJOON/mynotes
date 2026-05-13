// src/components/ErrorBoundary.jsx
import { Component } from "react"
import { Link } from "react-router-dom"

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // 可以在这里接入日志服务，比如 Sentry
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">出了点问题</h1>
            <p className="text-gray-500 text-sm mb-6">
              Something went wrong. Please try again.<br />
              如果问题持续出现，请刷新页面。
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                重试 / Try Again
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                返回首页 / Back to Home
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}