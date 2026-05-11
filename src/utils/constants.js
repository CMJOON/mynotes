// 共享常量 - 价格、套餐等
// Shared constants - pricing, packages, etc.

export const PRICING = [
  {
    key: "subject",
    title: "单科目",
    titleEn: "Single Subject",
    price: "RM 25",
    priceValue: 25,
    desc: "1个科目全部章节笔记与练习",
    descEn: "All notes & exercises for 1 subject",
    highlight: false,
    emoji: "📚",
  },
  {
    key: "form",
    title: "年级套餐",
    titleEn: "Form Package",
    price: "RM 100",
    priceValue: 100,
    desc: "1个年级全部科目",
    descEn: "All subjects for 1 form",
    highlight: true,
    emoji: "📦",
  },
  {
    key: "premium",
    title: "全站会员",
    titleEn: "Premium",
    price: "RM 150",
    priceValue: 150,
    desc: "Form 1-5 所有科目，永久有效",
    descEn: "All subjects Form 1–5, lifetime",
    highlight: false,
    emoji: "⭐",
  },
]