#!/usr/bin/env bun
/**
 * FinX Trading Agent - CLI Mode (No API Key Required)
 *
 * Interactive command-line interface for market regime analysis
 * Uses Commander.js for command structure and directly calls technical analysis tools
 */

import { Command } from 'commander';
import { analyzeMarket, analyzeAllMarkets } from './lib/analyzer.ts';
import { formatRegimeResult, formatTradingImplication, formatMarketOverview, formatKeyInsights } from './lib/formatters.ts';
import { MARKETS, TIMEFRAMES, MARKET_DISPLAY_NAMES, TIMEFRAME_DISPLAY_NAMES } from './config.ts';
import type { MarketSymbol, Timeframe } from './types.ts';

const program = new Command();

program
  .name('finx-trader')
  .description('Market regime analysis CLI - works without API key')
  .version('1.0.0');

/**
 * Analyze command - analyze specific market and timeframe
 */
program
  .command('analyze')
  .description('Analyze specific market and timeframe')
  .option('-m, --market <symbol>', 'Market symbol (US_INDICES, VIX, GOLD, EURUSD, DAX, USDJPY)')
  .option('-t, --timeframe <tf>', 'Timeframe (H1, DAILY, WEEKLY)')
  .action(async (options) => {
    console.log('🎯 FinX Trading Agent - Market Regime Analysis (CLI Mode)');
    console.log('═'.repeat(62));
    console.log('');

    let market: MarketSymbol;
    let timeframe: Timeframe;

    // If market not specified, show menu
    if (!options.market) {
      console.log('Select a market:');
      MARKETS.forEach((m, i) => {
        console.log(`  ${i + 1}. ${MARKET_DISPLAY_NAMES[m]}`);
      });
      console.log('');
      process.stdout.write('Enter market number (1-6): ');

      // Simple prompt using readline
      const choice = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
        });
      });

      const index = parseInt(choice) - 1;
      if (index < 0 || index >= MARKETS.length) {
        console.error('❌ Invalid selection');
        process.exit(1);
      }
      market = MARKETS[index] as MarketSymbol;
    } else {
      market = options.market.toUpperCase() as MarketSymbol;
      if (!MARKETS.includes(market)) {
        console.error(`❌ Invalid market: ${options.market}`);
        console.error(`   Valid markets: ${MARKETS.join(', ')}`);
        process.exit(1);
      }
    }

    // If timeframe not specified, show menu
    if (!options.timeframe) {
      console.log('');
      console.log('Select a timeframe:');
      TIMEFRAMES.forEach((tf, i) => {
        console.log(`  ${i + 1}. ${TIMEFRAME_DISPLAY_NAMES[tf]}`);
      });
      console.log('');
      process.stdout.write('Enter timeframe number (1-3): ');

      const choice = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
        });
      });

      const index = parseInt(choice) - 1;
      if (index < 0 || index >= TIMEFRAMES.length) {
        console.error('❌ Invalid selection');
        process.exit(1);
      }
      timeframe = TIMEFRAMES[index] as Timeframe;
    } else {
      timeframe = options.timeframe.toUpperCase() as Timeframe;
      if (!TIMEFRAMES.includes(timeframe)) {
        console.error(`❌ Invalid timeframe: ${options.timeframe}`);
        console.error(`   Valid timeframes: ${TIMEFRAMES.join(', ')}`);
        process.exit(1);
      }
    }

    // Analyze the market
    console.log('');
    console.log(`Analyzing: ${MARKET_DISPLAY_NAMES[market]} on ${TIMEFRAME_DISPLAY_NAMES[timeframe]} timeframe...`);
    console.log('');

    try {
      const analysis = await analyzeMarket(market, timeframe);

      console.log(formatRegimeResult(analysis));
      console.log('');
      console.log(formatTradingImplication(analysis.regime));
      console.log('');
      console.log('ℹ️  This analysis uses mock data for demonstration purposes.');
      console.log('');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * All command - analyze all markets across all timeframes
 */
program
  .command('all')
  .description('Analyze all markets across all timeframes')
  .action(async () => {
    console.log('🎯 FinX Trading Agent - Market Regime Analysis (CLI Mode)');
    console.log('═'.repeat(80));
    console.log('');
    console.log('Analyzing all markets across all timeframes...');
    console.log('');
    console.log(`📊 Markets: ${MARKETS.length} | ⏰ Timeframes: ${TIMEFRAMES.length} | 🔢 Total: ${MARKETS.length * TIMEFRAMES.length} combinations`);
    console.log('');

    try {
      const analyses = await analyzeAllMarkets(MARKETS, TIMEFRAMES);

      // Display market overview
      console.log(formatMarketOverview(analyses));

      // Display key insights
      console.log(formatKeyInsights(analyses));

      console.log('═'.repeat(80));
      console.log('✅ ANALYSIS COMPLETE');
      console.log('═'.repeat(80));
      console.log('');
      console.log('ℹ️  This analysis uses mock data for demonstration purposes.');
      console.log('ℹ️  For real market data, integrate with a market data API.');
      console.log('');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
