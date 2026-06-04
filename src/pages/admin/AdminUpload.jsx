import { useState, useEffect } from "react"
import { collection, addDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../../firebase"
import toast from "react-hot-toast"
import { Upload } from "lucide-react"
import { buildMaterialFileData } from "../../utils/materialFiles"
import { MALAYSIA_STATES, PAPER_TYPES } from "../../utils/constants"

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export default function AdminUpload() {
  const [subjects, setSubjects] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [form, setForm] = useState({
    title: "",
    type: "note",
    form: "5",
    subjectName: "",
    subjectId: "",
    chapter: "",
    year: "",
    state: "",
    paperType: "",
    hasAnswerScheme: false,
    isFree: false,
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const snapshot = await getDocs(collection(db, "subjects"))
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setSubjects(data)
      } catch (error) {
        console.error("获取科目失败:", error)
        toast.error("获取科目列表失败 / Failed to load subjects")
      }
    }
    fetchSubjects()
  }, [])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm({ ...form, [name]: type === "checkbox" ? checked : value })
  }

  const handleSubjectChange = (e) => {
    const selectedId = e.target.value
    const selectedSubject = subjects.find(s => s.id === selectedId)
    setForm({
      ...form,
      subjectId: selectedId,
      subjectName: selectedSubject?.name || "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error("请选择PDF文件 / Please select a PDF file"); return }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件太大，最大 10MB / File too large, max 10MB")
      return
    }
    if (!form.subjectId) {
      toast.error("请选择科目 / Please select a subject")
      return
    }

    setUploading(true)
    setUploadProgress("正在上传到 Cloudinary...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("resource_type", "raw")

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
        { method: "POST", body: formData }
      )

      if (!cloudRes.ok) throw new Error("Cloudinary 上传失败 / Cloudinary upload failed")
      const cloudData = await cloudRes.json()
      const fileUrl = cloudData.secure_url

      setUploadProgress("正在保存资料信息...")

      const materialData = {
        title: form.title,
        type: form.type,
        form: parseInt(form.form),
        subjectId: form.subjectId,
        subjectName: form.subjectName,
        chapter: form.type === "note" || form.type === "exercise" ? parseInt(form.chapter) || 0 : 0,
        year: form.type === "trial" || form.type === "pastyear" ? parseInt(form.year) || 0 : 0,
        state: form.type === "trial" ? form.state || "" : "",
        paperType: form.type === "trial" || form.type === "pastyear" ? form.paperType || "" : "",
        hasAnswerScheme: form.type === "trial" || form.type === "pastyear" ? !!form.hasAnswerScheme : false,
        isFree: form.isFree,
        downloadCount: 0,
        accessKey: `${form.subjectName}_form${form.form}`,
        formPackage: `form${form.form}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const materialRef = await addDoc(collection(db, "materials"), materialData)
      await setDoc(doc(db, "materialFiles", materialRef.id), {
        ...buildMaterialFileData(materialData, fileUrl),
        cloudinaryPublicId: cloudData.public_id || "",
        resourceType: cloudData.resource_type || "raw",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast.success("上传成功！/ Upload successful!")
      setUploadProgress("")
      setForm({
        title: "",
        type: "note",
        form: "5",
        subjectName: "",
        subjectId: "",
        chapter: "",
        year: "",
        state: "",
        paperType: "",
        hasAnswerScheme: false,
        isFree: true,
      })
      setFile(null)
      e.target.reset()
    } catch (err) {
      console.error(err)
      toast.error("上传失败 / Upload failed: " + err.message)
      setUploadProgress("")
    } finally {
      setUploading(false)
    }
  }

  const filteredSubjects = subjects.filter(s => s.form === parseInt(form.form))

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">上传资料 / Upload Material</h1>

      {(!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
          ⚠️ 请先在 .env.local 填入 VITE_CLOUDINARY_CLOUD_NAME 和 VITE_CLOUDINARY_UPLOAD_PRESET，才能上传文件。
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题 / Title</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Mathematics Chapter 1 - Number Bases"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型 / Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="note">笔记 / Note</option>
              <option value="exercise">练习 / Exercise</option>
              <option value="trial">Trial Paper</option>
              <option value="pastyear">Past Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年级 / Form</label>
            <select name="form" value={form.form} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[1,2,3,4,5].map(f => <option key={f} value={f}>Form {f}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">科目 / Subject</label>
          <select
            value={form.subjectId}
            onChange={handleSubjectChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择科目 / Select subject</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} - {s.nameZh}</option>
            ))}
          </select>
          {filteredSubjects.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">该年级暂无科目，请先在 Firestore 添加 subjects 数据</p>
          )}
        </div>

        {(form.type === "note" || form.type === "exercise") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">章节 / Chapter</label>
            <input
              type="number"
              name="chapter"
              value={form.chapter}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1"
            />
          </div>
        )}

        {(form.type === "trial" || form.type === "pastyear") && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份 / Year</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2023"
              />
            </div>
            {form.type === "trial" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">州属 / State</label>
                <select name="state" value={form.state} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">选择州属</option>
                  {MALAYSIA_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">试卷类型 / Paper Type</label>
                <select name="paperType" value={form.paperType} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">未指定 / Not specified</option>
                  {PAPER_TYPES.map(paper => (
                    <option key={paper.value} value={paper.value}>{paper.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasAnswerScheme"
                  checked={form.hasAnswerScheme}
                  onChange={handleChange}
                />
                有答案 / Has answer scheme
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            访问权限 / Access
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, isFree: true })}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                form.isFree
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              免费 / Free
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, isFree: false })}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                !form.isFree
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              付费 / Paid
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF 文件（最大 10MB）</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="text-xs text-green-600 mt-1">
              已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              {file.size > 10 * 1024 * 1024 && (
                <span className="text-red-500 ml-2">⚠️ 文件太大！</span>
              )}
            </p>
          )}
        </div>

        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            ⏳ {uploadProgress}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload size={18} />
          {uploading ? "上传中... / Uploading..." : "上传 / Upload"}
        </button>
      </form>
    </div>
  )
}
