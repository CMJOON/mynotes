// src/hooks/usePhoneAuth.js
import { useRef, useState } from "react"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "../firebase"
import toast from "react-hot-toast"

export function usePhoneAuth() {
  const recaptchaRef = useRef(null)
  const [confirmResult, setConfirmResult] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendOtp = async (phone) => {
    if (phone.length < 9) {
      toast.error("请输入有效电话号码 / Enter valid phone number")
      return false
    }
    setLoading(true)
    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear()
        recaptchaRef.current = null
      }
      recaptchaRef.current = new RecaptchaVerifier(
        auth, "recaptcha-container", { size: "invisible" }
      )
      const fullPhone = "+60" + phone.replace(/^0/, "")
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current)
      setConfirmResult(result)
      setOtpSent(true)
      toast.success("验证码已发送！/ OTP sent!")
      return true
    } catch (err) {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear()
        recaptchaRef.current = null
      }
      toast.error("发送失败 / Failed: " + err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (otp) => {
    if (!otp || otp.length !== 6) {
      toast.error("请输入6位验证码 / Enter 6-digit OTP")
      return null
    }
    setLoading(true)
    try {
      const { user } = await confirmResult.confirm(otp)
      return user
    } catch {
      toast.error("验证码错误 / Invalid OTP")
      return null
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setOtpSent(false)
    if (recaptchaRef.current) {
      recaptchaRef.current.clear()
      recaptchaRef.current = null
    }
  }

  return { sendOtp, verifyOtp, reset, otpSent, loading }
}