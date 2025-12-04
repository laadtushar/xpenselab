
export const siteConfig = {
  name: "XpenseLab",
  author: "XpenseLab",
  description: "An intelligent, modern application for managing your personal finances with ease. Track income, expenses, budgets, and get AI-powered insights.",
  url: "https://localhost:9002",
  siteUrl: "https://localhost:9002",
  ogImage: "https://localhost:9002/og.jpg",
  links: {
    github: "https://github.com/your-repo/localhost:9002",
  },
  limits: {
    aiRequestsPerDay: 10,
  }
}

export type SiteConfig = typeof siteConfig
