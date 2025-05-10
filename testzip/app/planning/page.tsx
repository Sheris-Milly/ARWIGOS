import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { PlanningContent } from "@/components/planning/planning-content"

export const metadata: Metadata = {
  title: "Financial Planning | Finance Advisor",
  description: "Tools for budgeting, goal setting, and retirement planning",
}

export default function PlanningPage() {
  return (
    <AppLayout>
      <PlanningContent />
    </AppLayout>
  )
}
