import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubUser = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // 取消上一个用户的 Firestore 监听
      if (unsubUser) {
        unsubUser()
        unsubUser = null
      }

      setUser(firebaseUser)

      if (firebaseUser) {
        // 实时监听用户数据，购买后自动更新
        unsubUser = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            setUserData(snap.exists() ? snap.data() : null)
            setLoading(false)
          },
          () => {
            // 监听出错时静默失败，不影响页面
            setUserData(null)
            setLoading(false)
          }
        )
      } else {
        setUserData(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubUser) unsubUser()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}