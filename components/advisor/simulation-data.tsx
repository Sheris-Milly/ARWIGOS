"use client";
import { 
  LampDesk, 
  RotateCw, 
  BarChart2, 
  BarChart, 
  LineChart, 
  PieChart, 
  Receipt, 
  Calculator, 
  Bot, 
  CalendarClock 
} from "lucide-react";

// Message interface
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  agentType?: string;
  timestamp: string;
  chartData?: any;
}

// Agent visuals configuration
export const agentVisuals: Record<string, {
  name: string;
  icon: React.ReactNode;
  color: string;
  actions: {
    thinking: React.ReactNode;
    fetching: React.ReactNode;
    analyzing: React.ReactNode;
  };
}> = {
  advisor: {
    name: "Financial Advisor",
    icon: <LampDesk className="h-4 w-4 text-white" />,
    color: "#4f46e5", // Indigo
    actions: {
      thinking: <LampDesk className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <BarChart2 className="h-4 w-4 text-white animate-pulse" />
    }
  },
  analyst: {
    name: "Market Analyst",
    icon: <BarChart className="h-4 w-4 text-white" />,
    color: "#0ea5e9", // Sky blue
    actions: {
      thinking: <BarChart className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <LineChart className="h-4 w-4 text-white animate-pulse" />
    }
  },
  portfolio: {
    name: "Portfolio Manager",
    icon: <PieChart className="h-4 w-4 text-white" />,
    color: "#16a34a", // Green
    actions: {
      thinking: <PieChart className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <PieChart className="h-4 w-4 text-white animate-pulse" />
    }
  },
  tax: {
    name: "Tax Specialist",
    icon: <Receipt className="h-4 w-4 text-white" />,
    color: "#9333ea", // Purple
    actions: {
      thinking: <Receipt className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <Calculator className="h-4 w-4 text-white animate-pulse" />
    }
  },
  final_advisor: {
    name: "Final Advisor",
    icon: <Bot className="h-4 w-4 text-white" />,
    color: "#dc2626", // Red
    actions: {
      thinking: <Bot className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <Calculator className="h-4 w-4 text-white animate-pulse" />
    }
  },
  retirement: {
    name: "Retirement Planner",
    icon: <CalendarClock className="h-4 w-4 text-white" />,
    color: "#e11d48", // Rose
    actions: {
      thinking: <CalendarClock className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <CalendarClock className="h-4 w-4 text-white animate-pulse" />
    }
  },
  final_advisor: {
    name: "Final Advisor",
    icon: <Bot className="h-4 w-4 text-white" />,
    color: "#f59e0b", // Amber
    actions: {
      thinking: <Bot className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <Bot className="h-4 w-4 text-white animate-pulse" />
    }
  },
  assistant: {
    name: "AI Assistant",
    icon: <Bot className="h-4 w-4 text-white" />,
    color: "#64748b", // Slate
    actions: {
      thinking: <Bot className="h-4 w-4 text-white" />,
      fetching: <RotateCw className="h-4 w-4 text-white animate-spin" />,
      analyzing: <Bot className="h-4 w-4 text-white animate-pulse" />
    }
  }
};

// Investment portfolio simulation
export const investmentSimulation: Message[] = [
  {
    id: "invest-intro-1",
    content: "I'm ARWIGOS, your AI-powered financial assistant. I'll help analyze your investment options using our multi-agent system.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-intro-2",
    content: "I'm connecting to financial databases to retrieve the latest market data and will analyze this with our specialized agents.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-intro-3",
    content: "Let me connect you with our Portfolio Manager to create an optimized investment strategy.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-portfolio-1",
    content: "Hello, I'm your Portfolio Manager agent. Based on current market conditions and historical performance data, I've developed several portfolio allocation strategies for moderate risk tolerance.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-portfolio-2",
    content: "Here's my recommended allocation for a growth-oriented portfolio with moderate risk:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Portfolio Allocation",
      type: "pie",
      dataPoints: [
        { label: "US Large Cap", value: 45 },
        { label: "US Small/Mid Cap", value: 15 },
        { label: "International Developed", value: 20 },
        { label: "Emerging Markets", value: 10 },
        { label: "US Bonds", value: 10 }
      ]
    }
  },
  {
    id: "invest-portfolio-3",
    content: "I'm now running a 10-year projection model using current market forecasts and economic indicators. Here's the expected growth trajectory for a $50,000 investment:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "10-Year Growth Projection ($)",
      type: "line",
      color: "#3b82f6",
      dataPoints: [
        { label: "Year 1", value: 54350 },
        { label: "Year 3", value: 64111 },
        { label: "Year 5", value: 75633 },
        { label: "Year 7", value: 89208 },
        { label: "Year 10", value: 114408 }
      ]
    }
  },
  {
    id: "invest-portfolio-4",
    content: "Let me connect you with our Tax Strategy specialist to analyze the tax implications of this portfolio.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-tax-1",
    content: "Hello, I'm your Tax Advisor agent. Looking at the proposed portfolio, I've identified several tax optimization opportunities:\n\n1. ETFs vs. Mutual Funds: The ETFs recommended are already tax-efficient due to their lower turnover\n\n2. Account Placement Strategy:\n   - Place bond ETFs in tax-advantaged accounts (IRA/401k)\n   - Keep international investments in taxable accounts for foreign tax credits\n   - Maintain growth-oriented US equities in both account types\n\n3. Tax-Loss Harvesting: Implement automated monitoring for tax-loss harvesting opportunities",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-tax-2",
    content: "Here's a visualization of the potential tax savings over 10 years using our optimized strategy versus a non-optimized approach:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Cumulative Tax Savings ($)",
      type: "bar",
      color: "#f59e0b",
      dataPoints: [
        { label: "Year 1", value: 320 },
        { label: "Year 3", value: 1250 },
        { label: "Year 5", value: 2470 },
        { label: "Year 7", value: 4105 },
        { label: "Year 10", value: 7830 }
      ]
    }
  },
  {
    id: "invest-market-1",
    content: "For current market analysis, I'll bring in our Market Analyst agent who constantly monitors global economic indicators and technical signals.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-market-2",
    content: "I'm your Market Analyst agent. I've just completed a comprehensive analysis of current market conditions by analyzing data from multiple sources including Federal Reserve projections, earnings reports, and global market indicators.\n\nHere's my current market assessment:\n\n1. Valuation Metrics: US market P/E ratios are slightly above historical averages\n\n2. Economic Indicators: Leading indicators suggest continued economic expansion\n\n3. Sector Analysis: Technology, healthcare, and clean energy sectors show strong fundamentals\n\n4. Risk Factors: Potential headwinds include inflation concerns and geopolitical tensions\n\nI recommend implementing your investment plan using dollar-cost averaging over 3-6 months to reduce entry point risk.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: "invest-market-3",
    content: "Here's a visualization of sector performance over the past 12 months:",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Sector Performance (12-Month %)",
      type: "bar",
      color: "#10b981",
      dataPoints: [
        { label: "Technology", value: 16.7 },
        { label: "Healthcare", value: 12.3 },
        { label: "Consumer", value: 9.8 },
        { label: "Financials", value: 8.4 },
        { label: "Energy", value: 4.2 },
        { label: "Utilities", value: 2.8 },
        { label: "Materials", value: 1.9 }
      ]
    }
  },
  {
    id: "invest-conclusion-1",
    content: "Based on all the analyses from our specialized agents, here's your comprehensive investment plan:\n\n1. Portfolio Allocation: Implement the recommended diversified portfolio\n\n2. Implementation Timeline: Use dollar-cost averaging over 3-6 months\n\n3. Tax Optimization: Follow the tax-efficient asset location strategy\n\n4. Regular Monitoring: Our system will continuously monitor your portfolio\n\nWith this comprehensive approach, you're positioned for long-term growth while managing risk in a tax-efficient manner.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// Retirement planning simulation
export const retirementSimulation: Message[] = [
  {
    id: "retire-intro-1",
    content: "I'm ARWIGOS, your AI-powered financial assistant. I'll help analyze your retirement planning options using our multi-agent system.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-intro-2",
    content: "I'm connecting our retirement specialist to help develop a comprehensive retirement plan.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-specialist-1",
    content: "Hello, I'm your Retirement Specialist. I'll be analyzing your current savings, income needs, and timeline to create a personalized retirement strategy. Let me gather the relevant data.",
    role: "assistant",
    agentType: "retirement_specialist",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-specialist-2",
    content: "Based on the information available, here's a projection of your retirement savings growth over time with your current contribution rate:",
    role: "assistant",
    agentType: "retirement_specialist",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Retirement Savings Projection",
      type: "line",
      color: "#f97316",
      dataPoints: [
        { label: "Now", value: 120000 },
        { label: "5 Years", value: 210500 },
        { label: "10 Years", value: 342700 },
        { label: "15 Years", value: 531200 },
        { label: "20 Years", value: 798400 },
        { label: "25 Years", value: 1175000 }
      ]
    }
  },
  {
    id: "retire-specialist-3",
    content: "I've analyzed your retirement income needs based on standard calculations. Here's a breakdown of your projected monthly income sources in retirement:",
    role: "assistant",
    agentType: "retirement_specialist",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Monthly Retirement Income Sources",
      type: "pie", 
      dataPoints: [
        { label: "401(k)/IRA", value: 55 },
        { label: "Social Security", value: 30 },
        { label: "Other Investments", value: 10 },
        { label: "Part-time Work", value: 5 }
      ]
    }
  },
  {
    id: "retire-specialist-4",
    content: "Let me connect you with our Tax Advisor to discuss tax-efficient withdrawal strategies in retirement.",
    role: "assistant",
    agentType: "retirement_specialist",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-tax-1",
    content: "Hello, I'm your Tax Advisor. Planning tax-efficient withdrawals in retirement is crucial for maximizing your savings. Here are my recommendations for withdrawal sequence:\n\n1. First, withdraw from taxable accounts (taking advantage of long-term capital gains rates)\n\n2. Next, withdraw from tax-deferred accounts like Traditional IRAs and 401(k)s\n\n3. Finally, withdraw from tax-free accounts like Roth IRAs\n\nThis sequence allows your tax-free accounts to grow for longer periods while minimizing your overall tax burden.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-tax-2",
    content: "Here's a comparison of the tax impact between an optimized withdrawal strategy versus a non-optimized approach:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Tax Savings with Optimized Withdrawals",
      type: "bar",
      color: "#f59e0b",
      dataPoints: [
        { label: "5 Years", value: 12500 },
        { label: "10 Years", value: 28700 },
        { label: "15 Years", value: 47300 },
        { label: "20 Years", value: 76900 }
      ]
    }
  },
  {
    id: "retire-portfolio-1",
    content: "Let me bring in our Portfolio Manager to discuss the optimal asset allocation for your retirement phase.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "retire-portfolio-2",
    content: "Hello, I'm your Portfolio Manager. As you approach and enter retirement, your asset allocation needs to evolve to balance growth and income needs. Here's my recommended allocation for retirement:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Retirement Portfolio Allocation",
      type: "pie",
      dataPoints: [
        { label: "Dividend Stocks", value: 30 },
        { label: "Bonds", value: 40 },
        { label: "REITs", value: 10 },
        { label: "Growth Stocks", value: 15 },
        { label: "Cash", value: 5 }
      ]
    }
  },
  {
    id: "retire-portfolio-3",
    content: "Based on this allocation, here's a projection of your monthly income generation:",
    role: "assistant",
    agentType: "portfolio_manager", 
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Monthly Income Sources ($)",
      type: "bar",
      color: "#3b82f6",
      dataPoints: [
        { label: "Dividends", value: 1450 },
        { label: "Bond Interest", value: 1250 },
        { label: "REIT Distributions", value: 850 },
        { label: "Social Security", value: 2100 }
      ]
    }
  },
  {
    id: "retire-conclusion-1",
    content: "Based on the combined analysis from our retirement specialist, tax advisor, and portfolio manager, here's your comprehensive retirement strategy:\n\n1. Increase your current contributions by 5% to reach your retirement savings target\n\n2. Implement the recommended retirement portfolio allocation\n\n3. Follow the tax-efficient withdrawal strategy in retirement\n\n4. Consider delaying Social Security until age 70 to maximize benefits\n\n5. Establish a healthcare expense fund for Medicare supplemental costs\n\nThis comprehensive approach will help ensure financial security throughout your retirement years.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// Tax planning simulation
export const taxSimulation: Message[] = [
  {
    id: "tax-intro-1",
    content: "I'm ARWIGOS, your AI-powered financial assistant. I'll help analyze your tax planning options using our multi-agent system.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-intro-2",
    content: "I'm connecting our tax advisor to develop strategies for optimizing your tax situation.",
    role: "assistant",
    agentType: "assistant",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-advisor-1",
    content: "Hello, I'm your Tax Advisor. I'll analyze your current tax situation and identify opportunities for tax optimization. Let me review the available information.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-advisor-2",
    content: "Based on my analysis, here's a breakdown of your current tax liabilities by category:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Current Tax Breakdown",
      type: "pie",
      dataPoints: [
        { label: "Federal Income Tax", value: 62 },
        { label: "State Income Tax", value: 15 },
        { label: "FICA (Social Security/Medicare)", value: 15 },
        { label: "Property Tax", value: 8 }
      ]
    }
  },
  {
    id: "tax-advisor-3",
    content: "I've identified several tax optimization strategies that could potentially reduce your overall tax burden:\n\n1. Maximize retirement contributions (401(k), IRA, HSA)\n\n2. Tax-loss harvesting for investment accounts\n\n3. Charitable giving strategies (including donor-advised funds)\n\n4. Education savings accounts for children\n\n5. Business expense optimization\n\nLet me show you the potential impact of these strategies.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-advisor-4",
    content: "Here's a comparison of your projected tax liability with and without the optimization strategies:",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Tax Liability Comparison",
      type: "bar",
      color: "#f59e0b",
      dataPoints: [
        { label: "Current Strategy", value: 42500 },
        { label: "Optimized Strategy", value: 36800 }
      ]
    }
  },
  {
    id: "tax-portfolio-1",
    content: "Let me connect you with our Portfolio Manager to discuss tax-efficient investment strategies.",
    role: "assistant",
    agentType: "tax_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-portfolio-2",
    content: "Hello, I'm your Portfolio Manager. I've analyzed your investment portfolio and identified opportunities for improving tax efficiency. Here are my recommendations:\n\n1. Asset Location Strategy: Place tax-inefficient investments in tax-advantaged accounts\n\n2. Municipal Bonds: Consider tax-exempt municipal bonds for taxable accounts\n\n3. ETFs vs. Mutual Funds: Prioritize ETFs for better tax efficiency\n\n4. Direct Indexing: Consider direct indexing for larger portfolios to enable more tax-loss harvesting\n\nLet me show you the potential tax savings from these strategies.",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-portfolio-3",
    content: "Here's a projection of the cumulative tax savings over time with the recommended investment strategies:",
    role: "assistant",
    agentType: "portfolio_manager",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Cumulative Tax Savings ($)",
      type: "line",
      color: "#3b82f6",
      dataPoints: [
        { label: "Year 1", value: 2200 },
        { label: "Year 3", value: 7400 },
        { label: "Year 5", value: 13800 },
        { label: "Year 7", value: 21500 },
        { label: "Year 10", value: 34600 }
      ]
    }
  },
  {
    id: "tax-market-1",
    content: "Let me bring in our Market Analyst to discuss economic trends that may impact future tax planning.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-market-2",
    content: "Hello, I'm your Market Analyst. Looking at current economic and political trends, there are several factors that may impact future tax rates and planning:\n\n1. Federal budget deficits may lead to higher tax rates in the coming years\n\n2. Potential tax code changes with new administrations\n\n3. State tax trends showing increasing rates in certain high-tax states\n\n4. International tax treaties and their impact on global income\n\nGiven these trends, tax-advantaged saving and deferred income strategies may become increasingly valuable.",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
  },
  {
    id: "tax-market-3",
    content: "Here's a projection of potential federal tax rate changes based on historical trends and current policy discussions:",
    role: "assistant",
    agentType: "market_analyst",
    timestamp: new Date().toISOString(),
    chartData: {
      title: "Projected Top Federal Tax Rate (%)",
      type: "line",
      color: "#10b981",
      dataPoints: [
        { label: "Current", value: 37.0 },
        { label: "2026", value: 39.6 },
        { label: "2028", value: 40.8 },
        { label: "2030", value: 42.0 },
        { label: "2032", value: 42.0 }
      ]
    }
  },
  {
    id: "tax-conclusion-1",
    content: "Based on the combined analysis from our tax advisor, portfolio manager, and market analyst, here's your comprehensive tax strategy:\n\n1. Immediate Actions:\n   - Maximize retirement and HSA contributions\n   - Implement tax-loss harvesting\n   - Review charitable giving strategies\n\n2. Investment Changes:\n   - Adopt the recommended asset location strategy\n   - Shift toward more tax-efficient investments\n\n3. Future Planning:\n   - Consider Roth conversions in lower-income years\n   - Evaluate business entity structures for maximum tax efficiency\n   - Develop a multi-year tax projection model\n\nThis comprehensive approach should help minimize your current and future tax liabilities while adapting to changing tax environments.",
    role: "assistant",
    agentType: "financial_advisor",
    timestamp: new Date().toISOString(),
  }
];

// Map of simulations by topic
// User profile data including portfolio, goals, and financial planning information
export const userProfileData = {
  personal: {
    name: "John Smith",
    age: 35,
    income: 95000,
    monthlySavings: 2500,
    taxBracket: "24%",
    riskTolerance: "Moderate",
    retirementAge: 55
  },
  portfolio: {
    totalValue: 325000,
    accounts: [
      { 
        name: "401(k)", 
        balance: 180000, 
        allocation: [
          { category: "US Stocks", percentage: 60, value: 108000 },
          { category: "International Stocks", percentage: 20, value: 36000 },
          { category: "Bonds", percentage: 15, value: 27000 },
          { category: "Cash", percentage: 5, value: 9000 }
        ],
        contributions: { annual: 19500, employerMatch: 5500 }
      },
      { 
        name: "Roth IRA", 
        balance: 65000,
        allocation: [
          { category: "US Growth Stocks", percentage: 50, value: 32500 },
          { category: "US Value Stocks", percentage: 20, value: 13000 },
          { category: "International Stocks", percentage: 20, value: 13000 },
          { category: "REITs", percentage: 10, value: 6500 }
        ],
        contributions: { annual: 6000, employerMatch: 0 }
      },
      { 
        name: "Brokerage Account", 
        balance: 80000,
        allocation: [
          { category: "Individual Stocks", percentage: 40, value: 32000 },
          { category: "ETFs", percentage: 30, value: 24000 },
          { category: "Bonds", percentage: 20, value: 16000 },
          { category: "Cash", percentage: 10, value: 8000 }
        ],
        contributions: { annual: 15000, employerMatch: 0 }
      }
    ],
    performance: {
      ytd: 7.2,
      oneYear: 9.8,
      threeYear: 11.5,
      fiveYear: 10.3,
      tenYear: 9.6
    }
  },
  goals: [
    {
      id: 1,
      name: "Early Retirement",
      targetAge: 55,
      targetAmount: 2500000,
      currentProgress: 12,
      priority: "High",
      details: "Achieve financial independence to retire by age 55 with $2.5M in retirement accounts."
    },
    {
      id: 2,
      name: "College Fund",
      targetDate: "2035",
      targetAmount: 180000,
      currentProgress: 22,
      priority: "Medium",
      details: "Save for children's college education - $180K total for two children."
    },
    {
      id: 3,
      name: "Vacation Home",
      targetDate: "2030",
      targetAmount: 300000,
      currentProgress: 15,
      priority: "Medium",
      details: "Purchase a vacation home in the mountains valued at approximately $300K."
    },
    {
      id: 4,
      name: "Emergency Fund",
      targetAmount: 30000,
      currentProgress: 83,
      priority: "High",
      details: "Build and maintain a 6-month emergency fund covering all essential expenses."
    }
  ],
  planning: {
    retirement: {
      currentSavingsRate: 18,
      recommendedSavingsRate: 22,
      projectedRetirementIncome: 85000,
      socialSecurityEstimate: 28000,
      pensionEstimate: 0,
      retirementAccountsIncome: 57000,
      calculatedSuccessRate: 76
    },
    tax: {
      effectiveTaxRate: 18.5,
      marginalTaxRate: 24,
      taxableIncome: 82000,
      taxDeductions: 13000,
      taxCredits: 2000,
      taxLossCurrent: 2500,
      taxOptimizationPotential: "Medium"
    },
    insurance: {
      lifeInsurance: "$1M term policy",
      disabilityInsurance: "$5,000/month coverage",
      healthInsurance: "PPO Family Plan",
      homeownersInsurance: "$450K coverage",
      autoInsurance: "Full coverage with $500 deductible",
      umbrellaPolicy: "$1M coverage"
    },
    estate: {
      willStatus: "Updated 2 years ago",
      trustStatus: "Not established",
      powerOfAttorney: "Completed",
      advancedDirectives: "Completed",
      beneficiaryDesignations: "Up to date",
      estateTaxExposure: "Low"
    }
  }
};

// Map agent types to agent visual keys
export const getAgentVisualKey = (agentType: string): string => {
  const mapping: Record<string, string> = {
    financial_advisor: "advisor",
    market_analyst: "analyst",
    portfolio_manager: "portfolio",
    tax_advisor: "tax",
    tax_specialist: "tax",
    retirement_specialist: "retirement",
    final_advisor: "final_advisor",
    assistant: "assistant"
  };
  
  return mapping[agentType] || "assistant";
};

export const simulations: Record<string, Message[]> = {
  investment: investmentSimulation,
  retirement: retirementSimulation,
  tax: taxSimulation
};

// Sample chart data for various messages
export const sampleCharts = {
  portfolioAllocation: {
    type: "doughnut" as const,
    title: "Recommended Portfolio Allocation",
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
  },
  incomeSourcesRetirement: {
    type: "pie" as const,
    title: "Projected Retirement Income Sources",
    data: {
      labels: ["401(k) Withdrawals", "Social Security", "Roth IRA", "Taxable Investments", "Part-time Work"],
      datasets: [{
        label: "Income Percentage",
        data: [40, 25, 15, 15, 5],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(229, 231, 235, 0.7)"
        ],
        borderWidth: 1
      }]
    }
  }
};

// Prebuilt conversations for simulations with user follow-ups and charts
export const simulationScenarios = {
  orchestrated_advisor: [
    { role: "user", content: "I'm 35 with $100,000 saved and want to plan for early retirement by 50. What should I do?", agentType: "user" },
    { role: "assistant", content: "Thank you for sharing your early retirement goals. I'll coordinate with our specialized financial team to provide you with comprehensive advice. Let me first invite our financial advisor to assess your overall situation.", agentType: "final_advisor" },
    { role: "assistant", content: "Thanks for including me. Early retirement by 50 is ambitious but potentially achievable with proper planning. With 15 years to prepare, we need to focus on aggressive but smart investing, maximizing tax advantages, and possibly increasing your savings rate. What's your current income and monthly savings amount?", agentType: "advisor" },
    { role: "user", content: "I make $90,000 per year and save about $1,500 per month", agentType: "user" },
    { role: "assistant", content: "Thank you for sharing those details. Let me coordinate input from our team of financial specialists to create a comprehensive early retirement plan for you.", agentType: "final_advisor" },
    { role: "assistant", content: "From a retirement planning perspective, we need to determine if your current savings trajectory will support early retirement. With $100,000 already saved and contributing $18,000 annually ($1,500 × 12), you're on a good path, but may need to increase your savings rate to meet an early retirement goal by age 50.", agentType: "retirement" },
    { role: "assistant", content: "I'd like to take a deeper look at the market conditions and investment opportunities that could help accelerate your path to early retirement.", agentType: "analyst" },
    { role: "assistant", content: "Given current market conditions, here's how your investments might grow over time with different allocation strategies:", agentType: "analyst", chartData: sampleCharts.retirementProjection },
    { role: "assistant", content: "Let me develop a portfolio allocation strategy tailored for early retirement. For someone in your position with 15 years until your goal, I recommend an aggressive but strategic asset allocation:", agentType: "portfolio", chartData: sampleCharts.aggressiveAllocation },
    { role: "assistant", content: "From a tax planning standpoint, maximizing tax-advantaged accounts is crucial for early retirement. You should fully fund your 401(k) if available ($20,500/year), IRA ($6,000/year), and HSA if eligible ($3,650/year). However, since you'll need access to funds before 59½, we also need to develop a strategy for the 'gap years' between ages 50-59½.", agentType: "tax" },
    { role: "assistant", content: "Building on the input from our team, here's my comprehensive recommendation for your early retirement plan:", agentType: "final_advisor" },
    { role: "assistant", content: "1. Increase your monthly savings from $1,500 to at least $2,250 (30% of your income)\n2. Maximize tax-advantaged accounts but also build a substantial taxable account\n3. Build a substantial taxable investment account for the age 50-59½ period\n4. Adopt an aggressive but diversified investment approach that becomes more conservative as you approach 50\n5. Consider developing additional income streams (side business, real estate)\n\nIs there a specific aspect of this plan you'd like to explore further?", agentType: "final_advisor" },
    { role: "user", content: "How should I structure my investments in the five years right before retirement?", agentType: "user" },
    { role: "assistant", content: "Great question about the crucial pre-retirement phase. Let me coordinate insights from our team on this transition period.", agentType: "final_advisor" },
    { role: "assistant", content: "The 5 years before retirement are critical for preserving capital while maintaining some growth. Based on current market analysis, you'll want to be particularly cautious about sequence of returns risk—the danger that a market downturn early in retirement could permanently damage your portfolio's longevity. Historically, protecting against this risk has been vital for successful early retirees.", agentType: "analyst" },
    { role: "assistant", content: "During the 5-year pre-retirement window, I recommend shifting to this more conservative allocation: 50% equities (with an emphasis on dividend-paying stocks and low-volatility funds), 30% bonds, 10% cash equivalents, and 10% alternative investments such as REITs. This provides sufficient protection while maintaining inflation-beating growth potential.", agentType: "portfolio" },
    { role: "assistant", content: "In the 5 years before retirement, you should also execute these important retirement transitions:\n\n1. Begin building your cash buffer (2-3 years of expenses)\n2. Start Roth conversion planning if appropriate\n3. Develop your withdrawal strategy and income hierarchy\n4. Create your retirement budget with detailed expense projections\n5. Analyze your projected retirement income sources:", agentType: "retirement", chartData: sampleCharts.incomeSourcesRetirement },
    { role: "assistant", content: "From a tax perspective, those final 5 years are the perfect time to:\n\n1. Assess the tax efficiency of your accounts\n2. Begin tax bracket management strategies\n3. Consider asset location optimization\n4. Prepare for Required Minimum Distributions (RMDs) if applicable\n5. Evaluate the tax impact of different withdrawal sequences\n\nProper tax planning in this window can add years to your portfolio's longevity.", agentType: "tax" },
    { role: "assistant", content: "Synthesizing our team's advice for the 5 years before your early retirement:\n\n1. Gradually shift to a more conservative 50/30/20 allocation (stocks/bonds/alternatives+cash)\n2. Build a 2-3 year cash buffer to protect against sequence risk\n3. Develop a detailed tax-efficient withdrawal strategy spanning different account types\n4. Start implementing Roth conversions if they make sense for your tax situation\n5. Create a detailed budget for your early retirement years with contingency plans\n\nThis approach provides both downside protection and continued growth potential, giving you the best chance of a successful early retirement that can last 40+ years. Would you like me to focus on any specific element in more detail?", agentType: "final_advisor" }
  ],
  
  // Personal data access scenario showing access to portfolio, goals, and plans
  personal_data_access: [
    { role: "user", content: "I'd like to see my current portfolio and financial goals.", agentType: "user" },
    { role: "assistant", content: "I'd be happy to provide an overview of your financial profile. I'll bring in our specialized agents to give you a comprehensive view of your portfolio, goals, and planning status.", agentType: "final_advisor" },
    { role: "assistant", content: "Here's a summary of your current portfolio worth $325,000 across three accounts:", agentType: "portfolio_manager", chartData: {
      title: "Your Current Portfolio Allocation",
      type: "doughnut",
      data: {
        labels: ["401(k)", "Roth IRA", "Brokerage"],
        datasets: [{
          label: "Account Balance",
          data: [180000, 65000, 80000],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)", // Blue 
            "rgba(16, 185, 129, 0.7)", // Green
            "rgba(249, 115, 22, 0.7)" // Orange
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(249, 115, 22, 1)"
          ],
          borderWidth: 1
        }]
      }
    }},
    { role: "assistant", content: "Your 401(k) is currently valued at $180,000 with an annual contribution of $19,500 plus an employer match of $5,500. The allocation is 60% US Stocks, 20% International Stocks, 15% Bonds, and 5% Cash.", agentType: "portfolio_manager" },
    { role: "assistant", content: "Your portfolio has been performing well with a 9.8% return over the past year and a 11.5% annualized return over the last three years.", agentType: "market_analyst" },
    { role: "assistant", content: "I've reviewed your financial goals and can provide status updates on each:", agentType: "financial_advisor", chartData: {
      title: "Financial Goals Progress",
      type: "bar",
      data: {
        labels: ["Early Retirement", "College Fund", "Vacation Home", "Emergency Fund"],
        datasets: [{
          label: "Progress (%)",
          data: [12, 22, 15, 83],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)", // Blue
            "rgba(16, 185, 129, 0.7)", // Green
            "rgba(249, 115, 22, 0.7)", // Orange
            "rgba(139, 92, 246, 0.7)" // Purple
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(139, 92, 246, 1)"
          ],
          borderWidth: 1
        }]
      }
    }},
    { role: "user", content: "Can you show me more details about my retirement planning?", agentType: "user" },
    { role: "assistant", content: "Let me gather detailed information about your retirement planning from our retirement specialist.", agentType: "final_advisor" },
    { role: "assistant", content: "I've analyzed your retirement plan and here are the key metrics:", agentType: "retirement_specialist", chartData: {
      title: "Projected Retirement Income Sources",
      type: "pie",
      data: {
        labels: ["Social Security", "Retirement Accounts"],
        datasets: [{
          label: "Annual Income ($)",
          data: [28000, 57000],
          backgroundColor: [
            "rgba(16, 185, 129, 0.7)", // Green
            "rgba(59, 130, 246, 0.7)" // Blue
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(59, 130, 246, 1)"
          ],
          borderWidth: 1
        }]
      }
    }},
    { role: "assistant", content: "Your current retirement plan has a 76% probability of success based on our Monte Carlo simulations. You're currently saving 18% of your income, but we recommend increasing this to 22% to improve your chances of meeting your early retirement goal by age 55.", agentType: "retirement_specialist" },
    { role: "assistant", content: "Given your current tax situation, I recommend maximizing your pre-tax retirement contributions. Your effective tax rate is 18.5%, but your marginal rate is 24%, making tax-advantaged accounts particularly valuable for you.", agentType: "tax_advisor" },
    { role: "assistant", content: "Based on this analysis, here are my recommendations to help you stay on track with your financial goals:", agentType: "final_advisor" },
    { role: "assistant", content: "1. Increase your retirement contributions: Consider increasing your 401(k) contributions to max out your annual limit, which would improve your retirement readiness.\n\n2. Rebalance your portfolio: Your current allocation is slightly heavy on US stocks. Consider diversifying further into international markets.\n\n3. Accelerate emergency fund completion: You're at 83% of your emergency fund goal. Prioritize completing this high-priority safety net.\n\n4. Set up automated contributions for your children's college fund: Regular small contributions can significantly impact your progress toward this medium-priority goal.\n\nWould you like me to provide specific steps to implement any of these recommendations?", agentType: "final_advisor" },
    { role: "user", content: "Can I see my tax planning information?", agentType: "user" },
    { role: "assistant", content: "I'll connect you with our tax specialist to review your tax planning details.", agentType: "final_advisor" },
    { role: "assistant", content: "Here's an overview of your current tax situation:", agentType: "tax_advisor", chartData: {
      title: "Tax Breakdown Analysis",
      type: "bar",
      data: {
        labels: ["Effective Tax Rate", "Marginal Tax Rate", "Tax Optimization Potential"],
        datasets: [{
          label: "Percentage (%)",
          data: [18.5, 24, 5.5],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)", // Blue
            "rgba(249, 115, 22, 0.7)", // Orange
            "rgba(16, 185, 129, 0.7)" // Green
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(16, 185, 129, 1)"
          ],
          borderWidth: 1
        }]
      }
    }},
    { role: "assistant", content: "You have significant tax optimization opportunities. Your taxable income is $82,000 with $13,000 in deductions and $2,000 in credits. I've identified potential tax-loss harvesting opportunities of about $2,500 in your brokerage account.", agentType: "tax_advisor" },
    { role: "assistant", content: "Based on our comprehensive analysis of your financial profile, including your portfolio, goals, and tax situation, here are my integrated recommendations:", agentType: "final_advisor" },
    { role: "assistant", content: "1. **Retirement Strategy**: Increase contributions to your 401(k) and Roth IRA to maximize tax advantages while building toward your early retirement goal.\n\n2. **Investment Rebalancing**: Adjust your portfolio to better align with your moderate risk tolerance and time horizon to retirement.\n\n3. **Tax Optimization**: Implement tax-loss harvesting in your brokerage account and explore increasing your pre-tax contributions to lower your taxable income.\n\n4. **Goal Prioritization**: Continue focusing on completing your emergency fund first, then accelerate funding for your other financial goals based on timeline and priority.\n\nIs there any specific area of your financial plan you'd like to explore in more depth?", agentType: "final_advisor" }
  ],

  investment: investmentSimulation,
  retirement: retirementSimulation,
  tax: taxSimulation
};
