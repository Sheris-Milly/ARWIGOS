import type { Metadata } from "next"
import { AppLayout } from "@/components/app-layout"
import { ProfileContent } from "@/components/profile/profile-content"

export const metadata: Metadata = {
  title: "Profile | Finance Advisor",
  description: "Manage your profile and account settings",
}

export default function ProfilePage() {
  return (
    <AppLayout>
      <ProfileContent />
    </AppLayout>
  )
} 