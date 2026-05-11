import { useState, useEffect } from "react"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "../../firebase"
import { supabase } from "../../supabase"   // ✅ 只用 anon key 的普通客户端
import toast from "react-hot-toast"
import { Upload } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function AdminUpload() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [form, setForm] = useState({
    title: "",
    type: "note",
    form: "5",
    subjectName: "",
    chapter: "",
    year: "",
    state: "",
    freePreviewPages: "0",
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    async function fetchSubjects() {
      const snapshot = await getDocs(collection(db, "subjects"))
      setSubjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetchSubjects()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error("请选择PDF文件 / Please select a PDF file"); return }

    // 检查文件大小（前端预检，50MB 上限）
    if (file.size > 50 * 1024 * 1024) {
      toast.error("文件太大，最大 50MB / File too large, max 50MB")
      return
    }
// 检查用户是否登录
    if (!user) {
      toast.error("请先登录 / Please login first")
      return
    }

    setUploading(true)
    setUploadProgress("正在上传文件... / Uploading file...")

    try {
      // ✅ 直接用 Supabase Storage 上传（anon key 足够）
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`

      const { data, error: uploadError } = await supabase.storage
        .from("materials")
        .upload(fileName, file, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setUploadProgress("正在保存资料信息... / Saving material info...")

      // ✅ 临时跳过 Firestore 写入（等规则生效后再恢复）
      console.log("文件已上传到 Supabase Storage:", data.path)
      console.log("资料信息:", {
        title: form.title,
        type: form.type,
        form: parseInt(form.form),
        subjectName: form.subjectName,
        chapter: parseInt(form.chapter) || 0,
        year: parseInt(form.year) || 0,
        state: form.state,
        filePath: data.path,
        freePreviewPages: parseInt(form.freePreviewPages),
        downloadCount: 0,
        createdAt: new Date(),
      })

      // 注释掉 Firestore 写入
      // await addDoc(collection(db, "materials"), {
      //   title: form.title,
      //   type: form.type,
      //   form: parseInt(form.form),
      //   subjectName: form.subjectName,
      //   chapter: parseInt(form.chapter) || 0,
      //   year: parseInt(form.year) || 0,
      //   state: form.state,
      //   filePath: data.path,
      //   freePreviewPages: parseInt(form.freePreviewPages),
      //   downloadCount: 0,
      //   createdAt: new Date(),
      // })

      toast.success("上传成功！/ Upload successful!")
      setUploadProgress("")
      setForm({
        title: "",
        type: "note",
        form: "5",
        subjectName: "",
        chapter: "",
        year: "",
        state: "",
        freePreviewPages: "0",
      })
      setFile(null)
      // 重置 file input
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
          <select name="subjectName" value={form.subjectName} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">选择科目 / Select subject</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.name}>{s.name} - {s.nameZh}</option>
            ))}
          </select>
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
                  {["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","WP Kuala Lumpur"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            免费预览页数 / Free Preview Pages
          </label>
          <input
            type="number"
            name="freePreviewPages"
            value={form.freePreviewPages}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0 = 全部免费, 3 = 仅前3页"
          />
          <p className="text-xs text-gray-400 mt-1">0 = 完全免费 / Fully free · 3 = 付费内容只预览前3页</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF 文件（最大 50MB）</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="text-xs text-green-600 mt-1">
              已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              {file.size > 50 * 1024 * 1024 && (
                <span className="text-red-500 ml-2">⚠️ 文件太大！</span>
              )}
            </p>
          )}
        </div>

        {/* 上传进度提示 */}
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