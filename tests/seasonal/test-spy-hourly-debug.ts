/**
 * Debug Test: Why SPY.US hourly doesn't show hour-specific insights
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

async function debugSPYHourly() {
  console.log('🔍 Debugging SPY.US Hourly Analysis\n');
  console.log('='.repeat(70));

  const result = await analyzeSeasonalTool.handler({
    symbol: 'SPY.US',
    years: 1,
    timeframe: 'hourly',
  });

  if (result.isError) {
    console.error('❌ Tool returned error:', result.content[0].text);
    process.exit(1);
  }

  const data = JSON.parse(result.content[0].text);

  console.log('\n📊 Basic Info:');
  console.log(`   Symbol: ${data.symbol}`);
  console.log(`   Timeframe: ${data.timeframe}`);
  console.log(`   Data Points: ${data.dataPoints}`);

  console.log('\n⏰ Hour-of-Day Stats:');
  if (data.hourOfDayStats) {
    const validHours = data.hourOfDayStats.filter((h: any) =>
      h && h.hour && typeof h.avgReturn === 'number' && typeof h.winRate === 'number'
    );
    const invalidCount = data.hourOfDayStats.length - validHours.length;
    console.log(`   Total: ${data.hourOfDayStats.length} (${invalidCount} invalid entries)`);
    console.log(`   Valid: ${validHours.length}`);

    if (invalidCount > 0) {
      console.log(`   ⚠️  WARNING: ${invalidCount} hours have null/invalid data`);
      data.hourOfDayStats.forEach((h: any, i: number) => {
        if (!h || !h.hour || typeof h.avgReturn !== 'number') {
          console.log(`      Index ${i}: ${JSON.stringify(h)}`);
        }
      });
    }

    validHours.forEach((h: any) => {
      console.log(`   ${h.hour}: ${h.avgReturn.toFixed(4)}% avg, ${h.winRate.toFixed(1)}% win, ${h.sampleSize} samples`);
    });

    // Check filter criteria from generateInsights
    const strongHours = data.hourOfDayStats.filter((h: any) => h.winRate > 55 && h.sampleSize > 20);
    const weakHours = data.hourOfDayStats.filter((h: any) => h.winRate < 45 && h.sampleSize > 20);

    console.log(`\n   Strong hours (>55% win rate, >20 samples): ${strongHours.length}`);
    strongHours.forEach((h: any) => {
      console.log(`      ${h.hour}: ${h.winRate.toFixed(1)}% (${h.sampleSize} samples)`);
    });

    console.log(`   Weak hours (<45% win rate, >20 samples): ${weakHours.length}`);
    weakHours.forEach((h: any) => {
      console.log(`      ${h.hour}: ${h.winRate.toFixed(1)}% (${h.sampleSize} samples)`);
    });
  } else {
    console.log('   ❌ No hour-of-day stats!');
  }

  console.log('\n📊 Market Session Stats:');
  if (data.marketSessionStats) {
    console.log(`   Count: ${data.marketSessionStats.length}`);
    data.marketSessionStats.forEach((s: any) => {
      console.log(`   ${s.session}: ${s.avgReturn.toFixed(4)}% avg, ${s.winRate.toFixed(1)}% win, ${s.volatility.toFixed(4)}% vol, ${s.sampleSize} samples`);
    });

    // Check filter criteria
    const bestSession = data.marketSessionStats.reduce((a: any, b: any) =>
      a.avgReturn > b.avgReturn ? a : b
    );
    console.log(`\n   Best session: ${bestSession.session} (${bestSession.winRate.toFixed(1)}% win rate)`);
    console.log(`   Meets criteria (>55% win rate): ${bestSession.winRate > 55 ? 'YES' : 'NO'}`);

    const highVolSessions = data.marketSessionStats.filter((s: any) =>
      s.volatility > 0.15 && s.sampleSize > 50
    );
    console.log(`   High volatility sessions (>0.15% vol, >50 samples): ${highVolSessions.length}`);
  } else {
    console.log('   ❌ No market session stats!');
  }

  console.log('\n💡 Generated Insights:');
  if (data.insights && data.insights.length > 0) {
    data.insights.forEach((insight: string, i: number) => {
      const isHourlyInsight = insight.toLowerCase().includes('hour') ||
                              insight.toLowerCase().includes('session');
      const marker = isHourlyInsight ? '⏰' : '📅';
      console.log(`   ${marker} ${i + 1}. ${insight}`);
    });
  } else {
    console.log('   ❌ No insights generated!');
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Analysis complete');
}

debugSPYHourly();
