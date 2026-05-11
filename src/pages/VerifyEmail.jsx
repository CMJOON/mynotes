import { useEffect, useState } from "react"
import { sendEmailVerification } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Mail } from "lucide-react"

export default function VerifyEmail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (user?.emailVerified) {
      navigate("/")
    }
  }, [user, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    setResending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success("验证邮件已重新发送！/ Verification email resent!")
      setCountdown(60)
    } catch (err) {
      toast.error("发送失败，请稍后再试 / Failed to resend")
    } finally {
      setResending(false)
    }
  }

  const handleCheckVerified = async () => {
    await auth.currentUser?.reload()
    if (auth.currentUser?.emailVerified) {
      toast.success("邮箱验证成功！/ Email verified!")
      navigate("/")
    } else {
      toast.error("还未验证，请检查邮箱 / Not verified yet")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">验证你的邮箱</h1>
        <p className="text-gray-500 mb-2">Verify your email address</p>
        <p className="text-sm text-gray-400 mb-8">
          我们已发送验证邮件到你的邮箱，请点击邮件中的链接完成验证。
          <br />
          We've sent a verification email. Please click the link to verify.
        </p>

        <button
          onClick={handleCheckVerified}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
        >
          我已验证 / I've verified
        </button>

        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="w-full border border-gray-200 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送验证邮件 / Resend"}
        </button>
      </div>
    </div>
  )
}