/**
 * Shared types for multi-timeframe seasonal analysis
 */

export type SeasonalTimeframe = 'daily' | 'hourly' | '5min';

export type PeriodType =
  | 'month-of-year'
  | 'quarter'
  | 'day-of-week'
  | 'hour-of-day'
  | 'day-of-month'
  | 'week-of-month'
  | 'week-of-year'
  | 'week-position' // "first-monday", "last-friday", etc.
  | 'market-session' // "pre-market", "open", "lunch", "close"
  | 'custom-event'; // FOMC, options expiry, earnings, elections, etc.

export interface SeasonalPattern {
  period: PeriodType;
  label: string;

  // Performance metrics
  avgReturn: number; // Average return for this period
  returnStdDev: number; // Volatility of returns
  winRate: number; // Win % (trades profit > threshold)
  winCount: number;
  lossCount: number;

  // Statistical significance
  sampleCount: number; // Number of occurrences
  confidenceInterval: number; // 95% CI
  isSignificant: boolean; // Statistically significant

  // Price action
  avgBodySize: number; // Avg (close-open)
  avgWickSize: number; // Avg intrabar range
  avgVolume: number;
  volatility: number;

  // Additional context
  anomalies?: string[]; // "Gap up", "High volatility", etc.
  strength: number; // 0-1 signal strength

  // Optional metadata
  bestYear?: string;
  worstYear?: string;
  consistency?: number; // 0-100 consistency score
}

export interface PeriodExtractor {
  type: PeriodType;
  extract(timestamp: number): string | null;
  requiredTimeframe: SeasonalTimeframe;
}

export interface TimeframeDataFetcher {
  fetch(symbol: string, years: number): Promise<CandleData[]>;
  getCostEstimate(): number; // API call cost
}

export interface CandleData {
  date: string;
  timestamp?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SeasonalAnalysisInput {
  symbol: string;
  years?: number;
  timeframe?: 'daily' | 'hourly';
  patterns?: PeriodType[];
  includeEvents?: boolean;
}

export interface SeasonalAnalysisResult {
  symbol: string;
  timeframe: string;
  period: string;
  dataPoints: number;

  // Group patterns by type
  patterns: {
    [key in PeriodType]?: SeasonalPattern[];
  };

  summary: {
    bestPeriods: Array<{ type: PeriodType; label: string; avgReturn: number }>;
    worstPeriods: Array<{ type: PeriodType; label: string; avgReturn: number }>;
    strongPatterns: SeasonalPattern[]; // Win rate > 65%
  };

  insights: string[];
}
