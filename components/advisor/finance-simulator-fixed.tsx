"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Loader2, 
  PiggyBank, 
  Landmark, 
  BarChart3, 
  TrendingUp,
  Clock,
  User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { SimpleChart } from "./simple-chart";
import { Message, agentVisuals, simulations } from "./simulation-data";

// Function to get the icon component based on icon name string
const getIconComponent = (iconName: string, className: string = "h-4 w-4 text-white") => {
  const icons: Record<string, React.ReactNode> = {
    BarChart3: <BarChart3 className={className} />,
    TrendingUp: <TrendingUp className={className} />,
    PiggyBank: <PiggyBank className={className} />,
    Landmark: <Landmark className={className} />,
    Clock: <Clock className={className} />,
    Bot: <Bot className={className} />,
    User: <UserIcon className={className} />
  };
  
  return icons[iconName] || <Bot className={className} />;
};

// Keywords to determine which simulation to run
const topicKeywords: Record<string, string[]> = {
  investment: [
    "investment", "invest", "stock", "bond", "etf", "portfolio", "market", 
    "returns", "assets", "allocation", "diversify", "diversification"
  ],
  retirement: [
    "retirement", "retire", "401k", "ira", "pension", "social security", 
    "withdraw", "withdrawal", "rmd", "savings", "retire early"
  ],
  tax: [
    "tax", "taxes", "deduction", "write-off", "irs", "audit", "filing", 
    "return", "capital gains", "income tax", "tax-free", "tax-deferred"
  ]
};

// Function to determine which simulation to run based on user input
const determineSimulationType = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      return topic;
    }
  }
  
  // Default to investment if no keywords match
  return "investment";
};

export function FinanceSimulator() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSimulationIndex, setCurrentSimulationIndex] = useState(0);
  const [simulationMessages, setSimulationMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingAgentType, setThinkingAgentType] = useState("assistant");
  const [currentSimulationType, setCurrentSimulationType] = useState("investment");
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);
  
  // Start a demo conversation on load
  useEffect(() => {
    // Only start if no messages exist
    if (messages.length === 0 && !isProcessing) {
      startSimulation("investment");
    }
  }, []);
  
  // Helper function to safely get agent details
  const getAgentDetails = (agentType: string) => {
    // Type guard for agent types
    if (agentType === "market_analyst" || 
        agentType === "portfolio_manager" || 
        agentType === "financial_advisor" || 
        agentType === "tax_advisor" || 
        agentType === "retirement_specialist" || 
        agentType === "assistant") {
      return agentVisuals[agentType];
    }
    return agentVisuals.assistant; // Fallback to assistant
  };
  
  // Start a simulation
  const startSimulation = (type: string) => {
    // Clear existing state
    setMessages([]);
    setIsProcessing(false);
    setIsThinking(false);
    setCurrentSimulationType(type);
    
    // Get appropriate user question
    let userQuestion = "How should I invest my money?";
    if (type === "retirement") {
      userQuestion = "What's the best way to save for retirement?";
    } else if (type === "tax") {
      userQuestion = "How can I reduce my taxes?";
    }
    
    // Create user message
    const userMessage: Message = {
      id: `user-${type}-${Date.now()}`,
      content: userQuestion,
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    // Start simulation
    setMessages([userMessage]);
    setIsProcessing(true);
    setCurrentSimulationIndex(0);
    setSimulationMessages(simulations[type]);
    
    // Show thinking indicator briefly
    setIsThinking(true);
    setThinkingAgentType("assistant");
    
    // Start adding agent messages
    setTimeout(() => {
      runSimulation();
    }, 800);
  };
  
  // Run the simulation, adding messages with delays
  const runSimulation = () => {
    setIsThinking(false);
    
    if (currentSimulationIndex >= simulationMessages.length) {
      setIsProcessing(false);
      return;
    }
    
    // Add the next message
    const nextMessage = simulationMessages[currentSimulationIndex];
    
    // Ensure unique ID
    const messageWithUniqueId = {
      ...nextMessage,
      id: `${nextMessage.id}-${Date.now()}`
    };
    
    // Add to messages
    setMessages(prev => [...prev, messageWithUniqueId]);
    
    // Prepare for next message
    const nextIndex = currentSimulationIndex + 1;
    setCurrentSimulationIndex(nextIndex);
    
    // If more messages, schedule them
    if (nextIndex < simulationMessages.length) {
      // Shorter delays for better demo experience
      const thinkDelay = 300;
      const messageDelay = 700;
      
      // Show typing indicator
      setTimeout(() => {
        setIsThinking(true);
        setThinkingAgentType(simulationMessages[nextIndex].agentType || "assistant");
      }, thinkDelay);
      
      // Schedule next message
      setTimeout(() => {
        runSimulation();
      }, messageDelay);
    } else {
      // End of simulation
      setIsProcessing(false);
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };
  
  // Render chart if message has chart data
  const renderChart = (chartData: any) => {
    if (!chartData) return null;
    
    return (
      <div className="mt-2">
        <SimpleChart data={chartData} />
      </div>
    );
  };
  
  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background text-foreground rounded-md border border-border mx-auto my-2 max-w-[1600px]">
      <div className="flex w-full h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with simulation tabs */}
          <header className="flex flex-col p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">ARWIGOS Multi-Agent Financial Advisor</h1>
              </div>
              <div className="flex items-center gap-4">
                {Object.entries(agentVisuals).map(([key, agent]) => (
                  <div key={key} className="flex items-center gap-1 text-xs text-zinc-400">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: agent.color }}></div>
                    <span>{agent.name}</span>
                  </div>
                )).slice(0, 3)}
              </div>
            </div>
            
            {/* Simulation selector tabs */}
            <div className="flex mt-4 border-b border-border">
              <button 
                onClick={() => startSimulation("investment")} 
                className={`px-4 py-2 font-medium text-sm ${currentSimulationType === "investment" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Investment Strategies
              </button>
              <button 
                onClick={() => startSimulation("retirement")} 
                className={`px-4 py-2 font-medium text-sm ${currentSimulationType === "retirement" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Retirement Planning
              </button>
              <button 
                onClick={() => startSimulation("tax")} 
                className={`px-4 py-2 font-medium text-sm ${currentSimulationType === "tax" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Tax Optimization
              </button>
            </div>
          </header>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 px-4 pb-20">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <div className="max-w-md text-center">
                      <h3 className="mb-2 text-xl font-bold">ARWIGOS Financial Advisor</h3>
                      <p className="text-muted-foreground">
                        Loading simulation... Please wait.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const agentType = message.agentType || "assistant";
                    const visual = getAgentDetails(agentType);
                    
                    return (
                      <motion.div
                        key={`${message.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <Avatar className="h-8 w-8 border-2 shadow-sm" style={{borderColor: visual.color}}>
                            <AvatarFallback style={{ background: visual.color }}>
                              {getIconComponent(visual.icon)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                          isUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-foreground"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium">{isUser ? "You" : visual.name}</div>
                            {message.timestamp && (
                              <div className="text-xs text-zinc-500">
                                {formatTimestamp(message.timestamp)}
                              </div>
                            )}
                          </div>
                          
                          <div className="prose prose-sm prose-invert max-w-none">
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className="mb-1">{line}</p>
                            ))}
                          </div>
                          
                          {message.chartData && renderChart(message.chartData)}
                        </div>
                        
                        {isUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-zinc-700">
                              <UserIcon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              
              {/* Thinking indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 border-2 shadow-sm" 
                          style={{borderColor: getAgentDetails(thinkingAgentType).color}}>
                    <AvatarFallback style={{ background: getAgentDetails(thinkingAgentType).color }}>
                      {getIconComponent(getAgentDetails(thinkingAgentType).icon)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{getAgentDetails(thinkingAgentType).name} is thinking...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Controls */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-muted rounded-md px-4 py-2 text-sm text-muted-foreground">
                {currentSimulationType === "investment" && "Showing investment portfolio simulation"}
                {currentSimulationType === "retirement" && "Showing retirement planning simulation"}
                {currentSimulationType === "tax" && "Showing tax optimization simulation"}
              </div>
              <Button 
                onClick={() => startSimulation(currentSimulationType)} 
                size="sm" 
                className="h-9"
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                Restart Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
