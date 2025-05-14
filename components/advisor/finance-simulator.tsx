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
  User
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
      User: <User className={className} />,
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
  {
    id: "advisor-sim-1",
    content: "I'm ARWIGOS, your AI-powered financial assistant. I'll help analyze your investment options using our multi-agent system.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-2",
    content: "I'm connecting to financial databases to retrieve the latest market data and will analyze this with our specialized agents.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-3",
    content: "Hello, I'm your Portfolio Manager agent. Based on current market conditions and historical performance data, I've developed several portfolio allocation strategies for moderate risk tolerance.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-4",
    content: "Here's my recommended allocation for a growth-oriented portfolio with moderate risk:\n\n```chart\nPortfolio Allocation:\n- 45% US Large Cap (VOO, VTI)\n- 15% US Small/Mid Cap (VXF, IJR)\n- 20% International Developed Markets (VEA, EFA)\n- 10% Emerging Markets (VWO, IEMG)\n- 10% US Investment Grade Bonds (BND, AGG)\n```\n\nThis allocation has shown a historical annualized return of approximately 8.7% with moderate volatility.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-5",
    content: "I'm now running a 10-year projection model using current market forecasts and economic indicators. Here's the expected growth trajectory for a $50,000 investment:\n\n```chart\n10-Year Growth Projection:\n- Year 1: $54,350\n- Year 3: $64,111\n- Year 5: $75,633\n- Year 7: $89,208\n- Year 10: $114,408\n```\n\nThis projection includes reinvested dividends and accounts for an average inflation rate of 2.3%.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-6",
    content: "Let me connect you with our Tax Strategy specialist to analyze the tax implications of this portfolio.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-7",
    content: "Hello, I'm your Tax Advisor agent. Looking at the proposed portfolio, I've identified several tax optimization opportunities:\n\n1. ETFs vs. Mutual Funds: The ETFs recommended are already tax-efficient due to their lower turnover\n\n2. Account Placement Strategy:\n   - Place bond ETFs in tax-advantaged accounts (IRA/401k)\n   - Keep international investments in taxable accounts for foreign tax credits\n   - Maintain growth-oriented US equities in both account types\n\n3. Tax-Loss Harvesting: Implement automated monitoring for tax-loss harvesting opportunities",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-8",
    content: "Here's a visualization of the potential tax savings over 10 years using our optimized strategy versus a non-optimized approach:\n\n```chart\nCumulative Tax Savings Over 10 Years:\n- Year 1: $320\n- Year 3: $1,250\n- Year 5: $2,470\n- Year 7: $4,105\n- Year 10: $7,830\n```\n\nThese tax optimizations could potentially add $7,830 to your overall returns over the 10-year period.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-9",
    content: "For current market analysis, I'll bring in our Market Analyst agent who constantly monitors global economic indicators and technical signals.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-10",
    content: "I'm your Market Analyst agent. I've just completed a comprehensive analysis of current market conditions by analyzing data from multiple sources including Federal Reserve projections, earnings reports, and global market indicators.\n\nHere's my current market assessment:\n\n1. Valuation Metrics: US market P/E ratios are slightly above historical averages\n\n2. Economic Indicators: Leading indicators suggest continued economic expansion\n\n3. Sector Analysis: Technology, healthcare, and clean energy sectors show strong fundamentals\n\n4. Risk Factors: Potential headwinds include inflation concerns and geopolitical tensions\n\nI recommend implementing your investment plan using dollar-cost averaging over 3-6 months to reduce entry point risk.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-11",
    content: "Here's a visualization of sector performance over the past 12 months:\n\n```chart\nSector Performance (12-Month):\n- Technology: +16.7%\n- Healthcare: +12.3%\n- Consumer Discretionary: +9.8%\n- Financials: +8.4%\n- Energy: +4.2%\n- Utilities: +2.8%\n- Materials: +1.9%\n```\n\nThis data supports our recommendation to maintain diversification while slightly overweighting technology and healthcare sectors.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: "advisor-sim-12",
    content: "Based on all the analyses from our specialized agents, here's your comprehensive investment plan:\n\n1. Portfolio Allocation: Implement the recommended diversified portfolio\n\n2. Implementation Timeline: Use dollar-cost averaging over 3-6 months\n\n3. Tax Optimization: Follow the tax-efficient asset location strategy\n\n4. Regular Monitoring: Our system will continuously monitor your portfolio\n\nWith this comprehensive approach, you're positioned for long-term growth while managing risk in a tax-efficient manner.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// No longer needed as we're using the SimpleChart component

export function FinanceSimulator() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSimulationIndex, setCurrentSimulationIndex] = useState(0);
  const [simulationMessages, setSimulationMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingAgentType, setThinkingAgentType] = useState("assistant");
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  
  // Handle sending a message and starting the simulation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // Add user message to chat
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
  
  // Run the simulation by adding messages with delays
  const runSimulation = () => {
    setIsThinking(false);
    
    if (currentSimulationIndex >= simulationMessages.length) {
      setIsProcessing(false);
      return;
    }
    
    // Add the next message in the simulation
    const nextMessage = simulationMessages[currentSimulationIndex];
    setMessages(prev => [...prev, nextMessage]);
    
    // Prepare for next message
    const nextIndex = currentSimulationIndex + 1;
    setCurrentSimulationIndex(nextIndex);
    
    // If there's another message coming up, show the thinking indicator for that agent
    if (nextIndex < simulationMessages.length) {
      // Calculate a random delay before showing the thinking indicator
      const thinkDelay = Math.random() * 500 + 500;
      
      // Calculate a longer delay for the next message to appear
      const messageDelay = Math.random() * 2000 + 2000;
      
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
  
  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background text-foreground rounded-md border border-border mx-auto my-2 max-w-[1600px]">
      <div className="flex w-full h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
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
                        Ask about investments, retirement planning, or tax strategies to start a simulated conversation with our multi-agent system.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const agentType = message.agentType || "assistant";
                    const visualKey = getAgentVisualKey(agentType);
                    const visual = agentVisuals[visualKey] || agentVisuals.assistant;
                    
                    return (
                      <motion.div
                        key={message.id || index}
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
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 border-2 shadow-sm" 
                          style={{borderColor: agentVisuals[getAgentVisualKey(thinkingAgentType)]?.color || agentVisuals.assistant.color}}>
                    <AvatarFallback style={{ background: agentVisuals[getAgentVisualKey(thinkingAgentType)]?.color || agentVisuals.assistant.color }}>
                      {getIconComponent(agentVisuals[getAgentVisualKey(thinkingAgentType)]?.icon || "Bot")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{agentVisuals[getAgentVisualKey(thinkingAgentType)]?.name || "Assistant"} is thinking...</span>
                  </div>
                </motion.div>
              )
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about investments, retirement planning, or tax strategies..."
                className="flex-1 resize-none min-h-[40px] max-h-[200px] text-sm pr-10"
                rows={1}
                disabled={isProcessing}
              />
              <Button type="submit" size="icon" disabled={isProcessing || !input.trim()} className="h-9 w-9">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing User component for Avatar
function User({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
