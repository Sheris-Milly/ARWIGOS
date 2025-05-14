"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Home, LineChart, PieChart, Search, Info, Bot, User } from "lucide-react"
import { motion } from "framer-motion"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  const navigation = [
    {
      title: "Overview",
      links: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: Home,
        },
        {
          title: "Portfolio Analysis",
          href: "/portfolio",
          icon: PieChart,
        },
      ],
    },
    {
      title: "Research",
      links: [
        {
          title: "Financial Planning",
          href: "/planning",
          icon: LineChart,
        },
        {
          title: "AI Advisor",
          href: "/advisor-new",
          icon: Bot,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          title: "Profile",
          href: "/profile",
          icon: User,
        },
        {
          title: "About",
          href: "/about",
          icon: Info,
        },
      ],
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}>
            <BarChart3 className="h-6 w-6 text-primary" />
          </motion.div>
          <motion.span
            className="text-lg font-semibold"
            initial={false}
            animate={{ opacity: state === "collapsed" ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            ArwiGos
          </motion.span>
        </div>
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput type="search" placeholder="Search..." className="w-full pl-8" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={pathname === link.href} tooltip={link.title}>
                      <Link href={link.href} className="transition-all duration-200">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2"
                        >
                          <link.icon className={`h-4 w-4 ${pathname === link.href ? "text-primary" : ""}`} />
                          <span>{link.title}</span>
                        </motion.div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>{/* Settings link removed as requested */}</SidebarFooter>
    </Sidebar>
  )
}
