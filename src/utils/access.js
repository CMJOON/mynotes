/**
 * 判断用户是否可以访问某份资料
 * Check if a user can access a given material
 */
export function canAccess(user, userData, material) {
  // Trial 和 Past Year 永远免费
  if (material.type === "trial" || material.type === "pastyear") return true
  // 前3章免费
  if (material.chapter <= 3) return true
  // 未登录无法访问付费内容
  if (!user) return false
  // 已付费用户检查套餐
  if (userData?.role === "paid") {
    if (userData?.paidPackage === "premium") return true
    if (userData?.paidPackage === `form${material.form}`) return true
    if (userData?.paidSubjects?.includes(material.subjectName + "_form" + material.form)) return true
  }
  return false
}