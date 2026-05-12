import { useEffect, useState } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { Lock, Download, Eye, Search } from "lucide-react"
import toast from "react-hot-toast"

const TYPE_LABELS = {
  note: { zh: "??", en: "Notes" },
  exercise: { zh: "??", en: "Exercise" },
  trial: { zh: "Trial", en: "Trial Paper" },
  pastyear: { zh: "Past Year", en: "Past Year" },
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        const response = await fetch("http://localhost:3001/api/materials")
        const all = await response.json()
        const filtered = all.filter(m =>
          m.title?.toLowerCase().includes(query.toLowerCase()) ||
          m.subjectName?.toLowerCase().includes(query.toLowerCase()) ||
          m.type?.toLowerCase().includes(query.toLowerCase())
        )
        setResults(filtered)
      } catch (error) {
        console.error("????:", error)
        toast.error("???? / Search failed")
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query])

  const handleView = async (material) => {
    try {
      const url = `http://localhost:3001/api/download/${material.filePath}`
      window.open(url, "_blank")
    } catch (err) {
      toast.error("???? / View failed")
    }
  }

  const handleDownload = async (material) => {
    try {
      const url = `http://localhost:3001/api/download/${material.filePath}`
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", material.title + ".pdf")
      link.setAttribute("target", "_blank")
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => document.body.removeChild(link), 100)
      toast.success("?????!/ Download started!")
    } catch (err) {
      toast.error("???? / Download failed")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0f4f8" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">???... / Searching...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f8" }}>
      <div style={{ backgroundColor: "#e8eef4" }} className="border-b border-gray-200 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Search size={20} />
            <span className="text-sm">????</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">"{query}" ?????</h1>
          <p className="text-gray-500 mt-1">?? {results.length} ???</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">???????</h3>
            <p className="text-gray-500">????????????</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((material) => (
              <div key={material.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {TYPE_LABELS[material.type]?.zh || material.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Form {material.form} · {material.subjectName}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{material.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {material.chapter && <p>??: {material.chapter}</p>}
                      {material.year && <p>??: {material.year}</p>}
                      {material.state && <p>??: {material.state}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleView(material)}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Eye size={16} />
                      ??
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Download size={16} />
                      ??
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
