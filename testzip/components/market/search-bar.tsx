import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearch: (symbol: string) => void
  isLoading: boolean
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [searchInput, setSearchInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      onSearch(searchInput.trim())
      setSearchInput("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Enter stock symbol (e.g. AAPL)"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        disabled={isLoading}
        className="w-full"
      />
      <Button type="submit" disabled={isLoading}>
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  )
} 