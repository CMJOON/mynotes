// src/pages/Login.jsx
import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "../firebase"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { usePhoneAuth } from "../hooks/usePhoneAuth"

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [tab, setTab] = useState("email")
  const [form, setForm] = useState({ email: "", password: "" })
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")

  const { sendOtp, verifyOtp, reset, otpSent, loading: otpLoading } = usePhoneAuth()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password)
      if (!user.emailVerified) {
        toast.error("请先验证邮箱！/ Please verify your email first!")
        setLoading(false)
        return
      }
      toast.success("登录成功！/ Login successful!")
      navigate("/")
    } catch {
      toast.error("邮箱或密码错误 / Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const { user } = await signInWithPopup(auth, googleProvider)
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) {
        navigate("/complete-profile")
      } else {
        toast.success("登录成功！/ Login successful!")
        navigate("/")
      }
    } catch {
      toast.error("Google 登录失败 / Google login failed")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSendOtp = () => sendOtp(phone)

  const handleVerifyOtp = async () => {
    const user = await verifyOtp(otp)
    if (!user) return
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) {
      navigate("/complete-profile")
    } else {
      toast.success("登录成功！/ Login successful!")
      navigate("/")
    }
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    if (newTab !== "phone") {
      reset()
      setOtp("")
      setPhone("")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">MyNotes</h1>
        <p className="text-center text-gray-500 mb-6">登录账号 / Login</p>

        {/* Google 登录 */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition mb-4 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {googleLoading ? "登录中..." : "使用 Google 登录 / Continue with Google"}
          </span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">或 / or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Tab 切换 */}
        <div className="flex border border-gray-200 rounded-lg p-1 mb-4">
          <button
            onClick={() => handleTabChange("email")}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
              tab === "email" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            邮箱 / Email
          </button>
          <button
            onClick={() => handleTabChange("phone")}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
              tab === "phone" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            手机号 / Phone
          </button>
        </div>

        {/* 邮箱登录 */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 / Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码 / Password</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录 / Login"}
            </button>
          </form>
        )}

        {/* 手机号登录 */}
        {tab === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号 / Phone</label>
              <div className="flex gap-2">
                <span className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  +60
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={otpSent}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="11-12345678"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {otpLoading ? "发送中..." : "发送验证码 / Send OTP"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    验证码 / OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest"
                    placeholder="123456"
                  />
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {otpLoading ? "验证中..." : "验证登录 / Verify & Login"}
                </button>
                <button
                  onClick={() => { reset(); setOtp("") }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  更换号码 / Change number
                </button>
              </>
            )}
          </div>
        )}

        <div id="recaptcha-container"></div>

        <p className="text-center text-sm text-gray-500 mt-4">
          还没有账号？/{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            注册 / Register
          </Link>
        </p>
      </div>
    </div>
  )
}