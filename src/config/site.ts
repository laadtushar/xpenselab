import { FAMILY_FOUNDER, FAMILY_STUDIO } from '@/lib/family';

// The canonical host is the apex. www also serves 200 but declares the apex
// canonical. A trailing slash is stripped so every URL built from this is
// consistent (canonical, og:url, sitemap, JSON-LD).
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://xpenselab.com").replace(/\/+$/, "");

export const siteConfig = {
  // The product name, as used for og:site_name and JSON-LD.
  name: "XpenseLab",
  tagline: "Smart Expense Tracking",
  // Who made it. The studio publishes the product; the founder is its author.
  author: FAMILY_FOUNDER.name,
  publisher: FAMILY_STUDIO.name,
  // Hero copy on the home page.
  description: "An intelligent, modern application for managing your personal finances with ease. Track income, expenses, budgets, and get AI-powered insights. Free expense tracker with premium features.",
  // Meta description (140-160 characters) for search results and link previews.
  metaDescription: "Track income, expenses, budgets and loans, and split costs with friends, free. Premium adds AI categorization, insights, forecasts and receipt scanning.",
  url: siteUrl,
  siteUrl,
  links: {
    github: "https://github.com/laadtushar/xpenselab",
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
