
export const siteConfig = {
  name: "XpenseLab - Personal Finance Tracker",
  author: "XpenseLab",
  description: "An intelligent, modern application for managing your personal finances with ease. Track income, expenses, budgets, and get AI-powered insights. Free expense tracker with premium features.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://xpenselab.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://xpenselab.com",
  ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || "https://xpenselab.com"}/og-image.svg`,
  links: {
    github: "https://github.com/your-repo/xpenselab",
  },
  limits: {
    aiRequestsPerDay: 10,
  },
  keywords: [
    "expense tracker",
    "personal finance",
    "budget tracker",
    "money management",
    "financial planning",
    "expense management",
    "income tracker",
    "budget app",
    "finance app",
    "AI expense categorization",
    "receipt scanner",
    "expense splitting",
    "debt tracker",
    "loan tracker",
    "financial insights",
    "free expense tracker",
    "premium finance app"
  ],
}

export type SiteConfig = typeof siteConfig
