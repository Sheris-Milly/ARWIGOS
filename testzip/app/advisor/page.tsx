import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { AdvisorContent } from "@/components/advisor/advisor-content"

export const metadata: Metadata = {
  title: "AI Advisor | Finance Advisor",
  description: "Get personalized financial advice from our AI advisor",
}

export default function AdvisorPage() {
  return (
    <AppLayout>
      <AdvisorContent />
    </AppLayout>
  )
}
