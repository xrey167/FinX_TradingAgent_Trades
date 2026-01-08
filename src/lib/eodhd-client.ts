/**
 * EODHD API Client - Handles all interactions with EOD Historical Data API
 *
 * Features:
 * - Authentication via API token
 * - Rate limiting (1000/minute, 100k/day)
 * - Caching to minimize API calls
 * - Error handling and retry logic
 * - TypeScript interfaces for all responses
 */

import axios from 'axios';

const EODHD_BASE_URL = 'https://eodhd.com/api';

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility: Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  // Exponential: 2s, 4s, 8s, 16s
  const exponential = baseDelay * Math.pow(2, attempt);

  // Add jitter: +/- 20%
  const jitter = exponential * 0.2 * (Math.random() * 2 - 1);

  return Math.floor(exponential + jitter);
}

interface EODHDConfig {
  apiToken: string;
  baseUrl?: string;
  cache?: Map<string, { data: any; timestamp: number }>;
  cacheTTL?: number; // milliseconds
}

export class EODHDClient {
  private apiToken: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private cacheTTL: number;
  private requestCount: { minute: number; day: number; lastReset: number };

  constructor(config: EODHDConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || EODHD_BASE_URL;
    this.cache = config.cache || new Map();
    this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    this.requestCount = { minute: 0, day: 0, lastReset: Date.now() };
  }

  /**
   * Fetch End-of-Day historical data (1 API call)
   */
  async getEODData(symbol: string, from?: string, to?: string): Promise<EODData[]> {
    const cacheKey = `eod-${symbol}-${from}-${to}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      api_token: this.apiToken,
      fmt: 'json',
      ...(from && { from }),
      ...(to && { to }),
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/eod/${symbol}?${params}`,
      1 // costs 1 API call
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  /**
   * Fetch Intraday data (5 API calls)
   */
  async getIntradayData(
    symbol: string,
    interval: '1m' | '5m' | '1h',
    from?: string,
    to?: string
  ): Promise<IntradayData[]> {
    const cacheKey = `intraday-${symbol}-${interval}-${from}-${to}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      api_token: this.apiToken,
      fmt: 'json',
      interval,
      ...(from && { from }),
      ...(to && { to }),
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/intraday/${symbol}?${params}`,
      5 // costs 5 API calls
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  /**
   * Fetch Fundamental data (10 API calls)
   */
  async getFundamentals(symbol: string): Promise<FundamentalData> {
    const cacheKey = `fundamentals-${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      api_token: this.apiToken,
      fmt: 'json',
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/fundamentals/${symbol}?${params}`,
      10 // costs 10 API calls
    );

    // Cache fundamentals for longer (30 minutes)
    this.setCache(cacheKey, response.data, 30 * 60 * 1000);
    return response.data;
  }

  /**
   * Fetch News data (5 API calls)
   */
  async getNews(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `news-${symbol}-${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      api_token: this.apiToken,
      s: symbol,
      fmt: 'json',
      limit: limit.toString(),
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/news?${params}`,
      5 // costs 5 API calls
    );

    // Cache news for shorter time (2 minutes)
    this.setCache(cacheKey, response.data, 2 * 60 * 1000);
    return response.data;
  }

  /**
   * Fetch Sentiment data
   */
  async getSentiment(symbol: string, from?: string, to?: string): Promise<SentimentData[]> {
    const cacheKey = `sentiment-${symbol}-${from}-${to}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      api_token: this.apiToken,
      s: symbol,
      fmt: 'json',
      ...(from && { from }),
      ...(to && { to }),
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/sentiments?${params}`,
      5 // costs 5 API calls
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  /**
   * Fetch Real-time data (1 API call)
   */
  async getRealtime(symbol: string): Promise<RealtimeData> {
    // Don't cache real-time data
    const params = new URLSearchParams({
      api_token: this.apiToken,
      fmt: 'json',
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/real-time/${symbol}?${params}`,
      1 // costs 1 API call
    );

    return response.data;
  }

  /**
   * Internal request handler with rate limiting and retry logic
   */
  private async makeRequest(url: string, apiCallCost: number, maxRetries: number = 4) {
    this.checkRateLimits(apiCallCost);

    const baseDelay = 2000; // 2 seconds base

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
        });

        // Success - update counters and return
        this.requestCount.minute += apiCallCost;
        this.requestCount.day += apiCallCost;
        return response;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (axios.isAxiosError(error)) {
          // Rate limit hit - always retry with backoff
          if (error.response?.status === 429) {
            if (isLastAttempt) {
              throw new Error('EODHD API rate limit exceeded after retries. Please try again later.');
            }

            const waitMs = calculateBackoff(attempt, baseDelay);
            console.warn(`⚠️  Rate limit hit (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitMs}ms...`);
            await sleep(waitMs);
            continue;
          }

          // Timeout or network error - retry
          if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            if (isLastAttempt) {
              throw new Error(`EODHD API network error: ${error.message}`);
            }

            const waitMs = calculateBackoff(attempt, baseDelay);
            console.warn(`⚠️  Network error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitMs}ms...`);
            await sleep(waitMs);
            continue;
          }

          // Client error (4xx) - don't retry
          if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            throw new Error(`EODHD API error: ${error.response?.data?.message || error.message}`);
          }

          // Server error (5xx) - retry
          if (error.response?.status && error.response.status >= 500) {
            if (isLastAttempt) {
              throw new Error(`EODHD API server error: ${error.response?.data?.message || error.message}`);
            }

            const waitMs = calculateBackoff(attempt, baseDelay);
            console.warn(`⚠️  Server error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitMs}ms...`);
            await sleep(waitMs);
            continue;
          }
        }

        // Unknown error - retry
        if (isLastAttempt) {
          throw error;
        }

        const waitMs = calculateBackoff(attempt, baseDelay);
        console.warn(`⚠️  Unknown error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
      }
    }

    throw new Error('Max retries exceeded - this should never happen');
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimits(apiCallCost: number): void {
    const now = Date.now();
    const timeSinceReset = now - this.requestCount.lastReset;

    // Reset per-minute counter every minute
    if (timeSinceReset > 60 * 1000) {
      this.requestCount.minute = 0;
      this.requestCount.lastReset = now;
    }

    // Reset daily counter every 24 hours
    if (timeSinceReset > 24 * 60 * 60 * 1000) {
      this.requestCount.day = 0;
    }

    // Check limits (with 10% buffer for safety)
    if (this.requestCount.minute + apiCallCost > 900) {
      // 1000 - 10%
      throw new Error('Approaching per-minute rate limit (1000/min). Slowing down...');
    }

    if (this.requestCount.day + apiCallCost > 90000) {
      // 100k - 10%
      throw new Error('Approaching daily rate limit (100k/day). Please try again tomorrow.');
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    // Use per-item TTL if available, otherwise use default cacheTTL
    const effectiveTTL = cached.ttl || this.cacheTTL;
    if (now - cached.timestamp > effectiveTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheTTL,
    });
  }
}

// TypeScript Interfaces

export interface EODData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface IntradayData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalData {
  General: {
    Code: string;
    Name: string;
    Exchange: string;
    Sector: string;
    Industry: string;
    Description?: string;
  };
  Highlights: {
    MarketCapitalization: number;
    EBITDA: number;
    PERatio: number;
    PEGRatio: number;
    WallStreetTargetPrice: number;
    BookValue: number;
    DividendShare: number;
    DividendYield: number;
    EarningsShare: number;
    EPSEstimateCurrentYear: number;
    EPSEstimateNextYear: number;
    EPSEstimateNextQuarter: number;
    EPSEstimateCurrentQuarter: number;
    MostRecentQuarter: string;
    ProfitMargin: number;
    OperatingMarginTTM: number;
    ReturnOnAssetsTTM: number;
    ReturnOnEquityTTM: number;
    RevenueTTM: number;
    RevenuePerShareTTM: number;
    QuarterlyRevenueGrowthYOY: number;
    GrossProfitTTM: number;
    DilutedEpsTTM: number;
    QuarterlyEarningsGrowthYOY: number;
  };
  Valuation: {
    TrailingPE: number;
    ForwardPE: number;
    PriceSalesTTM: number;
    PriceBookMRQ: number;
    EnterpriseValue: number;
    EnterpriseValueRevenue: number;
    EnterpriseValueEbitda: number;
  };
  Financials: {
    Balance_Sheet: {
      quarterly: Record<string, BalanceSheet>;
      yearly: Record<string, BalanceSheet>;
    };
    Cash_Flow: {
      quarterly: Record<string, CashFlow>;
      yearly: Record<string, CashFlow>;
    };
    Income_Statement: {
      quarterly: Record<string, IncomeStatement>;
      yearly: Record<string, IncomeStatement>;
    };
  };
  Earnings?: {
    History: Record<string, EarningsHistory>;
    Trend: Record<string, EarningsTrend>;
  };
  ESG_Scores?: {
    EnvironmentScore: number;
    SocialScore: number;
    GovernanceScore: number;
    TotalScore: number;
  };
}

export interface BalanceSheet {
  date: string;
  totalAssets: number;
  totalLiab: number;
  totalStockholderEquity: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
  netDebt: number;
  workingCapital: number;
}

export interface CashFlow {
  date: string;
  freeCashFlow: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  dividendsPaid: number;
}

export interface IncomeStatement {
  date: string;
  totalRevenue: number;
  costOfRevenue: number;
  grossProfit: number;
  ebitda: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

export interface NewsArticle {
  date: string;
  title: string;
  content: string;
  link: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  symbols: string[];
}

export interface SentimentData {
  date: string;
  symbol: string;
  positive: number;
  negative: number;
  neutral: number;
  sentiment_score: number; // -1 to 1
}

export interface RealtimeData {
  code: string;
  timestamp: number;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  change_p: number;
}

export interface EarningsHistory {
  reportDate: string;
  date: string;
  beforeAfterMarket: string;
  currency: string;
  epsActual: number;
  epsEstimate: number;
  epsDifference: number;
  surprisePercent: number;
}

export interface EarningsTrend {
  date: string;
  period: string;
  growth: number;
  earningsEstimateAvg: number;
  earningsEstimateLow: number;
  earningsEstimateHigh: number;
  earningsEstimateYearAgoEps: number;
  earningsEstimateNumberOfAnalysts: number;
  earningsEstimateGrowth: number;
  revenueEstimateAvg: number;
  revenueEstimateLow: number;
  revenueEstimateHigh: number;
  revenueEstimateYearAgoEps: number;
  revenueEstimateNumberOfAnalysts: number;
  revenueEstimateGrowth: number;
}
