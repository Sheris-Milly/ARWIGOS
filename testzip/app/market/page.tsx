import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { MarketContent } from "@/components/market/market-content"

export const metadata: Metadata = {
  title: "Market Research | Finance Advisor",
  description: "Real-time market data and financial news",
}

export default function MarketPage() {
  return (
    <AppLayout>
      <MarketContent />
    </AppLayout>
  )
}
