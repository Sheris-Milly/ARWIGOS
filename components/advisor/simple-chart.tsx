"use client";

import React from 'react';

interface ChartData {
  title: string;
  dataPoints: Array<{
    label: string;
    value: string | number;
  }>;
  type?: 'bar' | 'pie' | 'line';
  color?: string;
}

export function SimpleChart({ data }: { data: ChartData }) {
  const { title, dataPoints, type = 'bar', color } = data;
  
  // Generate colors for the chart
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 
    'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
  ];
  
  // Simple bar chart
  return (
    <div className="bg-zinc-800 rounded-md p-3 my-2 border border-zinc-700">
      <div className="text-xs text-zinc-400 mb-2 font-mono">{title}</div>
      <div className="space-y-2">
        {dataPoints.map((point, index) => {
          const chartColor = color ? color : colors[index % colors.length];
          
          // For percentage values, calculate width
          let width = '100%';
          let value = point.value;
          
          if (typeof value === 'string' && value.includes('%')) {
            const percentage = parseFloat(value);
            width = `${Math.min(Math.abs(percentage) * 5, 100)}%`;
          } else if (typeof value === 'number') {
            // Get the max value to scale bars properly
            const maxValue = Math.max(...dataPoints.map(p => 
              typeof p.value === 'number' ? p.value : parseFloat(p.value.toString())
            ));
            const percentage = (value / maxValue) * 100;
            width = `${percentage}%`;
          }
          
          return (
            <div key={index} className="flex items-center text-xs">
              <div className="w-1/3 text-zinc-300">{point.label}</div>
              <div className="w-2/3 flex items-center gap-2">
                <div 
                  className={chartColor}
                  style={{ 
                    width, 
                    height: '16px', 
                    borderRadius: '4px',
                    backgroundColor: chartColor.startsWith('bg-') ? undefined : chartColor
                  }}
                ></div>
                <div className="text-zinc-300">{value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
