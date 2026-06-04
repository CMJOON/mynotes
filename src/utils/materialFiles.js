import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { canAccess } from "./access"

export function buildMaterialFileData(material, fileUrl = null) {
  const formNumber = parseInt(material.form)
  const data = {
    title: material.title || "",
    type: material.type || "note",
    form: formNumber,
    subjectId: material.subjectId || "",
    subjectName: material.subjectName || "",
    chapter: parseInt(material.chapter) || 0,
    year: parseInt(material.year) || 0,
    state: material.state || "",
    paperType: material.paperType || "",
    hasAnswerScheme: !!material.hasAnswerScheme,
    isFree: !!material.isFree,
    accessKey: material.accessKey || `${material.subjectName}_form${formNumber}`,
    formPackage: material.formPackage || `form${formNumber}`,
  }

  if (fileUrl) data.fileUrl = fileUrl
  return data
}

export function buildDownloadUrl(fileUrl, title) {
  const safeTitle = (title || "material")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")

  return fileUrl.replace("/upload/", `/upload/fl_attachment:${safeTitle}/`)
}

export async function getMaterialFileUrl(material, user, userData) {
  if (!canAccess(user, userData, material)) {
    throw new Error("NO_ACCESS")
  }

  // Legacy compatibility. New uploads store fileUrl in materialFiles/{materialId}.
  if (material.fileUrl) return material.fileUrl

  const fileDoc = await getDoc(doc(db, "materialFiles", material.id))
  if (!fileDoc.exists()) throw new Error("FILE_NOT_FOUND")

  const fileUrl = fileDoc.data()?.fileUrl
  if (!fileUrl) throw new Error("FILE_NOT_FOUND")
  return fileUrl
}
