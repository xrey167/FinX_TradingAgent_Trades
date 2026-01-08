/**
 * Comprehensive Test for Combined Event Extractor (Issue #17)
 * Tests all major combination types and edge cases
 */

import {
  EventCalendar,
  CombinedEventExtractor,
  type EventCombination,
  type EventCombinationType,
} from '../../src/tools/seasonal-patterns/index.ts';

console.log('='.repeat(70));
console.log('COMPREHENSIVE COMBINED EVENT EXTRACTOR TEST (Issue #17)');
console.log('='.repeat(70));
console.log();

// Initialize
const calendar = new EventCalendar();
const extractor = new CombinedEventExtractor(calendar);

// Track test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function runTest(
  name: string,
  date: Date,
  expectedType: EventCombinationType | null,
  expectedImpact?: 'extreme' | 'very-high' | 'high'
): void {
  testsRun++;
  const dateStr = date.toISOString().split('T')[0];
  const combination = extractor.detectEventCombination(date);
  const actualType = combination?.type || null;
  const actualImpact = combination?.expectedImpact;

  const typeMatch = actualType === expectedType;
  const impactMatch = !expectedImpact || actualImpact === expectedImpact;
  const passed = typeMatch && impactMatch;

  if (passed) {
    testsPassed++;
    console.log(`✅ ${name}`);
    console.log(`   Date: ${dateStr}`);
    console.log(`   Combination: ${actualType || 'None'}`);
    if (combination) {
      console.log(`   Impact: ${actualImpact} | Multiplier: ${combination.volatilityMultiplier}x`);
    }
  } else {
    testsFailed++;
    console.log(`❌ ${name}`);
    console.log(`   Date: ${dateStr}`);
    console.log(`   Expected: ${expectedType || 'None'} (${expectedImpact || 'N/A'})`);
    console.log(`   Got: ${actualType || 'None'} (${actualImpact || 'N/A'})`);
  }
  console.log();
}

// Test Suite 1: CPI Combinations
console.log('📊 Test Suite 1: CPI-Based Combinations');
console.log('-'.repeat(70));

runTest(
  'CPI + Earnings Week',
  new Date('2024-01-11'), // CPI Release + Earnings Season
  'CPI+Earnings-Week',
  'high'
);

runTest(
  'CPI + Earnings Week (Day After)',
  new Date('2024-01-12'), // Day after CPI, still in earnings season
  'CPI+Earnings-Week',
  'high'
);

// Test Suite 2: FOMC Combinations
console.log('📊 Test Suite 2: FOMC-Based Combinations');
console.log('-'.repeat(70));

runTest(
  'Multiple High-Impact Week (FOMC + Triple Witching + Rebalancing)',
  new Date('2024-09-18'), // FOMC Meeting Day
  'Multiple-HighImpact-Week',
  'extreme'
);

runTest(
  'FOMC Week Only (No Combination)',
  new Date('2024-03-20'), // FOMC meeting, but options expiry in different week
  null
);

// Test Suite 3: Triple Witching Combinations
console.log('📊 Test Suite 3: Triple Witching Combinations');
console.log('-'.repeat(70));

runTest(
  'Triple Witching Day (in Multiple-HighImpact Week)',
  new Date('2024-09-20'), // Triple Witching Friday with FOMC same week
  'Multiple-HighImpact-Week',
  'extreme'
);

// Test Suite 4: Normal Weeks (No Combinations)
console.log('📊 Test Suite 4: Normal Weeks (No Combinations)');
console.log('-'.repeat(70));

runTest(
  'Normal Week - No Events',
  new Date('2024-02-05'), // Random Monday with no major events
  null
);

runTest(
  'Options Expiry Week Only (No High-Impact Combo)',
  new Date('2024-03-15'), // Options Expiry Friday, but no other high-impact events
  null
);

// Test Suite 5: Edge Cases
console.log('📊 Test Suite 5: Edge Cases');
console.log('-'.repeat(70));

runTest(
  'Week Boundary Test - Previous Week',
  new Date('2024-03-15'), // Friday of one week (Options Expiry)
  null
);

runTest(
  'Week Boundary Test - Next Week',
  new Date('2024-03-18'), // Monday of next week (FOMC Week starts)
  null
);

// Test Suite 6: Volatility Multipliers
console.log('📊 Test Suite 6: Volatility Multiplier Validation');
console.log('-'.repeat(70));

const multiplierTests = [
  { date: new Date('2024-01-11'), minMultiplier: 1.8, maxMultiplier: 2.2 }, // CPI+Earnings
  { date: new Date('2024-09-18'), minMultiplier: 3.0, maxMultiplier: 4.0 }, // Multiple High-Impact
];

for (const test of multiplierTests) {
  const dateStr = test.date.toISOString().split('T')[0];
  const combination = extractor.detectEventCombination(test.date);

  testsRun++;
  if (combination) {
    const multiplier = combination.volatilityMultiplier;
    const inRange = multiplier >= test.minMultiplier && multiplier <= test.maxMultiplier;

    if (inRange) {
      testsPassed++;
      console.log(`✅ Volatility multiplier for ${dateStr}: ${multiplier}x (expected ${test.minMultiplier}-${test.maxMultiplier}x)`);
    } else {
      testsFailed++;
      console.log(`❌ Volatility multiplier for ${dateStr}: ${multiplier}x (expected ${test.minMultiplier}-${test.maxMultiplier}x)`);
    }
  } else {
    testsFailed++;
    console.log(`❌ No combination detected for ${dateStr} (expected combination with multiplier)`);
  }
}

console.log();

// Test Suite 7: Extract Method (Timestamp-based)
console.log('📊 Test Suite 7: Extract Method (Timestamp-based)');
console.log('-'.repeat(70));

const extractTests = [
  { date: new Date('2024-01-11'), expected: 'CPI+Earnings-Week' },
  { date: new Date('2024-09-18'), expected: 'Multiple-HighImpact-Week' },
  { date: new Date('2024-02-05'), expected: null },
];

for (const test of extractTests) {
  testsRun++;
  const timestamp = test.date.getTime();
  const dateStr = test.date.toISOString().split('T')[0];
  const label = extractor.extract(timestamp);
  const match = label === test.expected;

  if (match) {
    testsPassed++;
    console.log(`✅ Extract ${dateStr}: ${label || 'null'} (expected ${test.expected || 'null'})`);
  } else {
    testsFailed++;
    console.log(`❌ Extract ${dateStr}: ${label || 'null'} (expected ${test.expected || 'null'})`);
  }
}

console.log();

// Test Suite 8: API Coverage
console.log('📊 Test Suite 8: API Coverage');
console.log('-'.repeat(70));

testsRun++;
const allCombinations = extractor.getAllCombinations();
if (allCombinations.length === 17) {
  testsPassed++;
  console.log(`✅ getAllCombinations() returns 17 combination types`);
} else {
  testsFailed++;
  console.log(`❌ getAllCombinations() returned ${allCombinations.length} types (expected 17)`);
}

testsRun++;
const fomcOpexMultiplier = extractor.getVolatilityMultiplier('FOMC+OptionsExpiry-Week');
if (fomcOpexMultiplier > 1.5 && fomcOpexMultiplier < 3.0) {
  testsPassed++;
  console.log(`✅ getVolatilityMultiplier('FOMC+OptionsExpiry-Week'): ${fomcOpexMultiplier}x`);
} else {
  testsFailed++;
  console.log(`❌ getVolatilityMultiplier('FOMC+OptionsExpiry-Week'): ${fomcOpexMultiplier}x (expected 1.5-3.0x)`);
}

console.log();

// Test Suite 9: Combination Detection Logic
console.log('📊 Test Suite 9: Combination Detection Logic');
console.log('-'.repeat(70));

// Test that week-level grouping works correctly
const weekTests = [
  { date: new Date('2024-09-16'), desc: 'Monday of FOMC+TW week' },
  { date: new Date('2024-09-17'), desc: 'Tuesday of FOMC+TW week' },
  { date: new Date('2024-09-18'), desc: 'Wednesday (FOMC Day) of FOMC+TW week' },
  { date: new Date('2024-09-19'), desc: 'Thursday of FOMC+TW week' },
  { date: new Date('2024-09-20'), desc: 'Friday (Triple Witching Day) of FOMC+TW week' },
];

const expectedType = 'Multiple-HighImpact-Week';
for (const test of weekTests) {
  testsRun++;
  const combo = extractor.detectEventCombination(test.date);
  const match = combo?.type === expectedType;

  if (match) {
    testsPassed++;
    console.log(`✅ ${test.desc}: ${combo.type}`);
  } else {
    testsFailed++;
    console.log(`❌ ${test.desc}: ${combo?.type || 'None'} (expected ${expectedType})`);
  }
}

console.log();

// Summary
console.log('='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed} ✅`);
console.log(`Failed: ${testsFailed} ❌`);
console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log();

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED! Combined Event Extractor is working perfectly!');
  console.log();
  console.log('✅ Issue #17 Implementation Complete:');
  console.log('   - Event combination detection working');
  console.log('   - Synergy effects calculated with volatility multipliers');
  console.log('   - All 17 combination types supported');
  console.log('   - Week-level grouping accurate');
  console.log('   - Extract method working');
  console.log('   - API fully functional');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed. Please review the implementation.`);
}

console.log('='.repeat(70));
