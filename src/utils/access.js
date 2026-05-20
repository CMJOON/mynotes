export function getMaterialAccessKey(material) {
  if (material?.accessKey) return material.accessKey
  return `${material?.subjectName}_form${material?.form}`
}

export function getMaterialFormPackage(material) {
  if (material?.formPackage) return material.formPackage
  return `form${material?.form}`
}

export function canAccess(user, userData, material) {
  // trial 和 pastyear 永远免费
  if (material.type === "trial" || material.type === "pastyear") return true

  // 标记为免费的资料
  if (material.isFree) return true

  // 未登录无法访问付费内容
  if (!user) return false

  // ✅ Admin 可以访问所有内容
  if (userData?.role === "admin") return true

  // 已付费用户检查套餐
  if (userData?.role === "paid") {
    if (userData?.paidPackage === "premium") return true
    if (userData?.paidPackage === getMaterialFormPackage(material)) return true
    if (userData?.paidSubjects?.includes(getMaterialAccessKey(material))) return true
  }

  return false
}
