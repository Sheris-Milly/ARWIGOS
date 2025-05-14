"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { LineChart, BarChart, PieChart, Bot, Database, Server, Code, BarChart3, Shield, GraduationCap, Heart } from "lucide-react"
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
      image: "https://shorturl.at/yoXbJ?height=200&width=200",
      skills: ["React", "Next.js", "Tailwind CSS", "Framer Motion", "UI/UX Design"],
    },
    {
      name: "Douae",
      role: "Backend Developer (API & Data Integration)",
      description:
        "Integrates real-time financial data via the Yahoo Finance API. Manages secure API calls, data fetching, and error handling.",
      icon: Database,
      color: "#3b82f6", // blue-500
      image: "https://shorturl.at/fCFxz?height=200&width=200",
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
      image: "https://shorturl.at/9Y6t1?height=200&width=200",
      skills: ["AI Integration", "NLP", "Conversation Design", "Context Management", "Financial Analysis"],
    },
    {
      name: "Adam",
      role: "DevOps Engineer (Deployment & Infrastructure)",
      description:
        "Oversees deployment, environment configuration, and security (using environment variables). Manages CI/CD pipelines and ensures smooth integration of all application components.",
      icon: Server,
      color: "#f59e0b", // amber-500
      image: "https://shorturl.at/xabcC?height=200&width=200",
      skills: ["CI/CD", "Infrastructure Management", "Security", "Environment Configuration", "Deployment Automation"],
    },
  ]

  const features = [
    {
      title: "Interactive Dashboard",
      description: "Real-time financial metrics and portfolio overview with interactive charts and visualizations.",
      icon: LineChart,
      color: "#10b981", // emerald-500
    },
    {
      title: "Portfolio Analysis",
      description: "Detailed portfolio tracking with performance metrics, allocation analysis, and rebalancing tools.",
      icon: PieChart,
      color: "#3b82f6", // blue-500
    },
    {
      title: "Market Research",
      description: "Up-to-date market data, stock information, and financial news from reliable sources.",
      icon: BarChart,
      color: "#8b5cf6", // violet-500
    },
    {
      title: "AI-Powered Insights",
      description: "Personalized financial advice and insights powered by advanced AI technology.",
      icon: Bot,
      color: "#f59e0b", // amber-500
    },
  ]

  const agentSystem = [
    {
      title: "Advisory Agent",
      description: "Provides personalized financial recommendations based on your goals, risk tolerance, and market conditions.",
      icon: Bot,
      color: "#10b981", // emerald-500
    },
    {
      title: "Portfolio Manager Agent",
      description: "Monitors and optimizes your investment portfolio, suggesting rebalancing opportunities and asset allocation strategies.",
      icon: PieChart,
      color: "#3b82f6", // blue-500
    },
    {
      title: "Market Analyst Agent",
      description: "Analyzes market trends, news, and economic indicators to identify investment opportunities and potential risks.",
      icon: BarChart3,
      color: "#8b5cf6", // violet-500
    },
    {
      title: "Planning Agent",
      description: "Helps you create and adjust financial plans to meet your short and long-term goals, considering your unique circumstances.",
      icon: LineChart,
      color: "#f59e0b", // amber-500
    },
    {
      title: "Risk Assessment Agent",
      description: "Evaluates potential risks in your investment strategy and recommends ways to mitigate them while maintaining growth potential.",
      icon: Shield,
      color: "#ec4899", // pink-500
    },
  ]

  return (
    <div className="space-y-16 py-8">
      {/* ARWIGOS Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent inline-block">ARWIGOS</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            AI-powered Real-time Wealth Insights & Goals-Oriented Strategy
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 p-8 border border-emerald-100 dark:border-emerald-800/30">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg shadow-emerald-500/20">
                <LineChart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Your Intelligent Financial Companion</h3>
                <p className="text-muted-foreground">Experience a new era of personal finance management</p>
              </div>
            </div>
            
            <p className="text-base leading-relaxed">
              ARWIGOS combines real-time financial data with advanced AI to deliver personalized insights and recommendations tailored to your unique financial situation. Our platform doesn't just track your investments—it actively helps you optimize them through intelligent analysis and forward-looking strategies.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="rounded-full p-2" 
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
                    </div>
                    <h3 className="font-medium">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Multi-Agent System Section */}
        <div className="mt-16">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent inline-block">Multi-Agent Intelligence System</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ARWIGOS is powered by a sophisticated multi-agent system that works in harmony to deliver comprehensive financial guidance.
            </p>
          </div>
          
          <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="absolute inset-0 bg-grid-gray-900/10 dark:bg-grid-white/5"></div>
            
            <div className="relative">
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-full shadow-lg shadow-emerald-500/20">
                  <Bot className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {agentSystem.map((agent, index) => (
                  <div 
                    key={agent.title}
                    className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="rounded-full p-2" 
                        style={{ backgroundColor: `${agent.color}20` }}
                      >
                        <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                      </div>
                      <h3 className="font-medium">{agent.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <p className="text-sm text-center">
                  Our multi-agent system creates a powerful synergy, where each specialized agent contributes to a comprehensive financial intelligence network that adapts to your unique needs and goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Team Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent inline-block">Our Team</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the talented individuals behind ARWIGOS
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="rounded-lg border p-6 transition-all duration-200 hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center mb-4">
                <div className="relative group mb-3">
                  <div 
                    className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg z-10 relative"
                    style={{ borderColor: `${member.color}40` }}
                  >
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={`${member.name} - ${member.role}`}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  
                  {/* Enlarged photo on hover */}
                  <div className="absolute opacity-0 group-hover:opacity-100 -top-16 left-1/2 -translate-x-1/2 transition-all duration-300 z-20 transform scale-0 group-hover:scale-100 origin-bottom pointer-events-none">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border-4 shadow-xl" style={{ borderColor: `${member.color}60` }}>
                      <img
                        src={member.image || "/placeholder.svg"}
                        alt={`${member.name} - ${member.role}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="w-4 h-4 bg-white rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2 border-r border-b" style={{ borderColor: `${member.color}60` }}></div>
                  </div>
                </div>
                <h3 className="font-medium text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground text-center">{member.role}</p>
              </div>
              
              <div
                className="mt-4 p-4 rounded-lg w-full"
                style={{ backgroundColor: `${member.color}10` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full p-2" style={{ backgroundColor: `${member.color}20` }}>
                    <member.icon className="h-5 w-5" style={{ color: member.color }} />
                  </div>
                  <p className="text-sm">{member.description}</p>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Skills & Expertise:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${member.color}20`, color: member.color }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Mentor Acknowledgment Section */}
      <section className="space-y-6">
        <div className="relative overflow-hidden rounded-lg border bg-card p-8 shadow-sm animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-primary/10 p-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent inline-block">Special Thanks to Our Mentor</h3>
              <p className="text-xl font-semibold text-primary">Professor Youssef Lamrani </p>
            </div>
            
            <div className="flex items-center space-x-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">With sincere appreciation</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
