import { Sparkles, Brain, LineChart, Shield, Zap, Database, Network } from "lucide-react";

const innovations = [
  {
    title: "Advanced Multi-Agent Architecture",
    description: "Our system employs a sophisticated multi-agent architecture where specialized AI agents collaborate in real-time to provide comprehensive financial analysis.",
    icon: Brain,
    color: "purple"
  },
  {
    title: "Real-Time Market Analysis",
    description: "Continuous monitoring and analysis of market conditions, ensuring your investment strategy adapts to changing market dynamics.",
    icon: LineChart,
    color: "blue"
  },
  {
    title: "Intelligent Risk Management",
    description: "Sophisticated risk assessment and mitigation strategies powered by machine learning algorithms.",
    icon: Shield,
    color: "red"
  },
  {
    title: "Dynamic Portfolio Optimization",
    description: "Advanced algorithms for portfolio optimization that adapt to market conditions and your investment goals.",
    icon: Sparkles,
    color: "yellow"
  },
  {
    title: "Sentiment Analysis Engine",
    description: "Real-time analysis of market sentiment and news impact on investment decisions.",
    icon: Zap,
    color: "orange"
  },
  {
    title: "Distributed Data Processing",
    description: "Efficient handling of large-scale financial data through distributed processing and storage systems.",
    icon: Database,
    color: "green"
  },
  {
    title: "Seamless Agent Communication",
    description: "Advanced inter-agent communication protocols ensuring coordinated decision-making.",
    icon: Network,
    color: "indigo"
  }
];

export function InnovationSection() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 animate-fade-in">
        <h2 className="text-3xl font-bold">Innovation at Our Core</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our Finance Advisor stands at the forefront of financial technology innovation,
          combining cutting-edge AI with advanced financial analysis to revolutionize
          investment decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {innovations.map((innovation, index) => (
          <div
            key={innovation.title}
            className="relative group animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative p-6 bg-card rounded-lg border shadow-sm">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-${innovation.color}-100 dark:bg-${innovation.color}-900/20`}>
                  <innovation.icon className={`w-6 h-6 text-${innovation.color}-600 dark:text-${innovation.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold">{innovation.title}</h3>
              </div>
              <p className="mt-4 text-muted-foreground">{innovation.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 