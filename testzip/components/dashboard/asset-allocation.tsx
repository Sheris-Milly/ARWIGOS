"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface AssetAllocationProps {
  allocation: { name: string; value: number; color: string }[]
  isLoading: boolean
}

export function AssetAllocation({ allocation, isLoading }: AssetAllocationProps) {
  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  return (
    <div className="h-full">
      <motion.div
        className="h-[300px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocation}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              animationDuration={1000}
              animationBegin={200}
            >
              {allocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Allocation"]}
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.9)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "white",
              }}
            />
            <Legend formatter={(value) => <span style={{ color: "#d1d5db" }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {allocation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: item.color }}>
              {item.value}%
            </div>
            <div className="mt-1 text-sm text-zinc-400">{item.name}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
