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
import {
  getDataFetcher,
  HourOfDayExtractor,
  MarketSessionExtractor,
  WeekPositionExtractor,
  WeekOfMonthExtractor,
  DayOfMonthExtractor,
} from './seasonal-patterns/index.ts';
import type { CandleData, SeasonalTimeframe } from './seasonal-patterns/index.ts';
import { EventCalendar } from './seasonal-patterns/event-calendar.ts';
import { FOMCWeekExtractor, OptionsExpiryWeekExtractor, EarningsSeasonExtractor } from './seasonal-patterns/event-extractors.ts';
import * as path from 'path';

const inputSchema = z.object({
  symbol: z.string().describe('Stock ticker symbol (e.g., AAPL.US, SPY.US)'),
  years: z.number().optional().default(5).describe('Number of years of history to analyze (default: 5)'),
  timeframe: z
    .enum(['daily', 'hourly'])
    .optional()
    .default('daily')
    .describe('Timeframe for analysis: daily (1 API call) or hourly (5 API calls, limited to 1-2 years)'),
  patterns: z
    .array(z.string())
    .optional()
    .describe('Specific patterns to analyze (e.g., ["month-of-year", "hour-of-day"]). If not specified, uses default patterns for timeframe.'),
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

interface HourOfDayStats {
  hour: string;
  avgReturn: number;
  winRate: number;
  sampleSize: number;
}

interface MarketSessionStats {
  session: string;
  avgReturn: number;
  winRate: number;
  volatility: number;
  sampleSize: number;
}

interface EventBasedStats {
  event: string;
  avgReturn: number;
  winRate: number;
  volatility: number;
  sampleSize: number;
  impact: 'high' | 'medium' | 'low';
}

interface WeekPositionStats {
  position: string; // "First-Monday", "Last-Friday", etc.
  avgReturn: number;
  winRate: number;
  sampleSize: number;
}

interface WeekOfMonthStats {
  week: string; // "Week-1", "Week-2", etc.
  avgReturn: number;
  winRate: number;
  sampleSize: number;
}

interface DayOfMonthStats {
  day: string; // "Day-1", "Day-15", etc.
  avgReturn: number;
  winRate: number;
  sampleSize: number;
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
  `Analyze seasonal patterns and calendar effects in historical price data across multiple timeframes.

Identifies:
- **Daily patterns** (default): Monthly, quarterly, day-of-week, famous patterns (Santa Rally, Sell in May)
- **Hourly patterns**: Hour-of-day, market sessions (Pre-Market, Open, Lunch, Power Hour, After Hours)
- Multi-year consistency and statistical significance

API Costs:
- Daily analysis: 1 API call (5+ years history)
- Hourly analysis: 5 API calls (1-2 years history limit)

Cached for 24-48 hours depending on timeframe.`,
  inputSchema.shape,
  async (input) => {
    try {
      requireEnvVar('EODHD_API_KEY');
      const { symbol, years, timeframe = 'daily', patterns } = input;
      // Schema version v5: Added week positioning patterns (week-of-month, day-of-month, week positions)
      const cacheKey = createCacheKey('analyze_seasonal_v5', { symbol, years, timeframe });

      // Cache TTL: 48 hours for hourly (user decision), 24 hours for daily
      const cacheTTL = timeframe === 'hourly' ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      // Try cache first
      const analysis = await globalToolCache.getOrFetch(
        cacheKey,
        cacheTTL,
        async () => {
          // Use new data fetcher for multi-timeframe support
          const dataFetcher = getDataFetcher(timeframe as SeasonalTimeframe);
          const candles: CandleData[] = await dataFetcher.fetch(symbol, years);

          if (candles.length === 0) {
            throw new Error('No historical data available for seasonal analysis');
          }

          // Convert candles to legacy format for existing analysis code
          const data = candles.map((c) => ({
            date: c.date,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          }));

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

            // Calculate monthly aggregate returns (first to last price in each month)
            // Group by year-month and find first/last closing prices
            const monthlyPrices: Record<string, { first: number; last: number; firstDate: Date; lastDate: Date }> = {};
            for (let i = 0; i < priceData.length; i++) {
              const point = priceData[i];
              if (point) {
                const pointMonth = monthNames[point.date.getMonth()];
                if (pointMonth === month) {
                  const year = point.date.getFullYear().toString();
                  const key = year;

                  if (!monthlyPrices[key]) {
                    monthlyPrices[key] = {
                      first: point.close,
                      last: point.close,
                      firstDate: point.date,
                      lastDate: point.date
                    };
                  } else {
                    // Update if this is earlier (first) or later (last) in the month
                    if (point.date < monthlyPrices[key]!.firstDate) {
                      monthlyPrices[key]!.first = point.close;
                      monthlyPrices[key]!.firstDate = point.date;
                    }
                    if (point.date > monthlyPrices[key]!.lastDate) {
                      monthlyPrices[key]!.last = point.close;
                      monthlyPrices[key]!.lastDate = point.date;
                    }
                  }
                }
              }
            }

            // Calculate monthly returns from first to last price
            const monthlyReturns: Record<string, number> = {};
            for (const [year, prices] of Object.entries(monthlyPrices)) {
              monthlyReturns[year] = ((prices.last - prices.first) / prices.first) * 100;
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

          // Analyze hour-of-day patterns (only for hourly timeframe)
          let hourOfDayStats: HourOfDayStats[] | undefined;
          if (timeframe === 'hourly') {
            const hourExtractor = new HourOfDayExtractor();
            const hourlyData: Record<string, number[]> = {};

            for (const point of priceData) {
              const hour = hourExtractor.extract(point.date.getTime());
              if (hour) {
                if (!hourlyData[hour]) hourlyData[hour] = [];
                hourlyData[hour]?.push(point.return);
              }
            }

            hourOfDayStats = Object.entries(hourlyData)
              .map(([hour, returns]) => {
                const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
                const positive = filtered.filter(r => r > 0).length;
                const sum = filtered.reduce((a, b) => a + b, 0);
                const avg = filtered.length > 0 ? sum / filtered.length : 0;

                return {
                  hour,
                  avgReturn: isFinite(avg) ? avg : 0,
                  winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                  sampleSize: filtered.length,
                };
              })
              .sort((a, b) => {
                // Sort by hour number (extract from "Hour-XX" format)
                const hourA = parseInt(a.hour.split('-')[1] || '0');
                const hourB = parseInt(b.hour.split('-')[1] || '0');
                return hourA - hourB;
              });
          }

          // Analyze market session patterns (only for hourly timeframe)
          let marketSessionStats: MarketSessionStats[] | undefined;
          if (timeframe === 'hourly') {
            const sessionExtractor = new MarketSessionExtractor();
            const sessionData: Record<string, number[]> = {};

            for (const point of priceData) {
              const session = sessionExtractor.extract(point.date.getTime());
              if (session) {
                if (!sessionData[session]) sessionData[session] = [];
                sessionData[session]?.push(point.return);
              }
            }

            marketSessionStats = Object.entries(sessionData).map(([session, returns]) => {
              const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
              const positive = filtered.filter(r => r > 0).length;
              const sum = filtered.reduce((a, b) => a + b, 0);
              const mean = filtered.length > 0 ? sum / filtered.length : 0;
              const variance = filtered.length > 0
                ? filtered.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / filtered.length
                : 0;
              const volatility = Math.sqrt(variance);

              return {
                session,
                avgReturn: isFinite(mean) ? mean : 0,
                winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                volatility: isFinite(volatility) ? volatility : 0,
                sampleSize: filtered.length,
              };
            });
          }

          // Analyze event-based patterns (FOMC weeks, options expiry, earnings seasons)
          let eventBasedStats: EventBasedStats[] | undefined;
          if (timeframe === 'daily') {
            try {
              // Try to load event calendar config (optional)
              const eventConfigPath = path.join(process.cwd(), '.claude', 'seasonal-events.json');
              const calendar = EventCalendar.fromFile(eventConfigPath);

              // Extract event periods
              const fomcExtractor = new FOMCWeekExtractor(calendar);
              const optionsExtractor = new OptionsExpiryWeekExtractor(calendar);
              const earningsExtractor = new EarningsSeasonExtractor(calendar);

              const eventData: Record<string, number[]> = {};

              for (const point of priceData) {
                const fomcWeek = fomcExtractor.extract(point.date.getTime());
                if (fomcWeek) {
                  if (!eventData[fomcWeek]) eventData[fomcWeek] = [];
                  eventData[fomcWeek]?.push(point.return);
                }

                const optionsWeek = optionsExtractor.extract(point.date.getTime());
                if (optionsWeek) {
                  if (!eventData[optionsWeek]) eventData[optionsWeek] = [];
                  eventData[optionsWeek]?.push(point.return);
                }

                const earningsSeason = earningsExtractor.extract(point.date.getTime());
                if (earningsSeason) {
                  if (!eventData[earningsSeason]) eventData[earningsSeason] = [];
                  eventData[earningsSeason]?.push(point.return);
                }
              }

              eventBasedStats = Object.entries(eventData).map(([event, returns]) => {
                const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
                const positive = filtered.filter(r => r > 0).length;
                const sum = filtered.reduce((a, b) => a + b, 0);
                const mean = filtered.length > 0 ? sum / filtered.length : 0;
                const variance = filtered.length > 0
                  ? filtered.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / filtered.length
                  : 0;
                const volatility = Math.sqrt(variance);

                // Determine impact level
                let impact: 'high' | 'medium' | 'low' = 'medium';
                if (event.includes('FOMC')) impact = 'high';
                else if (event.includes('Options')) impact = 'medium';
                else if (event.includes('Earnings')) impact = 'medium';

                return {
                  event,
                  avgReturn: isFinite(mean) ? mean : 0,
                  winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                  volatility: isFinite(volatility) ? volatility : 0,
                  sampleSize: filtered.length,
                  impact,
                };
              });
            } catch (error) {
              // Event calendar not configured - skip event analysis
              eventBasedStats = undefined;
            }
          }

          // Analyze week positioning patterns (only for daily timeframe)
          let weekPositionStats: WeekPositionStats[] | undefined;
          let weekOfMonthStats: WeekOfMonthStats[] | undefined;
          let dayOfMonthStats: DayOfMonthStats[] | undefined;

          if (timeframe === 'daily') {
            // Week Position (First-Monday, Last-Friday, etc.)
            const weekPosExtractor = new WeekPositionExtractor();
            const weekPosData: Record<string, number[]> = {};

            for (const point of priceData) {
              const position = weekPosExtractor.extract(point.date.getTime());
              if (position) {
                if (!weekPosData[position]) weekPosData[position] = [];
                weekPosData[position]?.push(point.return);
              }
            }

            weekPositionStats = Object.entries(weekPosData)
              .map(([position, returns]) => {
                const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
                const positive = filtered.filter(r => r > 0).length;
                const sum = filtered.reduce((a, b) => a + b, 0);
                const avg = filtered.length > 0 ? sum / filtered.length : 0;

                return {
                  position,
                  avgReturn: isFinite(avg) ? avg : 0,
                  winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                  sampleSize: filtered.length,
                };
              })
              .filter(s => s.sampleSize >= 10); // Minimum sample size

            // Week of Month (Week-1 through Week-5)
            const weekOfMonthExtractor = new WeekOfMonthExtractor();
            const weekOfMonthData: Record<string, number[]> = {};

            for (const point of priceData) {
              const week = weekOfMonthExtractor.extract(point.date.getTime());
              if (week) {
                if (!weekOfMonthData[week]) weekOfMonthData[week] = [];
                weekOfMonthData[week]?.push(point.return);
              }
            }

            weekOfMonthStats = Object.entries(weekOfMonthData)
              .map(([week, returns]) => {
                const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
                const positive = filtered.filter(r => r > 0).length;
                const sum = filtered.reduce((a, b) => a + b, 0);
                const avg = filtered.length > 0 ? sum / filtered.length : 0;

                return {
                  week,
                  avgReturn: isFinite(avg) ? avg : 0,
                  winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                  sampleSize: filtered.length,
                };
              })
              .sort((a, b) => {
                const weekA = parseInt(a.week.split('-')[1] || '0');
                const weekB = parseInt(b.week.split('-')[1] || '0');
                return weekA - weekB;
              });

            // Day of Month (Day-1 through Day-31)
            const dayOfMonthExtractor = new DayOfMonthExtractor();
            const dayOfMonthData: Record<string, number[]> = {};

            for (const point of priceData) {
              const day = dayOfMonthExtractor.extract(point.date.getTime());
              if (day) {
                if (!dayOfMonthData[day]) dayOfMonthData[day] = [];
                dayOfMonthData[day]?.push(point.return);
              }
            }

            dayOfMonthStats = Object.entries(dayOfMonthData)
              .map(([day, returns]) => {
                const filtered = returns.filter(r => !isNaN(r) && isFinite(r));
                const positive = filtered.filter(r => r > 0).length;
                const sum = filtered.reduce((a, b) => a + b, 0);
                const avg = filtered.length > 0 ? sum / filtered.length : 0;

                return {
                  day,
                  avgReturn: isFinite(avg) ? avg : 0,
                  winRate: filtered.length > 0 ? (positive / filtered.length) * 100 : 0,
                  sampleSize: filtered.length,
                };
              })
              .filter(s => s.sampleSize >= 5) // Minimum sample size
              .sort((a, b) => {
                const dayA = parseInt(a.day.split('-')[1] || '0');
                const dayB = parseInt(b.day.split('-')[1] || '0');
                return dayA - dayB;
              });
          }

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

          // Find best hour and session (only for hourly timeframe)
          const bestHour = hourOfDayStats && hourOfDayStats.length > 0
            ? [...hourOfDayStats].sort((a, b) => b.avgReturn - a.avgReturn)[0]
            : undefined;

          const bestSession = marketSessionStats && marketSessionStats.length > 0
            ? [...marketSessionStats].sort((a, b) => b.avgReturn - a.avgReturn)[0]
            : undefined;

          // Find best/worst events
          const bestEvent = eventBasedStats && eventBasedStats.length > 0
            ? [...eventBasedStats].sort((a, b) => b.avgReturn - a.avgReturn)[0]
            : undefined;

          return {
            symbol,
            period: `${years} years`,
            dataPoints: priceData.length,
            timeframe,

            monthlyStats,
            quarterlyStats,
            dayOfWeekStats,
            ...(hourOfDayStats && { hourOfDayStats }),
            ...(marketSessionStats && { marketSessionStats }),
            ...(eventBasedStats && { eventBasedStats }),
            ...(weekPositionStats && { weekPositionStats }),
            ...(weekOfMonthStats && { weekOfMonthStats }),
            ...(dayOfMonthStats && { dayOfMonthStats }),
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
              ...(bestHour && {
                bestHourOfDay: {
                  hour: bestHour.hour,
                  avgReturn: bestHour.avgReturn,
                  winRate: bestHour.winRate,
                  sampleSize: bestHour.sampleSize,
                },
              }),
              ...(bestSession && {
                bestMarketSession: {
                  session: bestSession.session,
                  avgReturn: bestSession.avgReturn,
                  winRate: bestSession.winRate,
                  volatility: bestSession.volatility,
                },
              }),
              ...(bestEvent && {
                bestEvent: {
                  event: bestEvent.event,
                  avgReturn: bestEvent.avgReturn,
                  winRate: bestEvent.winRate,
                  volatility: bestEvent.volatility,
                  impact: bestEvent.impact,
                },
              }),
            },

            insights: generateInsights(monthlyStats, quarterlyStats, dayOfWeekStats, patterns, hourOfDayStats, marketSessionStats, eventBasedStats, weekPositionStats, weekOfMonthStats, dayOfMonthStats),
          };
        }
      );

      // Calculate API cost based on timeframe
      const dataFetcher = getDataFetcher(timeframe as SeasonalTimeframe);
      const apiCost = dataFetcher.getCostEstimate();

      return formatToolResult(analysis, {
        sourceUrl: `https://eodhd.com/api/eod/${symbol}`,
        timestamp: new Date().toISOString(),
        apiCost,
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
  patterns: SeasonalPattern[],
  hourOfDayStats?: HourOfDayStats[],
  marketSessionStats?: MarketSessionStats[],
  eventBasedStats?: EventBasedStats[],
  weekPositionStats?: WeekPositionStats[],
  weekOfMonthStats?: WeekOfMonthStats[],
  dayOfMonthStats?: DayOfMonthStats[]
): string[] {
  const insights: string[] = [];

  // Event-based insights (highest priority for trading around events)
  if (eventBasedStats && eventBasedStats.length > 0) {
    const positiveEvents = eventBasedStats.filter(e => e.avgReturn > 0 && e.winRate > 55);
    const negativeEvents = eventBasedStats.filter(e => e.avgReturn < 0 || e.winRate < 45);

    if (positiveEvents.length > 0) {
      const topEvent = positiveEvents[0];
      if (topEvent) {
        insights.push(
          `Positive event pattern: ${topEvent.event} (${topEvent.winRate.toFixed(1)}% win rate, ${topEvent.avgReturn.toFixed(3)}% avg)`
        );
      }
    }

    if (negativeEvents.length > 0) {
      const worstEvent = negativeEvents[0];
      if (worstEvent) {
        insights.push(
          `Avoid or hedge during: ${worstEvent.event} (${worstEvent.winRate.toFixed(1)}% win rate, ${worstEvent.avgReturn.toFixed(3)}% avg)`
        );
      }
    }
  }

  // Week positioning insights (intramonth patterns)
  if (weekPositionStats && weekPositionStats.length > 0) {
    const strongPositions = weekPositionStats.filter(p => p.winRate > 55 && p.sampleSize >= 10);
    if (strongPositions.length > 0) {
      const topPositions = strongPositions
        .sort((a, b) => b.avgReturn - a.avgReturn)
        .slice(0, 2)
        .map(p => `${p.position} (${p.winRate.toFixed(1)}% win rate)`);
      insights.push(`Strong week positions: ${topPositions.join(', ')}`);
    }

    const weakPositions = weekPositionStats.filter(p => p.winRate < 45 && p.sampleSize >= 10);
    if (weakPositions.length > 0) {
      const bottom = weakPositions[0];
      if (bottom) {
        insights.push(`Avoid: ${bottom.position} (${bottom.winRate.toFixed(1)}% win rate)`);
      }
    }
  }

  // Week of month insights
  if (weekOfMonthStats && weekOfMonthStats.length > 0) {
    const strongWeeks = weekOfMonthStats.filter(w => w.winRate > 55);
    if (strongWeeks.length > 0) {
      const topWeek = strongWeeks.sort((a, b) => b.avgReturn - a.avgReturn)[0];
      if (topWeek) {
        insights.push(`Best week of month: ${topWeek.week} (${topWeek.winRate.toFixed(1)}% win rate, ${topWeek.avgReturn.toFixed(3)}% avg)`);
      }
    }
  }

  // Day of month insights (turn of month effect, etc.)
  if (dayOfMonthStats && dayOfMonthStats.length > 0) {
    // Check for turn-of-month effect (last/first few days)
    const turnOfMonth = dayOfMonthStats.filter(d => {
      const dayNum = parseInt(d.day.split('-')[1] || '0');
      return (dayNum <= 3 || dayNum >= 28) && d.sampleSize >= 10;
    });

    if (turnOfMonth.length > 0) {
      const avgTurnReturn = turnOfMonth.reduce((sum, d) => sum + d.avgReturn, 0) / turnOfMonth.length;
      const avgTurnWinRate = turnOfMonth.reduce((sum, d) => sum + d.winRate, 0) / turnOfMonth.length;

      if (avgTurnWinRate > 52) {
        insights.push(`Turn-of-month effect detected (${avgTurnWinRate.toFixed(1)}% win rate for days 1-3 & 28-31)`);
      }
    }
  }

  // Hourly insights (highest priority for hourly analysis)
  if (hourOfDayStats && hourOfDayStats.length > 0) {
    const strongHours = hourOfDayStats.filter(h => h.winRate > 55 && h.sampleSize > 20);
    if (strongHours.length > 0) {
      const topHours = strongHours.slice(0, 3).map(h => {
        // Convert "Hour-XX" to readable time (UTC)
        const hourNum = parseInt(h.hour.split('-')[1] || '0');
        return `${h.hour} (${h.winRate.toFixed(1)}% win rate)`;
      });
      insights.push(`Strong hours: ${topHours.join(', ')}`);
    }

    const weakHours = hourOfDayStats.filter(h => h.winRate < 45 && h.sampleSize > 20);
    if (weakHours.length > 0) {
      const bottomHours = weakHours.slice(0, 2).map(h => h.hour);
      insights.push(`Weak hours to avoid: ${bottomHours.join(', ')}`);
    }
  }

  // Market session insights
  if (marketSessionStats && marketSessionStats.length > 0) {
    const bestSession = marketSessionStats.reduce((a, b) => a.avgReturn > b.avgReturn ? a : b);
    if (bestSession.winRate > 55) {
      insights.push(
        `Best market session: ${bestSession.session} (${bestSession.winRate.toFixed(1)}% win rate, ${bestSession.avgReturn.toFixed(3)}% avg)`
      );
    }

    const highVolSessions = marketSessionStats.filter(s => s.volatility > 0.15 && s.sampleSize > 50);
    if (highVolSessions.length > 0) {
      insights.push(
        `High volatility sessions: ${highVolSessions.map(s => s.session).join(', ')} (increased risk/reward)`
      );
    }
  }

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
