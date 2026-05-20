import { useEffect, useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { PRICING } from "../utils/constants"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase"

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

const FORMS = ["1", "2", "3", "4", "5"]

// PurchaseModal 内部使用的套餐列表（从共享常量转换）
const PACKAGES = PRICING.map(p => ({
  key: p.key,
  labelZh: p.title,
  label: p.titleEn,
  price: p.price,
  descZh: p.desc,
  desc: p.descEn,
}))

export default function PurchaseModal({
  open,
  onClose,
  userData,
  defaultForm = "",
  defaultSubject = "",
  defaultPackage = "subject",
}) {
  const [name,       setName]       = useState("")
  const [phone,      setPhone]      = useState("")
  const [pkg,        setPkg]        = useState(defaultPackage)
  const [form,       setForm]       = useState(defaultForm)
  const [subject,    setSubject]    = useState(defaultSubject)
  const [subjectList, setSubjectList] = useState([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [errors,     setErrors]     = useState({})

  useEffect(() => {
    if (open) {
      setName(userData?.name || "")
      setPhone(userData?.phone ? `+60${userData.phone}` : "+60")
      setPkg(defaultPackage)
      setForm(defaultForm || userData?.formLevel?.toString() || "")
      setSubject(defaultSubject)
      setErrors({})
    }
  }, [open, userData, defaultForm, defaultSubject, defaultPackage])

  useEffect(() => {
    if (!form) { setSubjectList([]); return }
    setLoadingSubs(true)
    setSubject(defaultSubject || "")
    ;(async () => {
      try {
        const q = query(
          collection(db, "subjects"),
          where("form", "==", parseInt(form))
        )
        const snapshot = await getDocs(q)
        const list = snapshot.docs
          .map(d => d.data().name)
          .filter(Boolean)
          .sort()
        setSubjectList(list)
      } catch {
        setSubjectList([])
      } finally {
        setLoadingSubs(false)
      }
    })()
  }, [form, defaultSubject])

  function validate() {
    const e = {}
    if (!name.trim())  e.name    = "Please enter your name."
    if (!phone.trim()) e.phone   = "Please enter your phone number."
    if (!pkg)          e.pkg     = "Please select a package."
    if (pkg !== "premium" && !form) e.form = "Please select your form."
    if (pkg === "subject" && !subject) e.subject = "Please select a subject."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const pkgObj = PACKAGES.find(p => p.key === pkg)
    const formLine  = pkg !== "premium" ? `\nForm        : Form ${form}` : "\nForm        : Form 1 – 5 (All)"
    const subLine   = pkg === "subject"  ? `\nSubject     : ${subject}` : ""
    const accessLine = pkg === "premium"
      ? "\nAccess      : All Subjects, Form 1–5 (Lifetime)"
      : pkg === "form"
      ? `\nAccess      : All Subjects, Form ${form}`
      : `\nAccess      : ${subject}, Form ${form} (All Chapters)`

    const message =
      `Hi MyNotes! I would like to purchase:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Package     : ${pkgObj.label} (${pkgObj.price})` +
      formLine +
      subLine +
      accessLine +
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `Name        : ${name.trim()}\n` +
      `Phone       : ${phone.trim()}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Please help me unlock. Thank you!`

    window.open(buildWhatsAppUrl(message), "_blank")
    onClose()
  }

  if (!open) return null

  const needForm    = pkg !== "premium"
  const needSubject = pkg === "subject"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">购买配套 / Purchase Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">填写以下资料，通过 WhatsApp 完成购买 · Fill in details to order via WhatsApp</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Package */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              配套 / Package <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PACKAGES.map(p => (
                <button
                  key={p.key}
                  onClick={() => { setPkg(p.key); setErrors(e => ({ ...e, pkg: undefined })) }}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    pkg === p.key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-xs font-bold ${pkg === p.key ? "text-blue-700" : "text-gray-700"}`}>
                    {p.labelZh}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight">{p.label}</p>
                  <p className={`text-sm font-bold mt-1 ${pkg === p.key ? "text-blue-600" : "text-gray-500"}`}>
                    {p.price}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{p.descZh}</p>
                </button>
              ))}
            </div>
            {errors.pkg && <p className="text-red-400 text-xs mt-1">请选择配套 / {errors.pkg}</p>}
          </div>

          {/* Form Level */}
          {needForm && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                年级 / Form Level <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                {FORMS.map(f => (
                  <button
                    key={f}
                    onClick={() => { setForm(f); setErrors(e => ({ ...e, form: undefined })) }}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      form === f
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {errors.form && <p className="text-red-400 text-xs mt-1">请选择年级 / {errors.form}</p>}
            </div>
          )}

          {/* Subject */}
          {needSubject && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                科目 / Subject <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setErrors(err => ({ ...err, subject: undefined })) }}
                  disabled={!form || loadingSubs}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 appearance-none bg-white focus:outline-none focus:border-blue-400 transition disabled:opacity-50"
                >
                  <option value="">
                    {!form ? "请先选择年级 / Select a form first" : loadingSubs ? "加载中... / Loading..." : "选择科目... / Select subject..."}
                  </option>
                  {subjectList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
              {errors.subject && <p className="text-red-400 text-xs mt-1">请选择科目 / {errors.subject}</p>}
            </div>
          )}

          <div className="border-t border-gray-100 pt-1" />

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              姓名 / Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(err => ({ ...err, name: undefined })) }}
              placeholder="请输入姓名 / Your full name"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">请输入姓名 / {errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              电话号码 / Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setErrors(err => ({ ...err, phone: undefined })) }}
              placeholder="+601X-XXXXXXXX"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">请输入电话号码 / {errors.phone}</p>}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 space-y-3 border-t border-gray-100 shrink-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600 mb-1">订单摘要 / Order Summary</p>
            <p>配套 / Package : {PACKAGES.find(p => p.key === pkg)?.labelZh} ({PACKAGES.find(p => p.key === pkg)?.label}) — {PACKAGES.find(p => p.key === pkg)?.price}</p>
            {needForm    && <p>年级 / Form    : {form    || "—"}</p>}
            {needSubject && <p>科目 / Subject : {subject || "—"}</p>}
            <p>姓名 / Name   : {name  || "—"}</p>
            <p>电话 / Phone  : {phone || "—"}</p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all duration-150 shadow-md shadow-green-100 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.057 23.882a.5.5 0 0 0 .612.612l6.057-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.002-1.368l-.36-.214-3.713.91.934-3.626-.235-.373A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            发送 WhatsApp / Send via WhatsApp
          </button>
          <button
            onClick={onClose}
            className="w-full border-2 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition"
          >
            取消 / Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
