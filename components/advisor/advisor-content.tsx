"use client"

import { useState, useEffect, useRef } from "react"
import { getAuthHeader, isDevMode } from "@/lib/auth/dev-auth"
import { EnhancedFinanceAgent } from "@/components/advisor/enhanced-finance-agent"
import { ConversationList } from "@/components/advisor/conversation-list"
import { Bot, RefreshCw, PanelLeftIcon, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { fetchMarketData } from "@/lib/api/market"
import { fetchStockNews } from "@/lib/api/news"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function AdvisorContent() {
  const [marketData, setMarketData] = useState<any>(null)
  const [newsData, setNewsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const [apiKeysMissing, setApiKeysMissing] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { toast } = useToast()
  
  // References for the enhanced finance agent component
  const agentRef = useRef<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Load the current conversation ID from localStorage on mount
  useEffect(() => {
    const storedConvId = localStorage.getItem("currentConversationId")
    if (storedConvId) {
      setCurrentConversationId(storedConvId)
    }
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setApiError(false)
      setApiKeysMissing(false)
      
      // Try fetching market data
      const marketDataResult = await fetchMarketData()
      setMarketData(marketDataResult)
      
      // Try fetching news data
      const newsDataResult = await fetchStockNews()
      setNewsData(newsDataResult)
      
    } catch (err) {
      console.error("Failed to load market data:", err)
      setApiError(true)
      setShowApiErrorDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh market data
      const marketDataResult = await fetchMarketData()
      setMarketData(marketDataResult)
      
      // Refresh news data
      const newsDataResult = await fetchStockNews()
      setNewsData(newsDataResult)
      
      toast({
        title: "Data refreshed",
        description: "Financial market data has been updated.",
        duration: 3000,
      })
    } catch (err) {
      console.error("Failed to refresh data:", err)
      toast({
        title: "Refresh failed",
        description: "Could not update market data. Using cached data.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle conversation selection from the sidebar
  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    // Store the selected conversation ID in localStorage
    localStorage.setItem("currentConversationId", conversationId)
    // Call the agent's fetchHistory method using the ref
    if (agentRef.current?.fetchHistory) {
      agentRef.current.fetchHistory(conversationId)
    }
  }

  // Handle starting a new chat
  const handleNewChat = () => {
    // Call the agent's startNewChat method using the ref
    if (agentRef.current?.startNewChat) {
      agentRef.current.startNewChat()
    }
    setCurrentConversationId(null)
    localStorage.removeItem("currentConversationId")
  }

  // Toggle sidebar visibility for responsive design
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden">
      {/* Conversation Sidebar */}
      <div 
        className={cn(
          "w-72 transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        <ConversationList 
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          className="h-full"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-white md:flex"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftIcon size={18} />}
            </Button>
            <div className="h-8 w-8 rounded-lg bg-blue-800/30 text-blue-400 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">Financial Advisor</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="h-8 flex items-center gap-1.5 text-zinc-400 hover:text-white"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
        
        {/* Agent Chat Interface */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="animate-spin text-zinc-400 mb-4" />
                <h2 className="text-lg font-medium mb-2 text-zinc-200">Loading market data...</h2>
                <p className="text-sm text-zinc-400">Setting up your financial advisor experience</p>
              </div>
            </div>
          ) : (
            <EnhancedFinanceAgent 
              marketData={marketData} 
              newsData={newsData} 
              isLoading={isLoading} 
            />
          )}
        </div>
      </div>

      {/* API Error Dialog */}
      {apiError && showApiErrorDialog && (
        <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Connection Error</DialogTitle>
              <DialogDescription>
                There was a problem connecting to the financial data APIs. This might affect the advisor's ability to provide accurate recommendations.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm">You can still chat with the advisor, but market-specific questions might have limited answers.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowApiErrorDialog(false)}>Continue Anyway</Button>
              <Button variant="outline" onClick={handleRefresh}>Try Again</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* API Keys Missing Dialog */}
      {apiKeysMissing && showApiErrorDialog && (
        <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Keys Missing</DialogTitle>
              <DialogDescription>
                Your profile is missing necessary API keys for the financial advisor to function properly.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm">Please contact your administrator or update your profile with:</p>
              <ul className="list-disc ml-6 mt-2 text-sm">
                <li>Google API key (for the AI models)</li>
                <li>Alpha Vantage API key (for financial data)</li>
              </ul>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowApiErrorDialog(false)}>Continue with Limited Features</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
