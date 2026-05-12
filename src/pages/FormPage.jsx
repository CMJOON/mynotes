import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export default function FormPage() {
  const { formId } = useParams()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true)
      const q = query(
        collection(db, "subjects"),
        where("form", "==", parseInt(formId))
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSubjects(data)
      setLoading(false)
    }
    fetchSubjects()
  }, [formId])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-blue-600 font-medium mb-1">选择科目 / Select Subject</p>
          <h1 className="text-3xl font-bold text-gray-900">Form {formId}</h1>
          <p className="text-gray-500 mt-1">选择科目查看笔记、练习与试卷</p>
        </div>
      </div>

      {/* 年级快速切换 */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(f => (
          <Link
            key={f}
            to={`/form/${f}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              parseInt(formId) === f
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
            }`}
          >
            Form {f}
          </Link>
        ))}
      </div>

      {/* 科目列表 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中... / Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无科目 / No subjects found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <Link
                key={subject.id}
                to={`/form/${formId}/${subject.id}`}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-400 hover:shadow-md transition group"
              >
                <div className="text-4xl mb-3">{subject.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">
                  {subject.name}
                </h3>
                <p className="text-sm text-gray-500">{subject.nameZh}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                    部分免费 / Partial Free
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}