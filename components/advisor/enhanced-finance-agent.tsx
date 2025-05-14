"use client"

/** @jsxImportSource react */
import React, { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { sendChatMessage, getConversationHistory } from "@/lib/api/api-utils";
import { clearConversation, listConversations, deleteConversation as deleteConversationAPI } from "@/lib/api/conversations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlusCircle, 
  Bot, 
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
import { ChartVisualization } from "./chart-visualization";
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
  market_analyst: { icon: BarChart3, color: "#10b981", name: "Market Analyst" },
  portfolio_manager: { icon: TrendingUp, color: "#3b82f6", name: "Portfolio Manager" },
  financial_advisor: { icon: PiggyBank, color: "#8b5cf6", name: "Financial Advisor" },
  tax_advisor: { icon: Landmark, color: "#f59e0b", name: "Tax Advisor" },
  retirement_planner: { icon: PiggyBank, color: "#ec4899", name: "Retirement Planner" },
  general: { icon: Bot, color: "#64748b", name: "Finance Assistant" },
  error: { icon: AlertCircle, color: "#ef4444", name: "Error Recovery" },
  assistant: { icon: Bot, color: "#f97316", name: "FINANCE AGENT" },
};

// Helper function to get agent visual
function getAgentVisual(message: Message) {
  const agentType = message.agentType || "general";
  const visual = agentVisuals[agentType] || agentVisuals.general;
  
  // Return only the color and name, not the icon component
  return {
    color: visual.color,
    name: visual.name
  };
}

// Sample questions by category for suggestions
const questionCategories = [
  { name: "Market Analysis", icon: BarChart3, questions: ["What's the current market trend?", "Analyze stock XYZ", "Compare market sectors"] },
  { name: "Investment Advice", icon: TrendingUp, questions: ["Suggest investment strategies", "Should I buy/sell stock ABC?", "How to diversify my portfolio?"] },
  { name: "Retirement Planning", icon: PiggyBank, questions: ["Plan for early retirement", "Retirement account options", "Calculate retirement needs"] },
  { name: "Tax Planning", icon: Landmark, questions: ["Tax-efficient investing", "Tax loss harvesting strategies", "Optimize tax brackets"] }
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

  const initialMessage: Message = {
    id: `assistant-init-${Date.now()}`,
    role: "assistant",
    content: "Hello! I'm your AI Financial Advisor. How can I help you with your investments or financial planning today?",
    timestamp: new Date().toISOString(),
    agentType: "general",
    agentColor: "#4CAF50",
    agentDisplayName: "Financial Advisor"
  };

  // Fetch chat history for a conversation
  const fetchHistory = useCallback(async (convId: string) => {
    if (!convId) {
      // Only show welcome message if this is the first time
      // Otherwise, just show an empty state ready for input
      if (messages.length === 0) {
        setMessages([initialMessage]);
      }
      setHistoryLoading(false);
      setShowSuggestions(true);
      return;
    }

    setHistoryLoading(true);
    setError(null);
    
    try {
      const history = await getConversationHistory(convId);
      if (history.messages && history.messages.length > 0) {
        setMessages(history.messages);
        setCurrentConversationTitle(history.title || "Conversation");
      } else {
        // If there's no history but a conversation ID exists,
        // it means we're starting a new conversation
        setMessages([]);
      }
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setError("Failed to load conversation history: " + err.message);
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [messages.length]);

  // Load conversation history when conversationId changes
  useEffect(() => {
    fetchHistory(conversationId || "");
  }, [conversationId, fetchHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

// Investment Portfolio Analysis scenario messages
const investmentPortfolioMessages = [
  {
    id: `advisor-sim-1`,
    content: "I'm ARWIGOS, your AI-powered financial assistant. I see you'd like to explore investment options. Let me activate our multi-agent system to provide comprehensive insights.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-2`,
    content: "Connecting to Alpha Vantage API to retrieve latest market data... I'll analyze this information with our specialized Portfolio Manager agent.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-3`,
    content: "Hello, I'm your Portfolio Manager agent. Based on current market conditions and historical performance data, I've developed several portfolio allocation strategies. What's your primary investment goal and risk tolerance?",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-4`,
    content: "I'd like to focus on growth with moderate risk tolerance. I have about $50,000 to invest.",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-5`,
    content: "Thank you for that information. For a growth-oriented portfolio with moderate risk, I've analyzed thousands of potential allocations using Monte Carlo simulations. Here's my recommended allocation:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-6`,
    content: "```chart\nPortfolio Allocation:\n- 45% US Large Cap (VOO, VTI)\n- 15% US Small/Mid Cap (VXF, IJR)\n- 20% International Developed Markets (VEA, EFA)\n- 10% Emerging Markets (VWO, IEMG)\n- 10% US Investment Grade Bonds (BND, AGG)\n```\n\nThis allocation has shown a historical annualized return of approximately 8.7% with moderate volatility (standard deviation of 12.3%).",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-7`,
    content: "I'm now running a 10-year projection model using current market forecasts and economic indicators. Let me show you the expected growth trajectory for your $50,000 investment.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-8`,
    content: "```chart\n10-Year Growth Projection:\n- Year 1: $54,350\n- Year 3: $64,111\n- Year 5: $75,633\n- Year 7: $89,208\n- Year 10: $114,408\n```\n\nThis projection includes reinvested dividends and accounts for an average inflation rate of 2.3%.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-9`,
    content: "What about the tax implications of this portfolio?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-10`,
    content: "An excellent question about tax efficiency. Let me connect you with our Tax Strategy specialist to analyze this aspect of your portfolio.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-11`,
    content: "Hello, I'm your Tax Advisor agent. Looking at the proposed portfolio, I've identified several tax optimization opportunities:\n\n1. ETFs vs. Mutual Funds: The ETFs recommended are already tax-efficient due to their lower turnover and in-kind creation/redemption mechanism\n\n2. Account Placement Strategy:\n   - Place bond ETFs in tax-advantaged accounts (IRA/401k) to shield interest income\n   - Keep international investments in taxable accounts to take advantage of foreign tax credits\n   - Maintain growth-oriented US equities in both account types based on your tax bracket\n\n3. Tax-Loss Harvesting: I've created an automated monitoring system to identify tax-loss harvesting opportunities throughout the year, potentially adding 0.2-0.4% in after-tax returns annually",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-12`,
    content: "Here's a visualization of the potential tax savings over 10 years using our optimized strategy versus a non-optimized approach:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-13`,
    content: "```chart\nCumulative Tax Savings Over 10 Years:\n- Year 1: $320\n- Year 3: $1,250\n- Year 5: $2,470\n- Year 7: $4,105\n- Year 10: $7,830\n```\n\nThese tax optimizations could potentially add $7,830 to your overall returns over the 10-year period.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-14`,
    content: "What about current market conditions? Is this a good time to invest with this strategy?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-15`,
    content: "For current market analysis, I'll bring in our Market Analyst agent who constantly monitors global economic indicators, sentiment analysis, and technical signals.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-16`,
    content: "I'm your Market Analyst agent. I've just completed a comprehensive analysis of current market conditions by analyzing data from multiple sources including Federal Reserve economic projections, earnings reports from S&P 500 companies, and global market indicators.\n\nHere's my current market assessment:\n\n1. Valuation Metrics: US market P/E ratios are slightly above historical averages (22.3 vs 19.8 historical average)\n\n2. Economic Indicators: Leading indicators suggest continued economic expansion with moderate GDP growth projected at 2.3% annually\n\n3. Sector Analysis: Technology, healthcare, and clean energy sectors show particularly strong fundamentals and growth prospects\n\n4. Risk Factors: Potential headwinds include inflation concerns, geopolitical tensions, and possible monetary policy tightening\n\nRather than trying to time the market perfectly, I recommend implementing your investment plan using dollar-cost averaging over the next 3-6 months to reduce entry point risk.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-17`,
    content: "Here's a visualization of sector performance over the past 12 months to help you understand current market dynamics:",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-18`,
    content: "```chart\nSector Performance (12-Month):\n- Technology: +16.7%\n- Healthcare: +12.3%\n- Consumer Discretionary: +9.8%\n- Financials: +8.4%\n- Energy: +4.2%\n- Utilities: +2.8%\n- Materials: +1.9%\n```\n\nThis data supports our recommendation to maintain diversification while slightly overweighting technology and healthcare sectors for growth potential.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-19`,
    content: "Based on all the analyses from our specialized agents, here's your comprehensive investment plan:\n\n1. Portfolio Allocation: Implement the recommended diversified portfolio with slight tactical adjustments based on current market conditions\n\n2. Implementation Timeline: Use dollar-cost averaging over 3-6 months, investing approximately $8,000-$10,000 per month\n\n3. Tax Optimization: Follow the tax-efficient asset location strategy and enable our automated tax-loss harvesting system\n\n4. Regular Monitoring: Our system will continuously monitor your portfolio, rebalance when allocations drift beyond 5% thresholds, and alert you to any significant changes in market conditions\n\nWith this comprehensive approach, you're positioned for long-term growth while managing risk in a tax-efficient manner. Can I help with any specific aspect of this investment plan?",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// Retirement Planning scenario messages
const retirementPlanningMessages = [
  {
    id: `advisor-sim-1`,
    content: "I'm ARWIGOS, your AI-powered financial assistant. I'll help you create a comprehensive retirement plan using our multi-agent financial system.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-2`,
    content: "To develop your retirement plan, I'm connecting to multiple financial databases to gather current economic forecasts, inflation projections, and longevity data.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-3`,
    content: "I'm now activating our Retirement Planning specialist who will analyze this data and work with our other agents to develop a comprehensive strategy.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-4`,
    content: "Hello, I'm your Retirement Planning agent. To create an optimized retirement strategy, I'll need to understand your current financial situation and retirement goals. What's your current age, target retirement age, and how much do you currently have saved?",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-5`,
    content: "I'm 42, hoping to retire at 65, and I have about $320,000 in retirement accounts. I currently save $1,500 monthly toward retirement.",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-6`,
    content: "Thank you for that information. Based on Monte Carlo simulations using historical market data and forward-looking projections, I've analyzed thousands of potential retirement scenarios for someone in your situation.",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-7`,
    content: "Here's your current retirement trajectory based on your current savings rate and investment allocation:",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-8`,
    content: "```chart\nRetirement Projection:\n- Current Age (42): $320,000\n- Age 50: $642,800\n- Age 55: $912,300\n- Age 60: $1,246,700\n- Target Retirement Age (65): $1,652,400\n```\n\nBased on a 4% safe withdrawal rate, this would provide approximately $66,096 in annual retirement income (in today's dollars).",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-9`,
    content: "I'm now querying our Market Analysis agent to determine an optimal asset allocation strategy for your retirement portfolio based on your timeline and risk profile.",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-10`,
    content: "Based on your 23-year horizon to retirement, our Market Analysis agent recommends this optimal asset allocation strategy to balance growth with decreasing risk as you approach retirement:",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-11`,
    content: "```chart\nRecommended Asset Allocation by Age:\n- Current Age (42): 80% Equities, 20% Bonds\n- Age 50: 75% Equities, 25% Bonds\n- Age 55: 70% Equities, 30% Bonds\n- Age 60: 60% Equities, 40% Bonds\n- Target Retirement (65): 50% Equities, 50% Bonds\n```\n\nThis glide path strategy gradually reduces equity exposure as you approach retirement, reducing sequence-of-returns risk.",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-12`,
    content: "I'm now consulting with our Tax Strategy agent to identify opportunities to optimize your retirement savings vehicles for tax efficiency.",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-13`,
    content: "Hello, I'm your Tax Strategy specialist. Looking at your retirement timeline, I recommend a multi-vehicle approach to tax diversification:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-14`,
    content: "1. Traditional 401(k)/IRA: Continue maxing out your pre-tax contributions for immediate tax benefits\n\n2. Roth Conversion Ladder: Strategically convert portions of your traditional accounts to Roth during lower-income years\n\n3. Backdoor Roth IRA: Implement this strategy if your income exceeds direct Roth contribution limits\n\n4. HSA as a Stealth Retirement Account: If eligible, max out Health Savings Account contributions as a triple-tax-advantaged vehicle\n\nThis tax diversification strategy gives you flexible withdrawal options in retirement to manage your tax bracket.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-15`,
    content: "Based on our multi-agent analysis, here's how implementing these recommendations would impact your retirement readiness:",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-16`,
    content: "```chart\nRetirement Readiness with Optimizations:\n- Baseline Strategy: $1,652,400 at retirement\n- Optimized Asset Allocation: +$137,000\n- Tax Strategy Optimization: +$95,000\n- Projected Total: $1,884,400\n```\n\nThis would increase your sustainable retirement income from $66,096 to $75,376 annually (in today's dollars).",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-17`,
    content: "I'm now running a Social Security optimization analysis to determine your optimal claiming strategy...",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-18`,
    content: "Based on current Social Security rules and your earnings history, our analysis shows that delaying benefits until age 70 would maximize your lifetime benefits by an estimated $174,000 compared to claiming at age 62, assuming average longevity.",
    role: "assistant",
    agentType: "retirement_planner",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-19`,
    content: "To summarize your comprehensive retirement plan:\n\n1. Current Status: On track for $1.65M at retirement with current savings\n\n2. Asset Allocation: Implement the recommended glide path strategy to optimize risk/return profile\n\n3. Tax Strategy: Utilize multiple retirement vehicles for tax diversification\n\n4. Social Security: Consider delaying benefits until age 70 to maximize lifetime value\n\n5. Ongoing Monitoring: Our system will automatically alert you if market changes, legislative updates, or personal circumstances require plan adjustments\n\nWould you like me to focus on any specific aspect of this retirement plan in more detail?",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// Market Analysis scenario messages
const marketAnalysisMessages = [
  {
    id: `advisor-sim-1`,
    content: "I'm ARWIGOS, your AI-powered financial assistant. I see you're interested in market analysis. Let me activate our multi-agent system to provide comprehensive market insights.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-2`,
    content: "I'm connecting to Alpha Vantage, Bloomberg Terminal API, and other financial data sources to gather real-time market data across global markets and asset classes.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-3`,
    content: "Let me activate our Market Analyst agent who specializes in technical analysis, sentiment indicators, and macroeconomic trend interpretation.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-4`,
    content: "Hello, I'm your Market Analyst agent. I've just processed data from 87 different economic indicators, analyzed earnings reports from all S&P 500 companies, and assessed global market conditions. Here's a comprehensive overview of current market conditions, sector performance, and potential opportunities.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-5`,
    content: "Let's start with a broad market overview comparing major indices performance year-to-date:",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-6`,
    content: "```chart\nMajor Indices YTD Performance:\n- S&P 500: +14.7%\n- NASDAQ Composite: +21.3%\n- Dow Jones Industrial: +8.2%\n- Russell 2000: +6.5%\n- MSCI EAFE (International): +9.1%\n- MSCI Emerging Markets: +4.2%\n```\n\nThis data shows stronger performance in technology-heavy indices like the NASDAQ, with small caps and emerging markets lagging the broader market.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-7`,
    content: "I'm now analyzing economic indicators including GDP growth projections, unemployment data, inflation metrics, central bank policies, and manufacturing indices to assess the overall economic environment.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-8`,
    content: "Based on my analysis of these economic indicators, here are the key macroeconomic trends:\n\n1. Inflation: Core inflation has moderated to 2.7% annually, approaching central bank targets\n\n2. Employment: Unemployment rate remains low at 3.8% with modest wage growth of 3.2%\n\n3. GDP Growth: Economy expanded at 2.3% in the last quarter, slightly above consensus expectations\n\n4. Central Bank Policy: Federal Reserve signaling one potential rate cut in the next 6 months\n\n5. Consumer Sentiment: Consumer confidence index rising, suggesting continued spending strength\n\nThese indicators point to a resilient economy transitioning to a moderate growth environment with easing inflation pressures.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-9`,
    content: "Now, let's examine sector performance to identify potential investment opportunities. Here's a breakdown of the 11 major S&P 500 sectors:",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-10`,
    content: "```chart\nSector Performance (3-Month):\n- Information Technology: +18.3%\n- Communication Services: +12.7%\n- Healthcare: +9.8%\n- Consumer Discretionary: +8.5%\n- Financials: +7.2%\n- Industrials: +5.4%\n- Materials: +3.9%\n- Real Estate: +3.2%\n- Consumer Staples: +2.8%\n- Utilities: +1.3%\n- Energy: -2.7%\n```\n\nI'm detecting a clear rotation into growth-oriented sectors, particularly technology and communication services, with defensive sectors like utilities and consumer staples underperforming.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-11`,
    content: "Let me dive deeper into the technology sector, which is showing particularly strong performance. I'm analyzing subsector trends and specific company performance metrics.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-12`,
    content: "Within technology, these subsectors show the strongest momentum and earnings growth:\n\n1. Semiconductor & Equipment: +24.6% (3-month), driven by AI chip demand and supply normalization\n\n2. Cloud Computing: +19.2%, benefiting from enterprise digital transformation initiatives\n\n3. Cybersecurity: +16.8%, showing resilient spending even in budget-conscious environments\n\n4. Enterprise Software: +14.3%, particularly companies with AI integration capabilities\n\nThe semiconductor space is particularly interesting with the PHLX Semiconductor Index (SOX) outperforming the broader technology sector by 6.2 percentage points year-to-date.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-13`,
    content: "I'm now consulting with our Portfolio Manager agent to translate these market insights into actionable investment recommendations.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-14`,
    content: "Based on the Market Analyst's comprehensive data, I recommend these tactical portfolio adjustments to capitalize on current market conditions:\n\n1. Overweight Technology & Communication Services: Increase allocation by 3-5 percentage points, focusing on semiconductor, cloud computing, and digital advertising leaders\n\n2. Market Weight Healthcare & Financials: Maintain allocation with focus on healthcare innovation and financial institutions benefiting from potential rate environment changes\n\n3. Underweight Utilities, Consumer Staples & Energy: Reduce exposure by 2-4 percentage points given current growth environment and sector-specific headwinds\n\n4. Consider International Exposure: Selectively add European equities which are trading at more attractive valuations (12.5x forward P/E vs 19.2x for US equities)",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-15`,
    content: "Looking ahead, I'm analyzing potential market catalysts and risks that could impact these trends in the coming months.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-16`,
    content: "Key market catalysts to monitor:\n\n1. Upcoming Federal Reserve policy decisions and commentary\n\n2. Q2 earnings season starting in 3 weeks (consensus expects 8.7% year-over-year growth)\n\n3. Potential fiscal policy changes following the election cycle\n\n4. Geopolitical developments particularly in East Asia and Eastern Europe\n\n5. Continued AI adoption and investment across sectors\n\nOur system will continuously monitor these factors and alert you to any significant developments that might warrant portfolio adjustments.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-17`,
    content: "Based on this multi-agent analysis, here's a visualization of our recommended tactical asset allocation compared to a standard 60/40 portfolio:",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-18`,
    content: "```chart\nRecommended Tactical Asset Allocation:\n- US Large Cap (Growth-Tilted): 45%\n- US Small/Mid Cap: 10%\n- International Developed: 15%\n- Emerging Markets: 5%\n- US Investment Grade Bonds: 20%\n- High-Yield Bonds: 5%\n```\n\nThis allocation is designed to capitalize on current market trends while maintaining appropriate diversification and risk management.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-19`,
    content: "To summarize our market analysis:\n\n1. Current Environment: Moderating but resilient growth with easing inflation pressures\n\n2. Sector Opportunities: Technology, Communication Services, and Healthcare showing strongest momentum\n\n3. Tactical Recommendations: Overweight growth sectors, consider select international exposure, and maintain appropriate fixed income allocation as a buffer\n\n4. Monitoring Framework: Our multi-agent system will continuously track economic indicators, central bank policies, earnings trends, and market technicals to identify potential inflection points\n\nWould you like me to elaborate on any specific aspect of this market analysis?",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];
const taxStrategiesMessages = [
  {
    id: `advisor-sim-1`,
    content: "I'm ARWIGOS, your AI-powered financial assistant. I see you're interested in tax optimization strategies. Let me activate our multi-agent system to provide comprehensive insights.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-2`,
    content: "I'll connect you with our Tax Strategy agent who specializes in identifying tax optimization opportunities based on your specific financial situation.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-3`,
    content: "Hello, I'm your Tax Strategy specialist. To provide customized tax optimization recommendations, I'd like to understand your current situation better. Could you tell me about your income sources, investment types, and any major financial events planned for the next few years?",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-4`,
    content: "Sure! I'm 42 years old, married with two children. I have a salary of about $175,000 as a software engineer, and my spouse earns $85,000 as a healthcare professional. We have a portfolio of about $450,000 in various investments, mostly in mutual funds and some individual stocks. We also have a rental property that generates around $30,000 annual income. We're thinking about college planning for our kids and possibly buying a vacation home in the next 3-5 years.",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-5`,
    content: "My annual income is around $175,000. I'm married filing jointly, and I have a mix of stocks, bonds, and some rental property income.",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-6`,
    content: "Thank you for providing that information. Based on your income level of $175,000 with married filing jointly status, you're currently in the 24% federal tax bracket. Let me analyze potential tax optimization strategies across multiple dimensions including income timing, investment structuring, and deduction maximization.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-7`,
    content: "I've completed a comprehensive analysis and identified several tax optimization opportunities. First, let's look at your current tax situation versus what could be achieved with optimization:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-8`,
    content: "```chart\nTax Liability Comparison:\n- Current Strategy: $37,500 annual tax\n- Optimized Strategy: $29,800 annual tax\n- Potential Tax Savings: $7,700 (20.5% reduction)\n```\n\nThis analysis is based on implementing multiple tax-efficient strategies that I'll explain in detail.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-9`,
    content: "Here are the key tax optimization strategies I recommend based on your specific situation:\n\n1. Income Shifting and Timing Strategies\n\n2. Investment Structure Optimization\n\n3. Deduction Maximization\n\n4. Retirement Account Optimization\n\n5. Real Estate Tax Strategies\n\nLet me explain each strategy with specific recommendations.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-10`,
    content: "That sounds comprehensive. Let's dig into these strategies - could you start with the real estate tax strategies since we have that rental property?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-10`,
    content: "Strategy 1: Income Shifting and Timing\n\nConsider establishing a Donor-Advised Fund (DAF) for charitable contributions. By 'bunching' multiple years of charitable donations into a single tax year, you can exceed the standard deduction threshold in that year while taking the standard deduction in subsequent years.\n\nFor your income level, bunching three years of charitable contributions (assuming $10,000/year) into one tax year would create a $30,000 itemized deduction, reducing your taxable income significantly for that year.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-11`,
    content: "Strategy 2: Investment Structure Optimization\n\nBased on your investment portfolio, I recommend the following tax-efficient structuring:\n\n1. Asset Location Optimization: Hold tax-inefficient investments (bonds, REITs) in tax-advantaged accounts and growth-oriented equities in taxable accounts\n\n2. Tax-Loss Harvesting: Systematically realize losses to offset capital gains while maintaining desired market exposure\n\n3. Tax-Lot Optimization: When selling, specifically identify which lots to sell based on cost basis and holding period\n\nImplementing these investment strategies could reduce your annual tax burden by approximately $2,300.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-12`,
    content: "I'm now consulting with our Portfolio Manager agent to model the specific impact of these investment strategies on your portfolio's after-tax returns.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-13`,
    content: "That would be really helpful to see the long-term impact. I'm especially interested in how these strategies might affect our retirement planning.",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-13`,
    content: "Based on our analysis, here's the projected impact of implementing tax-efficient investment structures on your portfolio's after-tax growth over 10 years:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-14`,
    content: "```chart\nPortfolio Value After 10 Years (assuming 7% annual return):\n- Without Tax Optimization: $1,450,000\n- With Tax Optimization: $1,612,000\n- Added Value from Tax Efficiency: $162,000 (11.2% increase)\n```\n\nThis projection demonstrates the significant compounding benefit of tax-efficient investment strategies over time.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-15`,
    content: "Wow, $162,000 is substantial! That's definitely worth implementing. What about real estate strategies since we have that rental property?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-15`,
    content: "Strategy 3: Real Estate Tax Strategies\n\nSince you mentioned having rental property income, I've analyzed several real estate tax optimization opportunities:\n\n1. Cost Segregation Study: Accelerate depreciation deductions by identifying components that qualify for shorter depreciation periods\n\n2. 1031 Exchange Potential: Defer capital gains taxes by exchanging investment properties for like-kind properties\n\n3. Qualified Business Income (QBI) Deduction: Structure your rental activities to potentially qualify for the 20% QBI deduction under Section 199A\n\n4. Home Office Deduction: If applicable, properly document and claim home office deductions for space used exclusively for managing rental properties\n\nImplementing these real estate tax strategies could reduce your annual tax liability by approximately $3,200.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-16`,
    content: "Strategy 4: Retirement Account Optimization\n\nFor your income level and tax bracket, I recommend this retirement account strategy:\n\n1. Maximize 401(k) Contributions: Fully fund your employer-sponsored retirement plan up to the current limit of $22,500 (plus $7,500 catch-up if over 50)\n\n2. Backdoor Roth IRA: Implement the backdoor Roth IRA strategy to contribute to a Roth despite income limitations\n\n3. HSA as a Stealth Retirement Account: If eligible with a high-deductible health plan, maximize HSA contributions ($7,750 for family coverage) and invest the funds rather than spending them\n\nThese retirement strategies would reduce your current tax liability while building tax-advantaged wealth for the future.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-17`,
    content: "I've heard about the Backdoor Roth IRA but wasn't sure if it applied to our situation. And I didn't realize HSAs could be used that way - we do have a high-deductible plan. What about college planning for our kids?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-17`,
    content: "Let me show you how implementing these combined strategies would impact your effective tax rate:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-18`,
    content: "```chart\nEffective Tax Rate Comparison:\n- Current Strategy: 21.4% effective tax rate\n- With Income Shifting: 19.8%\n- With Investment Optimization: 18.3%\n- With Real Estate Strategies: 16.5%\n- With Retirement Optimization: 15.2%\n- Combined Optimized Strategy: 15.2%\n```\n\nThis represents a 6.2 percentage point reduction in your effective tax rate, putting an additional $7,700 in your pocket annually.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-19`,
    content: "Implementation Timeline:\n\nTo maximize the effectiveness of these strategies, I recommend this implementation sequence:\n\n1. Immediate Actions (Next 30 Days):\n   - Adjust 401(k) contributions to maximize by year-end\n   - Implement tax-loss harvesting in your current portfolio\n   - Begin documenting expenses for potential home office deduction\n\n2. Near-Term Actions (1-3 Months):\n   - Consult with a qualified accountant about cost segregation study\n   - Set up and fund Backdoor Roth IRA\n   - Restructure investment holdings for optimal asset location\n\n3. Medium-Term Actions (3-6 Months):\n   - Establish Donor-Advised Fund if bunching charitable contributions\n   - Explore 1031 exchange opportunities if planning property changes\n   - Implement systematic tax-lot identification strategy\n\nOur system will generate detailed step-by-step instructions for each of these action items.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `advisor-sim-20`,
    content: "To summarize our tax optimization plan:\n\n1. Comprehensive Strategy: We've identified opportunities across income timing, investment structure, real estate, and retirement planning\n\n2. Quantified Impact: Implementation would reduce your annual tax burden by approximately $7,700 and potentially add $162,000+ to your portfolio value over 10 years\n\n3. Implementation Roadmap: We've developed a sequenced plan to systematically implement these strategies\n\n4. Ongoing Monitoring: Our system will continuously track tax law changes and your financial situation to identify new optimization opportunities\n\nWould you like me to elaborate on any specific aspect of this tax optimization plan?",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: `user-sim-21`,
    content: "This is incredibly helpful! I'd like to start implementing these strategies right away. Can you create a detailed action plan with specific steps and timelines for us to follow? And would it make sense to schedule quarterly check-ins to adjust as our situation changes?",
    role: "user",
    timestamp: new Date().toISOString(),
  }
];

// Map of scenarios to their message sets
const scenarioMessages = {
  investmentPortfolio: investmentPortfolioMessages,
  retirementPlanning: retirementPlanningMessages,
  marketAnalysis: marketAnalysisMessages,
  taxStrategies: taxStrategiesMessages
};

// Available simulation scenarios
const SIMULATION_SCENARIOS = [
  "investmentPortfolio",  // Scenario 1: Investment Portfolio Analysis
  "retirementPlanning",   // Scenario 2: Retirement Planning
  "marketAnalysis",      // Scenario 3: Market Analysis and Trends
  "taxStrategies"        // Scenario 4: Tax Optimization Strategies
];

// Enhanced simulation function with better history handling
const runSimulation = (userInput: string) => {
  console.log("Running enhanced simulation with input:", userInput);
  
  // Set processing state immediately
  setIsProcessing(true);
  setError(null);
  
  // Create a new simulation ID with a more readable format
  const simulationDate = new Date();
  const simulationId = `sim-${simulationDate.getTime()}`;
  setConversationId(simulationId);
  
  try {
    // Create the user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: userInput,
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    // Get conversation title based on user input (first 30 chars)
    const conversationTitle = userInput.length > 30 
      ? `${userInput.substring(0, 30)}...` 
      : userInput;
    setCurrentConversationTitle(conversationTitle);
    
    // Set the initial message immediately and save to history
    setMessages([userMsg]);
    saveConversation(simulationId, conversationTitle, [userMsg]);
    
    // Create a copy of the hardcoded tax scenario responses
    const responses: Message[] = [
      {
        id: `msg-${Date.now()}-1`,
        role: "assistant",
        content: "I'll help you optimize your tax situation. Based on your current income and deductions, let me analyze potential strategies.",
        timestamp: new Date().toISOString(),
        agentType: "tax_advisor"
      },
      {
        id: `msg-${Date.now()}-2`,
        role: "assistant",
        content: "After reviewing your situation, I've identified several opportunities to reduce your tax burden:",
        timestamp: new Date().toISOString(),
        agentType: "tax_advisor"
      },
      {
        id: `msg-${Date.now()}-3`,
        role: "assistant",
        content: "Here's a breakdown of potential tax savings strategies for your consideration:\n\n```chart\nTax Savings Opportunities:\n- Tax-Advantaged Accounts: $3,500\n- Deductible Expenses: $1,800\n- Tax Credits: $2,200\n- Income Timing Strategies: $1,500\n- Tax-Efficient Investments: $1,200\n```\n\nThese are estimates based on your current financial situation.",
        timestamp: new Date().toISOString(),
        agentType: "tax_advisor"
      },
      {
        id: `msg-${Date.now()}-4`,
        role: "assistant",
        content: "I recommend focusing on maximizing your contributions to retirement accounts like 401(k) and IRA. This could save you approximately $3,500 in taxes annually while helping you build long-term wealth.",
        timestamp: new Date().toISOString(),
        agentType: "financial_advisor"
      },
      {
        id: `msg-${Date.now()}-5`,
        role: "assistant",
        content: "Additionally, consider these tax-efficient investment strategies:\n\n1. Hold growth investments in tax-advantaged accounts\n2. Keep dividend-paying investments in retirement accounts\n3. Use tax-loss harvesting for taxable accounts\n4. Consider municipal bonds for tax-free income\n\nThese approaches can significantly improve your after-tax returns.",
        timestamp: new Date().toISOString(),
        agentType: "portfolio_manager"
      }
    ];
    
    // Keep track of all messages for consistent saving
    const allMessages = [userMsg];
    
    // Display each message with a delay and save after each one
    responses.forEach((msg, index) => {
      setTimeout(() => {
        // Add this message to our tracking array
        allMessages.push(msg);
        
        // Update the UI with all messages so far
        setMessages([...allMessages]);
        
        // Save the conversation after each message is added and show visual confirmation
        saveConversation(simulationId, conversationTitle, allMessages);
        
        // Show saving notification on each message
        setSavingStatus({
          show: true,
          status: 'saved',
          message: 'Conversation saved to history'
        });
        
        // Auto-hide the notification after 2 seconds
        setTimeout(() => {
          setSavingStatus(prev => ({ ...prev, show: false }))
        }, 2000);
        
        // Scroll to the new message
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        
        // If it's the last message, turn off the processing state and show save confirmation
        if (index === responses.length - 1) {
          setTimeout(() => {
            setIsProcessing(false);
            
            // Final save to ensure everything is persisted
            saveConversation(simulationId, conversationTitle, allMessages);
            
            // Show a notification that the conversation was saved
            setSavingStatus({
              show: true,
              status: 'saved',
              message: 'Conversation saved to history'
            });
            
            // Add a system message confirming the conversation is saved
            const saveConfirmationMsg: Message = {
              id: `system-${Date.now()}`,
              role: "assistant",
              content: "*This conversation has been saved to your history. You can access it later from the sidebar.*",
              timestamp: new Date().toISOString(),
              agentType: "system"
            };
            
            // Add confirmation message to UI and save it
            allMessages.push(saveConfirmationMsg);
            setMessages([...allMessages]);
            saveConversation(simulationId, conversationTitle, allMessages);
            
            // Auto-hide the notification after 3 seconds
            setTimeout(() => {
              setSavingStatus(prev => ({ ...prev, show: false }))
            }, 3000);
            
            console.log("Conversation saved and can be accessed from history");
          }, 500);
        }
      }, 1500 * (index + 1)); // Stagger the messages with increasing delays
    });
    
    // Mark for saving in local storage
    window.localStorage.setItem('should_save_conversation', 'true');
    
  } catch (error) {
    console.error("Error in simulation:", error);
    setIsProcessing(false);
    setError("There was a problem with the simulation. Please try again.");
  }
};

// Simple handleSubmit that triggers the simulation with any input
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Don't do anything if input is empty or already processing
  if (!input.trim() || isProcessing) {
    return;
  }

  // Clear input field and any existing errors
  const userText = input.trim();
  setInput("");
  setError(null);
  
  // Just call runSimulation with the user's text - it handles everything else
  console.log("Submitting user input: ", userText);
  runSimulation(userText);
};

// Handle Enter key press in textarea
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  }
};  // End of handleSubmit function

  // Start a new chat without deleting saved conversations
  const startNewChat = () => {
    // First check if we should save the current conversation
    const shouldSave = window.localStorage.getItem('should_save_conversation') === 'true';
    
    if (shouldSave && conversationId && messages.length > 0) {
      // Save the current conversation before creating a new one
      saveConversation(conversationId, currentConversationTitle || 'Financial Conversation', messages);
      console.log("Saved conversation before starting new chat:", conversationId);
      window.localStorage.removeItem('should_save_conversation');
    }
    
    // Generate a new conversation ID
    const newConvId = `sim-${Date.now()}`;
    
    // Update state for new conversation
    setConversationId(newConvId);
    setCurrentConversationTitle("New Financial Consultation");
    setMessages([]);
    setHistoryLoading(false);
    setShowSuggestions(true);
    setError(null);
    setInput("");
    
    // Update URL to reflect new conversation
    window.history.pushState({}, '', `/advisor?id=${newConvId}`);
  };

  // Handle loading a conversation
  const handleLoadConversation = (convId: string) => {
    setConversationId(convId);
  };

  // Enhanced function to save conversation to local storage with better error handling and visual feedback
  const saveConversation = async (convId: string, title: string, messagesData: Message[]) => {
    // Don't attempt to save if there's no data or ID
    if (!convId || !messagesData || messagesData.length === 0) {
      console.warn("Cannot save conversation: Missing ID or messages");
      setSavingStatus({
        show: true,
        status: 'error',
        message: 'Could not save conversation - missing data'
      });
      return false;
    }
    
    // Make sure we have a valid title
    const safeTitle = title || `Conversation ${new Date().toLocaleString()}`;
    
    // Show saving indicator
    setSavingStatus({
      show: true,
      status: 'saving',
      message: 'Saving conversation...'
    });
    
    try {
      // Format the conversation object
      const conversation = {
        id: convId,
        title: safeTitle,
        messages: messagesData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: messagesData[messagesData.length - 1]?.content.substring(0, 50) || "",
        messageCount: messagesData.length,
        isSimulation: true
      };
      
      // Get existing conversations from local storage with error handling
      let existingConversations = [];
      try {
        const existingConversationsStr = localStorage.getItem('conversations');
        if (existingConversationsStr) {
          existingConversations = JSON.parse(existingConversationsStr);
          // Validate that it's an array
          if (!Array.isArray(existingConversations)) {
            console.warn("Conversations in storage is not an array, resetting");
            existingConversations = [];
          }
        }
      } catch (parseErr) {
        console.warn("Error parsing existing conversations, starting fresh", parseErr);
      }
      
      // Add new conversation or update existing
      const existingIndex = existingConversations.findIndex((c: any) => c.id === convId);
      if (existingIndex >= 0) {
        existingConversations[existingIndex] = conversation;
      } else {
        existingConversations.unshift(conversation); // Add to beginning for better UX
      }
      
      // Limit the number of saved conversations to prevent storage issues
      if (existingConversations.length > 100) {
        existingConversations = existingConversations.slice(0, 100);
      }
      
      // Save back to local storage
      localStorage.setItem('conversations', JSON.stringify(existingConversations));
      
      // Update URL with conversation ID for easier sharing/bookmarking
      window.history.pushState({}, '', `/advisor?id=${convId}`);
      
      // Display a timestamp of when it was saved for debugging
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      console.log(`Conversation saved at ${timeStr}: ${safeTitle} (${convId})`);
      
      // Show success message
      setSavingStatus({
        show: true,
        status: 'saved',
        message: 'Conversation saved to history'
      });
      
      // Hide the success message after 3 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          show: false
        }));
      }, 3000);
      
      // Trigger a DOM event that the conversation list can listen for
      const saveEvent = new CustomEvent('conversation-saved', { detail: { id: convId } });
      window.dispatchEvent(saveEvent);
      
      return true;
    } catch (err) {
      console.error('Error saving conversation:', err);
      setError("There was a problem saving your conversation. Your chat history might not be preserved.");
      
      // Show error message
      setSavingStatus({
        show: true,
        status: 'error',
        message: 'Failed to save conversation'
      });
      
      // Hide the error message after 5 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          show: false
        }));
      }, 5000);
      
      return false;
    }
  };
  
  // Handle clearing a conversation
  const handleClearConversation = async () => {
    if (!conversationId) return;
    
    try {
      // Remove from local storage
      const existingConversationsStr = localStorage.getItem('conversations');
      const existingConversations = existingConversationsStr ? JSON.parse(existingConversationsStr) : [];
      const filteredConversations = existingConversations.filter((c: any) => c.id !== conversationId);
      localStorage.setItem('conversations', JSON.stringify(filteredConversations));
      
      // Also try to clear from backend if available
      try {
        await clearConversation(conversationId);
      } catch (backendErr) {
        console.warn('Failed to clear conversation from backend:', backendErr);
      }
      
      startNewChat();
    } catch (err: any) {
      console.error("Error clearing conversation:", err);
      setError("Failed to clear conversation: " + err.message);
    }
  };

  // Handle sample question click
  const handleSampleQuestion = (question: string) => {
    setInput(question);
    // Use setTimeout to allow the state to update before submitting
    setTimeout(() => {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }, 0);
  };

  // Using SaveNotification component instead of internal implementation

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
                  className="w-full justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
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
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-10 overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto py-1">

                      
                      {/* ArwiGos - General Agent */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("general");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.general.color }}>
                            <Bot className="h-3 w-3" />
                          </div>
                          <span>ArwiGos (General)</span>
                        </div>
                      </Button>
                      
                      {/* Financial Advisor */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("financial_advisor");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.financial_advisor.color }}>
                            <PiggyBank className="h-3 w-3" />
                          </div>
                          <span>Financial Advisor</span>
                        </div>
                      </Button>
                      
                      {/* Market Analyst */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("market_analyst");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.market_analyst.color }}>
                            <BarChart3 className="h-3 w-3" />
                          </div>
                          <span>Market Analyst</span>
                        </div>
                      </Button>
                      
                      {/* Portfolio Manager */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("portfolio_manager");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.portfolio_manager.color }}>
                            <TrendingUp className="h-3 w-3" />
                          </div>
                          <span>Portfolio Manager</span>
                        </div>
                      </Button>
                      
                      {/* Retirement Planner */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("retirement_planner");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.retirement_planner.color }}>
                            <PiggyBank className="h-3 w-3" />
                          </div>
                          <span>Retirement Planner</span>
                        </div>
                      </Button>
                      
                      {/* Tax Advisor */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-zinc-800 rounded-none"
                        onClick={() => {
                          setActiveAgent("tax_advisor");
                          setShowAgentSelector(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: agentVisuals.tax_advisor.color }}>
                            <Landmark className="h-3 w-3" />
                          </div>
                          <span>Tax Advisor</span>
                        </div>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Conversations/Sessions List */}
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Conversations</div>
                <Button 
                  onClick={startNewChat} 
                  variant="default"
                  className="w-full justify-start mb-3 bg-primary hover:bg-primary/90 text-primary-foreground">
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
              <Button 
                variant="outline" 
                className="w-full justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
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
              <h2 className="text-md font-medium">
                {conversationId ? currentConversationTitle || 'Conversation' : 'New Conversation'}
              </h2>
            </div>
            {conversationId && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-background"
                onClick={handleClearConversation}
                aria-label="Clear conversation"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          

          {/* Messages container */}
          <ScrollArea className="flex-1 p-4 pb-8">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4">
                <div className="max-w-md text-center">
                  <h3 className="mb-2 text-xl font-bold">Financial Advisor</h3>
                  <p className="text-muted-foreground">
                    Start a conversation to get financial insights, market analysis, and personalized advice.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 px-4 pb-20">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const { color, name } = isUser
                      ? { color: "#64748b", name: "You" }
                      : getAgentVisual(message);
                    
                    return (
                      <motion.div
                        key={message.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex gap-3 mb-4",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isUser && (
                          <Avatar className="h-8 w-8 border-2 shadow-sm" style={{borderColor: color || '#3b82f6'}}>
                            <AvatarFallback style={{ background: color || '#3b82f6' }}>
                              {message.agentType === "financial_advisor" ? <PiggyBank className="h-4 w-4 text-white" /> :
                               message.agentType === "market_analyst" ? <BarChart3 className="h-4 w-4 text-white" /> :
                               message.agentType === "portfolio_manager" ? <TrendingUp className="h-4 w-4 text-white" /> :
                               message.agentType === "retirement_planner" ? <PiggyBank className="h-4 w-4 text-white" /> :
                               message.agentType === "tax_advisor" ? <Landmark className="h-4 w-4 text-white" /> :
                               <Bot className="h-4 w-4 text-white" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[80%] rounded-lg p-3 shadow-sm",
                          isUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-foreground"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium">{isUser ? "You" : name}</div>
                            {message.timestamp && (
                              <div className="text-xs text-zinc-500">
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                          <div className="prose prose-sm prose-invert max-w-none">
                            {/* Support for rendering charts and diagrams in messages */}
                            {message.content && message.content.includes('```chart') ? (
                              <>
                                {message.content.split('```chart').map((part, index) => {
                                  if (index === 0) {
                                    return part ? <div key={`text-${index}`} className="mb-2">{part}</div> : null;
                                  }
                                  
                                  const chartEnd = part.indexOf('```');
                                  if (chartEnd === -1) return <div key={`text-${index}`}>{part}</div>;
                                  
                                  const chartData = part.substring(0, chartEnd);
                                  const restOfContent = part.substring(chartEnd + 3);
                                  
                                  return (
                                    <React.Fragment key={`chart-${index}`}>
                                      <div className="bg-zinc-800 rounded-md p-3 my-2 border border-zinc-700 overflow-hidden">
                                        <div className="text-xs text-zinc-400 mb-2 font-mono">Financial Visualization</div>
                                        <ChartVisualization data={{ title: "Financial Visualization", dataPoints: chartData.split('\n').map(line => {
                                            const parts = line.split(':');
                                            return { 
                                              label: parts[0]?.trim() || "", 
                                              value: parts[1]?.trim() || ""
                                            };
                                          }), type: 'bar' }} />
                                      </div>
                                      {restOfContent && <div className="mt-2">{restOfContent}</div>}
                                    </React.Fragment>
                                  );
                                })}
                              </>
                            ) : (
                              message.content
                            )}
                          </div>
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
                  })}
                </AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Skeleton className="h-8 w-8 rounded-full bg-zinc-800" />
                    <div className="space-y-2 flex-1 max-w-[80%]">
                      <Skeleton className="h-4 w-24 bg-zinc-800" />
                      <Skeleton className="h-4 w-full bg-zinc-800" />
                      <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          </div>
          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mx-4 mb-2 bg-red-900 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          
            
          {/* Input area */}
          <div className="p-4 border-t border-zinc-800">
            <form onSubmit={handleSubmit} className="flex">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about investments, markets, portfolio planning..."
                  className="min-h-12 max-h-36 resize-none bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus-visible:ring-zinc-700 text-white rounded-xl pr-12"
                  disabled={isProcessing || historyLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isProcessing || historyLoading}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
