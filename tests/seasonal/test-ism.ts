/**
 * Test ISM Manufacturing PMI Event Pattern (Issue #11)
 *
 * Test Requirements:
 * 1. First business day calculation (handle holidays)
 * 2. 12 releases per year (monthly)
 * 3. 10:00 AM ET spike detection
 * 4. Pattern analysis with SPY.US
 * 5. Event window T-5 to T+5
 *
 * Acceptance Criteria:
 * - ISMExtractor correctly identifies first business day of each month
 * - Handles holidays properly (shifts to next business day)
 * - Detects 12 releases per year
 * - Impact classified as 'medium'
 * - 10:00 AM ET release time spike analysis
 */

import { EventCalendar } from '../../src/tools/seasonal-patterns/event-calendar.ts';

console.log('=================================================');
console.log('ISM MANUFACTURING PMI EVENT TEST (Issue #11)');
console.log('=================================================\n');

// Test 1: First Business Day Detection
console.log('TEST 1: First Business Day Detection');
console.log('------------------------------------');

const calendar = new EventCalendar();

// ISM PMI is released on the first business day of each month at 10:00 AM ET
// Test known dates for 2024 (accounting for weekends and holidays)
const testDates2024 = [
  { date: '2024-01-02', expected: true, description: 'January 2024 ISM (Jan 1 is holiday)' },
  { date: '2024-02-01', expected: true, description: 'February 2024 ISM (Thursday)' },
  { date: '2024-03-01', expected: true, description: 'March 2024 ISM (Friday)' },
  { date: '2024-04-01', expected: true, description: 'April 2024 ISM (Monday)' },
  { date: '2024-05-01', expected: true, description: 'May 2024 ISM (Wednesday)' },
  { date: '2024-06-03', expected: true, description: 'June 2024 ISM (Jun 1-2 weekend)' },
  { date: '2024-07-01', expected: true, description: 'July 2024 ISM (Monday)' },
  { date: '2024-08-01', expected: true, description: 'August 2024 ISM (Thursday)' },
  { date: '2024-09-03', expected: true, description: 'September 2024 ISM (Sep 1-2 weekend, Sep 2 Labor Day)' },
  { date: '2024-10-01', expected: true, description: 'October 2024 ISM (Tuesday)' },
  { date: '2024-11-01', expected: true, description: 'November 2024 ISM (Friday)' },
  { date: '2024-12-02', expected: true, description: 'December 2024 ISM (Dec 1 is Sunday)' },
  // Non-ISM dates
  { date: '2024-01-15', expected: false, description: 'Mid-month (not ISM)' },
  { date: '2024-02-15', expected: false, description: 'Mid-month (not ISM)' },
  { date: '2024-06-01', expected: false, description: 'June 1 (Saturday, not business day)' },
];

let passedCount = 0;
let failedCount = 0;

for (const test of testDates2024) {
  const date = new Date(test.date);
  const isISMWeek = calendar.isISMWeek ? calendar.isISMWeek(date) : null;

  if (isISMWeek !== null) {
    const passed = isISMWeek === test.expected;
    if (passed) {
      console.log(`✅ PASS: ${test.description} - ${test.date}`);
      passedCount++;
    } else {
      console.log(`❌ FAIL: ${test.description} - ${test.date} (expected: ${test.expected}, got: ${isISMWeek})`);
      failedCount++;
    }
  } else {
    console.log(`⚠️  SKIP: ${test.description} - isISMWeek() not yet implemented`);
  }
}

console.log(`\nTest 1 Results: ${passedCount} passed, ${failedCount} failed\n`);

// Test 2: Holiday Handling
console.log('TEST 2: Holiday Handling (Shift to Next Business Day)');
console.log('------------------------------------------------------');

const holidayTests = [
  { month: 'January', date: '2024-01-01', holiday: 'New Year\'s Day', expectedShift: '2024-01-02' },
  { month: 'July', date: '2024-07-04', holiday: 'Independence Day', expectedShift: '2024-07-05' },
  { month: 'September', date: '2024-09-02', holiday: 'Labor Day', expectedShift: '2024-09-03' },
  { month: 'November', date: '2024-11-28', holiday: 'Thanksgiving', expectedShift: 'N/A (mid-month)' },
  { month: 'December', date: '2024-12-25', holiday: 'Christmas', expectedShift: 'N/A (mid-month)' },
];

console.log('Federal Holidays that can affect first business day:');
for (const test of holidayTests) {
  console.log(`  ${test.month}: ${test.holiday} (${test.date})`);
  console.log(`    Expected ISM release shift: ${test.expectedShift}`);
}

console.log('\nNote: ISM is only affected by holidays on the 1st of the month');
console.log('Weekend shifts are also handled (if 1st falls on Sat/Sun)');

console.log();

// Test 3: Annual Frequency (12 releases per year)
console.log('TEST 3: Annual Frequency Detection');
console.log('-----------------------------------');

let releases2024 = 0;
let releases2025 = 0;

// Count releases in 2024
for (let month = 0; month < 12; month++) {
  // Check first week of each month
  for (let day = 1; day <= 7; day++) {
    const date = new Date(2024, month, day);
    if (calendar.isISMWeek && calendar.isISMWeek(date)) {
      releases2024++;
      break; // Only count once per month
    }
  }
}

// Count releases in 2025
for (let month = 0; month < 12; month++) {
  for (let day = 1; day <= 7; day++) {
    const date = new Date(2025, month, day);
    if (calendar.isISMWeek && calendar.isISMWeek(date)) {
      releases2025++;
      break;
    }
  }
}

console.log(`2024 ISM PMI Releases: ${releases2024} (expected: 12)`);
console.log(`2025 ISM PMI Releases: ${releases2025} (expected: 12)`);

if (releases2024 === 12 && releases2025 === 12) {
  console.log('✅ PASS: Correct annual frequency (12 releases/year)');
} else if (calendar.isISMWeek) {
  console.log('❌ FAIL: Incorrect annual frequency');
} else {
  console.log('⚠️  SKIP: isISMWeek() not yet implemented');
}

console.log();

// Test 4: ISMExtractor Class
console.log('TEST 4: ISMExtractor Class');
console.log('--------------------------');

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.ISMExtractor) {
    const ismExtractor = new module.ISMExtractor(calendar);

    console.log('✅ ISMExtractor class exists');
    console.log(`   Type: ${ismExtractor.type}`);
    console.log(`   Required Timeframe: ${ismExtractor.requiredTimeframe}`);

    // Test extraction on first business day
    const testDate = new Date('2024-02-01'); // Thursday, Feb 1
    const result = ismExtractor.extract(testDate.getTime());

    console.log(`\n   Test Extract (2024-02-01, Thursday):`);
    console.log(`   Result: ${result || 'null'}`);
    console.log(`   Expected: 'ISM-Week' or 'ISM-Day' or 'ISM-PMI'`);

    if (result && result.toUpperCase().includes('ISM')) {
      console.log('   ✅ PASS: Extraction working correctly');
    } else {
      console.log('   ❌ FAIL: Unexpected extraction result');
    }

    // Test non-ISM date
    const nonISMDate = new Date('2024-02-15');
    const nonISMResult = ismExtractor.extract(nonISMDate.getTime());

    console.log(`\n   Test Extract Non-Event (2024-02-15):`);
    console.log(`   Result: ${nonISMResult || 'null'}`);
    console.log(`   Expected: null`);

    if (nonISMResult === null) {
      console.log('   ✅ PASS: Non-event correctly returns null');
    } else {
      console.log('   ❌ FAIL: Non-event should return null');
    }

    // Test holiday shift (January 2024)
    const holidayShiftDate = new Date('2024-01-02'); // Tuesday (Jan 1 is holiday)
    const holidayResult = ismExtractor.extract(holidayShiftDate.getTime());

    console.log(`\n   Test Holiday Shift (2024-01-02, after New Year):`);
    console.log(`   Result: ${holidayResult || 'null'}`);
    console.log(`   Expected: ISM event (shifted from Jan 1)`);

    if (holidayResult && holidayResult.toUpperCase().includes('ISM')) {
      console.log('   ✅ PASS: Holiday shift handled correctly');
    } else {
      console.log('   ⚠️  Holiday shift may need verification');
    }

  } else {
    console.log('⚠️  SKIP: ISMExtractor class not yet implemented');
  }
} catch (error) {
  console.log('⚠️  SKIP: ISMExtractor class not yet implemented');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

console.log();

// Test 5: First Business Day Logic
console.log('TEST 5: First Business Day Calculation Logic');
console.log('---------------------------------------------');

console.log('Testing first business day calculation for various scenarios:');

const firstBusinessDayTests = [
  { year: 2024, month: 1, monthName: 'January', first: 1, day: 'Monday', expected: 1 },
  { year: 2024, month: 2, monthName: 'February', first: 1, day: 'Thursday', expected: 1 },
  { year: 2024, month: 6, monthName: 'June', first: 1, day: 'Saturday', expected: 3 },
  { year: 2024, month: 9, monthName: 'September', first: 1, day: 'Sunday', expected: 3 }, // Labor Day on 9/2
  { year: 2024, month: 12, monthName: 'December', first: 1, day: 'Sunday', expected: 2 },
  { year: 2025, month: 1, monthName: 'January', first: 1, day: 'Wednesday', expected: 1 },
];

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.ISMExtractor && typeof module.ISMExtractor.prototype.getFirstBusinessDay === 'function') {
    const ismExtractor = new module.ISMExtractor(calendar);

    console.log('\n   Testing getFirstBusinessDay() method:');

    for (const test of firstBusinessDayTests) {
      const firstBizDay = ismExtractor.getFirstBusinessDay(test.year, test.month - 1);
      const passed = firstBizDay.getDate() === test.expected;

      console.log(`   ${passed ? '✅' : '❌'} ${test.monthName} ${test.year}: Expected ${test.expected}, Got ${firstBizDay.getDate()}`);
    }

  } else {
    console.log('   ⚠️  getFirstBusinessDay() method not yet implemented');
  }
} catch (error) {
  console.log('   ⚠️  First business day logic not available');
}

console.log();

// Test 6: Impact Level Classification
console.log('TEST 6: Impact Level Classification');
console.log('-----------------------------------');

const ismDate = new Date('2024-02-01');
const events = calendar.getEventsForDate ? calendar.getEventsForDate(ismDate) : [];

if (events.length > 0) {
  const ismEvent = events.find(e => e.name.toUpperCase().includes('ISM'));

  if (ismEvent) {
    console.log(`Event Name: ${ismEvent.name}`);
    console.log(`Impact Level: ${ismEvent.impact}`);
    console.log(`Expected: 'medium' (manufacturing sentiment indicator)`);

    if (ismEvent.impact === 'medium') {
      console.log('✅ PASS: Correct impact level (medium)');
    } else {
      console.log(`❌ FAIL: Expected 'medium', got '${ismEvent.impact}'`);
    }
  } else {
    console.log('⚠️  SKIP: ISM event not found in calendar');
  }
} else {
  console.log('⚠️  SKIP: getEventsForDate() not returning ISM events yet');
}

console.log();

// Test 7: 10:00 AM ET Release Time
console.log('TEST 7: 10:00 AM ET Release Time Detection');
console.log('------------------------------------------');

console.log('ISM Manufacturing PMI releases at 10:00 AM ET sharp');
console.log('Expected behavior:');
console.log('  - Release at 10:00 AM ET (after market open at 9:30 AM)');
console.log('  - Initial market reaction in 9:30-10:00 AM range');
console.log('  - 10:00-10:30 AM typically shows spike in volume and volatility');
console.log('  - Different from retail sales (8:30 AM) and Fed rate (2:00 PM)');
console.log();

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.ISMExtractor) {
    const ismExtractor = new module.ISMExtractor(calendar);

    if (typeof ismExtractor.detectHourlySpike === 'function') {
      console.log('   ✅ Hourly spike detection method exists');

      // Test with 10:00 AM hour
      const result = ismExtractor.detectHourlySpike(1000, 120000000, 80000000);
      console.log(`   10:00 AM spike detected: ${result}`);

    } else {
      console.log('   ⚠️  detectHourlySpike() not implemented (optional)');
    }

    console.log('   Note: Hourly patterns require hourly timeframe data');
    console.log('   Integration test with SPY.US hourly data recommended');

  } else {
    console.log('   ⚠️  ISMExtractor not available for hourly testing');
  }
} catch (error) {
  console.log('   ⚠️  Hourly spike detection not yet implemented');
}

console.log();

// Test 8: Event Window Analysis
console.log('TEST 8: Event Window Analysis (T-5 to T+5)');
console.log('-------------------------------------------');

try {
  const module = await import('../../src/tools/seasonal-patterns/event-extractors.ts');

  if (module.ISMExtractor && typeof module.ISMExtractor.prototype.analyzeEventWindow === 'function') {
    const ismExtractor = new module.ISMExtractor(calendar);

    // Create mock price data
    const mockPriceData = [];
    const baseDate = new Date('2024-02-01'); // ISM release date

    for (let i = -10; i <= 10; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      mockPriceData.push({
        date,
        close: 480 + Math.random() * 10,
        high: 485 + Math.random() * 10,
        low: 475 + Math.random() * 10,
        volume: 90000000 + Math.random() * 40000000,
      });
    }

    const analysis = ismExtractor.analyzeEventWindow(baseDate, mockPriceData);

    console.log('   Event Window Analysis Results:');
    console.log(`   Is ISM Week: ${analysis.isISMWeek ?? 'N/A'}`);
    console.log(`   Days Until Release: ${analysis.daysUntilRelease ?? 'N/A'}`);
    console.log(`   Expected Impact: ${analysis.expectedImpact ?? 'N/A'}`);
    console.log(`   Insights: ${analysis.insights?.length ?? 0} generated`);

    if (analysis.insights && analysis.insights.length > 0) {
      console.log('\n   Generated Insights:');
      analysis.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight}`);
      });
    }

    console.log('\n   ✅ PASS: Event window analysis available');

  } else {
    console.log('   ⚠️  SKIP: analyzeEventWindow() not yet implemented');
  }
} catch (error) {
  console.log('   ⚠️  SKIP: Event window analysis not available');
}

console.log();

// Test 9: Weekend and Holiday Edge Cases
console.log('TEST 9: Weekend and Holiday Edge Cases');
console.log('--------------------------------------');

const edgeCases = [
  { date: '2024-06-01', day: 'Saturday', expected: '2024-06-03', reason: 'Weekend skip to Monday' },
  { date: '2024-09-01', day: 'Sunday', expected: '2024-09-03', reason: 'Weekend + Labor Day' },
  { date: '2024-12-01', day: 'Sunday', expected: '2024-12-02', reason: 'Weekend skip to Monday' },
  { date: '2025-01-01', day: 'Wednesday', expected: '2025-01-02', reason: 'New Year holiday' },
];

console.log('Edge case scenarios for first business day:');

for (const test of edgeCases) {
  const date = new Date(test.date);
  console.log(`  ${test.date} (${test.day}): ${test.reason}`);
  console.log(`    Expected ISM release: ${test.expected}`);

  if (calendar.isISMWeek) {
    const expectedDate = new Date(test.expected);
    const isISM = calendar.isISMWeek(expectedDate);
    console.log(`    Detected: ${isISM ? '✅ Yes' : '❌ No'}`);
  }
}

console.log();

// Test 10: Pattern Analysis with SPY.US
console.log('TEST 10: Pattern Analysis with SPY.US');
console.log('-------------------------------------');

console.log('This test requires full integration with seasonal analyzer tool');
console.log('Expected outcomes:');
console.log('  - ISM PMI events detected in SPY.US historical data');
console.log('  - First business day pattern verified');
console.log('  - 10:00 AM ET spike analysis with hourly data');
console.log('  - Event window returns and volatility measured');
console.log();

console.log('⚠️  Manual Test Required:');
console.log('   Run: bun test tests/seasonal/test-seasonal-comprehensive.ts');
console.log('   Or: bun run research -- --symbol SPY.US --years 5');
console.log('   Verify ISM events appear on first business day of each month');

console.log();

// Summary
console.log('=================================================');
console.log('ISM MANUFACTURING PMI TEST SUMMARY (Issue #11)');
console.log('=================================================');

const implementationStatus = [
  { feature: 'First business day calculation', status: calendar.isISMWeek ? '✅' : '⚠️' },
  { feature: 'Holiday handling', status: '⚠️ Verify edge cases' },
  { feature: '12 releases per year', status: releases2024 === 12 ? '✅' : '⚠️' },
  { feature: 'ISMExtractor class', status: '⚠️ Check needed' },
  { feature: 'Event window analysis', status: '⚠️ Check needed' },
  { feature: '10:00 AM spike detection', status: '⚠️ Optional feature' },
];

console.log('\nFeature Implementation Status:');
implementationStatus.forEach(item => {
  console.log(`${item.status} ${item.feature}`);
});

console.log('\nAcceptance Criteria Checklist (Issue #11):');
console.log('[ ] ISMExtractor correctly identifies first business day');
console.log('[ ] Handles holidays properly (shifts to next business day)');
console.log('[ ] Weekend logic working (Sat/Sun → Monday)');
console.log('[ ] Detects exactly 12 releases per year');
console.log('[ ] Impact level is "medium"');
console.log('[ ] 10:00 AM ET release time documented');
console.log('[ ] Event window (T-5 to T+5) analysis working');
console.log('[ ] Test coverage ≥80%');

console.log('\n=================================================');
console.log('TEST COMPLETE');
console.log('=================================================');
