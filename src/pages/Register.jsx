import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "../firebase"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [tab, setTab] = useState("email")
  const [otpSent, setOtpSent] = useState(false)
  const [confirmResult, setConfirmResult] = useState(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otp, setOtp] = useState("")
  const [phone, setPhone] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    formLevel: "5"
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 邮箱注册
  const handleEmailRegister = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error("密码至少需要6位 / Password must be at least 6 characters")
      return
    }
    if (form.phone.length < 9) {
      toast.error("请输入有效的电话号码 / Please enter a valid phone number")
      return
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(user, { displayName: form.name })
      await setDoc(doc(db, "users", user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        formLevel: parseInt(form.formLevel),
        role: "free",
        paidSubjects: [],
        paidPackage: null,
        createdAt: new Date()
      })
      await sendEmailVerification(user)
      toast.success("注册成功！请检查邮箱验证邮件 / Check your email for verification!")
      navigate("/verify-email")
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("此邮箱已注册 / Email already in use")
      } else {
        toast.error("注册失败，请重试 / Registration failed")
      }
    } finally {
      setLoading(false)
    }
  }

  // Google 注册
  const handleGoogleRegister = async () => {
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
    } catch (err) {
      toast.error("Google 注册失败 / Google registration failed")
    } finally {
      setGoogleLoading(false)
    }
  }

  // 发送 OTP
  const handleSendOtp = async () => {
    if (phone.length < 9) {
      toast.error("请输入有效电话号码 / Enter valid phone number")
      return
    }
    setOtpLoading(true)
    try {
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" })
      const fullPhone = "+60" + phone.replace(/^0/, "")
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptcha)
      setConfirmResult(result)
      setOtpSent(true)
      toast.success("验证码已发送！/ OTP sent!")
    } catch (err) {
      toast.error("发送失败 / Failed to send OTP: " + err.message)
    } finally {
      setOtpLoading(false)
    }
  }

  // 验证 OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("请输入6位验证码 / Enter 6-digit OTP")
      return
    }
    setOtpLoading(true)
    try {
      const { user } = await confirmResult.confirm(otp)
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) {
        navigate("/complete-profile")
      } else {
        toast.success("登录成功！/ Login successful!")
        navigate("/")
      }
    } catch (err) {
      toast.error("验证码错误 / Invalid OTP")
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">MyNotes</h1>
        <p className="text-center text-gray-500 mb-6">创建账号 / Create Account</p>

        {/* Google 注册 */}
        <button
          onClick={handleGoogleRegister}
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
            {googleLoading ? "处理中..." : "使用 Google 注册 / Continue with Google"}
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
            onClick={() => setTab("email")}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
              tab === "email" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            邮箱 / Email
          </button>
          <button
            onClick={() => setTab("phone")}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
              tab === "phone" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            手机号 / Phone
          </button>
        </div>

        {/* 邮箱注册 */}
        {tab === "email" && (
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 / Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>
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
                placeholder="至少6位 / At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话号码 / Phone</label>
              <div className="flex gap-2">
                <span className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">+60</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="11-12345678"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级 / Form</label>
              <select
                name="formLevel"
                value={form.formLevel}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Form 1</option>
                <option value="2">Form 2</option>
                <option value="3">Form 3</option>
                <option value="4">Form 4</option>
                <option value="5">Form 5</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "处理中..." : "注册 / Register"}
            </button>
          </form>
        )}

        {/* 手机号注册 */}
        {tab === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号 / Phone</label>
              <div className="flex gap-2">
                <span className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">+60</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">验证码 / OTP</label>
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
                  {otpLoading ? "验证中..." : "验证注册 / Verify & Register"}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp("") }}
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
          已有账号？/{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            登录 / Login
          </Link>
        </p>
      </div>
    </div>
  )
}