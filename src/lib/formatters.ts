/**
 * Output Formatters - Pretty Console Output
 *
 * This module provides functions to format market regime analysis
 * results into readable console output with boxes and tables.
 */

import type { RegimeAnalysis, MarketSymbol, Timeframe, MarketRegime } from '../types.ts';
import type { ExtendedRegimeAnalysis } from './analyzer.ts';
import { MARKET_DISPLAY_NAMES, TIMEFRAME_DISPLAY_NAMES } from '../config.ts';

/**
 * Format a single regime analysis result with a pretty box
 */
export function formatRegimeResult(analysis: ExtendedRegimeAnalysis): string {
  const marketName = MARKET_DISPLAY_NAMES[analysis.market as MarketSymbol];
  const timeframeName = TIMEFRAME_DISPLAY_NAMES[analysis.timeframe as Timeframe];

  const boxWidth = 61;
  const title = `MARKET REGIME ANALYSIS: ${marketName} (${timeframeName})`;
  const paddedTitle = title.padEnd(boxWidth - 2);

  // Determine direction indicator
  const slope = analysis.indicators.slope ?? 0;
  const direction = slope > 0.001 ? 'Upward ↑' : slope < -0.001 ? 'Downward ↓' : 'Neutral ↔';

  // Mode indicator
  const mode = analysis.usedClaude ? '🤖 AI-Powered' : '📊 Technical';

  const lines = [];
  lines.push('╔' + '═'.repeat(boxWidth) + '╗');
  lines.push('║ ' + paddedTitle + ' ║');
  lines.push('╠' + '═'.repeat(boxWidth) + '╣');
  lines.push(`║ Regime:     ${analysis.regime.padEnd(boxWidth - 14)} ║`);
  lines.push(`║ Confidence: ${analysis.confidence.toFixed(1)}%${' '.repeat(boxWidth - 23)} ║`);
  lines.push(`║ Direction:  ${direction.padEnd(boxWidth - 14)} ║`);
  lines.push(`║ Mode:       ${mode.padEnd(boxWidth - 14)} ║`);
  lines.push('╠' + '═'.repeat(boxWidth) + '╣');
  lines.push('║ Technical Indicators:' + ' '.repeat(boxWidth - 23) + '║');

  // Format indicators
  const indicators = analysis.indicators;
  if (indicators.rsi !== undefined) {
    lines.push(`║   RSI (14):        ${indicators.rsi.toFixed(1).padEnd(boxWidth - 21)} ║`);
  }
  if (indicators.slope !== undefined) {
    const slopePercent = (indicators.slope * 100).toFixed(3);
    const sign = indicators.slope >= 0 ? '+' : '';
    lines.push(`║   Slope:           ${(sign + slopePercent + '%').padEnd(boxWidth - 21)} ║`);
  }
  if (indicators.sma20 !== undefined) {
    lines.push(`║   SMA 20:          ${indicators.sma20.toFixed(4).padEnd(boxWidth - 21)} ║`);
  }
  if (indicators.sma50 !== undefined) {
    lines.push(`║   SMA 50:          ${indicators.sma50.toFixed(4).padEnd(boxWidth - 21)} ║`);
  }
  if (indicators.bollingerBands) {
    const bbWidth = ((indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle * 100);
    lines.push(`║   Bollinger Width: ${bbWidth.toFixed(2)}%${' '.repeat(boxWidth - 31)} ║`);
  }
  if (indicators.atr !== undefined) {
    lines.push(`║   ATR:             ${indicators.atr.toFixed(4).padEnd(boxWidth - 21)} ║`);
  }

  lines.push('╠' + '═'.repeat(boxWidth) + '╣');

  // Show Claude insights if available, otherwise show technical reasoning
  if (analysis.usedClaude && analysis.claudeInsights) {
    lines.push('║ 🤖 Claude Analysis:' + ' '.repeat(boxWidth - 21) + '║');

    // Word-wrap the Claude insights
    const words = analysis.claudeInsights.split(' ');
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + word).length > boxWidth - 6) {
        lines.push(`║ ${currentLine.padEnd(boxWidth - 2)} ║`);
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim().length > 0) {
      lines.push(`║ ${currentLine.trim().padEnd(boxWidth - 2)} ║`);
    }
  } else {
    lines.push('║ 📊 Technical Analysis:' + ' '.repeat(boxWidth - 25) + '║');

    // Word-wrap the reasoning text
    const words = analysis.reasoning.split(' ');
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + word).length > boxWidth - 6) {
        lines.push(`║ ${currentLine.padEnd(boxWidth - 2)} ║`);
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim().length > 0) {
      lines.push(`║ ${currentLine.trim().padEnd(boxWidth - 2)} ║`);
    }
  }

  lines.push('╚' + '═'.repeat(boxWidth) + '╝');

  return lines.join('\n');
}

/**
 * Format a trading implication based on regime
 */
export function formatTradingImplication(regime: MarketRegime): string {
  const implications: Record<MarketRegime, string> = {
    MOMENTUM: 'Consider trend-following strategies with tight stops',
    TREND: 'Look for pullback entries in trend direction',
    MEAN_REVERSION: 'Range-bound strategies - sell resistance, buy support',
    DOWNTREND: 'Be cautious - consider short positions or stay flat',
    SIDEWAYS: 'Wait for breakout or use range-trading strategies',
  };

  return `💡 Trading Implication: ${implications[regime]}`;
}

/**
 * Format a summary table of all markets
 */
export function formatMarketOverview(analyses: ExtendedRegimeAnalysis[]): string {
  const lines = [];
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('📊 COMPREHENSIVE MARKET REGIME OVERVIEW');
  lines.push('═'.repeat(80));
  lines.push('');

  // Group by market
  const marketGroups = new Map<MarketSymbol, RegimeAnalysis[]>();
  for (const analysis of analyses) {
    const market = analysis.market as MarketSymbol;
    if (!marketGroups.has(market)) {
      marketGroups.set(market, []);
    }
    marketGroups.get(market)?.push(analysis);
  }

  for (const [market, marketAnalyses] of marketGroups) {
    lines.push(`🎯 ${MARKET_DISPLAY_NAMES[market]}`);
    lines.push('─'.repeat(80));

    for (const analysis of marketAnalyses) {
      const tf = TIMEFRAME_DISPLAY_NAMES[analysis.timeframe as Timeframe];
      lines.push(`  ${tf}:`);
      lines.push(`    Regime: ${analysis.regime} (${analysis.confidence.toFixed(1)}% confidence)`);
      lines.push(`    RSI: ${analysis.indicators.rsi?.toFixed(1) ?? 'N/A'} | Slope: ${((analysis.indicators.slope ?? 0) * 100).toFixed(3)}%`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format key insights from all analyses
 */
export function formatKeyInsights(analyses: ExtendedRegimeAnalysis[]): string {
  const lines = [];
  lines.push('═'.repeat(80));
  lines.push('🔍 KEY INSIGHTS');
  lines.push('═'.repeat(80));
  lines.push('');

  // Group by regime
  const momentumMarkets = analyses.filter(a => a.regime === 'MOMENTUM');
  const trendingMarkets = analyses.filter(a => a.regime === 'TREND');
  const meanReversionMarkets = analyses.filter(a => a.regime === 'MEAN_REVERSION');
  const downtrendMarkets = analyses.filter(a => a.regime === 'DOWNTREND');
  const sidewaysMarkets = analyses.filter(a => a.regime === 'SIDEWAYS');

  if (momentumMarkets.length > 0) {
    lines.push(`📈 Momentum Markets (${momentumMarkets.length}):`);
    momentumMarkets.forEach(m => {
      lines.push(`   - ${MARKET_DISPLAY_NAMES[m.market as MarketSymbol]} on ${TIMEFRAME_DISPLAY_NAMES[m.timeframe as Timeframe]}`);
    });
    lines.push('');
  }

  if (trendingMarkets.length > 0) {
    lines.push(`📊 Trending Markets (${trendingMarkets.length}):`);
    trendingMarkets.forEach(m => {
      const direction = (m.indicators.slope ?? 0) > 0 ? '↑' : '↓';
      lines.push(`   ${direction} ${MARKET_DISPLAY_NAMES[m.market as MarketSymbol]} on ${TIMEFRAME_DISPLAY_NAMES[m.timeframe as Timeframe]}`);
    });
    lines.push('');
  }

  if (meanReversionMarkets.length > 0) {
    lines.push(`🔄 Mean Reversion Markets (${meanReversionMarkets.length}):`);
    meanReversionMarkets.forEach(m => {
      lines.push(`   - ${MARKET_DISPLAY_NAMES[m.market as MarketSymbol]} on ${TIMEFRAME_DISPLAY_NAMES[m.timeframe as Timeframe]}`);
    });
    lines.push('');
  }

  if (downtrendMarkets.length > 0) {
    lines.push(`📉 Downtrending Markets (${downtrendMarkets.length}):`);
    downtrendMarkets.forEach(m => {
      lines.push(`   - ${MARKET_DISPLAY_NAMES[m.market as MarketSymbol]} on ${TIMEFRAME_DISPLAY_NAMES[m.timeframe as Timeframe]}`);
    });
    lines.push('');
  }

  if (sidewaysMarkets.length > 0) {
    lines.push(`↔️  Sideways Markets (${sidewaysMarkets.length}):`);
    sidewaysMarkets.forEach(m => {
      lines.push(`   - ${MARKET_DISPLAY_NAMES[m.market as MarketSymbol]} on ${TIMEFRAME_DISPLAY_NAMES[m.timeframe as Timeframe]}`);
    });
    lines.push('');
  }

  // Trading implications
  lines.push('═'.repeat(80));
  lines.push('💡 TRADING IMPLICATIONS');
  lines.push('═'.repeat(80));
  lines.push('');

  if (momentumMarkets.length > 0) {
    lines.push('• Momentum markets: Consider trend-following strategies with tight stops');
  }
  if (trendingMarkets.length > 0) {
    lines.push('• Trending markets: Look for pullback entries in trend direction');
  }
  if (meanReversionMarkets.length > 0) {
    lines.push('• Mean reversion markets: Range-bound strategies, sell resistance/buy support');
  }
  if (downtrendMarkets.length > 0) {
    lines.push('• Downtrending markets: Be cautious, consider short positions or stay flat');
  }
  if (sidewaysMarkets.length > 0) {
    lines.push('• Sideways markets: Wait for breakout or use range-trading strategies');
  }

  lines.push('');

  // Show analysis mode info
  const claudeAnalysisCount = analyses.filter(a => a.usedClaude).length;
  if (claudeAnalysisCount > 0) {
    lines.push('═'.repeat(80));
    lines.push(`🤖 Analysis Mode: ${claudeAnalysisCount}/${analyses.length} analyses used Claude AI reasoning`);
    lines.push('');
  } else {
    lines.push('═'.repeat(80));
    lines.push('📊 Analysis Mode: Technical analysis only (no API key detected)');
    lines.push('');
  }

  return lines.join('\n');
}
