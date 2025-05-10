"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Trash2, Download, Bot, MessageSquare, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
// Removed: import { generateAIResponse } from "@/lib/api/gemini-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface FinanceAgentProps {
  marketData: any
  newsData: any
}

export function FinanceAgent({ marketData, newsData }: FinanceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI financial advisor. How can I help you with your investments or financial planning today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [conversationId, setConversationId] = useState<string | null>(null); // Added conversationId state
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Predefined questions for quick access
  const quickQuestions = [
    "What's your analysis of the current market conditions?",
    "How should I diversify my portfolio?",
    "What are some good retirement planning strategies?",
    "How can I reduce my investment risk?",
    "What's a good strategy for tax-efficient investing?",
    "Should I invest in bonds in the current market?",
  ]

  // Financial insights for the insights tab
  const financialInsights = [
    {
      title: "Market Volatility Strategy",
      content:
        "During periods of high market volatility, consider dollar-cost averaging to reduce timing risk and potentially benefit from market dips.",
    },
    {
      title: "Retirement Planning Tip",
      content:
        "The 4% rule suggests withdrawing 4% of your retirement savings in the first year, then adjusting for inflation each year after.",
    },
    {
      title: "Tax Efficiency",
      content:
        "Consider holding tax-efficient investments like ETFs in taxable accounts and less tax-efficient investments in tax-advantaged accounts.",
    },
    {
      title: "Emergency Fund",
      content:
        "Aim to have 3-6 months of essential expenses in an easily accessible emergency fund before increasing investment risk.",
    },
  ]

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load conversation history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("conversationHistory")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("conversationHistory", JSON.stringify(messages))
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Create context for the AI with market data and news
      const context = {
        marketData: marketData?.data
          ? {
              symbol: marketData.data.symbol,
              price: marketData.data.price,
              change: marketData.data.change,
              changePercent: marketData.data.change_percent,
            }
          : null,
        recentNews:
          newsData?.data?.news?.slice(0, 3).map((item: any) => ({
            title: item.article_title,
            source: item.source,
          })) || [],
      }

      const apiPayload: any = {
        query: userMessage.content,
        context: context,
      };
      if (conversationId) {
        apiPayload.conversationId = conversationId;
      }

      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: result.message, // Assuming the backend returns { message: string, ... }
      }
      setMessages((prev) => [...prev, assistantMessage]);
      if (result.conversation_id) {
        setConversationId(result.conversation_id); // Update conversationId from backend response
      }

    } catch (error: any) {
      console.error("Error generating AI response:", error)

      const errorMessage: Message = {
        role: "assistant",
        content: error.message || "I'm sorry, I encountered an error while processing your request. Please try again later.",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setActiveTab("chat")
    // Focus the textarea
    const textarea = document.querySelector("textarea")
    if (textarea) {
      textarea.focus()
    }
  }

  const clearConversation = async () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI financial advisor. How can I help you with your investments or financial planning today?",
      },
    ])
    localStorage.removeItem("conversationHistory")
    setConversationId(null); // Reset conversationId state

    // Call backend to clear history
    try {
      setIsLoading(true);
      const response = await fetch('/api/advisor', {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error clearing conversation history on backend:", errorData.error);
        // Optionally show a toast to the user
      }
      // Success, history cleared on backend
    } catch (error) {
      console.error("Error calling DELETE /api/advisor:", error);
      // Optionally show a toast to the user
    } finally {
      setIsLoading(false);
    }
  }

  const downloadConversation = () => {
    const conversationText = messages.map((msg) => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`).join("\n\n")

    const blob = new Blob([conversationText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-advisor-conversation-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-[500px]">
      <Tabs defaultValue="chat" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex w-max max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user" ? "ml-auto bg-emerald-500 text-white" : "bg-zinc-800",
                  )}
                >
                  {message.content}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 bg-zinc-800 w-max rounded-lg px-4 py-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>Thinking...</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-zinc-800 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={clearConversation}
                title="Clear conversation"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear conversation</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={downloadConversation}
                title="Download conversation"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download conversation</span>
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances, market trends, or investment advice..."
                className="min-h-12 resize-none flex-1 bg-zinc-800 border-zinc-700 focus-visible:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="flex-1 p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suggested Questions</h3>
            <p className="text-sm text-zinc-400">
              Click on any of these questions to quickly get financial advice on common topics.
            </p>
            <div className="grid gap-2">
              {quickQuestions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    <Bot className="mr-2 h-4 w-4 text-emerald-500" />
                    {question}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="flex-1 p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Insights</h3>
            <p className="text-sm text-zinc-400">
              Key financial insights and tips to help you make better investment decisions.
            </p>
            <div className="grid gap-4">
              {financialInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h4 className="font-medium">{insight.title}</h4>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{insight.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
