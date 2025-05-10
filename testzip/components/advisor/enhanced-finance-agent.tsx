"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Trash2, Download, ChevronRight, HelpCircle, X, BarChart3, TrendingUp, PiggyBank, BrainCircuit, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AgentMessage {
  agentType: string;
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  agentType?: string;
}

interface EnhancedFinanceAgentProps {
  marketData: any
  newsData: any
  isLoading: boolean
}

// Agent visual config - Define outside the component
const agentVisuals: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
  market_analysis: {
    icon: <BarChart3 className="h-5 w-5" />, color: "#10b981", name: "Market Analysis"
  },
  investment_advice: {
    icon: <TrendingUp className="h-5 w-5" />, color: "#3b82f6", name: "Investment Advice"
  },
  retirement_planning: {
    icon: <PiggyBank className="h-5 w-5" />, color: "#8b5cf6", name: "Retirement Planning"
  },
  tax_planning: { // Added based on potential backend types
    icon: <Landmark className="h-5 w-5" />, color: "#f59e0b", name: "Tax Planning"
  },
  general_query: { // Added based on potential backend types
    icon: <BrainCircuit className="h-5 w-5" />, color: "#ec4899", name: "General Query"
  },
  default: { // Fallback
    icon: <HelpCircle className="h-5 w-5" />, color: "#6b7280", name: "AI Advisor"
  }
};

export function EnhancedFinanceAgent({ marketData, newsData, isLoading }: EnhancedFinanceAgentProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("conversationHistory") : null;
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content:
              "Hello! I'm your AI financial advisor, powered by multiple specialized agents. How can I help you with your investments or financial planning today?",
            agentType: "default"
          },
        ]
  })

  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Predefined questions for quick access
  const questionCategories = [
    {
      name: "Market Analysis",
      icon: BarChart3,
      color: agentVisuals.market_analysis.color,
      questions: [
        "What's your analysis of the current market conditions?",
        "How are tech stocks performing today?",
        "What's the outlook for the S&P 500 this quarter?",
        "Which sectors are showing the most growth potential?",
      ],
    },
    {
      name: "Investment Strategy",
      icon: TrendingUp,
      color: agentVisuals.investment_advice.color,
      questions: [
        "How should I diversify my portfolio?",
        "What's a good strategy for tax-efficient investing?",
        "Should I invest in bonds in the current market?",
        "How can I reduce my investment risk?",
      ],
    },
    {
      name: "Retirement Planning",
      icon: PiggyBank,
      color: agentVisuals.retirement_planning.color,
      questions: [
        "What are some good retirement planning strategies?",
        "How much should I be saving for retirement?",
        "Should I prioritize a Roth IRA or traditional 401(k)?",
        "When should I start taking Social Security benefits?",
      ],
    },
  ]

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 1 && typeof window !== 'undefined') {
      localStorage.setItem("conversationHistory", JSON.stringify(messages))
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setSelectedCategory(null); // Close quick questions on send

    try {
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
      };

      const apiResponse = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          context: context,
          conversationId: conversationId,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`);
      }

      const result = await apiResponse.json();

      if (Array.isArray(result.response)) {
        const agentMessages: Message[] = result.response.map((agentMsg: AgentMessage) => ({
          role: "assistant",
          content: agentMsg.content,
          agentType: agentMsg.agentType || 'default', // Ensure agentType exists
        }));
        setMessages((prev) => [...prev, ...agentMessages]);
      } else {
        // Fallback for single response
        const assistantMessage: Message = {
          role: "assistant",
          content: result.response,
          agentType: 'default', // Assign a default type
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }

    } catch (error) {
      console.error("Error calling advisor API:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error instanceof Error ? error.message : "I encountered an error. Please try again.",
        agentType: 'default'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      // Refocus textarea after processing
      textareaRef.current?.focus();
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setSelectedCategory(null)
    textareaRef.current?.focus()
    // Optionally submit immediately
    // handleSubmit(new Event('submit') as unknown as React.FormEvent); // Uncomment to send immediately
  }

  const clearConversation = () => {
    const initialMessage: Message = {
        role: "assistant",
        content:
          "Hello! I'm your AI financial advisor, powered by multiple specialized agents. How can I help you with your investments or financial planning today?",
        agentType: "default"
      };
    setMessages([initialMessage]);
    if (typeof window !== 'undefined') {
        localStorage.removeItem("conversationHistory");
    }
    setConversationId(null);
    fetch('/api/advisor', { method: 'DELETE' })
      .then(res => {
        if (res.ok) console.log('Server conversation history cleared');
        else console.error('Failed to clear server conversation history');
      })
      .catch(err => console.error('Error clearing server history:', err));
  }

  const downloadConversation = () => {
    const conversationText = messages.map((msg) => {
        if (msg.role === 'user') return `You: ${msg.content}`;
        const agentName = agentVisuals[msg.agentType || 'default']?.name || 'AI';
        return `${agentName}: ${msg.content}`;
    }).join("\n\n");

    const blob = new Blob([conversationText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-advisor-chat-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 bg-card rounded-lg shadow-md h-[650px]">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[650px] bg-card rounded-lg shadow-lg border border-border overflow-hidden">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const agentType = message.agentType || 'default';
            const visuals = !isUser ? (agentVisuals[agentType] || agentVisuals.default) : null;

            return (
              <motion.div
                key={index} // Consider a more stable key if messages can be deleted/reordered
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex w-full",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "flex max-w-[85%] rounded-xl px-4 py-3 shadow-sm",
                  isUser
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none items-start gap-3 border-l-4",
                  visuals ? `border-${visuals.color}` : 'border-gray-400'
                )}
                 style={visuals ? { borderColor: visuals.color } : {}}>

                  {!isUser && visuals && (
                    <div className="flex flex-col items-center pt-1 flex-shrink-0">
                       <span className="p-1.5 rounded-full bg-background border" style={{ borderColor: `${visuals.color}40` }}>
                         {React.cloneElement(visuals.icon as React.ReactElement, { style: { color: visuals.color } })}
                       </span>
                       {/* Optional: Show agent name below icon */}
                       {/* <span className="text-[10px] mt-1 font-medium" style={{ color: visuals.color }}>{visuals.name}</span> */}
                    </div>
                  )}
                  {/* Use whitespace-pre-wrap to preserve line breaks */}
                  <span className="whitespace-pre-wrap break-words">{message.content}</span>
                </div>
              </motion.div>
            );
          })}
          {isProcessing && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2 bg-muted w-max rounded-xl px-4 py-3 shadow-sm rounded-bl-none border-l-4 border-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm flex flex-col gap-3">
        {/* Quick Question Categories - Improved UI */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-2"
            >
              <Card className="border-primary/30 bg-muted/50 shadow-inner">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                      {questionCategories.find(cat => cat.name === selectedCategory)?.icon &&
                        React.cloneElement(questionCategories.find(cat => cat.name === selectedCategory)!.icon({ className: "h-4 w-4" }) as React.ReactElement, { style: { color: questionCategories.find(cat => cat.name === selectedCategory)?.color } })
                      }
                      {selectedCategory} Questions
                    </h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => setSelectedCategory(null)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                  <div className="grid gap-1.5">
                    {questionCategories
                      .find((cat) => cat.name === selectedCategory)
                      ?.questions.map((question, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className="justify-start h-auto py-1.5 px-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 group"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          <ChevronRight className="mr-1.5 h-3 w-3 text-primary/70 group-hover:text-primary transition-colors" />
                          {question}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent -mb-1">
          {questionCategories.map((category, idx) => {
            const Icon = category.icon
            const isActive = selectedCategory === category.name;
            return (
              <Button
                key={idx}
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "flex-shrink-0 transition-all duration-200 ease-in-out group",
                  isActive ? "shadow-inner border-primary/50" : "border-border hover:border-muted-foreground/50",
                )}
                style={isActive ? {
                  borderColor: category.color,
                  backgroundColor: `${category.color}15`,
                  color: category.color
                } : {}}
                onClick={() => setSelectedCategory(isActive ? null : category.name)}
              >
                <Icon className={cn("mr-1.5 h-4 w-4 transition-colors", isActive ? '' : 'text-muted-foreground group-hover:text-foreground')}
                      style={!isActive ? { color: category.color } : {}} />
                {category.name}
              </Button>
            )
          })}
          {/* Help Button - Consider integrating into categories or removing if not needed */}
          {/* <Button variant="outline" size="sm" className="flex-shrink-0"><HelpCircle className="mr-1 h-4 w-4" />Help</Button> */}
        </div>

        {/* Input Form & Actions */}
        <div className="flex items-end gap-2">
          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              title="Clear conversation"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={downloadConversation}
              title="Download conversation"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>

          {/* Text Input Form */}
          <form onSubmit={handleSubmit} className="flex flex-1 items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about finance..."
              className="min-h-[40px] max-h-[150px] resize-y flex-1 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 shadow-sm text-sm py-2 px-3"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              onInput={(e) => {
                  // Auto-resize textarea
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isProcessing || !input.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Send message"
            >
              {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                  <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
