"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { LineChart, BarChart, PieChart, Bot, Database, Server, Code, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from "recharts"
import { InnovationSection } from "./innovation-section"
import { MentorAcknowledgment } from "./mentor-acknowledgment"

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: any
  title: string
  description: string
  color: string
  delay: number
}) {
  return (
    <div
      className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="rounded-full w-12 h-12 flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function TeamMemberCard({
  name,
  role,
  description,
  icon: Icon,
  color,
  image,
  skills,
  delay,
}: {
  name: string
  role: string
  description: string
  icon: any
  color: string
  image: string
  skills: string[]
  delay: number
}) {
  return (
    <div
      className="rounded-lg border p-6 transition-all duration-200 hover:shadow-md animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex flex-col items-center mb-4">
        <div 
          className="w-24 h-24 rounded-full overflow-hidden mb-3 border-4 flex items-center justify-center"
          style={{ borderColor: `${color}40` }}
        >
          <img
            src={image || "/placeholder.svg"}
            alt={`${name} - ${role}`}
            className="object-cover w-full h-full"
          />
        </div>
        <h3 className="font-medium text-lg">{name}</h3>
        <p className="text-sm text-muted-foreground text-center">{role}</p>
      </div>
      
      <div
        className="mt-4 p-4 rounded-lg w-full"
        style={{ backgroundColor: `${color}10` }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full p-2" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <p className="text-sm">{description}</p>
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Skills & Expertise:</p>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnimatedBarChart() {
  const [data, setData] = useState([
    { name: "Stocks", value: 45, previousValue: 40 },
    { name: "Bonds", value: 20, previousValue: 25 },
    { name: "Cash", value: 15, previousValue: 20 },
    { name: "Real Estate", value: 10, previousValue: 8 },
    { name: "Crypto", value: 10, previousValue: 7 },
  ])

  const [optimizationScore, setOptimizationScore] = useState(82)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((currentData) => {
        const newData = [...currentData]

        // Simulate portfolio optimization by gradually shifting allocation
        // Increase stocks and real estate, decrease bonds and cash over time
        return newData.map((item) => {
          const previousValue = item.value
          let change = 0

          if (item.name === "Stocks" || item.name === "Real Estate" || item.name === "Crypto") {
            change = Math.random() * 3 - 0.5 // Tendency to increase
          } else {
            change = Math.random() * 3 - 2 // Tendency to decrease
          }

          // Ensure values stay within reasonable ranges
          const newValue = Math.max(5, Math.min(60, item.value + change))

          return {
            ...item,
            previousValue,
            value: newValue,
          }
        })
      })

      // Increase optimization score over time
      setOptimizationScore((prev) => Math.min(98, prev + Math.random() * 1.5))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="absolute top-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
        <span>Asset Allocation</span>
        <div className="flex items-center gap-1 text-primary font-medium animate-fade-in">
          <span>Optimization Score:</span>
          <span className="animate-pulse-slow">
            {optimizationScore.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="pt-6 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 60]} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Allocation"]}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            />
            <Bar
              dataKey="previousValue"
              fill="#6b7280"
              radius={[0, 0, 0, 0]}
              fillOpacity={0.3}
              name="Previous Allocation"
              stackId="stack"
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              name="Current Allocation"
              animationDuration={800}
              animationBegin={300}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} fillOpacity={0.9} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center animate-fade-in">
        <span className="text-xs text-muted-foreground">Live simulation - data updates every 3s</span>
      </div>
    </>
  )
}

function getColor(index: number) {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ]
  return colors[index % colors.length]
}

export function AboutContent() {
  const teamMembers = [
    {
      name: "Widad",
      role: "Frontend Developer (React & UI/UX)",
      description:
        "Designs and implements the user interface and interactive components. Ensures a responsive, intuitive experience across dashboards, charts, and data displays.",
      icon: Code,
      color: "#10b981", // emerald-500
      image: "/placeholder.svg?height=200&width=200",
      skills: ["React", "Next.js", "Tailwind CSS", "Framer Motion", "UI/UX Design"],
    },
    {
      name: "Douae",
      role: "Backend Developer (API & Data Integration)",
      description:
        "Integrates real-time financial data via the Yahoo Finance API. Manages secure API calls, data fetching, and error handling.",
      icon: Database,
      color: "#3b82f6", // blue-500
      image: "/placeholder.svg?height=200&width=200",
      skills: [
        "API Integration",
        "Data Processing",
        "Error Handling",
        "Caching Strategies",
        "Performance Optimization",
      ],
    },
    {
      name: "Imad",
      role: "AI Integration Engineer",
      description:
        "Implements the Gemini 2.0 Flash API to build the AI finance advisor agent. Develops conversation memory and context handling for personalized financial insights.",
      icon: Bot,
      color: "#8b5cf6", // violet-500
      image: "/placeholder.svg?height=200&width=200",
      skills: ["AI Integration", "NLP", "Conversation Design", "Context Management", "Financial Analysis"],
    },
    {
      name: "Adam",
      role: "DevOps Engineer (Deployment & Infrastructure)",
      description:
        "Oversees deployment, environment configuration, and security (using environment variables). Manages CI/CD pipelines and ensures smooth integration of all application components.",
      icon: Server,
      color: "#f59e0b", // amber-500
      image: "/placeholder.svg?height=200&width=200",
      skills: ["CI/CD", "Infrastructure Management", "Security", "Environment Configuration", "Deployment Automation"],
    },
  ]

  const features = [
    {
      title: "Interactive Dashboard",
      description: "Real-time financial metrics and portfolio overview with interactive charts and visualizations.",
      icon: LineChart,
      color: "#10b981", // emerald-500
      details:
        "Our dashboard provides a comprehensive overview of your financial status with real-time updates. It features interactive charts that respond to your interactions, allowing you to drill down into specific data points. The dashboard is designed to give you a quick snapshot of your portfolio performance, market trends, and key financial metrics.",
    },
    {
      title: "Portfolio Analysis",
      description: "Detailed portfolio tracking with performance metrics, allocation analysis, and rebalancing tools.",
      icon: PieChart,
      color: "#3b82f6", // blue-500
      details:
        "The Portfolio Analysis section offers in-depth insights into your investments. Track performance over time, analyze asset allocation across different sectors and investment types, and use our rebalancing tools to optimize your portfolio. The interactive charts allow you to visualize your portfolio composition and identify areas for improvement.",
    },
    {
      title: "Market Research",
      description: "Up-to-date market data, stock information, and financial news from reliable sources.",
      icon: BarChart,
      color: "#8b5cf6", // violet-500
      details:
        "Stay informed with our Market Research section, which provides real-time market data, detailed stock information, and the latest financial news. Track market indices, analyze stock performance, and read curated news articles relevant to your investments. The data is sourced from reliable financial APIs and updated in real-time.",
    },
    {
      title: "AI Financial Advisor",
      description: "Personalized financial advice and insights powered by advanced AI technology.",
      icon: Bot,
      color: "#f59e0b", // amber-500
      details:
        "Our AI Financial Advisor leverages advanced natural language processing to provide personalized financial guidance. It can analyze your portfolio, offer investment recommendations, and help with financial planning. The advisor learns from your interactions to provide increasingly relevant advice over time, all while maintaining strict privacy standards.",
    },
  ]

  return (
    <div className="space-y-16 py-8">
      {/* About the App Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold">About Finance Advisor</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Finance Advisor was created with a simple mission: to democratize financial intelligence and
            empower individuals to make informed investment decisions.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
                    <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
        
        <InnovationSection />
      </section>
      
      {/* Our Team Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold">Our Team</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the talented individuals behind Finance Advisor
          </p>
                      </div>

        <div className="grid gap-6 md:grid-cols-2">
                  {teamMembers.map((member, index) => (
            <TeamMemberCard
                      key={member.name}
              {...member}
              delay={index * 0.1}
            />
                              ))}
                            </div>
      </section>
      
      {/* Technology Section */}
      
      {/* Mentor Acknowledgment needs to be re-added if desired */}
      {/* <MentorAcknowledgment /> */}

    </div>
  )
}
