"use client";

import { useEffect, useRef, useState } from "react";
import React from 'react';
import Chart from "chart.js/auto";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";

interface ChartData {
  title: string;
  dataPoints: Array<{
    label: string;
    value: string | number;
  }>;
  type?: 'bar' | 'pie' | 'line';
  color?: string;
}

interface ChartVisualizationProps {
  chartData: string;
}

export function ChartVisualization({ data }: { data: ChartData }) {
  const { title, dataPoints, type = 'bar', color } = data;
  
  // Generate colors for the chart
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 
    'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
  ];
  
  if (type === 'pie') {
    return (
      <div className="bg-zinc-800 rounded-md p-3 my-2 border border-zinc-700">
        <div className="text-xs text-zinc-400 mb-2 font-mono">{title}</div>
        <div className="relative h-48 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full overflow-hidden relative">
            {dataPoints.map((point, index) => {
              const percentage = typeof point.value === 'number' 
                ? point.value 
                : parseFloat(point.value.toString());
              
              // Calculate percentage of the circle
              const percentageOfCircle = (percentage / dataPoints.reduce(
                (sum, dp) => sum + (typeof dp.value === 'number' ? dp.value : parseFloat(dp.value.toString())),
                0
              )) * 100;
              
              // Calculate the angle for this slice
              const angle = (percentageOfCircle / 100) * 360;
              
              // Calculate starting angle based on previous datapoints
              const startAngle = dataPoints.slice(0, index).reduce((acc, dp) => {
                const dpPercentage = typeof dp.value === 'number' 
                  ? dp.value 
                  : parseFloat(dp.value.toString());
                const dpPercentageOfCircle = (dpPercentage / dataPoints.reduce(
                  (sum, p) => sum + (typeof p.value === 'number' ? p.value : parseFloat(p.value.toString())),
                  0
                )) * 100;
                return acc + (dpPercentageOfCircle / 100) * 360;
              }, 0);
              
              return (
                <div 
                  key={index}
                  className={`absolute top-0 left-0 w-full h-full origin-center ${colors[index % colors.length]}`}
                  style={{
                    transform: `rotate(${startAngle}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)`,
                    clipPathFallback: `inset(0 0 0 50%)`,
                    zIndex: index
                  }}
                />
              );
            })}
          </div>
        </div>
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clean up any existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Parse the chart data from markdown-style content
    const lines = chartData.split('\n').filter(line => line.includes(':') || line.includes('-'));
    const title = lines[0]?.replace(':', '') || 'Financial Data';
    
    // Extract data points
    const dataPoints = lines.slice(1).map(line => {
      const parts = line.split(':');
      if (parts.length > 1) {
        return { label: parts[0].trim().replace('- ', ''), value: parseFloat(parts[1].trim().replace(/[^0-9.-]/g, '')) };
      }
      
      // Handle format like "- Label: Value" or "- Label Value"
      const dashSplit = line.split('-');
      if (dashSplit.length > 1) {
        const content = dashSplit[1].trim();
        
        // Try to find numeric value in the content
        const match = content.match(/(.*?)(\$?[\d,.]+%?|\+[\d,.]+%?)$/);
        if (match) {
          const label = match[1].trim();
          const valueText = match[2].trim();
          const value = parseFloat(valueText.replace(/[^0-9.-]/g, ''));
          return { label, value };
        }
        
        return { label: content, value: 0 };
      }
      
      return { label: line, value: 0 };
    }).filter(item => !isNaN(item.value));
    
    // Determine the chart type based on the content
    let chartType = 'bar';
    const chartTitle = title.toLowerCase();
    
    if (chartTitle.includes('allocation') || chartTitle.includes('breakdown') || chartTitle.includes('distribution')) {
      chartType = 'pie';
    } else if (chartTitle.includes('projection') || chartTitle.includes('growth') || chartTitle.includes('trend')) {
      chartType = 'line';
    } else if (chartTitle.includes('comparison')) {
      chartType = 'bar';
    }
    
    // Generate colors
    const colors = generateChartColors(dataPoints.length);
    
    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    if (chartType === 'pie') {
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: dataPoints.map(dp => dp.label),
          datasets: [{
            label: title,
            data: dataPoints.map(dp => dp.value),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.6', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'white'
              }
            },
            title: {
              display: true,
              text: title,
              color: 'white',
              font: {
                size: 16
              }
            }
          }
        }
      });
    } else if (chartType === 'line') {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dataPoints.map(dp => dp.label),
          datasets: [{
            label: title,
            data: dataPoints.map(dp => dp.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                color: 'white'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: 'white'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            },
            title: {
              display: true,
              text: title,
              color: 'white',
              font: {
                size: 16
              }
            }
          }
        }
      });
    } else {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dataPoints.map(dp => dp.label),
          datasets: [{
            label: title,
            data: dataPoints.map(dp => dp.value),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.6', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: chartTitle.includes('performance') ? false : true,
              ticks: {
                color: 'white'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: 'white'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            },
            title: {
              display: true,
              text: title,
              color: 'white',
              font: {
                size: 16
              }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);
  
  // Generate an array of colors for the chart
  const generateChartColors = (count: number) => {
    const baseColors = [
      'rgba(75, 192, 192, 0.6)',  // Teal
      'rgba(54, 162, 235, 0.6)',  // Blue
      'rgba(153, 102, 255, 0.6)', // Purple
      'rgba(255, 159, 64, 0.6)',  // Orange
      'rgba(255, 99, 132, 0.6)',  // Red
      'rgba(255, 206, 86, 0.6)',  // Yellow
      'rgba(46, 204, 113, 0.6)',  // Green
      'rgba(156, 39, 176, 0.6)',  // Deep Purple
      'rgba(233, 30, 99, 0.6)',   // Pink
      'rgba(0, 188, 212, 0.6)'    // Cyan
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  };

  // Toggle chart collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    
    // If expanding a collapsed chart, re-render it
    if (isCollapsed && chartRef.current) {
      setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }
        
        // Re-trigger useEffect to recreate chart
        const event = new Event('resize');
        window.dispatchEvent(event);
      }, 50);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);

    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }

      const event = new Event('resize');
      window.dispatchEvent(event);
    }, 50);
  };

  return (
    <div className={`mt-2 mb-4 relative ${isExpanded ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4' : ''}`}>
      <div className={`bg-zinc-900 rounded-md border border-zinc-800 p-3 ${isExpanded ? 'w-full max-w-5xl h-[90vh]' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">Financial Visualization</div>
          <div className="flex space-x-2">
            <button 
              onClick={toggleCollapse}
              className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              aria-label={isCollapsed ? "Expand chart" : "Collapse chart"}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button 
              onClick={toggleExpand}
              className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              aria-label={isExpanded ? "Minimize chart" : "Maximize chart"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
        
        <div 
          className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0' : isExpanded ? 'h-[calc(90vh-80px)]' : 'h-[350px]'}`}
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          <canvas ref={chartRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default ChartVisualization;
