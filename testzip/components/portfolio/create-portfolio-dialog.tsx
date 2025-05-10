"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createPortfolio } from "@/lib/api/portfolio"

interface CreatePortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPortfolioCreated: () => void // Callback to refresh portfolio list
}

export function CreatePortfolioDialog({
  open,
  onOpenChange,
  onPortfolioCreated,
}: CreatePortfolioDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await createPortfolio(name.trim(), description.trim())
      toast({
        title: "Portfolio Created",
        description: `Portfolio "${name.trim()}" has been created successfully.`,
      })
      onPortfolioCreated() // Trigger refresh
      onOpenChange(false) // Close dialog
      // Reset form
      setName("")
      setDescription("")
    } catch (error) {
      console.error("Error creating portfolio:", error)
      toast({
        title: "Error Creating Portfolio",
        description: "Failed to create portfolio. Please check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>Enter the details for your new portfolio.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Growth Stocks, Retirement Fund"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="(Optional) Describe this portfolio's purpose"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 