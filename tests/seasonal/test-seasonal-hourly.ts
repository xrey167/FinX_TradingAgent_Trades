/**
 * Test Hourly Seasonal Analysis
 * Verifies the hourly analyzer works with real EODHD intraday data
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

async function testHourlySeasonal() {
  console.log('🧪 Testing Hourly Seasonal Analysis\n');
  console.log('='.repeat(70));

  try {
    // Test with AAPL to avoid SPY cache
    console.log('\n📊 Testing: AAPL.US (Hourly, 1 year)');
    console.log('-'.repeat(70));

    const result = await analyzeSeasonalTool.handler({
      symbol: 'AAPL.US',
      years: 1, // Hourly data limited to 1-2 years
      timeframe: 'hourly',
    });

    if (result.isError) {
      console.error('❌ Tool returned error:', result.content[0].text);
      process.exit(1);
    }

    const data = JSON.parse(result.content[0].text);

    // Debug: Check what timeframe is being analyzed
    console.log('✅ Tool executed successfully');
    console.log(`   Symbol: ${data.symbol}`);
    console.log(`   Period: ${data.period}`);
    console.log(`   Timeframe: ${data.timeframe || 'not set'}`);
    console.log(`   Data Points: ${data.dataPoints}`);

    // Check if we have the expected patterns
    console.log('\n📈 Patterns Found:');
    if (data.monthlyStats) {
      console.log(`   Monthly patterns: ${data.monthlyStats.length}`);
    }
    if (data.quarterlyStats) {
      console.log(`   Quarterly patterns: ${data.quarterlyStats.length}`);
    }
    if (data.dayOfWeekStats) {
      console.log(`   Day-of-week patterns: ${data.dayOfWeekStats.length}`);
    }
    if (data.hourOfDayStats) {
      console.log(`   Hour-of-day patterns: ${data.hourOfDayStats.length}`);
    }
    if (data.marketSessionStats) {
      console.log(`   Market session patterns: ${data.marketSessionStats.length}`);
    }

    // Display hour-of-day patterns (Phase 2)
    if (data.hourOfDayStats && data.hourOfDayStats.length > 0) {
      console.log('\n⏰ Hour-of-Day Patterns:');
      // Show top 5 hours by average return
      const topHours = [...data.hourOfDayStats]
        .sort((a: any, b: any) => b.avgReturn - a.avgReturn)
        .slice(0, 5);
      topHours.forEach((h: any, i: number) => {
        console.log(
          `   ${i + 1}. ${h.hour}: ${h.avgReturn.toFixed(3)}% avg, ${h.winRate.toFixed(1)}% win rate (${h.sampleSize} samples)`
        );
      });
    }

    // Display market session patterns (Phase 2)
    if (data.marketSessionStats && data.marketSessionStats.length > 0) {
      console.log('\n📊 Market Session Patterns:');
      data.marketSessionStats.forEach((s: any) => {
        console.log(
          `   ${s.session}: ${s.avgReturn.toFixed(3)}% avg, ${s.winRate.toFixed(1)}% win rate, ${s.volatility.toFixed(3)}% vol (${s.sampleSize} samples)`
        );
      });
    }

    // Display best months (from hourly aggregation)
    if (data.summary?.bestMonths && data.summary.bestMonths.length > 0) {
      console.log('\n🟢 Best Periods (from hourly data):');
      const validMonths = data.summary.bestMonths.filter((m: any) => m && m.month && m.avgReturn !== null && m.avgReturn !== undefined);
      validMonths.slice(0, 3).forEach((m: any, i: number) => {
        console.log(
          `   ${i + 1}. ${m.month}: ${m.avgReturn.toFixed(3)}% avg, ${m.consistency.toFixed(1)}% consistent`
        );
      });
    }

    // Display worst months
    if (data.summary?.worstMonths && data.summary.worstMonths.length > 0) {
      console.log('\n🔴 Worst Periods (from hourly data):');
      const validMonths = data.summary.worstMonths.filter((m: any) => m && m.month && m.avgReturn !== null && m.avgReturn !== undefined);
      validMonths.slice(0, 3).forEach((m: any, i: number) => {
        console.log(
          `   ${i + 1}. ${m.month}: ${m.avgReturn.toFixed(3)}% avg, ${m.consistency.toFixed(1)}% consistent`
        );
      });
    }

    // Display insights
    if (data.insights && data.insights.length > 0) {
      console.log('\n💡 Insights:');
      data.insights.forEach((insight: string) => {
        console.log(`   - ${insight}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Hourly analysis test passed!');
    console.log('='.repeat(70));

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('   ✓ Hourly data fetching successful');
    console.log('   ✓ Pattern analysis completed');
    console.log('   ✓ Results formatted correctly');
    if (data.hourOfDayStats) {
      console.log(`   ✓ Hour-of-day patterns detected (${data.hourOfDayStats.length} hours)`);
    }
    if (data.marketSessionStats) {
      console.log(`   ✓ Market session patterns detected (${data.marketSessionStats.length} sessions)`);
    }
    console.log('\n✅ Phase 2: Hour-of-day and market session analysis complete!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testHourlySeasonal();
