import { motion } from "framer-motion";
import { Brain, LineChart, Shield, Zap, Database, Network } from "lucide-react";
import { AgentCard } from "./agent-card";

const agents = [
  {
    name: "Market Analysis Agent",
    role: "Data Analysis & Pattern Recognition",
    description: "Specializes in analyzing market trends, patterns, and indicators to provide accurate market insights and predictions.",
    capabilities: [
      "Real-time market data analysis",
      "Pattern recognition in price movements",
      "Technical indicator calculation",
      "Market trend prediction",
      "Volatility analysis"
    ],
    icon: LineChart,
    color: "blue"
  },
  {
    name: "Risk Management Agent",
    role: "Risk Assessment & Mitigation",
    description: "Evaluates and manages investment risks by analyzing various factors and providing risk mitigation strategies.",
    capabilities: [
      "Portfolio risk assessment",
      "Risk factor identification",
      "Risk mitigation strategies",
      "Exposure analysis",
      "Stress testing scenarios"
    ],
    icon: Shield,
    color: "red"
  },
  {
    name: "Portfolio Optimization Agent",
    role: "Portfolio Management & Optimization",
    description: "Optimizes investment portfolios using advanced algorithms and machine learning techniques.",
    capabilities: [
      "Asset allocation optimization",
      "Portfolio rebalancing",
      "Diversification strategies",
      "Performance tracking",
      "Return optimization"
    ],
    icon: Brain,
    color: "purple"
  },
  {
    name: "News Analysis Agent",
    role: "News & Sentiment Analysis",
    description: "Analyzes financial news and market sentiment to provide context for investment decisions.",
    capabilities: [
      "News sentiment analysis",
      "Market impact assessment",
      "Event correlation",
      "Sentiment trend tracking",
      "News filtering and prioritization"
    ],
    icon: Zap,
    color: "yellow"
  },
  {
    name: "Data Management Agent",
    role: "Data Processing & Storage",
    description: "Manages data collection, processing, and storage to ensure data quality and accessibility.",
    capabilities: [
      "Data validation and cleaning",
      "Real-time data processing",
      "Historical data management",
      "Data quality assurance",
      "Storage optimization"
    ],
    icon: Database,
    color: "green"
  },
  {
    name: "Communication Agent",
    role: "Inter-Agent Communication & Coordination",
    description: "Facilitates communication between agents and ensures coordinated decision-making.",
    capabilities: [
      "Inter-agent message routing",
      "Task coordination",
      "Conflict resolution",
      "Communication protocol management",
      "System state monitoring"
    ],
    icon: Network,
    color: "indigo"
  }
];

export function AgentSystem() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h2 className="text-3xl font-bold">Our Multi-Agent System</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our Finance Advisor employs a sophisticated multi-agent system where specialized AI agents work together
          to provide comprehensive financial analysis and advice. Each agent has unique capabilities and
          responsibilities, creating a powerful synergy for optimal investment decisions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <AgentCard key={agent.name} {...agent} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center space-y-4 mt-12"
      >
        <h3 className="text-2xl font-bold">How It Works</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our agents collaborate in real-time, sharing insights and data to provide you with the most
          accurate and comprehensive financial advice. The system continuously learns and adapts to
          market conditions, ensuring your investment strategy remains optimal.
        </p>
      </motion.div>
    </div>
  );
} 