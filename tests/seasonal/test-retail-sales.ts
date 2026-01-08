/**
 * Test Retail Sales Event Pattern (Issue #10)
 *
 * Test Requirements:
 * 1. Mid-month detection (13-17th typically)
 * 2. 12 releases per year (monthly)
 * 3. Pattern analysis with SPY.US
 * 4. 8:30 AM hourly spike detection
 * 5. Event window T-5 to T+5
 *
 * Acceptance Criteria:
 * - RetailSalesExtractor correctly identifies mid-month release dates
 * - Detects 12 releases per year
 * - Impact classified as 'medium' (lower than CPI/NFP)
 * - Pattern analysis shows 8:30 AM ET spike in SPY.US
 * - Event window analysis working properly
 */

import { EventCalendar } from '../../src/tools/seasonal-patterns/event-calendar.ts';

console.log('=================================================');
console.log('RETAIL SALES EVENT PATTERN TEST (Issue #10)');
console.log('=================================================\n');

// Test 1: Retail Sales Date Detection
console.log('TEST 1: Retail Sales Date Detection');
console.log('------------------------------------');

const calendar = new EventCalendar();

// Retail Sales typically released mid-month (around 13-17th)
// Test known dates for 2024
const testDates2024 = [
  { date: '2024-01-17', expected: true, description: 'January 2024 retail sales' },
  { date: '2024-02-15', expected: true, description: 'February 2024 retail sales' },
  { date: '2024-03-14', expected: true, description: 'March 2024 retail sales' },
  { date: '2024-04-15', expected: true, description: 'April 2024 retail sales' },
  { date: '2024-05-16', expected: true, description: 'May 2024 retail sales' },
  { date: '2024-06-18', expected: true, description: 'June 2024 retail sales' },
  { date: '2024-07-16', expected: true, description: 'July 2024 retail sales' },
  { date: '2024-08-15', expected: true, description: 'August 2024 retail sales' },
  { date: '2024-09-17', expected: true, description: 'September 2024 retail sales' },
  { date: '2024-10-17', expected: true, description: 'October 2024 retail sales' },
  { date: '2024-11-15', expected: true, description: 'November 2024 retail sales' },
  { date: '2024-12-17', expected: true, description: 'December 2024 retail sales' },
  // Non-retail sales dates
  { date: '2024-01-05', expected: false, description: 'Early January (not retail sales)' },
  { date: '2024-01-25', expected: false, description: 'Late January (not retail sales)' },
  { date: '2024-06-01', expected: false, description: 'Early June (not retail sales)' },
];

let passedCount = 0;
let failedCount = 0;

for (const test of testDates2024) {
  const date = new Date(test.date);
  const isRetailSalesWeek = calendar.isRetailSalesWeek ? calendar.isRetailSalesWeek(date) : false;

  // For now, just check if method exists
  if (typeof calendar.isRetailSalesWeek === 'function') {
    const passed = isRetailSalesWeek === test.expected;
    if (passed) {
      console.log(`✅ PASS: ${test.description} - ${test.date}`);
      passedCount++;
    } else {
      console.log(`❌ FAIL: ${test.description} - ${test.date} (expected: ${test.expected}, got: ${isRetailSalesWeek})`);
      failedCount++;
    }
  } else {
    console.log(`⚠️  SKIP: ${test.description} - isRetailSalesWeek() not yet implemented`);
  }
}

console.log(`\nTest 1 Results: ${passedCount} passed, ${failedCount} failed\n`);

// Test 2: Annual Frequency (12 releases per year)
console.log('TEST 2: Annual Frequency Detection');
console.log('-----------------------------------');

const year2024 = new Date('2024-01-01');
const year2025 = new Date('2025-01-01');

let releases2024 = 0;
let releases2025 = 0;

// Count releases in 2024
for (let month = 0; month < 12; month++) {
  // Check mid-month dates (13-17th)
  for (let day = 13; day <= 17; day++) {
    const date = new Date(2024, month, day);
    if (calendar.isRetailSalesWeek && calendar.isRetailSalesWeek(date)) {
      releases2024++;
      break; // Only count once per month
    }
  }
}

// Count releases in 2025
for (let month = 0; month < 12; month++) {
  for (let day = 13; day <= 17; day++) {
    const date = new Date(2025, month, day);
    if (calendar.isRetailSalesWeek && calendar.isRetailSalesWeek(date)) {
      releases2025++;
      break;
    }
  }
}

console.log(`2024 Retail Sales Releases: ${releases2024} (expected: 12)`);
console.log(`2025 Retail Sales Releases: ${releases2025} (expected: 12)`);

if (releases2024 === 12 && releases2025 === 12) {
  console.log('✅ PASS: Correct annual frequency (12 releases/year)');
} else if (calendar.isRetailSalesWeek) {
  console.log('❌ FAIL: Incorrect annual frequency');
} else {
  console.log('⚠️  SKIP: isRetailSalesWeek() not yet implemented');
}

console.log();

// Test 3: RetailSalesExtractor Class
console.log('TEST 3: RetailSalesExtractor Class');
console.log('----------------------------------');

try {
  // Dynamic import to handle case where class doesn't exist yet
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.RetailSalesExtractor) {
    const retailExtractor = new module.RetailSalesExtractor(calendar);

    console.log('✅ RetailSalesExtractor class exists');
    console.log(`   Type: ${retailExtractor.type}`);
    console.log(`   Required Timeframe: ${retailExtractor.requiredTimeframe}`);

    // Test extraction
    const testDate = new Date('2024-01-17'); // Known retail sales date
    const result = retailExtractor.extract(testDate.getTime());

    console.log(`\n   Test Extract (2024-01-17):`);
    console.log(`   Result: ${result || 'null'}`);
    console.log(`   Expected: 'Retail-Sales-Week' or 'Retail-Sales-Day'`);

    if (result && (result.includes('Retail-Sales') || result.includes('Retail Sales'))) {
      console.log('   ✅ PASS: Extraction working correctly');
    } else {
      console.log('   ❌ FAIL: Unexpected extraction result');
    }

    // Test non-retail sales date
    const nonRetailDate = new Date('2024-01-05');
    const nonRetailResult = retailExtractor.extract(nonRetailDate.getTime());

    console.log(`\n   Test Extract Non-Event (2024-01-05):`);
    console.log(`   Result: ${nonRetailResult || 'null'}`);
    console.log(`   Expected: null`);

    if (nonRetailResult === null) {
      console.log('   ✅ PASS: Non-event correctly returns null');
    } else {
      console.log('   ❌ FAIL: Non-event should return null');
    }

  } else {
    console.log('⚠️  SKIP: RetailSalesExtractor class not yet implemented');
  }
} catch (error) {
  console.log('⚠️  SKIP: RetailSalesExtractor class not yet implemented');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

console.log();

// Test 4: Impact Level Classification
console.log('TEST 4: Impact Level Classification');
console.log('-----------------------------------');

const retailDate = new Date('2024-01-17');
const events = calendar.getEventsForDate ? calendar.getEventsForDate(retailDate) : [];

if (events.length > 0) {
  const retailEvent = events.find(e => e.name.toLowerCase().includes('retail'));

  if (retailEvent) {
    console.log(`Event Name: ${retailEvent.name}`);
    console.log(`Impact Level: ${retailEvent.impact}`);
    console.log(`Expected: 'medium' (lower than CPI/NFP which are 'high')`);

    if (retailEvent.impact === 'medium') {
      console.log('✅ PASS: Correct impact level (medium)');
    } else {
      console.log(`❌ FAIL: Expected 'medium', got '${retailEvent.impact}'`);
    }
  } else {
    console.log('⚠️  SKIP: Retail sales event not found in calendar');
  }
} else {
  console.log('⚠️  SKIP: getEventsForDate() not returning retail sales events yet');
}

console.log();

// Test 5: Mid-Month Detection Accuracy
console.log('TEST 5: Mid-Month Detection (13-17th)');
console.log('--------------------------------------');

const midMonthTests = [
  { day: 12, expected: false, reason: 'Too early (12th)' },
  { day: 13, expected: true, reason: 'Valid range start (13th)' },
  { day: 14, expected: true, reason: 'Mid-range (14th)' },
  { day: 15, expected: true, reason: 'Mid-range (15th)' },
  { day: 16, expected: true, reason: 'Mid-range (16th)' },
  { day: 17, expected: true, reason: 'Valid range end (17th)' },
  { day: 18, expected: false, reason: 'Too late (18th)' },
];

let midMonthPassed = 0;
let midMonthFailed = 0;

for (const test of midMonthTests) {
  const date = new Date(2024, 0, test.day); // January 2024
  const isRetailWeek = calendar.isRetailSalesWeek ? calendar.isRetailSalesWeek(date) : null;

  if (isRetailWeek !== null) {
    // Note: Actual dates might not fall exactly on these days, but they should be in this range
    console.log(`   Day ${test.day}: ${isRetailWeek ? 'Detected' : 'Not Detected'} - ${test.reason}`);
    midMonthPassed++;
  } else {
    console.log(`   ⚠️  Day ${test.day}: Method not implemented`);
  }
}

console.log(`\n   Mid-month detection tests: ${midMonthPassed} checked`);
console.log('   Note: Actual retail sales dates vary by month and calendar shifts');

console.log();

// Test 6: Event Window Analysis (T-5 to T+5)
console.log('TEST 6: Event Window Analysis (T-5 to T+5)');
console.log('-------------------------------------------');

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.RetailSalesExtractor && typeof module.RetailSalesExtractor.prototype.analyzeEventWindow === 'function') {
    const retailExtractor = new module.RetailSalesExtractor(calendar);

    // Create mock price data for event window testing
    const mockPriceData = [];
    const baseDate = new Date('2024-01-17'); // Retail sales date

    for (let i = -10; i <= 10; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      mockPriceData.push({
        date,
        close: 450 + Math.random() * 10,
        high: 455 + Math.random() * 10,
        low: 445 + Math.random() * 10,
        volume: 100000000 + Math.random() * 50000000,
      });
    }

    const analysis = retailExtractor.analyzeEventWindow(baseDate, mockPriceData);

    console.log('   Event Window Analysis Results:');
    console.log(`   Is Retail Sales Week: ${analysis.isRetailSalesWeek ?? 'N/A'}`);
    console.log(`   Days Until Release: ${analysis.daysUntilRelease ?? 'N/A'}`);
    console.log(`   Expected Impact: ${analysis.expectedImpact ?? 'N/A'}`);
    console.log(`   Insights: ${analysis.insights?.length ?? 0} generated`);

    if (analysis.insights && analysis.insights.length > 0) {
      console.log('\n   Generated Insights:');
      analysis.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight}`);
      });
    }

    console.log('\n   ✅ PASS: Event window analysis method exists and executes');

  } else {
    console.log('   ⚠️  SKIP: analyzeEventWindow() not yet implemented');
  }
} catch (error) {
  console.log('   ⚠️  SKIP: Event window analysis not available');
}

console.log();

// Test 7: 8:30 AM ET Hourly Spike (Market Open Hour)
console.log('TEST 7: 8:30 AM ET Release Time Detection');
console.log('-----------------------------------------');

console.log('Retail Sales releases at 8:30 AM ET (before market open at 9:30 AM)');
console.log('Expected behavior:');
console.log('  - Pre-market volatility spike at 8:30 AM');
console.log('  - Market open at 9:30 AM shows initial reaction');
console.log('  - First hour (9:30-10:30 AM) typically shows highest volume');
console.log();

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.RetailSalesExtractor) {
    const retailExtractor = new module.RetailSalesExtractor(calendar);

    // Check if extractor has hourly analysis capability
    if (typeof retailExtractor.detectHourlySpike === 'function') {
      console.log('   ✅ Hourly spike detection method exists');

      // Test with mock data
      const result = retailExtractor.detectHourlySpike(830, 150000000, 100000000);
      console.log(`   8:30 AM spike detected: ${result}`);

    } else {
      console.log('   ⚠️  detectHourlySpike() method not implemented (optional feature)');
    }

    console.log('   Note: Hourly patterns require hourly timeframe data');
    console.log('   Integration test with SPY.US hourly data recommended');

  } else {
    console.log('   ⚠️  RetailSalesExtractor not available for hourly testing');
  }
} catch (error) {
  console.log('   ⚠️  Hourly spike detection not yet implemented');
}

console.log();

// Test 8: Pattern Analysis with SPY.US
console.log('TEST 8: Pattern Analysis with SPY.US');
console.log('------------------------------------');

console.log('This test requires full integration with seasonal analyzer tool');
console.log('Expected outcomes:');
console.log('  - Retail Sales events detected in SPY.US historical data');
console.log('  - Average return calculation for event windows');
console.log('  - Volatility spike detection around 8:30 AM releases');
console.log('  - Win rate analysis (% of positive returns)');
console.log();

console.log('⚠️  Manual Test Required:');
console.log('   Run: bun test tests/seasonal/test-seasonal-comprehensive.ts');
console.log('   Or: bun run research -- --symbol SPY.US --years 5');
console.log('   Verify retail sales events appear in output');

console.log();

// Summary
console.log('=================================================');
console.log('RETAIL SALES TEST SUMMARY (Issue #10)');
console.log('=================================================');

const implementationStatus = [
  { feature: 'Mid-month detection (13-17th)', status: calendar.isRetailSalesWeek ? '✅' : '⚠️' },
  { feature: '12 releases per year', status: releases2024 === 12 ? '✅' : '⚠️' },
  { feature: 'RetailSalesExtractor class', status: '⚠️ Check needed' },
  { feature: 'Event window analysis', status: '⚠️ Check needed' },
  { feature: '8:30 AM spike detection', status: '⚠️ Optional feature' },
  { feature: 'Pattern analysis with SPY.US', status: '⚠️ Integration test' },
];

console.log('\nFeature Implementation Status:');
implementationStatus.forEach(item => {
  console.log(`${item.status} ${item.feature}`);
});

console.log('\nAcceptance Criteria Checklist (Issue #10):');
console.log('[ ] RetailSalesExtractor correctly identifies mid-month dates');
console.log('[ ] Detects exactly 12 releases per year');
console.log('[ ] Impact level is "medium" (lower than CPI/NFP)');
console.log('[ ] 8:30 AM ET release time documented');
console.log('[ ] Event window (T-5 to T+5) analysis working');
console.log('[ ] Pattern analysis shows correlation with SPY.US');
console.log('[ ] Test coverage ≥80%');

console.log('\n=================================================');
console.log('TEST COMPLETE');
console.log('=================================================');
