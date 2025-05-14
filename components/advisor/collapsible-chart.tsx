"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chart, registerables } from "chart.js";
import { motion, AnimatePresence } from "framer-motion";

// Register all ChartJS components
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

interface CollapsibleChartProps {
  title: string;
  type: "bar" | "line" | "pie" | "doughnut" | "polarArea";
  data: ChartData;
  height?: number;
}

export function CollapsibleChart({ title, type, data, height = 300 }: CollapsibleChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // Destroy chart when component unmounts
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Create or update chart when expanded
  useEffect(() => {
    if (isExpanded && canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: 10,
                cornerRadius: 4,
                displayColors: true,
              },
            },
          },
        });
      }
    }
  }, [isExpanded, type, data]);

  return (
    <div className="w-full border rounded-lg overflow-hidden my-4 bg-card">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer bg-muted/50 hover:bg-muted transition-colors" 
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: height, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 h-full w-full">
              <canvas ref={canvasRef} height={height - 32}></canvas>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
