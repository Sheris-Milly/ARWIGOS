"use client"

import { useEffect, useState } from "react"
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { fetchNewsForPortfolio, NewsArticle } from "@/lib/api/news"
import { ExternalLink, RefreshCw, AlertCircle, Newspaper } from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from 'date-fns'

interface NewsProps {
  className?: string
}

export function News({ className }: NewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadNews = async () => {
    try {
      setError(null)
      setRefreshing(true)
      const articles = await fetchNewsForPortfolio()
      setNews(articles)
    } catch (err) {
      console.error("Error loading news:", err)
      setError("Failed to load news. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 w-full"
            onClick={loadNews}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (news.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No news articles found for your portfolio.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={loadNews}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Portfolio News
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={loadNews}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex gap-4 items-start border-b border-zinc-800 pb-4 last:border-b-0 last:pb-0"
          >
            <div className="relative h-20 w-20 flex-shrink-0">
              {article.imageUrl ? (
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-md bg-zinc-800 flex items-center justify-center">
                  <Newspaper className="h-6 w-6 text-zinc-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline block"
              >
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{article.title}</h3>
              </Link>
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{article.source}</span>
                  <span className="text-zinc-600">&bull;</span>
                  <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                </div>
                <Link 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs hover:text-zinc-300"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Read
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
} 