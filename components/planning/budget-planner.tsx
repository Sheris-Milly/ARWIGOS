"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Budget, saveBudget } from '@/lib/api/planning'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface BudgetItem {
  id: string
  name: string
  amount: number
  type: "income" | "expense"
  category: string
}

interface BudgetPlannerProps {
  initialBudgets?: Budget[]
}

const expenseCategories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Savings",
  "Personal",
  "Entertainment",
  "Debt",
  "Other",
]

const incomeCategories = ["Salary", "Investments", "Side Hustle", "Other"]

const getCategoryColor = (category: string) => {
  const colors = {
    Housing: "#ef4444",
    Transportation: "#f97316",
    Food: "#f59e0b",
    Utilities: "#84cc16",
    Insurance: "#10b981",
    Healthcare: "#14b8a6",
    Savings: "#06b6d4",
    Personal: "#3b82f6",
    Entertainment: "#8b5cf6",
    Debt: "#a855f7",
    Other: "#6b7280",
    Salary: "#22c55e",
    Investments: "#3b82f6",
    "Side Hustle": "#a855f7",
  }

  return (colors as any)[category] || "#6b7280"
}

export function BudgetPlanner({ initialBudgets = [] }: BudgetPlannerProps) {
  const [items, setItems] = useState<BudgetItem[]>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem("budgetItems")
    if (saved) return JSON.parse(saved)

    // If no localStorage data, use initialBudgets if available
    if (initialBudgets.length > 0) {
      const latestBudget = initialBudgets[initialBudgets.length - 1]
      return Object.entries(latestBudget.expenses).map(([category, amount]) => ({
        id: Date.now().toString() + category,
        name: category,
        amount,
        type: "expense",
        category,
      }))
    }

    // Default items if no saved data
    return [
      { id: "1", name: "Salary", amount: 5000, type: "income", category: "Salary" },
      { id: "2", name: "Rent", amount: 1500, type: "expense", category: "Housing" },
      { id: "3", name: "Groceries", amount: 400, type: "expense", category: "Food" },
      { id: "4", name: "Car Payment", amount: 300, type: "expense", category: "Transportation" },
      { id: "5", name: "Utilities", amount: 200, type: "expense", category: "Utilities" },
      { id: "6", name: "Savings", amount: 500, type: "expense", category: "Savings" },
    ]
  })

  const [newItem, setNewItem] = useState({
    name: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "Other",
  })

  const [user, setUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    getUserSession()
  }, [supabase])

  useEffect(() => {
    localStorage.setItem("budgetItems", JSON.stringify(items))
  }, [items])

  const totalIncome = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalExpenses

  const handleAddItem = () => {
    if (!newItem.name || !newItem.amount) return

    const item: BudgetItem = {
      id: Date.now().toString(),
      name: newItem.name,
      amount: Number.parseFloat(newItem.amount),
      type: newItem.type,
      category: newItem.category,
    }

    setItems([...items, item])
    setNewItem({
      name: "",
      amount: "",
      type: "expense",
      category: "Other",
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSaveBudget = async () => {
    if (!user) {
      console.error("User not logged in")
      return
    }

    setIsSaving(true)
    try {
      const budgetData: Budget = {
        user_id: user.id,
        month: new Date().toISOString().slice(0, 7),
        income: totalIncome,
        expenses: items
          .filter(item => item.type === "expense")
          .reduce((acc, item) => {
            acc[item.category] = item.amount
            return acc
          }, {} as Record<string, number>),
        savings_goal: items.find(item => item.category === "Savings")?.amount || 0,
      }

      await saveBudget(budgetData)
    } catch (error) {
      console.error('Failed to save budget:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const expenseData = items
    .filter((item) => item.type === "expense")
    .reduce((acc: any[], item) => {
      const existingCategory = acc.find((i) => i.name === item.category)
      if (existingCategory) {
        existingCategory.value += item.amount
      } else {
        acc.push({
          name: item.category,
          value: item.amount,
          color: getCategoryColor(item.category),
        })
      }
      return acc
    }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Income</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Expenses</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Balance</div>
            <div className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Amount"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Add New Item</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-type">Type</Label>
                  <select
                    id="item-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as "income" | "expense" })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <select
                    id="item-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {newItem.type === "expense"
                      ? expenseCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))
                      : incomeCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="item-name">Description</Label>
                <Input
                  id="item-name"
                  placeholder="e.g., Rent, Groceries, Salary"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="item-amount">Amount</Label>
                <Input
                  id="item-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                />
              </div>

              <Button onClick={handleAddItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Budget Items</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(item.category) }} />
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">({item.category})</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={item.type === "income" ? "text-green-600" : "text-red-600"}>
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {item.name}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={handleSaveBudget}
            disabled={isSaving || !user}
            className="mt-4"
          >
            {isSaving ? "Saving..." : "Save Budget"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
