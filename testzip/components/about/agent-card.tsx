import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  icon: LucideIcon;
  color: string;
  index: number;
}

export function AgentCard({
  name,
  role,
  description,
  capabilities,
  icon: Icon,
  color,
  index,
}: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={cn("h-full border-2", `border-${color}-200`)}>
        <CardHeader className={cn("pb-2", `bg-${color}-50`)}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", `bg-${color}-100`)}>
              <Icon className={cn("w-6 h-6", `text-${color}-600`)} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Capabilities:</h4>
            <ul className="space-y-1">
              {capabilities.map((capability, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                  className="text-sm flex items-center gap-2"
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${color}-500`)} />
                  {capability}
                </motion.li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 