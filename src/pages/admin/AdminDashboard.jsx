import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase"
import { FileText, Users, BookOpen } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ materials: 0, users: 0, subjects: 0 })

  useEffect(() => {
    async function fetchStats() {
      const [materials, users, subjects] = await Promise.all([
        getDocs(collection(db, "materials")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "subjects")),
      ])
      setStats({
        materials: materials.size,
        users: users.size,
        subjects: subjects.size,
      })
    }
    fetchStats()
  }, [])

  const cards = [
    { label: "总资料数 / Materials", value: stats.materials, icon: FileText, color: "bg-blue-500" },
    { label: "注册用户 / Users", value: stats.users, icon: Users, color: "bg-green-500" },
    { label: "科目数 / Subjects", value: stats.subjects, icon: BookOpen, color: "bg-purple-500" },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">概览 / Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-200 flex items-center gap-4">
            <div className={`${card.color} text-white p-3 rounded-xl`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}