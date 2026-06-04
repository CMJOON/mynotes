import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import { db } from "../firebase"

const LIST_LIMIT = 20

export function materialToUserSnapshot(material) {
  return {
    materialId: material.id,
    title: material.title || "",
    type: material.type || "note",
    form: parseInt(material.form) || 0,
    subjectId: material.subjectId || "",
    subjectName: material.subjectName || "",
    chapter: parseInt(material.chapter) || 0,
    year: parseInt(material.year) || 0,
    state: material.state || "",
    paperType: material.paperType || "",
    hasAnswerScheme: !!material.hasAnswerScheme,
    isFree: !!material.isFree,
    accessKey: material.accessKey || `${material.subjectName}_form${material.form}`,
    formPackage: material.formPackage || `form${material.form}`,
  }
}

export async function loadSavedMaterialIds(user) {
  if (!user) return new Set()

  const snapshot = await getDocs(collection(db, "users", user.uid, "savedMaterials"))
  return new Set(snapshot.docs.map(item => item.id))
}

export async function loadCompletedMaterialIds(user) {
  if (!user) return new Set()

  const snapshot = await getDocs(collection(db, "users", user.uid, "completedMaterials"))
  return new Set(snapshot.docs.map(item => item.id))
}

export async function loadUserMaterialList(user, listName, count = LIST_LIMIT) {
  if (!user) return []

  const timestampField =
    listName === "recentMaterials"
      ? "viewedAt"
      : listName === "completedMaterials"
      ? "completedAt"
      : "savedAt"
  const listQuery = query(
    collection(db, "users", user.uid, listName),
    orderBy(timestampField, "desc"),
    limit(count)
  )
  const snapshot = await getDocs(listQuery)

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data(),
  }))
}

export async function saveMaterialForUser(user, material) {
  if (!user) throw new Error("LOGIN_REQUIRED")

  await setDoc(doc(db, "users", user.uid, "savedMaterials", material.id), {
    ...materialToUserSnapshot(material),
    savedAt: serverTimestamp(),
  })
}

export async function removeSavedMaterial(user, materialId) {
  if (!user) throw new Error("LOGIN_REQUIRED")

  await deleteDoc(doc(db, "users", user.uid, "savedMaterials", materialId))
}

export async function completeMaterialForUser(user, material) {
  if (!user) throw new Error("LOGIN_REQUIRED")

  await setDoc(doc(db, "users", user.uid, "completedMaterials", material.id), {
    ...materialToUserSnapshot(material),
    completedAt: serverTimestamp(),
  })
}

export async function removeCompletedMaterial(user, materialId) {
  if (!user) throw new Error("LOGIN_REQUIRED")

  await deleteDoc(doc(db, "users", user.uid, "completedMaterials", materialId))
}

export async function recordRecentMaterial(user, material, action = "view") {
  if (!user) return

  await setDoc(doc(db, "users", user.uid, "recentMaterials", material.id), {
    ...materialToUserSnapshot(material),
    lastAction: action,
    viewedAt: serverTimestamp(),
  }, { merge: true })
}
