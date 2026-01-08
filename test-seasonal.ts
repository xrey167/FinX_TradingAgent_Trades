/**
 * Test Seasonal Analysis Tool
 * Verifies the seasonal analyzer works with real EODHD data
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

async function testSeasonal() {
  console.log('🧪 Testing Seasonal Analysis Tool\n');
  console.log('='.repeat(70));

  try {
    // Test with AAPL (Demo key should work)
    console.log('\n📊 Testing: AAPL.US (5 years)');
    console.log('-'.repeat(70));

    const result = await analyzeSeasonalTool.handler({ symbol: 'AAPL.US', years: 5 });

    if (result.isError) {
      console.error('❌ Tool returned error:', result.content[0].text);
      process.exit(1);
    }

    const data = JSON.parse(result.content[0].text);

    // Verify structure
    console.log('✅ Tool executed successfully');
    console.log(`   Symbol: ${data.symbol}`);
    console.log(`   Period: ${data.period}`);
    console.log(`   Data Points: ${data.dataPoints}`);

    // Display best months
    console.log('\n🟢 Best Months:');
    data.summary.bestMonths.forEach((m: any, i: number) => {
      console.log(`   ${i + 1}. ${m.month}: ${m.avgReturn.toFixed(3)}% avg, ${m.consistency.toFixed(1)}% consistent`);
    });

    // Display worst months
    console.log('\n🔴 Worst Months:');
    data.summary.worstMonths.forEach((m: any, i: number) => {
      console.log(`   ${i + 1}. ${m.month}: ${m.avgReturn.toFixed(3)}% avg, ${m.consistency.toFixed(1)}% consistent`);
    });

    // Display strongest quarter
    console.log('\n📈 Strongest Quarter:');
    console.log(`   ${data.summary.strongestQuarter.quarter}: ${data.summary.strongestQuarter.avgReturn.toFixed(3)}% avg, ${data.summary.strongestQuarter.winRate.toFixed(1)}% win rate`);

    // Display patterns
    console.log('\n🎅 Seasonal Patterns:');
    data.patterns.forEach((p: any) => {
      console.log(`   ${p.name} (${p.period}): ${p.avgReturn.toFixed(3)}% avg, ${p.winRate.toFixed(1)}% win rate`);
    });

    // Display insights
    console.log('\n💡 Insights:');
    data.insights.forEach((insight: string) => {
      console.log(`   - ${insight}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests passed!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testSeasonal();
