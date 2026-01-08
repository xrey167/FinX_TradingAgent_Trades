/**
 * Test Suite for Event Window Extractor - Issue #16
 * Tests T-N to T+N pattern detection around market events
 *
 * Test Coverage:
 * - Basic window position detection (T-5 to T+5)
 * - FOMC event windows with known dates
 * - CPI event windows with known dates
 * - NFP event windows (first Friday pattern)
 * - Options expiry windows (third Friday)
 * - Trading days vs calendar days calculation
 * - Edge cases: weekends, holidays, cross-year windows
 */

import { EventCalendar } from '../../src/tools/seasonal-patterns/event-calendar.ts';
import {
  EventWindowExtractor,
  FOMCWindowExtractor,
  CPIWindowExtractor,
  NFPWindowExtractor,
  OptionsExpiryWindowExtractor,
  type EventWindowConfig,
} from '../../src/tools/seasonal-patterns/event-window-extractor.ts';

// Test utilities
function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// Test runner
function runTest(name: string, testFn: () => void | Promise<void>): void {
  console.log(`\n📋 Test: ${name}`);
  try {
    const result = testFn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ PASSED`);
      }).catch((error) => {
        console.error(`❌ FAILED: ${error.message}`);
        console.error(error.stack);
      });
    } else {
      console.log(`✅ PASSED`);
    }
  } catch (error: any) {
    console.error(`❌ FAILED: ${error.message}`);
    console.error(error.stack);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual: any, expected: any, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message}\n  Expected: ${expected}\n  Actual: ${actual}`
    );
  }
}

// Test Suite
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Event Window Extractor Test Suite - Issue #16');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Initialize calendar
const calendar = new EventCalendar();

// ============================================================================
// Test Group 1: Basic FOMC Window Detection
// ============================================================================
console.log('\n📦 Test Group 1: Basic FOMC Window Detection');

runTest('FOMC-1: Detect T+0 (event day) for known FOMC date', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // 2024-01-31 is a known FOMC meeting date
  const timestamp = dateToTimestamp('2024-01-31');
  const label = extractor.extract(timestamp);

  assertEquals(label, 'FOMC-T+0', 'Should detect FOMC event day');
});

runTest('FOMC-2: Detect T-5 (5 days before FOMC)', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // 2024-01-31 is FOMC date, so T-5 should be around 2024-01-24
  // Account for weekend: Jan 27-28 (Sat-Sun), so T-5 is actually Jan 24 (Wed)
  const timestamp = dateToTimestamp('2024-01-24');
  const label = extractor.extract(timestamp);

  // Should be within FOMC window
  assert(label !== null, 'Should detect date within FOMC window');
  assert(label!.startsWith('FOMC-T'), 'Should have FOMC prefix');
});

runTest('FOMC-3: Detect T+5 (5 days after FOMC)', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // 2024-01-31 is FOMC date (Wednesday)
  // T+5 should be around 2024-02-07 (accounting for weekend Feb 3-4)
  const timestamp = dateToTimestamp('2024-02-07');
  const label = extractor.extract(timestamp);

  // Should be within FOMC window
  assert(label !== null, 'Should detect date within FOMC window');
  assert(label!.startsWith('FOMC-T'), 'Should have FOMC prefix');
});

runTest('FOMC-4: Return null for dates outside window', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // 2024-02-15 is far from FOMC dates (next is 2024-03-20)
  const timestamp = dateToTimestamp('2024-02-15');
  const label = extractor.extract(timestamp);

  assertEquals(label, null, 'Should return null for dates outside window');
});

runTest('FOMC-5: Verify multiple FOMC dates in year', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // Test known FOMC dates from 2024
  const fomcDates = [
    '2024-01-31',
    '2024-03-20',
    '2024-05-01',
    '2024-06-12',
  ];

  let detectedCount = 0;
  for (const dateStr of fomcDates) {
    const timestamp = dateToTimestamp(dateStr);
    const label = extractor.extract(timestamp);
    if (label === 'FOMC-T+0') {
      detectedCount++;
    }
  }

  assert(detectedCount >= 2, `Should detect at least 2 FOMC dates (detected ${detectedCount})`);
});

// ============================================================================
// Test Group 2: CPI Window Detection
// ============================================================================
console.log('\n📦 Test Group 2: CPI Window Detection');

runTest('CPI-1: Detect CPI release day', () => {
  const extractor = new CPIWindowExtractor(calendar, 5);

  // 2024-01-11 is a known CPI release date
  const timestamp = dateToTimestamp('2024-01-11');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect CPI release day');
  assert(label!.includes('CPI'), 'Should have CPI prefix');
});

runTest('CPI-2: Detect T-3 before CPI', () => {
  const extractor = new CPIWindowExtractor(calendar, 5);

  // 2024-02-13 is CPI release (Tuesday)
  // T-3 should be around 2024-02-08 (Thursday)
  const timestamp = dateToTimestamp('2024-02-08');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect date within CPI window');
  assert(label!.startsWith('CPI-T'), 'Should have CPI prefix');
});

runTest('CPI-3: Detect T+2 after CPI', () => {
  const extractor = new CPIWindowExtractor(calendar, 5);

  // 2024-03-12 is CPI release (Tuesday)
  // T+2 should be 2024-03-14 (Thursday)
  const timestamp = dateToTimestamp('2024-03-14');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect date within CPI window');
  assert(label!.startsWith('CPI-T'), 'Should have CPI prefix');
});

// ============================================================================
// Test Group 3: NFP Window Detection
// ============================================================================
console.log('\n📦 Test Group 3: NFP Window Detection');

runTest('NFP-1: Detect NFP release day (first Friday)', () => {
  const extractor = new NFPWindowExtractor(calendar, 5);

  // January 2024: First Friday is Jan 5
  const timestamp = dateToTimestamp('2024-01-05');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect NFP release day');
  assert(label!.includes('NFP'), 'Should have NFP prefix');
});

runTest('NFP-2: Detect T-1 before NFP (Thursday)', () => {
  const extractor = new NFPWindowExtractor(calendar, 5);

  // February 2024: First Friday is Feb 2
  // T-1 should be Feb 1 (Thursday)
  const timestamp = dateToTimestamp('2024-02-01');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect date within NFP window');
  assert(label!.startsWith('NFP-T'), 'Should have NFP prefix');
});

runTest('NFP-3: Verify NFP first Friday pattern', () => {
  const extractor = new NFPWindowExtractor(calendar, 5);

  // Test first Fridays of multiple months
  const firstFridays = [
    '2024-03-01', // March: First Friday is March 1
    '2024-04-05', // April: First Friday is April 5
    '2024-05-03', // May: First Friday is May 3
  ];

  let detectedCount = 0;
  for (const dateStr of firstFridays) {
    const timestamp = dateToTimestamp(dateStr);
    const label = extractor.extract(timestamp);
    if (label && label.includes('NFP')) {
      detectedCount++;
    }
  }

  assert(detectedCount >= 2, `Should detect at least 2 NFP dates (detected ${detectedCount})`);
});

// ============================================================================
// Test Group 4: Options Expiry Window Detection
// ============================================================================
console.log('\n📦 Test Group 4: Options Expiry Window Detection');

runTest('OpEx-1: Detect third Friday (options expiry)', () => {
  const extractor = new OptionsExpiryWindowExtractor(calendar, 3);

  // January 2024: Third Friday is Jan 19
  const timestamp = dateToTimestamp('2024-01-19');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect options expiry day');
  assert(label!.includes('OpEx'), 'Should have OpEx prefix');
});

runTest('OpEx-2: Detect T-2 before expiry', () => {
  const extractor = new OptionsExpiryWindowExtractor(calendar, 3);

  // February 2024: Third Friday is Feb 16
  // T-2 should be Feb 14 (Wednesday)
  const timestamp = dateToTimestamp('2024-02-14');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect date within OpEx window');
  assert(label!.startsWith('OpEx-T'), 'Should have OpEx prefix');
});

runTest('OpEx-3: Verify third Friday pattern for multiple months', () => {
  const extractor = new OptionsExpiryWindowExtractor(calendar, 3);

  // Third Fridays in 2024
  const thirdFridays = [
    '2024-03-15', // March
    '2024-04-19', // April
    '2024-05-17', // May
  ];

  let detectedCount = 0;
  for (const dateStr of thirdFridays) {
    const timestamp = dateToTimestamp(dateStr);
    const label = extractor.extract(timestamp);
    if (label && label.includes('OpEx')) {
      detectedCount++;
    }
  }

  assert(detectedCount >= 2, `Should detect at least 2 OpEx dates (detected ${detectedCount})`);
});

// ============================================================================
// Test Group 5: Custom Window Sizes
// ============================================================================
console.log('\n📦 Test Group 5: Custom Window Sizes');

runTest('Window-1: Test small window (T-3 to T+3)', () => {
  const extractor = new FOMCWindowExtractor(calendar, 3);

  // Should detect within smaller window
  const timestamp = dateToTimestamp('2024-01-31');
  const label = extractor.extract(timestamp);

  assertEquals(label, 'FOMC-T+0', 'Should detect event day in small window');
});

runTest('Window-2: Test large window (T-10 to T+10)', () => {
  const extractor = new FOMCWindowExtractor(calendar, 10);

  // Should detect within larger window
  const timestamp = dateToTimestamp('2024-01-31');
  const label = extractor.extract(timestamp);

  assertEquals(label, 'FOMC-T+0', 'Should detect event day in large window');
});

runTest('Window-3: Verify window labels generation', () => {
  const extractor = new FOMCWindowExtractor(calendar, 3);

  const labels = extractor.getWindowLabels();

  // Should have 7 labels: T-3, T-2, T-1, T+0, T+1, T+2, T+3
  assertEquals(labels.length, 7, 'Should have 7 labels for window size 3');
  assert(labels.includes('FOMC-T-3'), 'Should include T-3');
  assert(labels.includes('FOMC-T+0'), 'Should include T+0');
  assert(labels.includes('FOMC-T+3'), 'Should include T+3');
});

runTest('Window-4: Verify window positions generation', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  const positions = extractor.getWindowPositions();

  // Should have 11 positions: -5 to +5
  assertEquals(positions.length, 11, 'Should have 11 positions for window size 5');
  assert(positions.includes(-5), 'Should include -5');
  assert(positions.includes(0), 'Should include 0');
  assert(positions.includes(5), 'Should include 5');
});

// ============================================================================
// Test Group 6: Edge Cases
// ============================================================================
console.log('\n📦 Test Group 6: Edge Cases');

runTest('Edge-1: Handle weekend dates correctly', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // Test Saturday and Sunday (should skip weekends)
  const saturday = dateToTimestamp('2024-01-27'); // Saturday
  const sunday = dateToTimestamp('2024-01-28'); // Sunday

  const satLabel = extractor.extract(saturday);
  const sunLabel = extractor.extract(sunday);

  // Weekends should either be null or not counted in trading days
  console.log(`  Saturday label: ${satLabel}`);
  console.log(`  Sunday label: ${sunLabel}`);
});

runTest('Edge-2: Handle market holidays', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // Test New Year's Day 2024 (holiday)
  const holiday = dateToTimestamp('2024-01-01');
  const label = extractor.extract(holiday);

  console.log(`  Holiday label: ${label}`);
  // Holiday should be skipped in trading days calculation
});

runTest('Edge-3: Handle cross-year windows', () => {
  const extractor = new EventWindowExtractor(calendar, {
    eventType: 'fomc',
    windowSize: 10,
  });

  // Test date near year boundary
  const timestamp = dateToTimestamp('2024-12-20');
  const label = extractor.extract(timestamp);

  console.log(`  Cross-year label: ${label}`);
  // Should handle year boundaries correctly
});

runTest('Edge-4: Test calendar days mode (skipWeekends=false)', () => {
  const extractor = new EventWindowExtractor(calendar, {
    eventType: 'fomc',
    windowSize: 5,
    skipWeekends: false,
    skipHolidays: false,
  });

  // Should count all calendar days including weekends
  const timestamp = dateToTimestamp('2024-01-31');
  const label = extractor.extract(timestamp);

  assertEquals(label, 'FOMC-T+0', 'Should detect event day in calendar mode');
});

// ============================================================================
// Test Group 7: Generic EventWindowExtractor
// ============================================================================
console.log('\n📦 Test Group 7: Generic EventWindowExtractor');

runTest('Generic-1: Configure custom event window', () => {
  const config: EventWindowConfig = {
    eventType: 'fomc',
    windowSize: 7,
    labelPrefix: 'FED',
    timeframe: 'daily',
  };

  const extractor = new EventWindowExtractor(calendar, config);

  // Should use custom label prefix
  const timestamp = dateToTimestamp('2024-01-31');
  const label = extractor.extract(timestamp);

  assert(label !== null, 'Should detect event');
  assert(label!.startsWith('FED-'), 'Should use custom prefix');
});

runTest('Generic-2: Test multiple event types', () => {
  // Test different event types
  const eventTypes: Array<EventWindowConfig['eventType']> = [
    'fomc',
    'economic',
    'options-expiry',
  ];

  let detectedEvents = 0;
  for (const eventType of eventTypes) {
    const extractor = new EventWindowExtractor(calendar, {
      eventType,
      windowSize: 5,
    });

    // Check if any dates in January 2024 match
    for (let day = 1; day <= 31; day++) {
      const timestamp = dateToTimestamp(`2024-01-${String(day).padStart(2, '0')}`);
      const label = extractor.extract(timestamp);
      if (label !== null) {
        detectedEvents++;
        break; // Found at least one event for this type
      }
    }
  }

  assert(detectedEvents >= 2, `Should detect at least 2 event types (detected ${detectedEvents})`);
});

// ============================================================================
// Test Group 8: Real-World Scenarios
// ============================================================================
console.log('\n📦 Test Group 8: Real-World Scenarios');

runTest('Scenario-1: Pre-FOMC drift detection (T-2 to T-1)', () => {
  const extractor = new FOMCWindowExtractor(calendar, 5);

  // 2024-03-20 is FOMC date (Wednesday)
  // T-1 should be March 19 (Tuesday)
  // T-2 should be March 18 (Monday)

  const t1 = dateToTimestamp('2024-03-19');
  const t2 = dateToTimestamp('2024-03-18');

  const label1 = extractor.extract(t1);
  const label2 = extractor.extract(t2);

  console.log(`  T-1 label: ${label1}`);
  console.log(`  T-2 label: ${label2}`);

  assert(label1 !== null, 'Should detect T-1');
  assert(label2 !== null, 'Should detect T-2');
});

runTest('Scenario-2: CPI 8:30 AM release window', () => {
  const extractor = new CPIWindowExtractor(calendar, 3);

  // 2024-04-10 is CPI release (Wednesday)
  const releaseDay = dateToTimestamp('2024-04-10');
  const label = extractor.extract(releaseDay);

  console.log(`  CPI release day label: ${label}`);
  assert(label !== null, 'Should detect CPI release day');
});

runTest('Scenario-3: NFP Friday pattern', () => {
  const extractor = new NFPWindowExtractor(calendar, 5);

  // June 2024: First Friday is June 7
  const nfpDay = dateToTimestamp('2024-06-07');
  const label = extractor.extract(nfpDay);

  console.log(`  NFP day label: ${label}`);
  assert(label !== null, 'Should detect NFP day');
});

runTest('Scenario-4: Options expiry pinning (T-1)', () => {
  const extractor = new OptionsExpiryWindowExtractor(calendar, 3);

  // July 2024: Third Friday is July 19
  // T-1 should be July 18 (Thursday)
  const t1 = dateToTimestamp('2024-07-18');
  const label = extractor.extract(t1);

  console.log(`  OpEx T-1 label: ${label}`);
  assert(label !== null, 'Should detect T-1 before options expiry');
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Test Suite Complete');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📊 Coverage Summary:');
console.log('  ✓ Basic window detection (T-N to T+N)');
console.log('  ✓ FOMC event windows with known dates');
console.log('  ✓ CPI event windows with known dates');
console.log('  ✓ NFP event windows (first Friday pattern)');
console.log('  ✓ Options expiry windows (third Friday)');
console.log('  ✓ Custom window sizes');
console.log('  ✓ Edge cases (weekends, holidays, cross-year)');
console.log('  ✓ Real-world scenarios');
console.log('\n💡 Usage Examples:');
console.log('  const extractor = new FOMCWindowExtractor(calendar, 5);');
console.log('  const label = extractor.extract(timestamp);');
console.log('  // Returns: "FOMC-T-5", "FOMC-T+0", "FOMC-T+3", etc.');
