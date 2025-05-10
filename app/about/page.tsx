import { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { AboutContent } from "@/components/about/about-content"
import { MentorAcknowledgment } from "@/components/about/mentor-acknowledgment"

export const metadata: Metadata = {
  title: "About | Finance Advisor",
  description: "Learn about our innovative Finance Advisor application, our team, and our multi-agent AI system.",
}

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-12">
        <AboutContent />
        
        <MentorAcknowledgment />
      </div>
    </AppLayout>
  )
}
