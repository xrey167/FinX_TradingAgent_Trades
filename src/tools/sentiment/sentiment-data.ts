/**
 * Sentiment Data Tool - Fetch news and sentiment for stocks
 *
 * MCP tool for fetching news and sentiment data using EODHD API:
 * - Recent news articles with sentiment (Positive/Negative/Neutral)
 * - Aggregated sentiment scores
 * - Trending topics
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getEODHDClient } from '../../lib/eodhd-client-singleton.ts';
import { globalToolCache } from '../../lib/tool-cache.ts';
import { formatToolResult, formatToolError, requireEnvVar, createCacheKey } from '../helpers.ts';

const inputSchema = z.object({
  symbol: z.string().describe('Stock ticker symbol (e.g., AAPL.US)'),
  limit: z.number().optional().default(10).describe('Number of news articles to fetch'),
});

export const fetchSentimentDataTool = tool(
  'fetch_sentiment_data',
  `Fetch news and sentiment data for a stock:
- Recent news articles with sentiment (Positive/Negative/Neutral)
- Aggregated sentiment scores
- Trending topics

Costs 5 API calls per request.`,
  inputSchema.shape,
  async (input) => {
    try {
      requireEnvVar('EODHD_API_KEY');
      const { symbol, limit } = input;
      const cacheKey = createCacheKey('fetch_sentiment_data', { symbol, limit });

      // Try cache first (10 minute TTL for sentiment - news changes more frequently)
      const summary = await globalToolCache.getOrFetch(
        cacheKey,
        10 * 60 * 1000, // 10 minutes
        async () => {
          const client = getEODHDClient();
          const news = await client.getNews(symbol, limit);

          // Calculate sentiment statistics
          const sentimentCounts = news.reduce(
            (acc, article) => {
              const sentiment = article.sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral';
              if (sentiment in acc) {
                acc[sentiment]++;
              }
              return acc;
            },
            { positive: 0, negative: 0, neutral: 0 }
          );

          const total = news.length;
          const sentimentScore =
            total > 0 ? ((sentimentCounts.positive - sentimentCounts.negative) / total) * 100 : 0;

          return {
            symbol,
            newsCount: total,
            sentiment: {
              positive: sentimentCounts.positive,
              negative: sentimentCounts.negative,
              neutral: sentimentCounts.neutral,
              positivePercent: total > 0 ? ((sentimentCounts.positive / total) * 100).toFixed(1) : '0.0',
              negativePercent: total > 0 ? ((sentimentCounts.negative / total) * 100).toFixed(1) : '0.0',
              neutralPercent: total > 0 ? ((sentimentCounts.neutral / total) * 100).toFixed(1) : '0.0',
              overallScore: sentimentScore.toFixed(1), // -100 to +100
            },
            recentArticles: news.slice(0, 5).map((article) => ({
              date: article.date,
              title: article.title,
              sentiment: article.sentiment,
              link: article.link,
            })),
            allArticles: news,
          };
        }
      );

      return formatToolResult(summary, {
        sourceUrl: `https://eodhd.com/api/news?s=${symbol}&limit=${limit}`,
        timestamp: new Date().toISOString(),
        apiCost: 5,
      });
    } catch (error) {
      return formatToolError(error, 'Error fetching sentiment data');
    }
  }
);
