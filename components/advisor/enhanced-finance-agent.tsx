"use client"

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, PlusSquare, Bot, User, BarChart3, TrendingUp, PiggyBank, Landmark, BrainCircuit, HelpCircle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AgentMessage {
  agentType: string;
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  agentType?: string; // Make agentType optional for user messages
  id?: string; // Optional message ID from backend
  createdAt?: string; // Optional timestamp
}

interface EnhancedFinanceAgentProps {
  marketData?: any; // Market data for context
  newsData?: any; // News data for context
  isLoading?: boolean; // Loading state
}

// Agent visual config - Define outside the component
const agentVisuals: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
  market_analyst: { icon: <BarChart3 className="h-4 w-4" />, color: "#10b981", name: "Market Analyst" },
  portfolio_manager: { icon: <TrendingUp className="h-4 w-4" />, color: "#3b82f6", name: "Portfolio Manager" },
  financial_advisor: { icon: <PiggyBank className="h-4 w-4" />, color: "#8b5cf6", name: "Financial Advisor" },
  // Legacy agent types (keeping for backward compatibility)
  market_analysis: { icon: <BarChart3 className="h-4 w-4" />, color: "#10b981", name: "Market Analysis" },
  investment_advice: { icon: <TrendingUp className="h-4 w-4" />, color: "#3b82f6", name: "Investment Advice" },
  retirement_planning: { icon: <PiggyBank className="h-4 w-4" />, color: "#8b5cf6", name: "Retirement Planning" },
  tax_planning: { icon: <Landmark className="h-4 w-4" />, color: "#f59e0b", name: "Tax Planning" },
  general_query: { icon: <BrainCircuit className="h-4 w-4" />, color: "#ec4899", name: "General Query" },
  default: { icon: <HelpCircle className="h-4 w-4" />, color: "#6b7280", name: "AI Advisor" },
  error: { icon: <AlertCircle className="h-4 w-4" />, color: "#ef4444", name: "Error" },
  loading: { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "#6b7280", name: "Loading" },
};

// Helper function to get agent visual config
const getAgentVisual = (agentType?: string) => {
  const key = agentType && agentVisuals[agentType] ? agentType : 'default';
  return agentVisuals[key];
};

// Define question categories with icons and sample questions
const questionCategories = [
  { name: "Market Analysis", icon: BarChart3, questions: ["What's the current market trend?", "Analyze stock XYZ.", "Compare market sectors."] },
  { name: "Investment Advice", icon: TrendingUp, questions: ["Suggest investment strategies.", "Should I buy/sell stock ABC?", "How to diversify my portfolio?"] },
  { name: "Retirement Planning", icon: PiggyBank, questions: ["How much should I save for retirement?", "Best retirement account options?", "Withdrawal strategies for retirement?"] },
  { name: "Tax Planning", icon: Landmark, questions: ["How to invest tax-efficiently?", "Understand capital gains tax.", "Tax implications of stock options?"] },
  { name: "General Finance", icon: BrainCircuit, questions: ["Explain compound interest.", "What is a mutual fund?", "How does inflation affect savings?"] },
];

export function EnhancedFinanceAgent({ marketData, newsData, isLoading: externalLoading }: EnhancedFinanceAgentProps): React.ReactNode {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true); // Start loading initially
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initialMessage: Message = {
    role: "assistant",
    content: "Hello! I'm your AI Financial Advisor. How can I help you with your investments or financial planning today?",
    agentType: "default"
  };

  // --- API Interaction Functions ---

  const fetchHistory = useCallback(async (convId: string) => {
    if (!convId) {
      setMessages([initialMessage]);
      setHistoryLoading(false);
      setShowSuggestions(true);
      return;
    }

    setHistoryLoading(true);
    setError(null);
    try {
      // Get the Supabase auth token - check all possible storage locations
      let token = null;
      
      // Try localStorage with different key formats
      const possibleKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb:token',
        'supabase.auth.data',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      for (const key of possibleKeys) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          token = storedValue;
          break;
        }
      }
      
      // Try sessionStorage if not found in localStorage
      if (!token) {
        for (const key of possibleKeys) {
          const storedValue = sessionStorage.getItem(key);
          if (storedValue) {
            token = storedValue;
            break;
          }
        }
      }
      
      // Development mode fallback - use a dummy token if in development
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('Using development mode fallback authentication');
        token = 'dev-mode-token';
      }
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in or refresh the page.");
      }

      // Parse the token - handle different formats
      let accessToken = '';
      try {
        // Try parsing as JSON
        const parsedToken = JSON.parse(token);
        accessToken = parsedToken.access_token || parsedToken.token || parsedToken.currentSession?.access_token || '';
      } catch {
        // If not JSON, use the token directly
        accessToken = token;
      }

      if (!accessToken && process.env.NODE_ENV === 'development') {
        // Use the dev mode token
        accessToken = 'dev-mode-token';
      }
      
      if (!accessToken) {
        throw new Error("Invalid authentication token. Please log in again.");
      }

      // Connect to the Python FastAPI backend to get conversation history
      const response = await fetch(`/backend/fastapi_server/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.status === 404) {
        console.warn("Conversation not found, starting new one.");
        localStorage.removeItem("currentConversationId");
        setConversationId(null);
        setMessages([initialMessage]);
        setShowSuggestions(true);
        return;
      }
      if (!response.ok) {
        throw new Error(`Error fetching history: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        const historyMessages: Message[] = data.messages.map((msg: any) => [
          { role: 'user', content: msg.user_message, id: msg.id + '-user', createdAt: msg.created_at },
          { role: 'assistant', content: msg.ai_response, agentType: msg.agent_name || 'default', id: msg.id + '-ai', createdAt: msg.created_at }
        ]).flat();
        setMessages(historyMessages);
        setShowSuggestions(false); // Hide suggestions if history exists
      } else {
        setMessages([initialMessage]);
        setShowSuggestions(true);
      }
    } catch (err: any) {
      console.error("Failed to fetch conversation history:", err);
      setError(`Failed to load chat history: ${err.message}. Starting a new chat.`);
      localStorage.removeItem("currentConversationId");
      setConversationId(null);
      setMessages([initialMessage]);
      setShowSuggestions(true);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const userMessage: Message = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setError(null);
    setShowSuggestions(false);

    // Optimistically update UI
    const loadingMessage: Message = { role: "assistant", content: "", agentType: "loading", id: "loading-" + Date.now() };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Get the Supabase auth token - check all possible storage locations
      let token = null;
      
      // Try localStorage with different key formats
      const possibleKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb:token',
        'supabase.auth.data',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      for (const key of possibleKeys) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          token = storedValue;
          break;
        }
      }
      
      // Try sessionStorage if not found in localStorage
      if (!token) {
        for (const key of possibleKeys) {
          const storedValue = sessionStorage.getItem(key);
          if (storedValue) {
            token = storedValue;
            break;
          }
        }
      }
      
      // Development mode fallback - use a dummy token if in development
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('Using development mode fallback authentication');
        token = 'dev-mode-token';
      }
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in or refresh the page.");
      }

      // Parse the token - handle different formats
      let accessToken = '';
      try {
        // Try parsing as JSON
        const parsedToken = JSON.parse(token);
        accessToken = parsedToken.access_token || parsedToken.token || parsedToken.currentSession?.access_token || '';
      } catch {
        // If not JSON, use the token directly
        accessToken = token;
      }

      if (!accessToken && process.env.NODE_ENV === 'development') {
        // Use the dev mode token
        accessToken = 'dev-mode-token';
      }
      
      if (!accessToken) {
        throw new Error("Invalid authentication token. Please log in again.");
      }

      // Connect to the Python FastAPI backend
      try {
        // Try to connect to the FastAPI backend
        const response = await fetch("/backend/fastapi_server/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            message: messageContent,
            conversation_id: conversationId, // Send current ID, backend handles creation if null
            context: {
              market_data: marketData, // Include market data as context
              news_data: newsData, // Include news data as context
              timestamp: new Date().toISOString()
            }
          }),
        });

        // Remove loading indicator
        setMessages((prev) => prev.filter(msg => msg.agentType !== 'loading'));

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.detail && errorData.detail.includes("API key")) {
              throw new Error("API key error: " + errorData.detail + ". Please update your API keys in your profile settings.");
            }
            throw new Error(errorData.detail || "Bad request");
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
            throw new Error(errorData.detail || `API Error: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        
        // Create the assistant message from the response
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
          agentType: data.agent_name || 'default',
          id: data.message_id || `msg-${Date.now()}`, // Generate ID if not provided
          createdAt: data.created_at || new Date().toISOString()
        };
        
        setMessages((prev) => [...prev, assistantMessage]);

        // If it was a new conversation, update the state and localStorage
        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id);
          localStorage.setItem("currentConversationId", data.conversation_id);
        }
      } catch (fetchError) {
        console.error("FastAPI connection error:", fetchError);
        
        // Remove loading indicator if it's still there
        setMessages((prev) => prev.filter(msg => msg.agentType !== 'loading'));
        
        // If we're in development mode, provide a simulated response
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using simulated response in development mode');
          
          // Create a simulated response
          const simulatedMessage: Message = {
            role: "assistant",
            content: `I'm currently running in simulation mode. The FastAPI backend could not be reached. Your message was: "${messageContent}". In a real environment, I would provide financial advice based on your query and the available market data.`,
            agentType: 'financial_advisor',
            id: `sim-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          
          setMessages((prev) => [...prev, simulatedMessage]);
          
          // Create a simulated conversation ID if needed
          if (!conversationId) {
            const simConvId = `sim-conv-${Date.now()}`;
            setConversationId(simConvId);
            localStorage.setItem("currentConversationId", simConvId);
          }
        } else {
          // If not in development mode, show error message
          throw fetchError;
        }
      }

      // Note: We already set the messages in the try block

    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(`An error occurred: ${err.message}`);
      // Remove loading indicator and add error message
      setMessages((prev) => prev.filter(msg => msg.agentType !== 'loading'));
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        agentType: "error",
        id: "error-" + Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      textareaRef.current?.focus();
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    localStorage.removeItem("currentConversationId");
    setMessages([initialMessage]);
    setError(null);
    setIsProcessing(false);
    setShowSuggestions(true);
    setInput("");
    textareaRef.current?.focus();
  };
  
  const clearCurrentChat = async () => {
    if (!conversationId) {
      startNewChat(); // If no current chat, just reset locally
      return;
    }

    setIsProcessing(true); // Indicate processing
    setError(null);
    try {
      // Get the Supabase auth token - check all possible storage locations
      let token = null;
      
      // Try localStorage with different key formats
      const possibleKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb:token',
        'supabase.auth.data',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      for (const key of possibleKeys) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          token = storedValue;
          break;
        }
      }
      
      // Try sessionStorage if not found in localStorage
      if (!token) {
        for (const key of possibleKeys) {
          const storedValue = sessionStorage.getItem(key);
          if (storedValue) {
            token = storedValue;
            break;
          }
        }
      }
      
      // Development mode fallback - use a dummy token if in development
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('Using development mode fallback authentication');
        token = 'dev-mode-token';
      }
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in or refresh the page.");
      }

      // Parse the token - handle different formats
      let accessToken = '';
      try {
        // Try parsing as JSON
        const parsedToken = JSON.parse(token);
        accessToken = parsedToken.access_token || parsedToken.token || parsedToken.currentSession?.access_token || '';
      } catch {
        // If not JSON, use the token directly
        accessToken = token;
      }

      if (!accessToken && process.env.NODE_ENV === 'development') {
        // Use the dev mode token
        accessToken = 'dev-mode-token';
      }
      
      if (!accessToken) {
        throw new Error("Invalid authentication token. Please log in again.");
      }

      // Connect to the Python FastAPI backend to delete the conversation
      const response = await fetch(`/backend/fastapi_server/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok && response.status !== 404) { // Ignore 404 if already deleted
        const errorData = await response.json().catch(() => ({ detail: 'Failed to clear chat' }));
        throw new Error(errorData.detail || `API Error: ${response.statusText}`);
      }

      // Successfully deleted or not found, start a new chat locally
      startNewChat();

    } catch (err: any) {
      console.error("Error clearing chat:", err);
      setError(`Failed to clear chat: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Effects ---

  // Load conversation ID from localStorage on mount
  useEffect(() => {
    const storedConvId = localStorage.getItem("currentConversationId");
    if (storedConvId) {
      setConversationId(storedConvId);
      fetchHistory(storedConvId);
    } else {
      setHistoryLoading(false); // No history to load
      setMessages([initialMessage]);
      setShowSuggestions(true);
    }
  }, [fetchHistory]); // fetchHistory is memoized

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isProcessing) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  // --- Rendering ---

  return (
    <Card className="flex h-[calc(100vh-100px)] w-full flex-col bg-gradient-to-b from-zinc-900 to-black shadow-2xl rounded-lg border border-zinc-700 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-700 p-3 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-emerald-500">
            <AvatarFallback className="bg-emerald-600 text-white"><Bot size={16} /></AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg font-semibold text-zinc-100">AI Financial Advisor</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={startNewChat} disabled={isProcessing} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                  <PlusSquare size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={clearCurrentChat} disabled={isProcessing || !conversationId} className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-zinc-700">
                  <Trash2 size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                <p>Clear Chat History</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={() => conversationId && fetchHistory(conversationId)} disabled={isProcessing || historyLoading} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                  <RefreshCw size={18} className={cn(historyLoading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                <p>Refresh Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 mb-4">
          {historyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const visual = getAgentVisual(message.agentType);
                const isUser = message.role === 'user';
                const isLoadingPlaceholder = message.agentType === 'loading';

                return (
                  <motion.div
                    key={message.id || `msg-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex items-start gap-3",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <Avatar className="h-8 w-8 border" style={{ borderColor: visual.color }}>
                        <AvatarFallback style={{ backgroundColor: visual.color + '20', color: visual.color }}>
                          {isLoadingPlaceholder ? <Loader2 className="h-4 w-4 animate-spin" /> : visual.icon}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-4 py-3 shadow-md",
                        isUser
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700",
                        isLoadingPlaceholder && "bg-transparent border-none p-0",
                        message.agentType === 'error' && "bg-red-900/50 border-red-700 text-red-100"
                      )}
                    >
                      {!isUser && !isLoadingPlaceholder && (
                        <div className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: visual.color }}>
                          {visual.icon} {visual.name}
                        </div>
                      )}
                      {isLoadingPlaceholder ? (
                        <div className="flex items-center justify-center p-3">
                           <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        </div>
                       ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                       )
                      }
                    </div>
                    {isUser && (
                      <Avatar className="h-8 w-8 border border-blue-600">
                        <AvatarFallback className="bg-blue-600/20 text-blue-500"><User size={16} /></AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {showSuggestions && !historyLoading && messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 border-t border-zinc-700 bg-zinc-800/30"
        >
          <p className="text-sm font-medium text-zinc-300 mb-3">Need inspiration? Try asking about:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {questionCategories.map((category) => (
              <Button
                key={category.name}
                variant="outline"
                size="sm"
                className="flex-col h-auto items-start justify-start p-3 text-left bg-zinc-700/50 border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                onClick={() => sendMessage(category.questions[0])} // Send first question on click
                disabled={isProcessing}
              >
                <category.icon className="h-5 w-5 mb-1.5 text-zinc-400" />
                <span className="text-xs font-medium">{category.name}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="border-t border-zinc-700 p-3 bg-zinc-800/50">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about finance..."
            className="w-full resize-none rounded-md border border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12 min-h-[50px] max-h-[150px] text-sm pt-3 pb-3 pl-4"
            rows={1}
            disabled={isProcessing || historyLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-zinc-600 disabled:text-zinc-400"
            disabled={!input.trim() || isProcessing || historyLoading}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </Card>
  );
}
