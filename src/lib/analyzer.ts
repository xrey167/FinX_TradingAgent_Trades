/**
 * Analysis Library - Hybrid Mode (Local + Claude Reasoning)
 *
 * This module provides functions to analyze market regimes:
 * - With Claude API: Gets AI-powered reasoning and insights
 * - Without Claude API: Uses local technical analysis only
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { fetchMarketDataTool } from '../tools/market-data.ts';
import { analyzeRegimeTool } from '../tools/regime-analyzer.ts';
import type { MarketSymbol, Timeframe, RegimeAnalysis } from '../types.ts';
import { HISTORICAL_BARS, MARKET_DISPLAY_NAMES, TIMEFRAME_DISPLAY_NAMES } from '../config.ts';

/**
 * Extended analysis result with mode information
 */
export interface ExtendedRegimeAnalysis extends RegimeAnalysis {
  usedClaude?: boolean;
  claudeInsights?: string;
}

/**
 * Check if Claude API is available
 */
export function hasClaudeAPI(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Analyze with Claude's reasoning (requires API key)
 */
async function analyzeMarketWithClaude(
  market: MarketSymbol,
  timeframe: Timeframe
): Promise<ExtendedRegimeAnalysis> {
  const bars = HISTORICAL_BARS[timeframe];

  // First, get the technical analysis locally
  const localAnalysis = await analyzeMarketLocal(market, timeframe);

  // Then ask Claude to provide deeper insights
  const prompt = `You are a market analyst. Analyze the following technical indicators for ${MARKET_DISPLAY_NAMES[market]} on the ${TIMEFRAME_DISPLAY_NAMES[timeframe]} timeframe:

Market: ${market}
Timeframe: ${timeframe}
Regime: ${localAnalysis.regime}
Confidence: ${localAnalysis.confidence}%

Technical Indicators:
- RSI: ${localAnalysis.indicators.rsi?.toFixed(1) ?? 'N/A'}
- Slope: ${((localAnalysis.indicators.slope ?? 0) * 100).toFixed(3)}%
- SMA 20: ${localAnalysis.indicators.sma20?.toFixed(4) ?? 'N/A'}
- SMA 50: ${localAnalysis.indicators.sma50?.toFixed(4) ?? 'N/A'}
- Bollinger Band Width: ${localAnalysis.indicators.bollingerBands ? (((localAnalysis.indicators.bollingerBands.upper - localAnalysis.indicators.bollingerBands.lower) / localAnalysis.indicators.bollingerBands.middle) * 100).toFixed(2) : 'N/A'}%
- ATR: ${localAnalysis.indicators.atr?.toFixed(4) ?? 'N/A'}

Initial Assessment: ${localAnalysis.reasoning}

Provide:
1. Your assessment of this regime classification (agree/disagree and why)
2. Key factors supporting or contradicting the regime
3. What traders should watch for next
4. Risk factors to consider

Be concise but insightful (3-5 sentences).`;

  try {
    let claudeInsights = '';

    for await (const message of query({
      prompt,
      options: {
        model: 'claude-sonnet-4-5-20241022',
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if (message.type === 'result' && message.subtype === 'success') {
        claudeInsights = message.result;
        break;
      }
    }

    return {
      ...localAnalysis,
      usedClaude: true,
      claudeInsights: claudeInsights || localAnalysis.reasoning,
    };
  } catch (error) {
    console.warn('Claude API failed, falling back to local analysis:', error);
    return { ...localAnalysis, usedClaude: false };
  }
}

/**
 * Analyze with local technical analysis only (no API key required)
 */
async function analyzeMarketLocal(
  market: MarketSymbol,
  timeframe: Timeframe
): Promise<RegimeAnalysis> {
  const bars = HISTORICAL_BARS[timeframe];

  // Step 1: Fetch market data using the tool handler directly
  const dataResult = await fetchMarketDataTool.handler({
    market,
    timeframe,
    bars,
  }, {});

  if (dataResult.isError) {
    throw new Error(`Failed to fetch data for ${market} ${timeframe}`);
  }

  // Parse the JSON response
  const dataText = dataResult.content[0]?.text;
  if (!dataText) {
    throw new Error(`No data received for ${market} ${timeframe}`);
  }

  const marketData = JSON.parse(dataText);

  // Step 2: Analyze regime using the tool handler directly
  const regimeResult = await analyzeRegimeTool.handler({
    market,
    timeframe,
    ohlcv: marketData.data,
  }, {});

  if (regimeResult.isError) {
    throw new Error(`Failed to analyze regime for ${market} ${timeframe}`);
  }

  // Parse the JSON response
  const regimeText = regimeResult.content[0]?.text;
  if (!regimeText) {
    throw new Error(`No analysis received for ${market} ${timeframe}`);
  }

  const analysis: RegimeAnalysis = JSON.parse(regimeText);
  return analysis;
}

/**
 * Analyze a single market and timeframe (hybrid mode)
 * Uses Claude if API key available, falls back to local analysis
 */
export async function analyzeMarket(
  market: MarketSymbol,
  timeframe: Timeframe,
  useClaude: boolean = hasClaudeAPI()
): Promise<ExtendedRegimeAnalysis> {
  if (useClaude && hasClaudeAPI()) {
    return analyzeMarketWithClaude(market, timeframe);
  } else {
    const local = await analyzeMarketLocal(market, timeframe);
    return { ...local, usedClaude: false };
  }
}

/**
 * Analyze multiple markets and timeframes
 */
export async function analyzeMarkets(
  markets: MarketSymbol[],
  timeframes: Timeframe[],
  useClaude: boolean = hasClaudeAPI()
): Promise<ExtendedRegimeAnalysis[]> {
  const results: ExtendedRegimeAnalysis[] = [];

  for (const market of markets) {
    for (const timeframe of timeframes) {
      try {
        const analysis = await analyzeMarket(market, timeframe, useClaude);
        results.push(analysis);
      } catch (error) {
        console.error(`Error analyzing ${market} ${timeframe}:`, error);
      }
    }
  }

  return results;
}

/**
 * Analyze all configured markets and timeframes
 */
export async function analyzeAllMarkets(
  markets: MarketSymbol[],
  timeframes: Timeframe[],
  useClaude: boolean = hasClaudeAPI()
): Promise<ExtendedRegimeAnalysis[]> {
  return analyzeMarkets(markets, timeframes, useClaude);
}
