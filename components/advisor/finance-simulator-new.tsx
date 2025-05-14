"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Loader2, 
  PiggyBank, 
  Landmark, 
  BarChart3, 
  TrendingUp,
  Clock,
  Search,
  User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { SimpleChart } from "./simple-chart";
import { Message, agentVisuals, simulations, getAgentVisualKey } from "./simulation-data";

// Function to get the icon component based on icon name string or ReactNode
const getIconComponent = (icon: string | React.ReactNode, className: string = "h-4 w-4 text-white") => {
  // If icon is already a ReactNode, return it directly
  if (React.isValidElement(icon)) {
    return icon;
  }
  
  // Handle string icon names
  if (typeof icon === "string") {
    const icons: Record<string, React.ReactNode> = {
      BarChart3: <BarChart3 className={className} />,
      TrendingUp: <TrendingUp className={className} />,
      PiggyBank: <PiggyBank className={className} />,
      Landmark: <Landmark className={className} />,
      Clock: <Clock className={className} />,
      Bot: <Bot className={className} />,
      User: <UserIcon className={className} />,
      Search: <Search className={className} />
    };
    
    return icons[icon] || <Bot className={className} />;
  }
  
  // Fallback
  return <Bot className={className} />;
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
  const [input, setInput] = useState("How should I invest my money?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSimulationIndex, setCurrentSimulationIndex] = useState(0);
  const [simulationMessages, setSimulationMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingAgentType, setThinkingAgentType] = useState("assistant");
  const [simulationType, setSimulationType] = useState<string>("investment");
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);
  
  // Start with a demo conversation on initial load
  useEffect(() => {
    // Auto-start with investment demo on first render
    if (messages.length === 0 && !isProcessing) {
      startDemo("investment");
    }
  }, []);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  
  // Function to simulate a submit without an event
  const simulateSubmit = () => {
    if (!input.trim() || isProcessing) return;
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    // Determine which simulation to run based on user input
    const simulationType = determineSimulationType(input);
    const selectedSimulation = simulations[simulationType];
    
    // Clear previous conversation and add user message to chat
    setMessages([userMessage]);
    setInput("");
    setIsProcessing(true);
    setCurrentSimulationIndex(0);
    setSimulationMessages(selectedSimulation);
    
    // Show thinking indicator for the main assistant first
    setIsThinking(true);
    setThinkingAgentType("assistant");
    
    // Start the simulation with a delay
    setTimeout(() => {
      runSimulation();
    }, 1500);
  };
  
  // Handle sending a message and starting the simulation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulateSubmit();
  };
  
  // Helper function to safely get agent details
  const getAgentDetails = (agentType: string) => {
    const visualKey = getAgentVisualKey(agentType);
    return agentVisuals[visualKey] || agentVisuals.assistant; // Fallback to assistant if not found
  };

  // Run the simulation by adding messages with delays
  const runSimulation = () => {
    setIsThinking(false);
    
    if (currentSimulationIndex >= simulationMessages.length) {
      setIsProcessing(false);
      return;
    }
    
    // Add the next message in the simulation
    const nextMessage = simulationMessages[currentSimulationIndex];
    
    // Ensure the message has a unique ID for each run
    const messageWithUniqueId = {
      ...nextMessage,
      id: `${nextMessage.id}-${Date.now()}`
    };
    
    // Add message to the existing messages
    setMessages(prev => [...prev, messageWithUniqueId]);
    
    // Update the current index
    const nextIndex = currentSimulationIndex + 1;
    setCurrentSimulationIndex(nextIndex);
    
    // If there's another message coming up, show the thinking indicator for that agent
    if (nextIndex < simulationMessages.length) {
      // Use shorter delays for a faster demo experience
      const thinkDelay = 300;
      const messageDelay = 600;
      
      // Schedule showing the thinking indicator
      setTimeout(() => {
        setIsThinking(true);
        setThinkingAgentType(simulationMessages[nextIndex].agentType || "assistant");
      }, thinkDelay);
      
      // Schedule the next message
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
  
  // Render a chart if the message contains chart data
  const renderChart = (chartData: any) => {
    if (!chartData) return null;
    
    return (
      <div className="mt-2">
        <SimpleChart data={chartData} />
      </div>
    );
  };
  
  // Helper function to start a specific demo conversation
  const startDemo = (type: string) => {
    // Clear any existing state first
    setMessages([]);
    setIsProcessing(false);
    setIsThinking(false);
    setSimulationType(type);
    
    // Set appropriate demo question based on simulation type
    let userQuestion = "How should I invest my money?";
    if (type === "retirement") {
      userQuestion = "What's the best way to save for retirement?";
    } else if (type === "tax") {
      userQuestion = "How can I reduce my taxes?";
    }
    
    // Add user message and start simulation immediately
    const userMessage: Message = {
      id: `user-${type}-${Date.now()}`,
      content: userQuestion,
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    setMessages([userMessage]);
    setIsProcessing(true);
    setCurrentSimulationIndex(0);
    setSimulationMessages(simulations[type]);
    
    // Start the first agent response almost immediately
    setIsThinking(true);
    setThinkingAgentType("assistant");
    
    setTimeout(() => {
      runSimulation();
    }, 500);
  };
  
  // Function to switch between different simulation types
  const handleSimulationSwitch = (type: string) => {
    if (type !== simulationType) {
      startDemo(type);
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background text-foreground rounded-md border border-border mx-auto my-2 max-w-[1600px]">
      <div className="flex w-full h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
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
                onClick={() => handleSimulationSwitch("investment")} 
                className={`px-4 py-2 font-medium text-sm ${simulationType === "investment" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Investment Strategies
              </button>
              <button 
                onClick={() => handleSimulationSwitch("retirement")} 
                className={`px-4 py-2 font-medium text-sm ${simulationType === "retirement" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Retirement Planning
              </button>
              <button 
                onClick={() => handleSimulationSwitch("tax")} 
                className={`px-4 py-2 font-medium text-sm ${simulationType === "tax" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
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
                    const visual = agentVisuals[agentType] || agentVisuals.assistant;
                    
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
              
              {isThinking && (
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-muted rounded-md px-4 py-2 text-sm text-muted-foreground">
                {simulationType === "investment" && "Showing investment portfolio simulation"}
                {simulationType === "retirement" && "Showing retirement planning simulation"}
                {simulationType === "tax" && "Showing tax optimization simulation"}
              </div>
              <Button 
                onClick={() => startDemo(simulationType)} 
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
