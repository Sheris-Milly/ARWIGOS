"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface MarketNewsProps {
  news: any
  isLoading: boolean
  maxItems?: number
}

export function MarketNews({ news, isLoading, maxItems = 10 }: MarketNewsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-2">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!news || !news.data || news.data.length === 0) {
    return <div className="text-center py-4 text-zinc-400">No news available</div>
  }

  // Limit the number of news items
  const newsItems = news.data.slice(0, maxItems)

  return (
    <div className="space-y-4">
      {newsItems.map((item: any, index: number) => (
        <motion.a
          key={item.uuid || index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 hover:bg-zinc-800/50 p-2 rounded-md transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
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
          <div className="space-y-1 flex-1">
            <h3 className="font-medium line-clamp-2">{item.title}</h3>
            <p className="text-sm text-zinc-400">
              {item.source} • {formatNewsDate(item.published_at)}
            </p>
            {item.summary && (
              <p className="text-sm text-zinc-300 line-clamp-2 mt-1">{item.summary}</p>
            )}
            {item.tickers && item.tickers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.tickers.slice(0, 5).map((ticker: string) => (
                  <span key={ticker} className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
                    {ticker}
                  </span>
                ))}
              </div>
            )}
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
