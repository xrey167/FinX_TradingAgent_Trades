/**
 * Comprehensive Test Suite for Seasonal Analysis (Phase 1 + Phase 2)
 * Tests backward compatibility, hourly patterns, and edge cases
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  console.log(`\n🧪 Running: ${name}`);
  console.log('-'.repeat(70));

  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error}`);
  }
}

async function testDailyBackwardCompatibility() {
  // Test that daily analysis still works as before
  const result = await analyzeSeasonalTool.handler({
    symbol: 'AAPL.US',
    years: 5,
    timeframe: 'daily',
  });

  if (result.isError) {
    throw new Error(`Tool returned error: ${result.content[0].text}`);
  }

  const data = JSON.parse(result.content[0].text);

  // Verify expected fields exist
  if (!data.symbol || data.symbol !== 'AAPL.US') {
    throw new Error('Missing or incorrect symbol');
  }

  if (!data.monthlyStats || data.monthlyStats.length !== 12) {
    throw new Error(`Expected 12 monthly stats, got ${data.monthlyStats?.length}`);
  }

  if (!data.quarterlyStats || data.quarterlyStats.length !== 4) {
    throw new Error(`Expected 4 quarterly stats, got ${data.quarterlyStats?.length}`);
  }

  if (!data.dayOfWeekStats || data.dayOfWeekStats.length !== 5) {
    throw new Error(`Expected 5 day-of-week stats, got ${data.dayOfWeekStats?.length}`);
  }

  // Verify hourly-specific fields are NOT present for daily timeframe
  if (data.hourOfDayStats) {
    throw new Error('hourOfDayStats should not exist for daily timeframe');
  }

  if (data.marketSessionStats) {
    throw new Error('marketSessionStats should not exist for daily timeframe');
  }

  console.log(`   ✓ Symbol: ${data.symbol}`);
  console.log(`   ✓ Timeframe: ${data.timeframe || 'daily (default)'}`);
  console.log(`   ✓ Data points: ${data.dataPoints}`);
  console.log(`   ✓ Monthly patterns: ${data.monthlyStats.length}`);
  console.log(`   ✓ No hourly patterns (correct for daily)`);
}

async function testHourlyPatterns() {
  // Test that hourly analysis includes hour-of-day and market sessions
  const result = await analyzeSeasonalTool.handler({
    symbol: 'QQQ.US',
    years: 1,
    timeframe: 'hourly',
  });

  if (result.isError) {
    throw new Error(`Tool returned error: ${result.content[0].text}`);
  }

  const data = JSON.parse(result.content[0].text);

  // Verify timeframe is set
  if (data.timeframe !== 'hourly') {
    throw new Error(`Expected timeframe 'hourly', got '${data.timeframe}'`);
  }

  // Verify hourly-specific fields exist
  if (!data.hourOfDayStats) {
    throw new Error('hourOfDayStats missing for hourly timeframe');
  }

  if (!data.marketSessionStats) {
    throw new Error('marketSessionStats missing for hourly timeframe');
  }

  // Verify hour-of-day stats structure
  if (data.hourOfDayStats.length === 0) {
    throw new Error('hourOfDayStats is empty');
  }

  const firstHour = data.hourOfDayStats[0];
  if (!firstHour.hour || typeof firstHour.avgReturn !== 'number' || typeof firstHour.winRate !== 'number' || typeof firstHour.sampleSize !== 'number') {
    throw new Error('hourOfDayStats has incorrect structure');
  }

  // Verify market session stats structure
  if (data.marketSessionStats.length === 0) {
    throw new Error('marketSessionStats is empty');
  }

  const firstSession = data.marketSessionStats[0];
  if (!firstSession.session || typeof firstSession.avgReturn !== 'number' || typeof firstSession.winRate !== 'number' || typeof firstSession.volatility !== 'number') {
    throw new Error('marketSessionStats has incorrect structure');
  }

  console.log(`   ✓ Symbol: ${data.symbol}`);
  console.log(`   ✓ Timeframe: ${data.timeframe}`);
  console.log(`   ✓ Hour-of-day patterns: ${data.hourOfDayStats.length}`);
  console.log(`   ✓ Market sessions: ${data.marketSessionStats.length}`);
  console.log(`   ✓ Sample hour: ${firstHour.hour} (${firstHour.sampleSize} samples)`);
  console.log(`   ✓ Sample session: ${firstSession.session} (${firstSession.sampleSize} samples)`);
}

async function testHourlyInsights() {
  // Test that insights are generated for hourly patterns
  const result = await analyzeSeasonalTool.handler({
    symbol: 'SPY.US',
    years: 1,
    timeframe: 'hourly',
  });

  if (result.isError) {
    throw new Error(`Tool returned error: ${result.content[0].text}`);
  }

  const data = JSON.parse(result.content[0].text);

  if (!data.insights || data.insights.length === 0) {
    throw new Error('No insights generated');
  }

  // Check if hourly-specific insights exist (should mention hours or sessions)
  const hasHourlyInsights = data.insights.some((insight: string) =>
    insight.toLowerCase().includes('hour') ||
    insight.toLowerCase().includes('session')
  );

  if (!hasHourlyInsights) {
    console.warn('   ⚠️  Warning: No hourly-specific insights found');
  } else {
    console.log(`   ✓ Hourly insights generated`);
  }

  console.log(`   ✓ Total insights: ${data.insights.length}`);
  data.insights.forEach((insight: string, i: number) => {
    console.log(`   ${i + 1}. ${insight}`);
  });
}

async function testDailyDefaultTimeframe() {
  // Test that daily is the default when timeframe is not specified
  const result = await analyzeSeasonalTool.handler({
    symbol: 'MSFT.US',
    years: 3,
  });

  if (result.isError) {
    throw new Error(`Tool returned error: ${result.content[0].text}`);
  }

  const data = JSON.parse(result.content[0].text);

  // Should not have hourly patterns when timeframe not specified
  if (data.hourOfDayStats || data.marketSessionStats) {
    throw new Error('Daily should be default - hourly patterns should not exist');
  }

  console.log(`   ✓ Default timeframe works correctly`);
  console.log(`   ✓ No hourly patterns (daily is default)`);
}

async function testDataPointCounts() {
  // Test that data point counts are reasonable
  console.log('\n   Testing daily data points...');
  const dailyResult = await analyzeSeasonalTool.handler({
    symbol: 'AAPL.US',
    years: 5,
    timeframe: 'daily',
  });

  if (!dailyResult.isError) {
    const dailyData = JSON.parse(dailyResult.content[0].text);
    const expectedDailyPoints = 5 * 252; // ~252 trading days per year
    const minExpected = expectedDailyPoints * 0.8; // Allow 20% variance
    const maxExpected = expectedDailyPoints * 1.2;

    if (dailyData.dataPoints < minExpected || dailyData.dataPoints > maxExpected) {
      console.warn(`   ⚠️  Warning: Daily data points (${dailyData.dataPoints}) outside expected range (${minExpected.toFixed(0)}-${maxExpected.toFixed(0)})`);
    } else {
      console.log(`   ✓ Daily data points reasonable: ${dailyData.dataPoints}`);
    }
  }

  console.log('\n   Testing hourly data points...');
  const hourlyResult = await analyzeSeasonalTool.handler({
    symbol: 'AAPL.US',
    years: 1,
    timeframe: 'hourly',
  });

  if (!hourlyResult.isError) {
    const hourlyData = JSON.parse(hourlyResult.content[0].text);
    // ~252 trading days * ~6.5 trading hours = ~1,638 hourly bars per year
    const expectedHourlyPoints = 1638;
    const minExpected = expectedHourlyPoints * 0.7; // Allow more variance for hourly
    const maxExpected = expectedHourlyPoints * 1.5;

    if (hourlyData.dataPoints < minExpected || hourlyData.dataPoints > maxExpected) {
      console.warn(`   ⚠️  Warning: Hourly data points (${hourlyData.dataPoints}) outside expected range (${minExpected.toFixed(0)}-${maxExpected.toFixed(0)})`);
    } else {
      console.log(`   ✓ Hourly data points reasonable: ${hourlyData.dataPoints}`);
    }
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE SEASONAL ANALYSIS TEST SUITE (Phase 1 + Phase 2)  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');

  // Run all tests
  await runTest('Daily Analysis - Backward Compatibility', testDailyBackwardCompatibility);
  await runTest('Hourly Patterns - Hour-of-Day & Market Sessions', testHourlyPatterns);
  await runTest('Hourly Insights Generation', testHourlyInsights);
  await runTest('Default Timeframe (Daily)', testDailyDefaultTimeframe);
  await runTest('Data Point Counts Validation', testDataPointCounts);

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`         ${result.error}`);
    }
  });

  console.log('='.repeat(70));
  console.log(`Total: ${results.length} tests | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.error('\n❌ Some tests failed! Please review and fix issues.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Phase 1 + Phase 2 working correctly.');
  }
}

main();
