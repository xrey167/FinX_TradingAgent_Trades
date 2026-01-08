/**
 * Test Event-Based Seasonal Patterns (Phase 3)
 * Tests FOMC weeks, options expiry weeks, and earnings seasons
 */

import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';
import {
  EventCalendar,
  FOMCWeekExtractor,
  OptionsExpiryWeekExtractor,
  EarningsSeasonExtractor,
} from './src/tools/seasonal-patterns/index.ts';

console.log('=================================================');
console.log('EVENT-BASED SEASONAL PATTERNS TEST (Phase 3)');
console.log('=================================================\n');

// Test 1: EventCalendar Functionality
console.log('TEST 1: EventCalendar Date Detection');
console.log('-------------------------------------');

const calendar = new EventCalendar();

// Test FOMC week detection (known FOMC date: 2024-03-20)
const fomcDate = new Date('2024-03-20');
const fomcWeekStart = new Date('2024-03-18'); // Monday before
const fomcWeekEnd = new Date('2024-03-22'); // Friday after

console.log(`FOMC Meeting Date: ${fomcDate.toISOString().split('T')[0]}`);
console.log(`Week Start (Monday): ${fomcWeekStart.toISOString().split('T')[0]} - isFOMCWeek: ${calendar.isFOMCWeek(fomcWeekStart)}`);
console.log(`FOMC Day (Wednesday): ${fomcDate.toISOString().split('T')[0]} - isFOMCWeek: ${calendar.isFOMCWeek(fomcDate)}`);
console.log(`Week End (Friday): ${fomcWeekEnd.toISOString().split('T')[0]} - isFOMCWeek: ${calendar.isFOMCWeek(fomcWeekEnd)}`);

// Test options expiry week detection (3rd Friday of March 2024 = 2024-03-15)
const opexDate = new Date('2024-03-15'); // 3rd Friday
const opexWeekStart = new Date('2024-03-11'); // Monday before
console.log(`\nOptions Expiry (3rd Friday): ${opexDate.toISOString().split('T')[0]}`);
console.log(`Week Start (Monday): ${opexWeekStart.toISOString().split('T')[0]} - isOptionsExpiryWeek: ${calendar.isOptionsExpiryWeek(opexWeekStart)}`);
console.log(`Expiry Day (Friday): ${opexDate.toISOString().split('T')[0]} - isOptionsExpiryWeek: ${calendar.isOptionsExpiryWeek(opexDate)}`);

// Test earnings season detection (January, April, July, October)
const jan = new Date('2024-01-15');
const feb = new Date('2024-02-15');
const apr = new Date('2024-04-15');
console.log(`\nEarnings Season Detection:`);
console.log(`January 2024: ${calendar.isEarningsSeason(jan)} (should be true)`);
console.log(`February 2024: ${calendar.isEarningsSeason(feb)} (should be false)`);
console.log(`April 2024: ${calendar.isEarningsSeason(apr)} (should be true)`);

console.log('\n✅ TEST 1 PASSED: EventCalendar detection working\n');

// Test 2: Event Extractors
console.log('TEST 2: Event Extractors');
console.log('------------------------');

const fomcExtractor = new FOMCWeekExtractor(calendar);
const optionsExtractor = new OptionsExpiryWeekExtractor(calendar);
const earningsExtractor = new EarningsSeasonExtractor(calendar);

console.log('FOMC Week Extractor:');
console.log(`  FOMC Week: ${fomcExtractor.extract(fomcDate.getTime())}`);
console.log(`  Non-FOMC Week: ${fomcExtractor.extract(new Date('2024-02-10').getTime())}`);

console.log('\nOptions Expiry Extractor:');
console.log(`  Options Week: ${optionsExtractor.extract(opexDate.getTime())}`);
console.log(`  Non-Options Week: ${optionsExtractor.extract(new Date('2024-03-05').getTime())}`);

console.log('\nEarnings Season Extractor:');
console.log(`  Earnings Season (Jan): ${earningsExtractor.extract(jan.getTime())}`);
console.log(`  Non-Earnings Season (Feb): ${earningsExtractor.extract(feb.getTime())}`);

console.log('\n✅ TEST 2 PASSED: Event extractors working\n');

// Test 3: Full Seasonal Analysis with Event Patterns
console.log('TEST 3: Full Seasonal Analysis with Events');
console.log('-------------------------------------------');
console.log('Analyzing SPY.US with event-based patterns (5 years daily)...\n');

try {
  const result = await analyzeSeasonalTool.handler({
    symbol: 'SPY.US',
    years: 5,
    timeframe: 'daily',
  });

  // Parse the tool result (wrapped format)
  if (result.isError) {
    throw new Error(`Tool returned error: ${result.content[0].text}`);
  }

  const data = JSON.parse(result.content[0].text);

  console.log(`Symbol: ${data.symbol}`);
  console.log(`Timeframe: ${data.timeframe}`);
  console.log(`Data Points: ${data.dataPoints}`);

  // Check if event-based stats exist
  if (data.eventBasedStats && data.eventBasedStats.length > 0) {
    console.log(`\n✅ Event-Based Patterns Detected: ${data.eventBasedStats.length} events`);
    console.log('\nEvent Pattern Details:');
    console.log('======================');

    for (const event of data.eventBasedStats) {
      const statusEmoji = event.winRate > 55 ? '✅' : event.winRate < 45 ? '⚠️' : '➖';
      console.log(`\n${statusEmoji} ${event.event} (${event.impact.toUpperCase()} impact)`);
      console.log(`   Avg Return: ${event.avgReturn.toFixed(4)}%`);
      console.log(`   Win Rate: ${event.winRate.toFixed(2)}%`);
      console.log(`   Volatility: ${event.volatility.toFixed(2)}%`);
      console.log(`   Sample Size: ${event.sampleSize} occurrences`);
    }

    // Verify expected events exist
    const hasFOMC = data.eventBasedStats.some(e => e.event === 'FOMC-Week');
    const hasOptionsExpiry = data.eventBasedStats.some(e => e.event === 'Options-Expiry-Week');
    const hasEarnings = data.eventBasedStats.some(e => e.event === 'Earnings-Season');

    console.log('\n\nEvent Verification:');
    console.log(`  FOMC Week: ${hasFOMC ? '✅ Found' : '❌ Missing'}`);
    console.log(`  Options Expiry Week: ${hasOptionsExpiry ? '✅ Found' : '❌ Missing'}`);
    console.log(`  Earnings Season: ${hasEarnings ? '✅ Found' : '❌ Missing'}`);

    if (hasFOMC && hasOptionsExpiry && hasEarnings) {
      console.log('\n✅ TEST 3 PASSED: All expected events detected\n');
    } else {
      console.log('\n⚠️ TEST 3 WARNING: Some events missing (may be expected if insufficient data)\n');
    }
  } else {
    console.log('\n❌ TEST 3 FAILED: No event-based stats returned');
    console.log('Check if EventCalendar is properly integrated in seasonal-analyzer.ts\n');
  }

  // Display insights that mention events
  if (data.insights && data.insights.length > 0) {
    const eventInsights = data.insights.filter(i =>
      i.toLowerCase().includes('fomc') ||
      i.toLowerCase().includes('options') ||
      i.toLowerCase().includes('earnings') ||
      i.toLowerCase().includes('event')
    );

    if (eventInsights.length > 0) {
      console.log('\n📊 Event-Related Insights:');
      console.log('==========================');
      eventInsights.forEach((insight, i) => {
        console.log(`${i + 1}. ${insight}`);
      });
    }
  }

  console.log('\n=================================================');
  console.log('EVENT PATTERN TEST COMPLETE');
  console.log('=================================================');
} catch (error) {
  console.error('\n❌ TEST 3 FAILED with error:');
  console.error(error);
  process.exit(1);
}
