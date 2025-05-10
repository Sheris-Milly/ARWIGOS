import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { PortfolioContent } from "@/components/portfolio/portfolio-content"

export const metadata: Metadata = {
  title: "Portfolio Analysis | Finance Advisor",
  description: "Analyze and manage your investment portfolio",
}

export default function PortfolioPage() {
  return (
    <AppLayout>
      <PortfolioContent />
    </AppLayout>
  )
}
