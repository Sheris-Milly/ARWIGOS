"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface PortfolioTableProps {
  stocks: any[]
  onRemove: (symbol: string, portfolioId: string) => void
}

export function PortfolioTable({ stocks, onRemove }: PortfolioTableProps) {
  // Render function for actions column
  const renderActions = (row: any) => (
    <div className="flex gap-2 justify-end">
      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onRemove(row.symbol, row.portfolioId)}>
        Remove
      </Button>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={`${stock.portfolioId}-${stock.symbol}`}>
              <TableCell className="font-medium">{stock.symbol}</TableCell>
              <TableCell>{stock.name}</TableCell>
              <TableCell className="text-right">{stock.shares}</TableCell>
              <TableCell className="text-right">{formatCurrency(stock.purchasePrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(stock.currentPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(stock.value)}</TableCell>
              <TableCell className={`text-right ${stock.gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(stock.gain)} ({formatPercentage(stock.gainPercent / 100)})
              </TableCell>
              <TableCell>
                {renderActions(stock)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
