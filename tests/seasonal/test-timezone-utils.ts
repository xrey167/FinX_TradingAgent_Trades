/**
 * Test Suite: TimezoneUtil.isUSMarketHoliday()
 *
 * Comprehensive tests for US market holiday detection
 * Tests all 10 NYSE holidays plus weekend observations
 *
 * Issue #44: Centralized holiday detection via facade pattern
 */

import { TimezoneUtil } from '../../src/tools/seasonal-patterns/timezone-utils.ts';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Test result tracking
 */
interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

/**
 * Assert helper function
 */
function assert(condition: boolean, testName: string, message?: string): void {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    results.push({ name: testName, passed: false, message });
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) {
      console.log(`  ${colors.red}Error: ${message}${colors.reset}`);
    }
  }
}

/**
 * Test suite runner
 */
function runTests(): void {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TimezoneUtil.isUSMarketHoliday() Test Suite${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Test Group 1: 10 NYSE Holidays (2024)
  console.log(`${colors.blue}Test Group 1: All 10 NYSE Holidays (2024)${colors.reset}`);

  // 1. New Year's Day
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-01-01')),
    "New Year's Day 2024 (January 1)",
    "Expected New Year's Day to be a holiday"
  );

  // 2. Martin Luther King Jr. Day (3rd Monday in January)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-01-15')),
    "Martin Luther King Jr. Day 2024 (January 15)",
    "Expected MLK Day to be a holiday"
  );

  // 3. Presidents Day (3rd Monday in February)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-02-19')),
    "Presidents Day 2024 (February 19)",
    "Expected Presidents Day to be a holiday"
  );

  // 4. Good Friday (Friday before Easter)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-03-29')),
    "Good Friday 2024 (March 29)",
    "Expected Good Friday to be a holiday"
  );

  // 5. Memorial Day (Last Monday in May)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-05-27')),
    "Memorial Day 2024 (May 27)",
    "Expected Memorial Day to be a holiday"
  );

  // 6. Juneteenth (June 19, observed if weekend)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-06-19')),
    "Juneteenth 2024 (June 19)",
    "Expected Juneteenth to be a holiday"
  );

  // 7. Independence Day (July 4, observed if weekend)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-07-04')),
    "Independence Day 2024 (July 4)",
    "Expected July 4th to be a holiday"
  );

  // 8. Labor Day (1st Monday in September)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-09-02')),
    "Labor Day 2024 (September 2)",
    "Expected Labor Day to be a holiday"
  );

  // 9. Thanksgiving Day (4th Thursday in November)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-11-28')),
    "Thanksgiving Day 2024 (November 28)",
    "Expected Thanksgiving to be a holiday"
  );

  // 10. Christmas Day (December 25, observed if weekend)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2024-12-25')),
    "Christmas Day 2024 (December 25)",
    "Expected Christmas to be a holiday"
  );

  // Test Group 2: Regular Trading Days (2024)
  console.log(`\n${colors.blue}Test Group 2: Regular Trading Days (should NOT be holidays)${colors.reset}`);

  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-06-15')),
    "Regular trading day: June 15, 2024",
    "Expected June 15 to NOT be a holiday"
  );

  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-10-15')),
    "Regular trading day: October 15, 2024",
    "Expected October 15 to NOT be a holiday"
  );

  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-03-15')),
    "Regular trading day: March 15, 2024",
    "Expected March 15 to NOT be a holiday"
  );

  // Test Group 3: Weekend Observation Rules (2025)
  console.log(`\n${colors.blue}Test Group 3: Weekend Observation Rules${colors.reset}`);

  // New Year's Day 2025 falls on Wednesday (not weekend)
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2025-01-01')),
    "New Year's Day 2025 (Wednesday - no observation shift)",
    "Expected January 1, 2025 to be a holiday"
  );

  // Independence Day 2026 falls on Saturday, observed on Friday July 3
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2026-07-03')),
    "Independence Day 2026 observed (Friday July 3, as July 4 is Saturday)",
    "Expected July 3, 2026 to be observed holiday"
  );

  // Test Group 4: Multiple Years (2024-2026)
  console.log(`\n${colors.blue}Test Group 4: Multi-Year Holiday Coverage${colors.reset}`);

  // 2025 holidays
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2025-01-20')),
    "MLK Day 2025 (January 20)",
    "Expected MLK Day 2025 to be a holiday"
  );

  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2025-11-27')),
    "Thanksgiving 2025 (November 27)",
    "Expected Thanksgiving 2025 to be a holiday"
  );

  // 2026 holidays
  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2026-01-01')),
    "New Year's Day 2026 (January 1)",
    "Expected New Year's Day 2026 to be a holiday"
  );

  assert(
    TimezoneUtil.isUSMarketHoliday(new Date('2026-12-25')),
    "Christmas 2026 (December 25)",
    "Expected Christmas 2026 to be a holiday"
  );

  // Test Group 5: Edge Cases
  console.log(`\n${colors.blue}Test Group 5: Edge Cases${colors.reset}`);

  // Day before Thanksgiving (not a holiday)
  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-11-27')),
    "Day before Thanksgiving 2024 (November 27)",
    "Expected day before Thanksgiving to NOT be a holiday"
  );

  // Day after Christmas (not a holiday)
  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-12-26')),
    "Day after Christmas 2024 (December 26)",
    "Expected day after Christmas to NOT be a holiday"
  );

  // Black Friday (not a holiday - markets are open)
  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-11-29')),
    "Black Friday 2024 (November 29)",
    "Expected Black Friday to NOT be a holiday"
  );

  // Test Group 6: Jobless Claims Integration
  console.log(`\n${colors.blue}Test Group 6: Jobless Claims Integration${colors.reset}`);

  // Thanksgiving 2024 is Thursday Nov 28 - no jobless claims
  const thanksgiving2024 = new Date('2024-11-28');
  assert(
    thanksgiving2024.getDay() === 4 && TimezoneUtil.isUSMarketHoliday(thanksgiving2024),
    "Thanksgiving 2024 is Thursday + Holiday (no jobless claims)",
    "Expected Thanksgiving to be both Thursday and holiday"
  );

  // Regular Thursday - should have jobless claims
  const regularThursday = new Date('2024-06-13');
  assert(
    regularThursday.getDay() === 4 && !TimezoneUtil.isUSMarketHoliday(regularThursday),
    "Regular Thursday June 13, 2024 (has jobless claims)",
    "Expected regular Thursday to NOT be a holiday"
  );

  // Test Group 7: ISM First Business Day Integration
  console.log(`\n${colors.blue}Test Group 7: ISM First Business Day Integration${colors.reset}`);

  // January 1, 2024 is New Year's (Monday) - ISM shifts to Jan 2
  const jan1_2024 = new Date('2024-01-01');
  assert(
    jan1_2024.getDay() === 1 && TimezoneUtil.isUSMarketHoliday(jan1_2024),
    "January 1, 2024 is Monday + Holiday (ISM shifts to Jan 2)",
    "Expected January 1, 2024 to be both Monday and holiday"
  );

  // January 2, 2024 should NOT be a holiday (first business day)
  assert(
    !TimezoneUtil.isUSMarketHoliday(new Date('2024-01-02')),
    "January 2, 2024 is NOT a holiday (first business day for ISM)",
    "Expected January 2, 2024 to NOT be a holiday"
  );

  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    console.log(`${colors.yellow}Failed tests:${colors.reset}`);
    results.filter(r => !r.passed).forEach(result => {
      console.log(`  - ${result.name}`);
      if (result.message) {
        console.log(`    ${result.message}`);
      }
    });
    console.log();
    process.exit(1);
  }
}

// Run the tests
runTests();
