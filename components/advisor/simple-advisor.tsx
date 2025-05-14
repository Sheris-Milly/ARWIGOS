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
  User as UserIcon,
  RefreshCw,
  Database,
  LineChart,
  PieChart,
  LayoutDashboard,
  Globe,
  Save,
  Download,
  Upload,
  Share2,
  FileText,
  Sparkles,
  Brain,
  Presentation,
  LucideIcon,
  Wallet,
  BadgePercent,
  Building,
  Home,
  Plus,
  DollarSign,
  X,
  Shield,
  Heart,
  CreditCard,
  Calculator,
  Briefcase,
  Users,
  HelpCircle,
  Play,
  Lightbulb
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { CollapsibleChart } from "./collapsible-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

// Define chart data type
interface ChartData {
  type: "bar" | "line" | "pie" | "doughnut" | "polarArea";
  title: string;
  description?: string; // Additional explanation of the chart
  insights?: string[]; // Key insights from the chart
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
    }[];
  };
}

// Define message interface
interface Message {
  id: string;
  sender: AgentType;
  text: string;
  timestamp: number;
  chart?: ChartData;
  
  // Advanced features
  reasoning?: string; // Internal reasoning/context not shown to the user
  confidence?: number; // Confidence level (0-1)
  sources?: string[]; // Sources of information 
  isCollaborative?: boolean; // Message from multiple agents working together
  relatedAgents?: AgentType[]; // Other agents that contributed
  keywords?: string[]; // Extracted keywords from the message
  
  // Enhanced chart experience
  description?: string; // Description of what the chart shows
  insights?: string[]; // Key insights from the chart
  
  // Interactive elements
  suggestionType?: 'question' | 'action' | 'insight'; // Type of suggestion
  suggestions?: string[]; // Follow-up suggestions
  emotionalTone?: 'neutral' | 'positive' | 'negative' | 'urgent' | 'cautious'; // Emotional tone
  
  // UI/UX elements
  expanded?: boolean; // Whether detail sections are expanded
  savedByUser?: boolean; // User has saved this message
  flaggedForReview?: boolean; // User has flagged this for review
}

// Define agent types for type safety
type AgentType = "advisor" | "portfolio" | "analyst" | "retirement" | "tax" | "user";

// Define action types for agents
type AgentAction = "thinking" | "fetching" | "analyzing" | "calculating" | "researching" | "planning";

// Agent specializations for more detailed roles
type AgentSpecialization = {
  name: string;
  description: string;
  icon: React.ReactNode;
};

// Agent definitions with animated actions and specializations
const agents: Record<Exclude<AgentType, "user">, {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  expertise: string[];
  specializations: AgentSpecialization[];
  actions: Record<AgentAction, React.ReactNode>;
}> = {
  advisor: {
    name: "Lead Financial Advisor",
    icon: <Sparkles className="h-4 w-4 text-white" />,
    color: "#8b5cf6", // Purple
    description: "Coordinates the financial advisory team and provides comprehensive financial guidance",
    expertise: ["Financial planning", "Wealth management", "Goal setting", "Team coordination"],
    specializations: [
      { name: "Wealth Manager", description: "Focuses on high-net-worth client strategies", icon: <Wallet className="h-3 w-3" /> },
      { name: "Financial Coach", description: "Provides behavioral finance guidance", icon: <Presentation className="h-3 w-3" /> }
    ],
    actions: {
      thinking: <Brain className="h-4 w-4 text-white animate-pulse" />,
      fetching: <Database className="h-4 w-4 text-white animate-pulse" />,
      analyzing: <RefreshCw className="h-4 w-4 text-white animate-spin" />,
      calculating: <Bot className="h-4 w-4 text-white animate-spin" />,
      researching: <FileText className="h-4 w-4 text-white animate-pulse" />,
      planning: <Presentation className="h-4 w-4 text-white animate-pulse" />
    }
  },
  analyst: {
    name: "Market Analyst",
    icon: <BarChart3 className="h-4 w-4 text-white" />,
    color: "#10b981", // Green
    description: "Analyzes market trends and economic indicators to inform investment decisions",
    expertise: ["Equity research", "Economic forecasting", "Sector analysis", "Market timing"],
    specializations: [
      { name: "Technical Analyst", description: "Uses chart patterns to predict market moves", icon: <LineChart className="h-3 w-3" /> },
      { name: "Fundamental Analyst", description: "Evaluates company financials and economic indicators", icon: <FileText className="h-3 w-3" /> }
    ],
    actions: {
      thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
      fetching: <Globe className="h-4 w-4 text-white animate-pulse" />,
      analyzing: <LineChart className="h-4 w-4 text-white animate-pulse" />,
      calculating: <BarChart3 className="h-4 w-4 text-white animate-spin" />,
      researching: <RefreshCw className="h-4 w-4 text-white animate-spin" />,
      planning: <Presentation className="h-4 w-4 text-white animate-pulse" />
    }
  },
  portfolio: {
    name: "Portfolio Manager",
    icon: <TrendingUp className="h-4 w-4 text-white" />,
    color: "#3b82f6", // Blue
    description: "Designs and manages investment portfolios tailored to client goals and risk tolerance",
    expertise: ["Asset allocation", "Security selection", "Portfolio optimization", "Risk management"],
    specializations: [
      { name: "ETF Strategist", description: "Specializes in ETF-based portfolios", icon: <LayoutDashboard className="h-3 w-3" /> },
      { name: "ESG Specialist", description: "Focuses on sustainable investing", icon: <Sparkles className="h-3 w-3" /> }
    ],
    actions: {
      thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
      fetching: <LayoutDashboard className="h-4 w-4 text-white animate-pulse" />,
      analyzing: <PieChart className="h-4 w-4 text-white animate-pulse" />,
      calculating: <TrendingUp className="h-4 w-4 text-white animate-spin" />,
      researching: <LineChart className="h-4 w-4 text-white animate-pulse" />,
      planning: <Bot className="h-4 w-4 text-white animate-spin" />
    }
  },
  tax: {
    name: "Tax Specialist",
    icon: <Landmark className="h-4 w-4 text-white" />,
    color: "#f59e0b", // Amber
    description: "Provides tax planning strategies to minimize tax burden and maximize after-tax returns",
    expertise: ["Tax-efficient investing", "Tax loss harvesting", "Retirement account planning", "Estate tax minimization"],
    specializations: [
      { name: "Business Tax Expert", description: "Specializes in business tax strategies", icon: <Building className="h-3 w-3" /> },
      { name: "Estate Tax Planner", description: "Focuses on inheritance and gift tax strategies", icon: <FileText className="h-3 w-3" /> }
    ],
    actions: {
      thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
      fetching: <Database className="h-4 w-4 text-white animate-pulse" />,
      analyzing: <BadgePercent className="h-4 w-4 text-white animate-pulse" />,
      calculating: <DollarSign className="h-4 w-4 text-white animate-spin" />,
      researching: <FileText className="h-4 w-4 text-white animate-pulse" />,
      planning: <Presentation className="h-4 w-4 text-white animate-pulse" />
    }
  },
  retirement: {
    name: "Retirement Planner",
    icon: <Clock className="h-4 w-4 text-white" />,
    color: "#f97316", // Orange
    description: "Develops comprehensive retirement plans to ensure financial security in retirement",
    expertise: ["Retirement needs analysis", "Social Security optimization", "Withdrawal strategies", "Healthcare planning"],
    specializations: [
      { name: "Early Retirement Specialist", description: "Focuses on strategies for early retirement", icon: <Sparkles className="h-3 w-3" /> },
      { name: "Income Planner", description: "Specializes in retirement income generation", icon: <DollarSign className="h-3 w-3" /> }
    ],
    actions: {
      thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
      fetching: <Database className="h-4 w-4 text-white animate-pulse" />,
      analyzing: <LineChart className="h-4 w-4 text-white animate-pulse" />,
      calculating: <Clock className="h-4 w-4 text-white animate-spin" />,
      researching: <FileText className="h-4 w-4 text-white animate-pulse" />,
      planning: <Home className="h-4 w-4 text-white animate-pulse" />
    }
  },

};

// Keywords to determine which agent should respond
const agentKeywords = {
  advisor: ["advice", "recommend", "help", "guidance", "suggest", "opinion", "overview", "plan", "strategy"],
  analyst: ["market", "trend", "outlook", "forecast", "economy", "sector", "analysis", "stock", "performance"],
  portfolio: ["portfolio", "invest", "stock", "bond", "etf", "allocation", "diversify", "asset", "fund"],
  tax: ["tax", "taxes", "deduction", "write-off", "irs", "capital gains", "income", "bracket", "refund"],
  retirement: ["retirement", "401k", "ira", "pension", "social security", "retiring", "withdraw", "roth"],

};

// Predefined agent responses
const agentResponses = {
  advisor: [
    "Based on your financial goals, I recommend a balanced approach with a mix of stocks and bonds.",
    "Looking at your situation, it would be wise to focus on building an emergency fund before aggressive investing.",
    "I'd suggest speaking with our portfolio manager about specific investment opportunities that match your risk tolerance.",
    "Have you considered how your current debt situation might impact your investment strategy?",
    "Looking at the big picture, you should consider balancing investments with retirement planning and tax optimization."
  ],
  analyst: [
    "The market has been showing volatility in tech sectors, while healthcare and consumer staples remain stable.",
    "Recent economic indicators suggest a potential slowdown in the next quarter, which might impact growth stocks.",
    "We're seeing interesting opportunities in emerging markets, particularly in sectors focusing on renewable energy.",
    "Small-cap stocks have been underperforming compared to large-caps this year - this might present buying opportunities.",
    "Based on current trends, value stocks might outperform growth in the coming months."
  ],
  portfolio: [
    "I'd recommend a portfolio with 60% stocks, 30% bonds, and 10% alternatives based on your risk profile.",
    "For stock picks, consider blue-chip companies with strong dividends like Johnson & Johnson or Procter & Gamble.",
    "ETFs offer a simple way to diversify - a total market ETF combined with a bond ETF would be a good foundation.",
    "Based on your age and goals, you might want to consider a more aggressive allocation with up to 80% in equities.",
    "Dollar-cost averaging into index funds is a solid strategy for long-term wealth building."
  ],
  tax: [
    "Contributing to tax-advantaged accounts like 401(k)s and IRAs should be your first priority.",
    "Consider tax-loss harvesting to offset capital gains and potentially reduce your tax liability.",
    "Municipal bonds offer tax-free income at the federal level and potentially at the state level too.",
    "For your situation, a Roth conversion might make sense given your current tax bracket and future expectations.",
    "Make sure you're taking advantage of all available deductions, including those for home offices and healthcare expenses."
  ],
  retirement: [
    "The 4% withdrawal rule is a good starting point for retirement planning, but your specific situation may vary.",
    "Consider delaying Social Security benefits until age 70 to maximize your lifetime benefits.",
    "A mix of Roth and traditional retirement accounts gives you tax flexibility in retirement.",
    "Based on your current savings rate, you're on track to reach your retirement goals by age 62.",
    "In retirement, consider a bucket strategy with separate allocations for short-term, medium-term, and long-term needs."
  ],
  estate: [
    "Creating a will is essential for ensuring your assets are distributed according to your wishes.",
    "Consider establishing a trust to provide more control over how your assets are distributed and potentially reduce estate taxes.",
    "Regularly review your beneficiary designations on accounts to ensure they reflect your current wishes.",
    "Powers of attorney for healthcare and finances are crucial documents to have in place before they're needed.",
    "Estate planning should be reviewed after major life events like marriages, births, or significant changes in assets."
  ],
  insurance: [
    "Life insurance needs typically decrease as you age and your dependents become self-sufficient.",
    "Consider an umbrella liability policy to protect your assets from potential lawsuits.",
    "Long-term care insurance is most cost-effective when purchased in your 50s before health issues arise.",
    "Regularly review your coverage amounts to ensure they keep pace with your growing assets.",
    "Self-insuring through adequate emergency savings might be appropriate for some types of coverage."
  ],
  credit: [
    "Aim to keep your credit utilization below 30% of available credit to maintain a strong credit score.",
    "Mortgage refinancing could make sense if you can reduce your interest rate by at least 0.75-1%.",
    "Consider a debt snowball or avalanche method to systematically eliminate your debts.",
    "Home equity lines of credit can be a strategic borrowing tool if used responsibly for value-adding purposes.",
    "Regularly check your credit report for errors that might be negatively impacting your score."
  ],
  cfo: [
    "Regular financial reviews are essential - consider quarterly check-ins to track progress toward your goals.",
    "Automating your savings and bill payments creates a financial system that requires less active management.",
    "Maintaining separate accounts for different financial goals can help with mental accounting and progress tracking.",
    "Your financial priorities should evolve with life stages - what's important now may change significantly in 5-10 years.",
    "Building a professional team including a financial advisor, CPA, and estate attorney provides specialized expertise for complex situations."
  ]
};

// Choose which agent responds based on message content
function determineAgent(message: string): Exclude<AgentType, "user"> {
  message = message.toLowerCase();
  
  // Count matches for each agent
  const matches: Record<Exclude<AgentType, "user">, number> = {
    advisor: 0,
    analyst: 0,
    portfolio: 0,
    tax: 0,
    retirement: 0
  };
  
  // Count keyword matches for each agent
  Object.entries(agentKeywords).forEach(([agent, keywords]) => {
    keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        // Weight certain keywords more heavily
        const weight = keyword.length > 6 ? 2 : 1;
        matches[agent as Exclude<AgentType, "user">] += weight;
      }
    });
  });
  
  // Check for specific financial scenarios that might require multiple agents
  const scenarioMatches = {
    retirement_planning: matches.retirement > 0 && (matches.tax > 0 || matches.portfolio > 0),
    investment_strategy: matches.portfolio > 0 && matches.analyst > 0
  };
  
  // Adjust scores based on scenarios
  if (scenarioMatches.retirement_planning) {
    matches.advisor += 2;
  }
  if (scenarioMatches.investment_strategy) {
    matches.portfolio += 1;
  }
  
  // Find agent with most matches
  let bestAgent = "advisor"; // Default
  let maxMatches = matches.advisor;
  
  Object.entries(matches).forEach(([agent, count]) => {
    if (count > maxMatches) {
      maxMatches = count;
      bestAgent = agent;
    }
  });
  
  // If no strong matches, use advisor
  if (maxMatches === 0) {
    return "advisor";
  }
  
  return bestAgent as Exclude<AgentType, "user">;
}

// Get a random response from an agent
function getAgentResponse(agentType: Exclude<AgentType, "user">): string {
  const responses = agentResponses[agentType];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

export function SimpleAdvisor() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>("advisor");
  const [currentAction, setCurrentAction] = useState<AgentAction>("thinking");
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  
  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        sender: "advisor",
        text: "Hello! I'm your AI financial assistant. Our team of specialized agents can help with investments, market analysis, retirement planning, and tax strategies. What financial questions can I help you with today?",
        timestamp: Date.now(),
        confidence: 0.95,
        emotionalTone: "positive",
        suggestions: [
          "What's a good investment strategy for someone in their 30s?", 
          "How should I plan for retirement?", 
          "What tax strategies can help me save money?"
        ]
      };
      
      setMessages([welcomeMessage]);
    }
  }, []);
  
  // Sample chart data for various messages
const sampleCharts = {
  portfolioAllocation: {
    type: "doughnut" as const,
    title: "Recommended Portfolio Allocation",
    description: "A balanced portfolio diversified across major asset classes",
    insights: ["Provides broad market exposure", "Balances growth with stability", "Suitable for medium risk tolerance"],
    data: {
      labels: ["US Stocks", "International Stocks", "Bonds", "REITs", "Cash"],
      datasets: [{
        label: "Allocation",
        data: [45, 25, 20, 5, 5],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)", // Blue
          "rgba(16, 185, 129, 0.7)", // Green
          "rgba(249, 115, 22, 0.7)", // Orange
          "rgba(139, 92, 246, 0.7)", // Purple
          "rgba(229, 231, 235, 0.7)" // Gray
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(249, 115, 22, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(229, 231, 235, 1)"
        ],
        borderWidth: 1
      }]
    }
  },
  aggressiveAllocation: {
    type: "doughnut" as const,
    title: "Aggressive Growth Portfolio",
    description: "Higher risk portfolio focused on growth sectors and emerging markets",
    insights: ["Potential for higher returns", "Higher volatility expected", "Suitable for longer time horizons"],
    data: {
      labels: ["US Growth Stocks", "Emerging Markets", "Tech Sector", "High-Yield Bonds", "REITs"],
      datasets: [{
        label: "Allocation",
        data: [40, 20, 20, 10, 10],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)", // Blue
          "rgba(16, 185, 129, 0.7)", // Green
          "rgba(236, 72, 153, 0.7)", // Pink
          "rgba(249, 115, 22, 0.7)", // Orange
          "rgba(139, 92, 246, 0.7)" // Purple
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(249, 115, 22, 1)",
          "rgba(139, 92, 246, 1)"
        ],
        borderWidth: 1
      }]
    }
  },
  conservativeAllocation: {
    type: "doughnut" as const,
    title: "Conservative Income Portfolio",
    description: "Lower risk portfolio focused on income and capital preservation",
    insights: ["Focuses on stability and income", "Lower expected volatility", "Suitable for shorter time horizons"],
    data: {
      labels: ["Bonds", "Dividend Stocks", "Cash", "US Stocks", "International Stocks"],
      datasets: [{
        label: "Allocation",
        data: [40, 25, 15, 15, 5],
        backgroundColor: [
          "rgba(249, 115, 22, 0.7)", // Orange
          "rgba(59, 130, 246, 0.7)", // Blue
          "rgba(229, 231, 235, 0.7)", // Gray
          "rgba(16, 185, 129, 0.7)", // Green
          "rgba(139, 92, 246, 0.7)"  // Purple
        ],
        borderColor: [
          "rgba(249, 115, 22, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(229, 231, 235, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)"
        ],
        borderWidth: 1
      }]
    }
  },
  investmentReturns: {
    type: "line" as const,
    title: "Projected Investment Growth ($10,000 Initial)",
    description: "Comparison of different investment strategies over 10 years",
    insights: ["Growth potential increases with risk", "Compounding effects become significant over time", "Diversification reduces volatility"],
    data: {
      labels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10"],
      datasets: [
        {
          label: "Aggressive Growth",
          data: [11000, 12100, 13310, 14641, 16105, 17716, 19487, 21436, 23579, 25937],
          borderColor: "rgba(236, 72, 153, 1)", // Pink
          backgroundColor: "rgba(236, 72, 153, 0.1)",
          borderWidth: 2,
          fill: true
        },
        {
          label: "Balanced",
          data: [10700, 11449, 12250, 13108, 14026, 15007, 16058, 17182, 18385, 19672],
          borderColor: "rgba(59, 130, 246, 1)", // Blue
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: true
        },
        {
          label: "Conservative",
          data: [10400, 10816, 11249, 11699, 12167, 12653, 13159, 13686, 14233, 14802],
          borderColor: "rgba(249, 115, 22, 1)", // Orange
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          borderWidth: 2,
          fill: true
        }
      ]
    }
  },
  etfComparison: {
    type: "bar" as const,
    title: "ETF Performance Comparison (5-Year Annualized)",
    description: "Performance and expense ratio comparison of recommended ETFs",
    insights: ["Low-cost index ETFs provide broad market exposure", "Sector ETFs offer targeted exposure with higher potential returns", "Expense ratios impact long-term performance"],
    data: {
      labels: ["VTI (Total Market)", "VOO (S&P 500)", "VGT (Tech Sector)", "VIG (Dividend Growth)", "VXUS (International)", "BND (Total Bond)"],
      datasets: [{
        label: "5-Year Return (%)",
        data: [13.5, 14.2, 23.8, 11.6, 8.9, 3.1],
        backgroundColor: "rgba(59, 130, 246, 0.7)", // Blue
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1
      }]
    }
  },
  sectorPerformance: {
    type: "bar" as const,
    title: "Current Market Sector Performance (YTD)",
    description: "Year-to-date performance of major market sectors",
    insights: ["Technology and healthcare leading growth", "Energy sector experiencing volatility", "Defensive sectors underperforming in bull market"],
    data: {
      labels: ["Technology", "Healthcare", "Financials", "Consumer Discretionary", "Industrials", "Energy", "Utilities", "Real Estate"],
      datasets: [{
        label: "YTD Return (%)",
        data: [22.5, 15.7, 9.8, 11.3, 8.7, -3.2, 2.6, 5.8],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",  // Blue
          "rgba(16, 185, 129, 0.7)",  // Green
          "rgba(139, 92, 246, 0.7)",  // Purple 
          "rgba(236, 72, 153, 0.7)",  // Pink
          "rgba(249, 115, 22, 0.7)",  // Orange
          "rgba(239, 68, 68, 0.7)",   // Red
          "rgba(168, 85, 247, 0.7)",  // Indigo
          "rgba(107, 114, 128, 0.7)"  // Gray
        ],
        borderWidth: 1
      }]
    }
  },
  assetCorrelation: {
    type: "bar" as const,
    title: "Asset Class Correlation Matrix",
    description: "How different asset classes move in relation to each other",
    insights: ["Lower correlation increases diversification benefits", "Bonds often move inversely to stocks in market stress", "Alternative assets provide diversification"],
    data: {
      labels: ["US Stocks to Int'l Stocks", "Stocks to Bonds", "Stocks to REITs", "Stocks to Gold", "Bonds to REITs", "Bonds to Gold"],
      datasets: [{
        label: "Correlation Coefficient",
        data: [0.85, -0.32, 0.68, 0.12, 0.23, 0.45],
        backgroundColor: "rgba(139, 92, 246, 0.7)", // Purple
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 1
      }]
    }
  },
  dollarCostAveraging: {
    type: "line" as const,
    title: "Lump Sum vs. Dollar-Cost Averaging ($10,000)",
    description: "Comparison of investment strategies in different market conditions",
    insights: ["DCA reduces impact of market timing", "Lump sum historically outperforms in rising markets", "DCA provides psychological benefits in volatile markets"],
    data: {
      labels: ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"],
      datasets: [
        {
          label: "Lump Sum",
          data: [10000, 10200, 10100, 10400, 10700, 10500, 10800, 11000, 10800, 11200, 11500, 11800],
          borderColor: "rgba(59, 130, 246, 1)", // Blue
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: false
        },
        {
          label: "Dollar-Cost Averaging",
          data: [833, 1675, 2534, 3425, 4350, 5240, 6158, 7107, 8025, 9016, 10058, 11102],
          borderColor: "rgba(16, 185, 129, 1)", // Green
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          fill: false
        }
      ]
    }
  },
  retirementProjection: {
    type: "line" as const,
    title: "Retirement Savings Projection",
    data: {
      labels: ["Now", "5 Years", "10 Years", "15 Years", "20 Years"],
      datasets: [{
        label: "Current Savings Rate",
        data: [150000, 350000, 650000, 1100000, 1700000],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true
      },
      {
        label: "Increased Savings Rate",
        data: [150000, 400000, 800000, 1400000, 2300000],
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        fill: true
      }]
    }
  },
  marketSectors: {
    type: "bar" as const,
    title: "Sector Performance (YTD)",
    data: {
      labels: ["Technology", "Healthcare", "Consumer", "Energy", "Financials", "Utilities"],
      datasets: [{
        label: "YTD Return %",
        data: [24.5, 12.8, 9.3, -5.2, 8.7, 4.2],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(239, 68, 68, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(107, 114, 128, 0.7)"
        ],
        borderWidth: 1
      }]
    }
  },
  taxStrategies: {
    type: "bar" as const,
    title: "Tax Savings by Strategy",
    data: {
      labels: ["401(k) Contribution", "IRA Contribution", "HSA", "Tax Loss Harvesting", "Mortgage Interest", "Charitable Giving"],
      datasets: [{
        label: "Potential Tax Savings ($)",
        data: [5500, 1650, 875, 1200, 3000, 2200],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1
      }]
    }
  }
};

// Prebuilt conversations for simulations with user follow-ups and charts
const simulationScenarios = {
  investment: [
    { role: "user", content: "I have $10,000 to invest as a beginner. What's the best approach?", agentType: "user" },
    { role: "assistant", content: "Thanks for reaching out about investing your $10,000. As a beginner, it's smart to start with a strategic approach rather than just picking random stocks. Let me bring in our market analyst to share some current market insights.", agentType: "advisor" },
    { role: "assistant", content: "Thanks for including me. Before making any investment decisions, it's helpful to understand the current market environment. We're seeing increased volatility lately, with technology sectors experiencing some pullback while value stocks are performing well. Here's how different market sectors have been performing this year:", agentType: "analyst", chartData: sampleCharts.sectorPerformance },
    { role: "assistant", content: "For a beginner with $10,000, I'd recommend starting with a diversified approach using ETFs (Exchange-Traded Funds) rather than individual stocks. ETFs give you instant diversification across many companies with a single purchase. Here are some top-performing ETFs that cover different parts of the market:", agentType: "analyst", chartData: sampleCharts.etfComparison },
    { role: "user", content: "That makes sense. What kind of portfolio allocation would you recommend for my $10,000?", agentType: "user" },
    { role: "assistant", content: "Great question about portfolio allocation. I'll bring in our portfolio manager to provide some specific recommendations based on your situation as a beginner investor.", agentType: "advisor" },
    { role: "assistant", content: "For a beginning investor with $10,000, I recommend starting with a balanced portfolio that gives you exposure to different asset classes while managing risk. Here's what a diversified allocation might look like:", agentType: "portfolio", chartData: sampleCharts.portfolioAllocation },
    { role: "assistant", content: "This balanced allocation provides good diversification across US stocks, international stocks, and bonds. If you're younger (under 40) and comfortable with more risk for potentially higher long-term returns, you might consider this more aggressive allocation:", agentType: "portfolio", chartData: sampleCharts.aggressiveAllocation },
    { role: "assistant", content: "Or if you're more concerned about preserving your capital and minimizing volatility, a more conservative approach might be appropriate:", agentType: "portfolio", chartData: sampleCharts.conservativeAllocation },
    { role: "assistant", content: "Looking at the projected growth of your $10,000 investment over 10 years, you can see how different risk levels might affect your returns. This assumes you don't add any additional money over time:", agentType: "portfolio", chartData: sampleCharts.investmentReturns },
    { role: "user", content: "I'm in my 30s and comfortable with some risk. Should I invest all $10,000 at once or spread it out?", agentType: "user" },
    { role: "assistant", content: "That's a great question about timing your investment. Let me ask our market analyst to weigh in on lump sum investing versus dollar-cost averaging.", agentType: "advisor" },
    { role: "assistant", content: "When it comes to investing $10,000, you have two main approaches: investing it all at once (lump sum) or spreading it out over time (dollar-cost averaging or DCA). Research shows that lump sum investing outperforms DCA about two-thirds of the time since markets tend to rise over time. However, DCA can reduce the impact of market timing and provide psychological benefits, especially in volatile markets. Here's a comparison of how these approaches might perform:", agentType: "analyst", chartData: sampleCharts.dollarCostAveraging },
    { role: "assistant", content: "Since you're in your 30s and comfortable with some risk, a reasonable approach would be to invest 50-70% of your $10,000 now in your chosen allocation, and then invest the remainder in equal monthly installments over 3-6 months. This gives you both the statistical advantage of getting money working in the market quickly while still preserving some dry powder if the market dips.", agentType: "advisor" },
    { role: "user", content: "What about diversification between different types of investments? How related are they?", agentType: "user" },
    { role: "assistant", content: "Excellent question about diversification between asset classes. I'll bring in our portfolio manager to explain how different investments relate to each other.", agentType: "advisor" },
    { role: "assistant", content: "Diversification works best when you combine assets that don't move in perfect sync with each other (low correlation). This chart shows the correlation between different asset classes. A correlation of 1.0 would mean perfect alignment, while lower or negative numbers indicate assets that move more independently or in opposite directions:", agentType: "portfolio", chartData: sampleCharts.assetCorrelation },
    { role: "assistant", content: "As you can see, bonds often have a negative correlation with stocks, which is why they're valuable in a portfolio - they can provide stability when stocks decline. Adding exposure to other asset classes like REITs (real estate) and gold can further enhance diversification since they have lower correlations with traditional stocks and bonds.", agentType: "portfolio" },
    { role: "user", content: "What about tax implications of investing my $10,000?", agentType: "user" },
    { role: "assistant", content: "That's a very important consideration. Let me bring in our tax specialist to address the tax implications of your investment strategy.", agentType: "advisor" },
    { role: "assistant", content: "When it comes to investing your $10,000, tax considerations can significantly impact your net returns. Here are the key tax points to consider:\n\n1. Investment account type: Tax-advantaged accounts like Roth IRAs (tax-free growth) or Traditional IRAs (tax-deferred growth) offer significant benefits over taxable brokerage accounts if you qualify and don't need the money until retirement.\n\n2. Capital gains taxes: In taxable accounts, assets held over 1 year qualify for lower long-term capital gains rates (0%, 15%, or 20% depending on your income) versus short-term gains taxed as ordinary income.\n\n3. Tax-loss harvesting: In taxable accounts, you can sell investments at a loss to offset capital gains and reduce your tax bill.", agentType: "tax" },
    { role: "assistant", content: "Here's a visualization of how much you might save through different tax strategies on your investments:", agentType: "tax", chartData: sampleCharts.taxStrategies },
    { role: "assistant", content: "For your $10,000 investment as a beginner in your 30s, I'd recommend first confirming if you're eligible to contribute to a Roth IRA, which would give you tax-free growth and withdrawals in retirement. If you've already maxed out retirement accounts or need access to the money before retirement age, then a taxable brokerage account makes sense, where you should focus on tax-efficient ETFs and funds that distribute minimal capital gains.", agentType: "tax" },
    { role: "assistant", content: "Based on all this information, would you like me to recommend a specific step-by-step plan for investing your $10,000 that takes into account your age, risk tolerance, and tax situation?", agentType: "advisor" }
  ],
  retirement: [
    { role: "user", content: "I'm 35 and want to retire by 55. Is that possible?", agentType: "user" },
    { role: "assistant", content: "Retiring by 55 when you're currently 35 is an ambitious but potentially achievable goal. Let me bring in our retirement specialist to discuss this further.", agentType: "advisor" },
    { role: "assistant", content: "Thanks for including me. Retiring 20 years from now at age 55 is certainly possible with proper planning. The key factors we need to consider are your current savings, income, expenses, and expected lifestyle in retirement. Generally, you'll need about 25 times your annual expenses saved to retire comfortably.", agentType: "retirement" },
    { role: "assistant", content: "From an investment perspective, you'll need a growth-oriented portfolio now that can transition to more income-focused investments as you approach retirement. I'd suggest a portfolio with 80% equities and 20% bonds at your current age, gradually shifting to 60% equities and 40% bonds as you near 55.", agentType: "portfolio" },
    { role: "assistant", content: "Here's a projection of how your retirement savings might grow with a disciplined savings and investment approach:", agentType: "retirement", chartData: sampleCharts.retirementProjection },
    { role: "assistant", content: "I notice that early retirement means you'll need to bridge the gap before traditional retirement benefits like Social Security become available. Would you like to discuss strategies for generating income during that period?", agentType: "advisor" },
    { role: "user", content: "What about healthcare costs in early retirement?", agentType: "user" },
    { role: "assistant", content: "Healthcare costs are indeed a critical consideration for early retirement planning. Let me address that.", agentType: "retirement" },
    { role: "assistant", content: "Healthcare can be one of the largest expenses in early retirement, especially before Medicare eligibility at 65. For retiring at 55, you'll need to budget for 10 years of private health insurance. Current estimates suggest you should budget $12,000-$15,000 per year per person for comprehensive coverage.\n\nOptions to consider include:\n\n1. COBRA from your employer (typically limited to 18 months)\n2. ACA marketplace plans\n3. Health Sharing Ministries (if applicable)\n4. Part-time work with health benefits\n\nAdditionally, I recommend building a separate health savings fund of at least $50,000 per person to cover out-of-pocket expenses and emergencies.", agentType: "retirement" },
    { role: "assistant", content: "From a tax perspective, funding a Health Savings Account (HSA) during your working years can provide triple tax advantages: tax-deductible contributions, tax-free growth, and tax-free withdrawals for qualified medical expenses in retirement.", agentType: "tax" },
    { role: "assistant", content: "Would you like to discuss other aspects of early retirement planning, such as sequence of returns risk or withdrawal strategies?", agentType: "advisor" }
  ],
  tax: [
    { role: "user", content: "How can I reduce my tax burden this year?", agentType: "user" },
    { role: "assistant", content: "Tax optimization is an important aspect of financial planning. Let me bring in our tax specialist to provide some strategies for reducing your tax burden.", agentType: "advisor" },
    { role: "assistant", content: "Thank you. There are several strategies you can employ to potentially reduce your tax burden this year. First, maximize contributions to tax-advantaged accounts like 401(k)s, IRAs, and HSAs if you're eligible. These contributions can reduce your taxable income.", agentType: "tax" },
    { role: "assistant", content: "From an investment standpoint, consider tax-loss harvesting in your portfolio. By selling investments that have declined in value, you can offset capital gains from other investments, potentially reducing your overall tax liability.", agentType: "portfolio" },
    { role: "assistant", content: "Here's a visualization of potential tax savings from various strategies:", agentType: "tax", chartData: sampleCharts.taxStrategies },
    { role: "assistant", content: "Other strategies to consider include bundling deductible expenses to surpass the standard deduction threshold, making charitable contributions, and reviewing your withholding to ensure you're not overpaying throughout the year.\n\nWould you like me to explore any of these strategies in more detail?", agentType: "tax" },
    { role: "user", content: "I'm self-employed. What are the best deductions I should be taking?", agentType: "user" },
    { role: "assistant", content: "Being self-employed opens up numerous tax deduction opportunities. Let me have our tax specialist provide more detailed information about self-employment deductions.", agentType: "advisor" },
    { role: "assistant", content: "As a self-employed individual, you can deduct ordinary and necessary business expenses including: home office deduction (if you have a dedicated space), health insurance premiums, business travel, vehicle expenses, professional services (legal, accounting), business insurance, retirement plan contributions, and business equipment (with depreciation or Section 179 expensing). Here's a visualization of the potential tax savings from various strategies:", agentType: "tax", chartData: sampleCharts.taxStrategies },
    { role: "assistant", content: "One often overlooked deduction is self-employment tax. You can deduct 50% of your self-employment tax on your personal return. Also, consider setting up a Qualified Business Income (QBI) deduction, which allows eligible self-employed individuals to deduct up to 20% of their qualified business income.", agentType: "tax" },
    { role: "user", content: "What about retirement accounts for self-employed people?", agentType: "user" },
    { role: "assistant", content: "That's an excellent question about retirement accounts. As a self-employed individual, you have several powerful retirement savings options beyond what typical employees have access to.", agentType: "advisor" },
    { role: "assistant", content: "You can establish a Solo 401(k), which allows you to contribute both as an employee (up to $22,500 in 2023, plus $7,500 catch-up if over 50) AND as the employer up to 25% of your compensation, with total contributions capped at $66,000 ($73,500 if over 50). Alternatively, a SEP IRA allows contributions of up to 25% of your net self-employment income, up to $66,000 for 2023.", agentType: "tax" },
    { role: "assistant", content: "From a portfolio management perspective, these retirement accounts should be part of your overall asset allocation strategy. They provide exceptional tax advantages while allowing you to invest in a wide variety of securities.", agentType: "portfolio" }
  ]
};

// Create agent response function
const createAgentResponse = (agentType: Exclude<AgentType, "user">, userInput: string) => {
  // Get base response text
  const responseText = getAgentResponse(agentType);
  
  // Sometimes add a chart
  const shouldAddChart = agentType !== "advisor" && Math.random() > 0.5;
  let chart;
  
  if (shouldAddChart) {
    if (agentType === "portfolio") {
      chart = Math.random() > 0.5 ? sampleCharts.portfolioAllocation : sampleCharts.aggressiveAllocation;
    } else if (agentType === "retirement") {
      chart = sampleCharts.retirementProjection;
    } else if (agentType === "analyst") {
      chart = sampleCharts.marketSectors;
    } else if (agentType === "tax") {
      chart = sampleCharts.taxStrategies;
    }
  }
  
  // Determine if response should be collaborative
  const isCollaborative = Math.random() > 0.7;
  let relatedAgents: AgentType[] | undefined;
  
  if (isCollaborative) {
    // Select 1-2 related agents
    const availableAgents = Object.keys(agents).filter(a => a !== agentType) as Exclude<AgentType, "user">[];
    const numRelatedAgents = Math.floor(Math.random() * 2) + 1;
    relatedAgents = [];
    
    for (let i = 0; i < numRelatedAgents; i++) {
      if (availableAgents.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAgents.length);
        relatedAgents.push(availableAgents[randomIndex]);
        availableAgents.splice(randomIndex, 1);
      }
    }
  }
  
  // Generate follow-up suggestions
  const suggestions = Math.random() > 0.3 ? [
    `Tell me more about ${agentType === "portfolio" ? "asset allocation" : 
                        agentType === "retirement" ? "retirement planning" :
                        agentType === "tax" ? "tax strategies" :
                        agentType === "analyst" ? "market trends" : "financial planning"}`,
    `How does this affect my ${Math.random() > 0.5 ? "long-term goals" : "current financial situation"}?`
  ] : undefined;
  
  // Create agent response
  const agentResponse: Message = {
    id: `${agentType}-${Date.now()}`,
    sender: agentType,
    text: responseText,
    timestamp: Date.now(),
    chart: chart,
    confidence: 0.7 + Math.random() * 0.3,
    isCollaborative,
    relatedAgents,
    suggestions,
    suggestionType: "question",
    emotionalTone: Math.random() > 0.8 ? "positive" : "neutral"
  };
  
  setIsTyping(false);
  setMessages(prev => [...prev, agentResponse]);
};

// Handle sending a message
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isTyping) return;
  
  // Create user message
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    sender: "user",
    text: input.trim(),
    timestamp: Date.now(),
    keywords: input.trim().split(/\s+/).filter(word => word.length > 4)
  };
  
  // Add user message to chat
  setMessages(prev => [...prev, userMessage]);
  setInput("");
  
  // Determine which agent should respond
  const agentType = determineAgent(input);
  setCurrentAgent(agentType);
  
  // Simulate agent typing
  setIsTyping(true);
  
  // Add random delay for more natural feeling
  setTimeout(() => {
    // Sometimes show fetching data animation
    const shouldFetchData = Math.random() > 0.6;
    if (shouldFetchData) {
      setCurrentAction("fetching");
      setIsFetching(true);
      setTimeout(() => {
        setIsFetching(false);
        // Sometimes show analyzing data animation
        const shouldAnalyze = Math.random() > 0.4;
        if (shouldAnalyze) {
          setCurrentAction("analyzing");
          setIsAnalyzing(true);
          setTimeout(() => {
            setIsAnalyzing(false);
            createAgentResponse(agentType, input);
          }, 1000 + Math.random() * 1000);
        } else {
          createAgentResponse(agentType, input);
        }
      }, 1000 + Math.random() * 1000);
    } else {
      setCurrentAction("thinking");
      createAgentResponse(agentType, input);
    }
  }, 500 + Math.random() * 1000);
};

// Function to start a simulation directly from a button click
const startSimulation = (simulationType: keyof typeof simulationScenarios) => {
  // Clear any existing conversation
  setMessages([]);
  setInput("");
  
  // Create a simulated user message based on the selected simulation type
  const simulation = simulationScenarios[simulationType as keyof typeof simulationScenarios];
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    sender: "user",
    text: simulation[0].content,
    timestamp: Date.now(),
    keywords: simulation[0].content.split(/\s+/).filter(word => word.length > 4)
  };
  
  // Add user message to chat
  setMessages([userMessage]);
  
  // Play through simulation with delays
  playSimulation(simulation);
};

// Function to play through a simulation with realistic typing delays
const playSimulation = (simulation: Array<{role: string, content: string, agentType: string, chartData?: any}>) => {
  // Skip the first message (user message) as we already displayed it
  const agentMessages = simulation.slice(1);
  
  let totalDelay = 0;
  const messageDelays: number[] = [];
  
  // Calculate delays for each message
  agentMessages.forEach((message, index) => {
    // For user messages, we want to show typing indicator for a shorter time
    const isUserMessage = message.role === "user";
    
    // Much shorter delay before user messages (was 5000)
    const readingDelay = isUserMessage ? 3000 : 0;
    
    // Reduced base delay between messages (was 1500)
    totalDelay += (index > 0 ? 1000 : 0) + readingDelay;
    
    // Add this message's delay to the array
    messageDelays.push(totalDelay);
    
    // Calculate typing time based on message length (shorter for user messages and reduced multiplier)
    const typingMultiplier = isUserMessage ? 0.5 : 1.5;
    const thinkingTime = Math.min(500 + message.content.length * typingMultiplier, isUserMessage ? 750 : 1500);
    
    // Add typing time to total delay for next message
    totalDelay += thinkingTime;
  });
  
  // Display each message with its calculated delay
  agentMessages.forEach((message, index) => {
    setTimeout(() => {
      // If it's a user message, don't show typing indicators from agents
      if (message.role === "user") {
        // Immediate user message with no delay (was 500ms)
        const userResponse: Message = {
          id: `user-${Date.now()}-${index}`,
          sender: "user",
          text: message.content,
          timestamp: Date.now(),
          keywords: message.content.split(/\s+/).filter(word => word.length > 4)
        };
        
        setMessages(prev => [...prev, userResponse]);
      } else {
        // For agent messages, simulate typing and then add the response
        const agentType = message.agentType as Exclude<AgentType, "user"> || "advisor";
        setCurrentAgent(agentType);
        setIsTyping(true);
        
        // Reduced delay for typing simulation (was 1500ms)
        setTimeout(() => {
          const agentResponse: Message = {
            id: `${agentType}-${Date.now()}-${index}`,
            sender: agentType,
            text: message.content,
            timestamp: Date.now(),
            chart: message.chartData,
            confidence: 0.7 + Math.random() * 0.3,
            suggestions: Math.random() > 0.5 ? [
              "Tell me more about this",
              "How does this affect my finances?"
            ] : undefined,
            emotionalTone: "neutral"
          };
          
          setIsTyping(false);
          setMessages(prev => [...prev, agentResponse]);
        }, 750);
      }
    }, messageDelays[index]);
  });
};

// Format timestamp for display
const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background text-foreground rounded-md border border-border mx-auto my-2 max-w-[1200px]">
<div className="flex w-full h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
         
            <div className="flex items-center gap-2">
              <Button onClick={() => startSimulation('investment')} variant="outline" size="sm" className="gap-1">
                
                ArwiGos adviser
              </Button>
             
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(agents).map(([key, agent]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: agent.color }}></div>
                  <span>{agent.name}</span>
                </div>
              ))}
            </div>
          </header>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 px-4 pb-20">
              {messages.map((message, index) => {
                const isUser = message.sender === "user";
                const agent = isUser ? null : agents[message.sender as keyof typeof agents];
                const emotionColor = message.emotionalTone === "positive" ? "border-green-400" : 
                                    message.emotionalTone === "negative" ? "border-red-400" : 
                                    message.emotionalTone === "urgent" ? "border-amber-400" : 
                                    message.emotionalTone === "cautious" ? "border-blue-400" : "";
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <Avatar className={`h-8 w-8 border-2 ${emotionColor}`} style={{borderColor: emotionColor || agent?.color}}>
                        <AvatarFallback style={{ background: agent?.color }}>
                          {agent?.icon}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <Collapsible 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isUser 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-foreground"
                      }`}
                      open={message.expanded}
                      onOpenChange={(open) => {
                        const updatedMessages = [...messages];
                        updatedMessages[index] = { ...message, expanded: open };
                        setMessages(updatedMessages);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {isUser ? "You" : agent?.name}
                            {message.confidence && !isUser && (
                              <span className="ml-2 text-xs opacity-50">
                                {Math.round(message.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                        
                        {!isUser && message.isCollaborative && (
                          <Badge variant="outline" className="text-xs">
                            Team Response
                          </Badge>
                        )}
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert">
                        {message.text.split('\n').map((line, i) => (
                          <p key={i} className="mb-1">{line}</p>
                        ))}
                        
                        {/* Render chart if message has chart data */}
                        {message.chart && (
                          <CollapsibleChart 
                            title={message.chart.title}
                            type={message.chart.type}
                            data={message.chart.data}
                            height={300}
                          />
                        )}
                      </div>
                      
                      {/* Expandable content with additional details */}
                      {!isUser && (message.reasoning || (message.sources && message.sources.length > 0) || (message.relatedAgents && message.relatedAgents.length > 0)) && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-2 w-full flex items-center justify-center text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {message.expanded ? "Hide details" : "View details"}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                      
                      <CollapsibleContent className="mt-2 pt-2 border-t border-border text-xs">
                        {message.reasoning && (
                          <div className="mb-2">
                            <h4 className="font-medium mb-1">Reasoning</h4>
                            <p className="text-muted-foreground">{message.reasoning}</p>
                          </div>
                        )}
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="mb-2">
                            <h4 className="font-medium mb-1">Sources</h4>
                            <ul className="list-disc pl-4 text-muted-foreground">
                              {message.sources.map((source, i) => (
                                <li key={i}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.relatedAgents && message.relatedAgents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.relatedAgents.map((agentType) => {
                              const relatedAgent = agents[agentType as Exclude<AgentType, "user">];
                              return (
                                <Badge key={agentType} variant="outline" style={{ borderColor: relatedAgent?.color }}>
                                  <span className="h-2 w-2 rounded-full mr-1" style={{ background: relatedAgent?.color }}></span>
                                  {relatedAgent?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </CollapsibleContent>
                      
                      {/* Suggested follow-up questions */}
                      {!isUser && message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, i) => (
                            <Button 
                              key={i} 
                              variant="outline" 
                              size="sm" 
                              className="text-xs"
                              onClick={() => {
                                setInput(suggestion);
                                if (textareaRef.current) {
                                  textareaRef.current.focus();
                                }
                              }}
                            >
                              {message.suggestionType === "question" && <HelpCircle className="h-3 w-3 mr-1" />}
                              {message.suggestionType === "action" && <Play className="h-3 w-3 mr-1" />}
                              {message.suggestionType === "insight" && <Lightbulb className="h-3 w-3 mr-1" />}
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </Collapsible>
                    
                    {isUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-800">
                          <UserIcon className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Animated indicators for different agent actions */}
              {(isTyping || isFetching || isAnalyzing) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 border-2" style={{borderColor: currentAgent !== "user" ? agents[currentAgent as Exclude<AgentType, "user">]?.color : "#64748b"}}>
                    <AvatarFallback style={{ background: currentAgent !== "user" ? agents[currentAgent as Exclude<AgentType, "user">]?.color : "#64748b" }}>
                      {currentAgent !== "user" ? (
                        isFetching ? agents[currentAgent as Exclude<AgentType, "user">]?.actions.fetching : 
                        isAnalyzing ? agents[currentAgent as Exclude<AgentType, "user">]?.actions.analyzing : 
                        agents[currentAgent as Exclude<AgentType, "user">]?.actions.thinking
                      ) : (
                        <UserIcon className="h-4 w-4 text-white" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    {isFetching && (
                      <span className="text-xs text-muted-foreground">Fetching market data...</span>
                    )}
                    {isAnalyzing && (
                      <span className="text-xs text-muted-foreground">Analyzing financial information...</span>
                    )}
                    {isTyping && !isFetching && !isAnalyzing && (
                      <>
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse animation-delay-300">●</span>
                        <span className="animate-pulse animation-delay-600">●</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              
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
                className="flex-1 resize-none min-h-[40px] max-h-[200px] text-sm"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="h-9 w-9">
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
