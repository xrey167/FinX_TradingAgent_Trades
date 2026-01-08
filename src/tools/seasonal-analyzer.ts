/**
 * Seasonal Analysis Tool - Detect seasonal patterns in market data
 *
 * Analyzes historical price data to identify:
 * - Monthly performance patterns (best/worst months)
 * - Quarterly trends (Q1, Q2, Q3, Q4)
 * - Day-of-week effects (Monday blues, Friday rallies)
 * - Calendar anomalies (Santa Rally, Sell in May, etc.)
 * - Multi-year seasonal strength
 *
 * Inspired by: Mark Hulbert's seasonal analysis, Larry Williams' patterns
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getEODHDClient } from '../lib/eodhd-client-singleton.ts';
import { globalToolCache } from '../lib/tool-cache.ts';
import { formatToolResult, formatToolError, requireEnvVar, createCacheKey } from './helpers.ts';

const inputSchema = z.object({
  symbol: z.string().describe('Stock ticker symbol (e.g., AAPL.US, SPY.US)'),
  years: z.number().optional().default(5).describe('Number of years of history to analyze (default: 5)'),
});

interface MonthlyStats {
  month: string;
  avgReturn: number;
  winRate: number;
  bestYear: string;
  worstYear: string;
  consistency: number; // 0-100
}

interface QuarterlyStats {
  quarter: string;
  avgReturn: number;
  winRate: number;
  volatility: number;
}

interface DayOfWeekStats {
  day: string;
  avgReturn: number;
  winRate: number;
}

interface SeasonalPattern {
  name: string;
  period: string;
  avgReturn: number;
  winRate: number;
  description: string;
}

export const analyzeSeasonalTool = tool(
  'analyze_seasonal',
  `Analyze seasonal patterns and calendar effects in historical price data.

Identifies:
- Best/worst performing months (e.g., "November rally")
- Quarterly trends (Q4 strength, Q1 weakness, etc.)
- Day-of-week effects (Monday selloffs, Friday rallies)
- Famous patterns (Santa Rally, Sell in May, January Effect)
- Multi-year consistency of seasonal trends

Uses historical data to quantify seasonal edge. Costs 1 API call per request.`,
  inputSchema.shape,
  async (input) => {
    try {
      requireEnvVar('EODHD_API_KEY');
      const { symbol, years } = input;
      const cacheKey = createCacheKey('analyze_seasonal', { symbol, years });

      // Try cache first (24 hour TTL - seasonal patterns don't change often)
      const analysis = await globalToolCache.getOrFetch(
        cacheKey,
        24 * 60 * 60 * 1000, // 24 hours
        async () => {
          const client = getEODHDClient();

          // Calculate date range
          const endDate = new Date();
          const startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - years);

          const from = startDate.toISOString().split('T')[0];
          const to = endDate.toISOString().split('T')[0];

          // Fetch historical daily data
          const data = await client.getEODData(symbol, from, to);

          if (data.length === 0) {
            throw new Error('No historical data available for seasonal analysis');
          }

          // Parse dates and calculate returns
          const priceData = data.map(d => ({
            date: new Date(d.date),
            close: d.close,
            return: 0, // Will calculate
          }));

          // Calculate daily returns
          for (let i = 1; i < priceData.length; i++) {
            const current = priceData[i];
            const previous = priceData[i - 1];
            if (current && previous) {
              current.return = ((current.close - previous.close) / previous.close) * 100;
            }
          }

          // Analyze by month
          const monthlyData: Record<string, { returns: number[]; years: Set<string> }> = {};
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];

          for (const point of priceData) {
            const monthIndex = point.date.getMonth();
            const month = monthNames[monthIndex];
            const year = point.date.getFullYear().toString();

            if (month) {
              if (!monthlyData[month]) {
                monthlyData[month] = { returns: [], years: new Set() };
              }
              monthlyData[month]?.returns.push(point.return);
              monthlyData[month]?.years.add(year);
            }
          }

          const monthlyStats: MonthlyStats[] = monthNames.map(month => {
            const data = monthlyData[month] || { returns: [], years: new Set() };
            const returns = data.returns.filter(r => !isNaN(r));
            const positive = returns.filter(r => r > 0).length;

            // Calculate monthly aggregate returns (sum of daily returns as proxy)
            const monthlyReturns: Record<string, number> = {};
            for (let i = 0; i < priceData.length; i++) {
              const point = priceData[i];
              if (point) {
                const pointMonth = monthNames[point.date.getMonth()];
                if (pointMonth === month) {
                  const year = point.date.getFullYear().toString();
                  monthlyReturns[year] = (monthlyReturns[year] || 0) + point.return;
                }
              }
            }

            const aggregateReturns = Object.values(monthlyReturns);
            const positiveMonths = aggregateReturns.filter(r => r > 0).length;

            // Find best/worst years
            let bestYear = 'N/A';
            let worstYear = 'N/A';
            let bestReturn = -Infinity;
            let worstReturn = Infinity;

            for (const [year, ret] of Object.entries(monthlyReturns)) {
              if (ret > bestReturn) {
                bestReturn = ret;
                bestYear = year;
              }
              if (ret < worstReturn) {
                worstReturn = ret;
                worstYear = year;
              }
            }

            // Consistency: how often is this month positive?
            const consistency = aggregateReturns.length > 0
              ? (positiveMonths / aggregateReturns.length) * 100
              : 0;

            return {
              month,
              avgReturn: returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0,
              winRate: returns.length > 0 ? (positive / returns.length) * 100 : 0,
              bestYear,
              worstYear,
              consistency,
            };
          });

          // Analyze by quarter
          const quarterlyData: Record<string, number[]> = {
            Q1: [], Q2: [], Q3: [], Q4: [],
          };

          for (const point of priceData) {
            const month = point.date.getMonth();
            if (month < 3) quarterlyData.Q1?.push(point.return);
            else if (month < 6) quarterlyData.Q2?.push(point.return);
            else if (month < 9) quarterlyData.Q3?.push(point.return);
            else quarterlyData.Q4?.push(point.return);
          }

          const quarterlyStats: QuarterlyStats[] = Object.entries(quarterlyData).map(([quarter, returns]) => {
            const filtered = returns.filter(r => !isNaN(r));
            const positive = filtered.filter(r => r > 0).length;
            const mean = filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
            const variance = filtered.length > 0
              ? filtered.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / filtered.length
              : 0;

            return {
              quarter,
              avgReturn: mean,
              winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
              volatility: Math.sqrt(variance),
            };
          });

          // Analyze by day of week
          const dayOfWeekData: Record<string, number[]> = {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [],
          };

          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          for (const point of priceData) {
            const dayIndex = point.date.getDay();
            const day = dayNames[dayIndex];
            if (day && day !== 'Sunday' && day !== 'Saturday' && dayOfWeekData[day]) {
              dayOfWeekData[day]?.push(point.return);
            }
          }

          const dayOfWeekStats: DayOfWeekStats[] = Object.entries(dayOfWeekData).map(([day, returns]) => {
            const filtered = returns.filter(r => !isNaN(r));
            const positive = filtered.filter(r => r > 0).length;

            return {
              day,
              avgReturn: filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0,
              winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
            };
          });

          // Identify famous seasonal patterns
          const patterns: SeasonalPattern[] = [];

          // Santa Rally (last week of December - typically last 5-7 trading days)
          const santaRallyReturns: number[] = [];
          for (const point of priceData) {
            const month = point.date.getMonth();
            const day = point.date.getDate();
            // Last week of December (days 24-31)
            if (month === 11 && day >= 24) {
              santaRallyReturns.push(point.return);
            }
          }
          if (santaRallyReturns.length > 0) {
            const filtered = santaRallyReturns.filter(r => !isNaN(r));
            const avgReturn = filtered.reduce((a, b) => a + b, 0) / filtered.length;
            const positive = filtered.filter(r => r > 0).length;
            patterns.push({
              name: 'Santa Rally',
              period: 'Late December (Dec 24-31)',
              avgReturn,
              winRate: (positive / filtered.length) * 100,
              description: 'Traditional year-end rally in stocks',
            });
          }

          // Sell in May and Go Away (May through October)
          const sellInMayReturns: number[] = [];
          for (const point of priceData) {
            const month = point.date.getMonth();
            // May (4) through October (9)
            if (month >= 4 && month <= 9) {
              sellInMayReturns.push(point.return);
            }
          }
          if (sellInMayReturns.length > 0) {
            const filtered = sellInMayReturns.filter(r => !isNaN(r));
            const avgReturn = filtered.reduce((a, b) => a + b, 0) / filtered.length;
            const positive = filtered.filter(r => r > 0).length;
            patterns.push({
              name: 'Sell in May',
              period: 'May - October',
              avgReturn, // Actual average return (negative means weakness)
              winRate: (positive / filtered.length) * 100,
              description: 'Summer doldrums - historically weak period',
            });
          }

          // January Effect
          const januaryReturns = monthlyData['January']?.returns || [];
          if (januaryReturns.length > 0) {
            const avgReturn = januaryReturns.reduce((a, b) => a + b, 0) / januaryReturns.length;
            const positive = januaryReturns.filter(r => r > 0).length;
            patterns.push({
              name: 'January Effect',
              period: 'January',
              avgReturn,
              winRate: (positive / januaryReturns.length) * 100,
              description: 'Tax-loss selling reversal and new year optimism',
            });
          }

          // Find best and worst months
          const sortedMonths = [...monthlyStats].sort((a, b) => b.avgReturn - a.avgReturn);
          const bestMonths = sortedMonths.slice(0, 3);
          const worstMonths = sortedMonths.slice(-3).reverse();

          // Find strongest quarter
          const sortedQuarters = [...quarterlyStats].sort((a, b) => b.avgReturn - a.avgReturn);
          const strongestQuarter = sortedQuarters[0] || { quarter: 'N/A', avgReturn: 0, winRate: 0, volatility: 0 };

          // Find best day of week
          const sortedDays = [...dayOfWeekStats].sort((a, b) => b.avgReturn - a.avgReturn);
          const bestDay = sortedDays[0] || { day: 'N/A', avgReturn: 0, winRate: 0 };

          return {
            symbol,
            period: `${years} years`,
            dataPoints: priceData.length,

            monthlyStats,
            quarterlyStats,
            dayOfWeekStats,
            patterns,

            summary: {
              bestMonths: bestMonths.map(m => ({
                month: m.month,
                avgReturn: m.avgReturn,
                consistency: m.consistency,
              })),
              worstMonths: worstMonths.map(m => ({
                month: m.month,
                avgReturn: m.avgReturn,
                consistency: m.consistency,
              })),
              strongestQuarter: {
                quarter: strongestQuarter.quarter,
                avgReturn: strongestQuarter.avgReturn,
                winRate: strongestQuarter.winRate,
              },
              bestDayOfWeek: {
                day: bestDay.day,
                avgReturn: bestDay.avgReturn,
                winRate: bestDay.winRate,
              },
            },

            insights: generateInsights(monthlyStats, quarterlyStats, dayOfWeekStats, patterns),
          };
        }
      );

      return formatToolResult(analysis, {
        sourceUrl: `https://eodhd.com/api/eod/${symbol}`,
        timestamp: new Date().toISOString(),
        apiCost: 1,
      });
    } catch (error) {
      return formatToolError(error, 'Error analyzing seasonal patterns');
    }
  }
);

/**
 * Generate actionable insights from seasonal analysis
 */
function generateInsights(
  monthlyStats: MonthlyStats[],
  quarterlyStats: QuarterlyStats[],
  dayOfWeekStats: DayOfWeekStats[],
  patterns: SeasonalPattern[]
): string[] {
  const insights: string[] = [];

  // Monthly insights
  const strongMonths = monthlyStats.filter(m => m.consistency > 60 && m.avgReturn > 0);
  if (strongMonths.length > 0) {
    insights.push(
      `Strong seasonal months: ${strongMonths.map(m => m.month).join(', ')} (60%+ positive consistency)`
    );
  }

  const weakMonths = monthlyStats.filter(m => m.consistency < 40 && m.avgReturn < 0);
  if (weakMonths.length > 0) {
    insights.push(
      `Weak seasonal months: ${weakMonths.map(m => m.month).join(', ')} (historically negative)`
    );
  }

  // Quarterly insights
  if (quarterlyStats.length > 0) {
    const strongQuarter = quarterlyStats.reduce((a, b) => a.avgReturn > b.avgReturn ? a : b);
    insights.push(`Strongest quarter: ${strongQuarter.quarter} (avg return: ${strongQuarter.avgReturn.toFixed(2)}%)`);
  }

  // Day of week insights
  const strongDays = dayOfWeekStats.filter(d => d.winRate > 52);
  if (strongDays.length > 0) {
    insights.push(
      `Strong days: ${strongDays.map(d => d.day).join(', ')} (above 52% win rate)`
    );
  }

  // Pattern insights
  const strongPatterns = patterns.filter(p => p.winRate > 60);
  if (strongPatterns.length > 0) {
    insights.push(
      `Confirmed patterns: ${strongPatterns.map(p => p.name).join(', ')} (historical edge exists)`
    );
  }

  return insights;
}
