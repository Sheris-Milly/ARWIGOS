"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface RecentNewsProps {
  news: any
  isLoading: boolean
}

export function RecentNews({ news, isLoading }: RecentNewsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!news || !news.data || news.data.length === 0) {
    return <div className="text-center py-4 text-zinc-400">No news available</div>
  }

  // Take the first 3 news items
  // Check if news.data is an array before calling slice
  const newsItems = Array.isArray(news.data) 
    ? news.data.slice(0, 3) 
    : news.data && typeof news.data === 'object' 
      ? [news.data] 
      : []

  return (
    <div className="space-y-4">
      {newsItems.map((item: any, index: number) => (
        <motion.a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 hover:bg-zinc-800/50 p-2 rounded-md transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800">
            <img
              src={item.image_url || "/placeholder.svg?height=64&width=64"}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=64"
              }}
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium line-clamp-2">{item.title}</h3>
            <p className="text-sm text-zinc-400">
              {item.source} • {formatNewsDate(item.published_at)}
            </p>
          </div>
        </motion.a>
      ))}
    </div>
  )
}

function formatNewsDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}
