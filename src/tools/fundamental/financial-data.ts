/**
 * Financial Data Tool - Fetch fundamental data for stocks
 *
 * MCP tool for fetching comprehensive fundamental data using EODHD API:
 * - Company information (sector, industry)
 * - Valuation metrics (P/E, PEG, P/B, EV/EBITDA)
 * - Financial statements (balance sheet, income statement, cash flow)
 * - Earnings history and estimates
 * - ESG scores
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getEODHDClient } from '../../lib/eodhd-client-singleton.ts';
import { globalToolCache } from '../../lib/tool-cache.ts';
import { formatToolResult, formatToolError, requireEnvVar, createCacheKey } from '../helpers.ts';

const inputSchema = z.object({
  symbol: z.string().describe('Stock ticker symbol (e.g., AAPL.US, TSLA.US)'),
});

export const fetchFinancialDataTool = tool(
  'fetch_financial_data',
  `Fetch comprehensive fundamental data for a stock including:
- Company information (sector, industry)
- Valuation metrics (P/E, PEG, P/B, EV/EBITDA)
- Financial statements (balance sheet, income statement, cash flow)
- Earnings history and estimates
- ESG scores

Returns quarterly and annual data. Costs 10 API calls per request.`,
  inputSchema.shape,
  async (input) => {
    try {
      requireEnvVar('EODHD_API_KEY');
      const { symbol } = input;
      const cacheKey = createCacheKey('fetch_financial_data', { symbol });

      // Try cache first (30 minute TTL for fundamentals)
      const summary = await globalToolCache.getOrFetch(
        cacheKey,
        30 * 60 * 1000, // 30 minutes
        async () => {
          const client = getEODHDClient();
          const fundamentals = await client.getFundamentals(symbol);

          // Extract key metrics for easier analysis
          return {
            symbol: fundamentals.General.Code,
            company: fundamentals.General.Name,
            sector: fundamentals.General.Sector,
            industry: fundamentals.General.Industry,

            valuation: {
              marketCap: fundamentals.Highlights.MarketCapitalization,
              peRatio: fundamentals.Highlights.PERatio,
              pegRatio: fundamentals.Highlights.PEGRatio,
              priceToBook: fundamentals.Valuation.PriceBookMRQ,
              priceToSales: fundamentals.Valuation.PriceSalesTTM,
              evToEbitda: fundamentals.Valuation.EnterpriseValueEbitda,
            },

            profitability: {
              profitMargin: fundamentals.Highlights.ProfitMargin,
              operatingMargin: fundamentals.Highlights.OperatingMarginTTM,
              roe: fundamentals.Highlights.ReturnOnEquityTTM,
              roa: fundamentals.Highlights.ReturnOnAssetsTTM,
            },

            growth: {
              revenueGrowthYOY: fundamentals.Highlights.QuarterlyRevenueGrowthYOY,
              earningsGrowthYOY: fundamentals.Highlights.QuarterlyEarningsGrowthYOY,
            },

            // Most recent quarter financials
            recentQuarter: Object.keys(fundamentals.Financials.Income_Statement.quarterly)[0] || 'N/A',
            revenue: (() => {
              const quarterKey = Object.keys(fundamentals.Financials.Income_Statement.quarterly)[0];
              return quarterKey ? fundamentals.Financials.Income_Statement.quarterly[quarterKey]?.totalRevenue : null;
            })(),
            netIncome: (() => {
              const quarterKey = Object.keys(fundamentals.Financials.Income_Statement.quarterly)[0];
              return quarterKey ? fundamentals.Financials.Income_Statement.quarterly[quarterKey]?.netIncome : null;
            })(),
            freeCashFlow: (() => {
              const quarterKey = Object.keys(fundamentals.Financials.Cash_Flow.quarterly)[0];
              return quarterKey ? fundamentals.Financials.Cash_Flow.quarterly[quarterKey]?.freeCashFlow : null;
            })(),

            // Full data for detailed analysis
            fullData: fundamentals,
          };
        }
      );

      return formatToolResult(summary, {
        sourceUrl: `https://eodhd.com/api/fundamentals/${symbol}`,
        timestamp: new Date().toISOString(),
        apiCost: 10,
      });
    } catch (error) {
      return formatToolError(error, 'Error fetching fundamental data');
    }
  }
);
