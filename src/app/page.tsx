import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check, BrainCircuit, PiggyBank, Split } from "lucide-react"
import { Logo } from "@/components/logo"
import { HomepageBottomNav } from "@/components/homepage-bottom-nav"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Logo />
            <span className="font-bold">{siteConfig.name}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2">
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Login
              </Link>
              <Link href="/login" className={buttonVariants()}>
                Get Started
              </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                🚀 Now with AI-Powered Insights!
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              Take Control of Your Finances
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              {siteConfig.description} Stop guessing, start growing.
            </p>
            <div className="flex gap-4">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Get Started for Free
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-12 md:py-20">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Features</h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Everything you need to manage your money and achieve your financial goals.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 pt-12">
                 <Card>
                    <CardHeader>
                        <BrainCircuit className="h-10 w-10 text-primary mb-2"/>
                        <CardTitle>AI Categorization</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Automatically categorize your expenses with the power of AI, saving you time and effort.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <PiggyBank className="h-10 w-10 text-primary mb-2"/>
                        <CardTitle>Smart Budgeting</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Set monthly budgets, track your progress, and get AI-powered advice to stay on track.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Split className="h-10 w-10 text-primary mb-2"/>
                        <CardTitle>Expense Splitting</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Easily create groups and split shared expenses with friends and family. No more manual calculations.</p>
                    </CardContent>
                </Card>
            </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="container py-12 md:py-20">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Pricing</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Choose the plan that's right for you. Get started for free.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-12">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <CardDescription>For individuals getting started with managing their finances.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-4xl font-bold">Free</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Track Income & Expenses</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Manual Budgeting</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Expense Splitting</li>
                </ul>
              </CardContent>
              <CardFooter>
                 <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    Get Started
                </Link>
              </CardFooter>
            </Card>
            <Card className="border-primary flex flex-col">
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Unlock powerful AI features and advanced controls.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                 <p><span className="text-4xl font-bold">$10</span><span className="text-muted-foreground">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Everything in Basic</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Expense Categorization</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Budgeting Assistant</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />AI Financial Insights</li>
                   <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Receipt Scanning</li>
                   <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" />Predictive Forecasting</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                    Upgrade to Premium
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
        <footer className="py-6 md:px-8 md:py-0 border-t pb-20 md:pb-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built by {siteConfig.author}. The source code is available on GitHub.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Privacy & GDPR
                    </Link>
                    {/* Add social links here if needed */}
                </div>
            </div>
        </footer>
      <HomepageBottomNav />
    </div>
  )
}
