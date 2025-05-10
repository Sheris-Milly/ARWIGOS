// This file handles the Gemini AI API integration

interface Message {
  role: "user" | "assistant"
  content: string
}

/**
 * Generates an AI response using the Gemini API
 * @param messages Previous conversation messages
 * @param prompt Current user prompt
 * @param context Additional context (market data, news, etc.)
 * @returns Promise with the AI response
 */
export async function generateAIResponse(messages: Message[], prompt: string, context: any): Promise<string> {
  try {
    // This would be the actual API call:
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // Check if we're in a development environment or missing API key
    if (!apiKey) {
      console.log("Using simulated AI response - API key missing")
      return simulateAIResponse(messages, prompt, context)
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

    // Format the conversation history
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    // Add the current prompt with context
    const currentPrompt = {
      role: "user",
      parts: [
        {
          text: `Context: ${JSON.stringify(context)}

User query: ${prompt}`,
        },
      ],
    }

    const requestBody = {
      contents: [...formattedMessages, currentPrompt],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error("Error generating AI response:", error)
    // Return simulated response as fallback
    return simulateAIResponse(messages, prompt, context)
  }
}

// Helper function to simulate AI response
function simulateAIResponse(messages: Message[], prompt: string, context: any): string {
  // Extract key information from context
  const marketData = context.marketData
  const recentNews = context.recentNews

  // Simple keyword matching for demo purposes
  const promptLower = prompt.toLowerCase()

  // Check for market-related queries
  if (promptLower.includes("market") || promptLower.includes("stock") || promptLower.includes("invest")) {
    if (marketData) {
      const direction = marketData.change > 0 ? "up" : "down"
      const changePercent = Math.abs(marketData.changePercent).toFixed(2)

      return `Based on the latest market data, the ${marketData.symbol} is currently ${direction} by ${changePercent}%. ${getMarketAdvice(marketData.changePercent)}`
    } else {
      return "I'd be happy to discuss the market with you. However, I don't have the latest market data at the moment. Is there a specific aspect of investing you'd like to discuss?"
    }
  }

  // Check for news-related queries
  if (promptLower.includes("news") || promptLower.includes("headline")) {
    if (recentNews && recentNews.length > 0) {
      const newsItems = recentNews
        .slice(0, 2)
        .map((item: any) => `- ${item.title} (${item.source})`)
        .join("\n")
      return `Here are some recent financial headlines:\n\n${newsItems}\n\nWould you like me to analyze any of these news items in more detail?`
    } else {
      return "I'd be happy to discuss recent financial news with you. However, I don't have the latest headlines at the moment. Is there a specific company or sector you're interested in?"
    }
  }

  // Check for portfolio-related queries
  if (promptLower.includes("portfolio") || promptLower.includes("diversif")) {
    return "Portfolio diversification is a key strategy to manage risk. A well-diversified portfolio typically includes a mix of stocks, bonds, and other assets across different sectors and geographies. Based on your risk tolerance and investment timeline, I'd recommend allocating your investments across multiple asset classes. Would you like more specific advice about your portfolio allocation?"
  }

  // Check for retirement-related queries
  if (promptLower.includes("retire") || promptLower.includes("401k") || promptLower.includes("ira")) {
    return "Retirement planning is crucial for long-term financial security. The general guideline is to save 15-20% of your income for retirement. Tax-advantaged accounts like 401(k)s and IRAs offer significant benefits. For a 401(k), try to contribute at least enough to get your employer's full match. Would you like more specific retirement planning advice?"
  }

  // Check for budget-related queries
  if (promptLower.includes("budget") || promptLower.includes("spend") || promptLower.includes("save")) {
    return "Creating a budget is the foundation of financial health. The 50/30/20 rule is a good starting point: allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. Tracking your expenses can help identify areas where you can cut back. Would you like more specific budgeting advice?"
  }

  // Check for tax-related queries
  if (promptLower.includes("tax") || promptLower.includes("taxes")) {
    return "Tax-efficient investing can significantly impact your long-term returns. Consider maximizing contributions to tax-advantaged accounts like 401(k)s and IRAs. For taxable accounts, consider tax-efficient investments like index funds and ETFs that have lower turnover and generate fewer capital gains distributions. Tax-loss harvesting can also be an effective strategy to offset capital gains. Would you like more specific tax planning advice?"
  }

  // Check for risk-related queries
  if (promptLower.includes("risk") || promptLower.includes("volatility")) {
    return "Managing investment risk is essential for long-term success. Diversification across asset classes, sectors, and geographies can help reduce portfolio volatility. Your risk tolerance should align with your investment timeline—generally, the longer your time horizon, the more risk you can afford to take. Consider using dollar-cost averaging to reduce the impact of market volatility. Would you like me to help you assess your risk tolerance?"
  }

  // Check for specific investment advice
  if (promptLower.includes("should i buy") || promptLower.includes("should i invest in")) {
    return "I can't provide specific investment recommendations for individual securities. However, I can suggest that any investment decision should be based on your financial goals, risk tolerance, and time horizon. It's generally advisable to conduct thorough research, consider how the investment fits into your overall portfolio strategy, and possibly consult with a financial advisor before making significant investment decisions."
  }

  // Default response for other queries
  return "I'm your AI financial advisor, here to help with investment strategies, market analysis, retirement planning, and other financial topics. How can I assist you with your financial goals today?"
}

// Helper function to generate market advice
function getMarketAdvice(changePercent: number): string {
  if (changePercent > 2) {
    return "The market is showing strong positive momentum. This might be a good time to review your portfolio and consider taking some profits if you've reached your investment goals for certain positions."
  } else if (changePercent > 0) {
    return "The market is showing modest gains. This stable environment could be suitable for maintaining your current investment strategy while looking for selective opportunities."
  } else if (changePercent > -2) {
    return "The market is showing a slight decline. For long-term investors, this might present buying opportunities for quality stocks on your watchlist."
  } else {
    return "The market is experiencing a significant decline. While this volatility can be concerning, it's important to avoid emotional decisions. Consider your long-term investment goals before making any major changes to your portfolio."
  }
}
