export const siteConfig = {
  name: "XpenseLab",
  author: "XpenseLab",
  description: "An intelligent, modern application for managing your personal finances with ease. Track income, expenses, budgets, and get AI-powered insights.",
  url: "https://xpenselab.com",
  ogImage: "https://xpenselab.com/og.jpg",
  links: {
    github: "https://github.com/your-repo/xpenselab",
  },
  limits: {
    aiRequestsPerDay: 10,
  }
}

export type SiteConfig = typeof siteConfig
