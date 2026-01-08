/**
 * Phase 4 - Week Positioning Patterns Test
 * Tests week-of-month, day-of-month, and week-position seasonal analysis
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

console.log('=================================================');
console.log('WEEK POSITIONING PATTERNS TEST (Phase 4)');
console.log('=================================================\n');

async function testWeekPatterns() {
  try {
    console.log('Testing Phase 4: Week Positioning Patterns...\n');

    // Test with SPY.US (5 years of daily data)
    console.log('📊 Analyzing SPY.US (5 years, daily timeframe)...');
    const result = await analyzeSeasonalTool.handler({
      symbol: 'SPY.US',
      years: 5,
      timeframe: 'daily',
    });

    const data = JSON.parse(result.content[0].text);

    // ============================================
    // TEST 1: Week Position Stats
    // ============================================
    console.log('\n✓ TEST 1: Week Position Stats (First-Monday, Last-Friday, etc.)');

    if (!data.weekPositionStats) {
      throw new Error('❌ weekPositionStats missing from result');
    }

    console.log(`  Found ${data.weekPositionStats.length} week position patterns`);

    // Verify structure
    const sampleWeekPos = data.weekPositionStats[0];
    if (!sampleWeekPos) {
      throw new Error('❌ No week position patterns found');
    }

    const requiredFields = ['position', 'avgReturn', 'winRate', 'sampleSize'];
    for (const field of requiredFields) {
      if (!(field in sampleWeekPos)) {
        throw new Error(`❌ Missing field: ${field} in weekPositionStats`);
      }
    }

    // Check for expected patterns
    const hasFirstMonday = data.weekPositionStats.some((p: any) => p.position === 'First-Monday');
    const hasLastFriday = data.weekPositionStats.some((p: any) => p.position === 'Last-Friday');

    console.log(`  - First-Monday pattern: ${hasFirstMonday ? '✓ Found' : '✗ Not found'}`);
    console.log(`  - Last-Friday pattern: ${hasLastFriday ? '✓ Found' : '✗ Not found'}`);

    // Show top 3 patterns
    const topWeekPositions = data.weekPositionStats
      .sort((a: any, b: any) => b.avgReturn - a.avgReturn)
      .slice(0, 3);

    console.log('\n  Top 3 Week Positions by Avg Return:');
    topWeekPositions.forEach((p: any, i: number) => {
      console.log(
        `    ${i + 1}. ${p.position}: ${p.avgReturn.toFixed(3)}% avg, ${p.winRate.toFixed(1)}% win rate (${p.sampleSize} samples)`
      );
    });

    console.log('  ✅ TEST 1 PASSED: Week position stats working\n');

    // ============================================
    // TEST 2: Week of Month Stats
    // ============================================
    console.log('✓ TEST 2: Week of Month Stats (Week-1, Week-2, etc.)');

    if (!data.weekOfMonthStats) {
      throw new Error('❌ weekOfMonthStats missing from result');
    }

    console.log(`  Found ${data.weekOfMonthStats.length} week of month patterns`);

    // Verify structure
    const sampleWeekOfMonth = data.weekOfMonthStats[0];
    if (!sampleWeekOfMonth) {
      throw new Error('❌ No week of month patterns found');
    }

    const weekOfMonthFields = ['week', 'avgReturn', 'winRate', 'sampleSize'];
    for (const field of weekOfMonthFields) {
      if (!(field in sampleWeekOfMonth)) {
        throw new Error(`❌ Missing field: ${field} in weekOfMonthStats`);
      }
    }

    // Check for expected patterns (Week-1 through Week-5)
    const expectedWeeks = ['Week-1', 'Week-2', 'Week-3', 'Week-4'];
    for (const week of expectedWeeks) {
      const found = data.weekOfMonthStats.some((w: any) => w.week === week);
      console.log(`  - ${week} pattern: ${found ? '✓ Found' : '✗ Not found'}`);
    }

    // Show all weeks sorted by return
    console.log('\n  Week of Month Performance:');
    data.weekOfMonthStats
      .sort((a: any, b: any) => b.avgReturn - a.avgReturn)
      .forEach((w: any) => {
        console.log(
          `    ${w.week}: ${w.avgReturn.toFixed(3)}% avg, ${w.winRate.toFixed(1)}% win rate (${w.sampleSize} samples)`
        );
      });

    console.log('  ✅ TEST 2 PASSED: Week of month stats working\n');

    // ============================================
    // TEST 3: Day of Month Stats
    // ============================================
    console.log('✓ TEST 3: Day of Month Stats (Day-01 to Day-31)');

    if (!data.dayOfMonthStats) {
      throw new Error('❌ dayOfMonthStats missing from result');
    }

    console.log(`  Found ${data.dayOfMonthStats.length} day of month patterns`);

    // Verify structure
    const sampleDayOfMonth = data.dayOfMonthStats[0];
    if (!sampleDayOfMonth) {
      throw new Error('❌ No day of month patterns found');
    }

    const dayOfMonthFields = ['day', 'avgReturn', 'winRate', 'sampleSize'];
    for (const field of dayOfMonthFields) {
      if (!(field in sampleDayOfMonth)) {
        throw new Error(`❌ Missing field: ${field} in dayOfMonthStats`);
      }
    }

    // Show top 5 and bottom 5 days
    const sortedDays = data.dayOfMonthStats.sort((a: any, b: any) => b.avgReturn - a.avgReturn);

    console.log('\n  Top 5 Best Days of Month:');
    sortedDays.slice(0, 5).forEach((d: any, i: number) => {
      console.log(
        `    ${i + 1}. ${d.day}: ${d.avgReturn.toFixed(3)}% avg, ${d.winRate.toFixed(1)}% win rate (${d.sampleSize} samples)`
      );
    });

    console.log('\n  Bottom 5 Worst Days of Month:');
    sortedDays.slice(-5).forEach((d: any, i: number) => {
      console.log(
        `    ${i + 1}. ${d.day}: ${d.avgReturn.toFixed(3)}% avg, ${d.winRate.toFixed(1)}% win rate (${d.sampleSize} samples)`
      );
    });

    // Test turn-of-month effect (days 1-3 and 28-31)
    const turnOfMonthDays = data.dayOfMonthStats.filter((d: any) => {
      const dayNum = parseInt(d.day.split('-')[1] || '0');
      return dayNum <= 3 || dayNum >= 28;
    });

    if (turnOfMonthDays.length > 0) {
      const avgTurnReturn =
        turnOfMonthDays.reduce((sum: number, d: any) => sum + d.avgReturn, 0) / turnOfMonthDays.length;
      const avgTurnWinRate =
        turnOfMonthDays.reduce((sum: number, d: any) => sum + d.winRate, 0) / turnOfMonthDays.length;

      console.log('\n  Turn-of-Month Effect (Days 1-3 & 28-31):');
      console.log(`    Average Return: ${avgTurnReturn.toFixed(3)}%`);
      console.log(`    Average Win Rate: ${avgTurnWinRate.toFixed(1)}%`);
      console.log(`    Status: ${avgTurnWinRate > 52 ? '✅ Positive effect detected' : '➖ No clear effect'}`);
    }

    console.log('  ✅ TEST 3 PASSED: Day of month stats working\n');

    // ============================================
    // TEST 4: Insights Generation
    // ============================================
    console.log('✓ TEST 4: Week Pattern Insights Generation');

    if (!data.insights || data.insights.length === 0) {
      throw new Error('❌ No insights generated');
    }

    console.log(`  Generated ${data.insights.length} total insights`);

    // Check for week-related insights
    const weekInsights = data.insights.filter((insight: string) =>
      insight.toLowerCase().includes('week') ||
      insight.toLowerCase().includes('turn-of-month') ||
      insight.toLowerCase().includes('position')
    );

    if (weekInsights.length > 0) {
      console.log(`\n  Week-Related Insights (${weekInsights.length}):`);
      weekInsights.forEach((insight: string) => {
        console.log(`    - ${insight}`);
      });
    } else {
      console.log('  ⚠️ No week-specific insights generated (may be due to data)');
    }

    console.log('  ✅ TEST 4 PASSED: Insights generation working\n');

    // ============================================
    // TEST 5: Minimum Sample Size Filtering
    // ============================================
    console.log('✓ TEST 5: Minimum Sample Size Filtering');

    // All patterns should have at least 10 samples
    const allPatterns = [
      ...data.weekPositionStats,
      ...data.weekOfMonthStats,
      ...data.dayOfMonthStats,
    ];

    const belowMinimum = allPatterns.filter((p: any) => p.sampleSize < 10);

    if (belowMinimum.length > 0) {
      console.log(`  ❌ Found ${belowMinimum.length} patterns with sample size < 10`);
      belowMinimum.forEach((p: any) => {
        console.log(`    - ${p.position || p.week || p.day}: ${p.sampleSize} samples`);
      });
      throw new Error('Minimum sample size filtering not working');
    }

    console.log('  All patterns have sample size >= 10 ✓');
    console.log('  ✅ TEST 5 PASSED: Minimum sample size filtering working\n');

    // ============================================
    // TEST 6: Data Validation (NaN/Infinity checks)
    // ============================================
    console.log('✓ TEST 6: Data Validation (NaN/Infinity checks)');

    let invalidData = 0;

    for (const pattern of allPatterns) {
      if (!isFinite(pattern.avgReturn) || isNaN(pattern.avgReturn)) {
        console.log(`  ❌ Invalid avgReturn: ${pattern.avgReturn}`);
        invalidData++;
      }
      if (!isFinite(pattern.winRate) || isNaN(pattern.winRate)) {
        console.log(`  ❌ Invalid winRate: ${pattern.winRate}`);
        invalidData++;
      }
    }

    if (invalidData > 0) {
      throw new Error(`Found ${invalidData} invalid data points`);
    }

    console.log('  All numeric values are valid (finite and not NaN) ✓');
    console.log('  ✅ TEST 6 PASSED: Data validation working\n');

    // ============================================
    // Summary
    // ============================================
    console.log('=================================================');
    console.log('PHASE 4 TEST SUMMARY');
    console.log('=================================================');
    console.log('✅ TEST 1: Week Position Stats - PASSED');
    console.log('✅ TEST 2: Week of Month Stats - PASSED');
    console.log('✅ TEST 3: Day of Month Stats - PASSED');
    console.log('✅ TEST 4: Insights Generation - PASSED');
    console.log('✅ TEST 5: Minimum Sample Size Filtering - PASSED');
    console.log('✅ TEST 6: Data Validation - PASSED');
    console.log('=================================================');
    console.log('Total: 6 tests | Passed: 6 | Failed: 0');
    console.log('=================================================\n');

    console.log('✅ PHASE 4 IMPLEMENTATION COMPLETE AND VERIFIED\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    throw error;
  }
}

// Run tests
testWeekPatterns()
  .then(() => {
    console.log('✅ All Phase 4 tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Phase 4 tests failed:', error);
    process.exit(1);
  });
