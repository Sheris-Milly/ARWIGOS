"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { sendChatMessage, getConversationHistory } from "@/lib/api/api-utils";
import { clearConversation, listConversations, deleteConversation as deleteConversationAPI } from "@/lib/api/conversations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlusCircle, 
  Bot, 
  MessageSquare, 
  Send, 
  Loader2, 
  RefreshCcw, 
  PiggyBank, 
  Landmark, 
  Menu, 
  User, 
  ChevronDown, 
  BarChart3, 
  AlertCircle, 
  TrendingUp, 
  Trash2, 
  PlusSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConversationList } from "./conversation-list";
import ChartVisualization from "./chart-visualization";
import { SaveIndicator } from "./save-indicator";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  agentType?: string; 
  agentColor?: string; 
  agentDisplayName?: string;
}

// For simulation messages with the same structure as Message
type SimulationMessage = Message;

interface EnhancedFinanceAgentProps {
  marketData?: any;
  newsData?: any;
  isLoading?: boolean;
}

// Agent visual config
const agentVisuals: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
  market_analyst: { icon: <BarChart3 />, color: "#10b981", name: "Market Analyst" },
  portfolio_manager: { icon: <TrendingUp />, color: "#3b82f6", name: "Portfolio Manager" },
  financial_advisor: { icon: <PiggyBank />, color: "#8b5cf6", name: "Financial Advisor" },
  tax_advisor: { icon: <Landmark />, color: "#f59e0b", name: "Tax Advisor" },
  retirement_planner: { icon: <PiggyBank />, color: "#ec4899", name: "Retirement Planner" },
  general: { icon: <Bot />, color: "#64748b", name: "Finance Assistant" },
  error: { icon: <AlertCircle />, color: "#ef4444", name: "Error Recovery" },
  assistant: { icon: <Bot />, color: "#f97316", name: "FINANCE AGENT" },
};

// Helper function to get agent visual
function getAgentVisual(message: Message) {
  const agentType = message.agentType || "general";
  const visual = agentVisuals[agentType] || agentVisuals.general;
  
  return {
    icon: visual.icon,
    color: visual.color,
    name: visual.name
  };
}

// Sample questions by category for suggestions
const questionCategories = [
  { name: "Market Analysis", icon: BarChart3, questions: ["What's the current market trend?", "Analyze stock XYZ", "Compare market sectors"] },
  { name: "Investment Advice", icon: TrendingUp, questions: ["Suggest investment strategies", "Should I buy/sell stock ABC?", "How to diversify my portfolio?"] },
  { name: "Financial Planning", icon: PiggyBank, questions: ["Create a savings plan", "Retirement planning advice", "Debt reduction strategies"] },
  { name: "Tax Optimization", icon: Landmark, questions: ["Tax saving tips", "Tax implications of investments", "Capital gains tax questions"] }
];

export function EnhancedFinanceAgent({ marketData, newsData, isLoading: externalLoading }: EnhancedFinanceAgentProps) {
  // Message and input state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Conversation management state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string | null>(null);
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Saving status indicator
  const [savingStatus, setSavingStatus] = useState<{show: boolean, status: 'saving' | 'saved' | 'error', message: string}>(
    {show: false, status: 'saved', message: ''}
  );
  
  // UI state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeAgent, setActiveAgent] = useState<string>("assistant");
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const initialMessage: Message = {
    id: `assistant-init-${Date.now()}`,
    role: "assistant",
    content: "Hello! I'm your AI Financial Advisor. How can I help you with your investments or financial planning today?",
    timestamp: new Date().toISOString(),
    agentType: "assistant"
  };

  // Initialize messages with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Load conversation history
  useEffect(() => {
    async function loadConversations() {
      try {
        setHistoryLoading(true);
        const conversations = await listConversations();
        setHistoryLoading(false);
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setHistoryLoading(false);
      }
    }
    
    loadConversations();
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  // Process message content to handle markdown and special formatting
  const processMessageContent = (content: string) => {
    // Simple markdown-like processing
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  };

  // Extract chart data from message content
  const extractChartData = (content: string) => {
    if (!content.includes('```chart')) return null;
    
    const chartMatch = content.match(/```chart([\s\S]*?)```/);
    return chartMatch ? chartMatch[1].trim() : null;
  };

  // Toggle chart expansion
  const toggleChartExpand = (messageId: string) => {
    setExpandedCharts(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Simulated responses based on financial topics
  const simulatedResponses = {
    investment: [
      "Based on your investment goals, I'd recommend a diversified portfolio with 60% stocks, 30% bonds, and 10% alternative investments.",
      "For long-term growth, consider index funds that track the S&P 500. They offer low fees and historically strong returns.",
      "Dollar-cost averaging is an effective strategy to reduce the impact of market volatility on your investments.",
      "When evaluating stocks, look at fundamentals like P/E ratio, debt-to-equity ratio, and revenue growth trends."
    ],
    retirement: [
      "For retirement planning, the 4% rule suggests you can withdraw 4% of your portfolio annually with minimal risk of running out of money.",
      "Consider maximizing your 401(k) contributions, especially if your employer offers matching funds - that's essentially free money.",
      "A Roth IRA can be advantageous if you expect to be in a higher tax bracket during retirement.",
      "As you approach retirement, gradually shift your portfolio toward more conservative investments to protect your capital."
    ],
    taxes: [
      "Tax-loss harvesting can offset capital gains and reduce your tax liability while maintaining your overall investment strategy.",
      "Municipal bonds offer tax-exempt interest income, which can be beneficial for investors in higher tax brackets.",
      "Consider timing your income and deductions strategically to minimize your overall tax burden.",
      "Qualified dividends are taxed at lower rates than ordinary income, making dividend-paying stocks tax-efficient in taxable accounts."
    ],
    general: [
      "Building an emergency fund covering 3-6 months of expenses should be a financial priority before aggressive investing.",
      "When evaluating financial products, always consider the total cost including fees, commissions, and opportunity costs.",
      "Diversification across asset classes, sectors, and geographies can help manage risk in your portfolio.",
      "Regular financial check-ups are important - review your investment strategy, insurance coverage, and estate plan annually."
    ]
  };

  // Function to determine the topic of a message
  const determineMessageTopic = (message: string): keyof typeof simulatedResponses => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('bond') || lowerMessage.includes('portfolio')) {
      return 'investment';
    } else if (lowerMessage.includes('retire') || lowerMessage.includes('401k') || lowerMessage.includes('ira') || lowerMessage.includes('pension')) {
      return 'retirement';
    } else if (lowerMessage.includes('tax') || lowerMessage.includes('deduct') || lowerMessage.includes('write-off') || lowerMessage.includes('income')) {
      return 'taxes';
    } else {
      return 'general';
    }
  };

  // Function to get a simulated response based on the message topic
  const getSimulatedResponse = (message: string): string => {
    const topic = determineMessageTopic(message);
    const responses = simulatedResponses[topic];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Handle sending a message with simulation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setError(null);
    
    try {
      setSavingStatus({show: true, status: 'saving', message: 'Processing your request...'});
      
      // Simulate a delay for processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a simulated response based on the user's message
      const simulatedResponse = getSimulatedResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: simulatedResponse,
        role: "assistant",
        timestamp: new Date().toISOString(),
        agentType: activeAgent
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(`sim-${Date.now()}`);
      setCurrentConversationTitle("Simulated Financial Conversation");
      setSavingStatus({show: true, status: 'saved', message: 'Response received'});
      
      // Hide saving status after a delay
      setTimeout(() => {
        setSavingStatus({show: false, status: 'saved', message: ''});
      }, 2000);
      
    } catch (error) {
      console.error("Error in simulation:", error);
      setError(error instanceof Error ? error.message : "Failed to generate response");
      setSavingStatus({show: true, status: 'error', message: 'Error in simulation'});
    } finally {
      setIsProcessing(false);
      setShowSuggestions(false);
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionClick = (question: string) => {
    setInput(question);
    setShowSuggestions(false);
    
    // Use setTimeout to allow the state to update before submitting
    setTimeout(() => {
      if (textareaRef.current) {
        const event = new Event('submit') as unknown as React.FormEvent;
        handleSubmit(event);
      }
    }, 0);
  };

  // Handle selecting an agent
  const handleAgentSelect = (agentType: string) => {
    setActiveAgent(agentType);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle starting a new conversation
  const handleNewConversation = () => {
    setMessages([initialMessage]);
    setConversationId(null);
    setCurrentConversationTitle(null);
    setActiveAgent("assistant");
    setShowSuggestions(true);
  };

  // Handle loading a conversation
  const handleLoadConversation = async (id: string) => {
    try {
      setHistoryLoading(true);
      const history = await getConversationHistory(id);
      
      if (history.messages) {
        setMessages(history.messages);
        setConversationId(id);
        setCurrentConversationTitle(history.title || null);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setError("Failed to load conversation history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversationAPI(id);
      
      if (id === conversationId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setError("Failed to delete conversation");
    }
  };

  // Handle clearing the current conversation
  const handleClearConversation = async () => {
    if (!conversationId) return;
    
    try {
      await clearConversation(conversationId);
      handleNewConversation();
    } catch (error) {
      console.error("Failed to clear conversation:", error);
      setError("Failed to clear conversation");
    }
  };

  // Handle refreshing the conversation list
  const handleRefresh = async () => {
    if (conversationId) {
      await handleLoadConversation(conversationId);
    } else {
      handleNewConversation();
    }
  };

  // Convenience function for starting a new chat
  const startNewChat = () => {
    handleNewConversation();
  };

  // Render component
  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background text-foreground rounded-md border border-border mx-auto my-2 max-w-[1600px]">
      <SaveIndicator 
        show={savingStatus.show}
        status={savingStatus.status}
        message={savingStatus.message}
      />
      <div className="flex w-full h-full">
        {/* Agent sidebar */}
        <div className={`w-full md:w-60 border-r border-border transition-all duration-300 ease-in-out ${sidebarVisible ? 'block' : 'hidden md:block'}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center p-4 border-b border-border">
              <h2 className="text-sm font-semibold tracking-tight uppercase">AI Agents</h2>
            </div>
            
            {/* Agent selector */}
            <div className="p-4 border-b border-border">
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Agent Type</div>
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" 
                           style={{ backgroundColor: agentVisuals[activeAgent]?.color || '#f97316' }}>
                        {activeAgent === "financial_advisor" ? <PiggyBank className="h-3 w-3" /> :
                         activeAgent === "market_analyst" ? <BarChart3 className="h-3 w-3" /> :
                         activeAgent === "portfolio_manager" ? <TrendingUp className="h-3 w-3" /> :
                         activeAgent === "retirement_planner" ? <PiggyBank className="h-3 w-3" /> :
                         activeAgent === "tax_advisor" ? <Landmark className="h-3 w-3" /> :
                         <Bot className="h-3 w-3" />}
                      </div>
                      <span>{agentVisuals[activeAgent]?.name || "FINANCE AGENT"}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
                
                {showAgentSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto py-1">
                      {Object.entries(agentVisuals).map(([key, { icon, name, color }]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          className="w-full justify-start rounded-none"
                          onClick={() => {
                            setActiveAgent(key);
                            setShowAgentSelector(false);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: color }}>
                              {icon}
                            </div>
                            <span>{name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Conversations list */}
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Conversations</div>
                <Button 
                  onClick={startNewChat} 
                  variant="default"
                  className="w-full justify-start mb-3">
                  <PlusSquare className="h-4 w-4 mr-2" />
                  <span>New Conversation</span>
                </Button>
                
                <ScrollArea className="h-[calc(100vh-240px)]">
                  <ConversationList
                    currentConversationId={conversationId}
                    onSelectConversation={handleLoadConversation}
                    onNewChat={startNewChat}
                    className="space-y-1"
                  />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarVisible(!sidebarVisible)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">
                {activeAgent === 'assistant' ? 'AI Financial Advisor' : agentVisuals[activeAgent]?.name || 'AI Financial Advisor'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewConversation} className="text-xs">
                <PlusCircle className="mr-1 h-3 w-3" /> New Chat
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isProcessing || historyLoading} className="text-xs">
                <RefreshCcw className="mr-1 h-3 w-3" /> Refresh
              </Button>
            </div>
          </header>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4" ref={chatContainerRef}>
            <div className="space-y-4" ref={messagesEndRef}>
              {messages.map((message, index) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center mb-1">
                        {message.agentType === "financial_advisor" ? <PiggyBank className="h-4 w-4" /> :
                         message.agentType === "market_analyst" ? <BarChart3 className="h-4 w-4" /> :
                         message.agentType === "portfolio_manager" ? <TrendingUp className="h-4 w-4" /> :
                         message.agentType === "retirement_planner" ? <PiggyBank className="h-4 w-4" /> :
                         message.agentType === "tax_advisor" ? <Landmark className="h-4 w-4" /> :
                         <Bot className="h-4 w-4" />}
                        <span className="ml-2 text-xs font-semibold" style={{ color: getAgentVisual(message).color }}>
                          {getAgentVisual(message).name}
                        </span>
                      </div>
                    )}
                    {typeof message.content === 'string' ? (
                      <div className="prose dark:prose-invert max-w-none text-sm break-words" dangerouslySetInnerHTML={{ __html: processMessageContent(message.content) }} />
                    ) : (
                      <div className="text-sm break-words">{message.content}</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-right">{formatTimestamp(message.timestamp)}</p>
                    {message.role === 'assistant' && message.id.startsWith('assistant-chart-') && (
                      <ChartVisualization 
                        messageId={message.id} 
                        chartData={extractChartData(message.content)} 
                        isExpanded={expandedCharts[message.id] || false}
                        onToggleExpand={() => toggleChartExpand(message.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] p-3 rounded-lg shadow-sm bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="p-3 rounded-lg shadow-sm bg-destructive text-destructive-foreground text-sm">
                    Error: {error}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

    
          {/* Input area */}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${activeAgent === 'assistant' ? 'anything' : agentVisuals[activeAgent]?.name || 'anything'}... (Shift+Enter for new line)`}
                className="flex-1 resize-none min-h-[40px] max-h-[200px] text-sm pr-10"
                rows={1}
                disabled={isProcessing || historyLoading}
              />
              <Button type="submit" size="icon" disabled={isProcessing || !input.trim() || historyLoading} className="h-9 w-9">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
