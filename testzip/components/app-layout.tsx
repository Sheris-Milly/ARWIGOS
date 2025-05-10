"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure theme toggle only renders client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Completely rewritten theme toggle function
  const toggleTheme = () => {
    // Use resolvedTheme instead of theme to get the actual current theme
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)

    // Apply theme class directly to document for immediate effect
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Store the theme preference in localStorage for persistence
    localStorage.setItem("theme", newTheme)
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Finance Advisor</h1>
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </>
  )
}
