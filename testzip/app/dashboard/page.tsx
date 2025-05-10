import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | Finance Advisor",
  description: "Overview of your financial metrics and portfolio summary",
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  )
}
