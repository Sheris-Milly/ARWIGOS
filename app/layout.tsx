import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata = {
  title: "Finance Advisor",
  description: "AI-powered financial analysis and advice",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                classNames: {
                  error: 'bg-red-400 dark:bg-red-700 border-red-500 dark:border-red-600 text-white',
                  // You can add more custom classes for other toast types (success, warning, info)
                },
              }}
            />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}