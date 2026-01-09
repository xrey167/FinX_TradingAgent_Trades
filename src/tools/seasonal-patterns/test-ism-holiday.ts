/**
 * Test script to verify ISM first business day calculation with holiday checks
 * Tests Issue #39: Add holiday checks to ISM first business day calculation
 */

import { EventCalendar } from './event-calendar.ts';
import { ISMExtractor } from './economic-indicator-extractors.ts';

function testISMHolidayLogic() {
  console.log('Testing ISM First Business Day with Holiday Checks\n');
  console.log('='.repeat(70));

  // Initialize EventCalendar
  const calendar = new EventCalendar();
  const ismExtractor = new ISMExtractor(calendar);

  // Test cases: months with holidays on/near the first
  const testCases = [
    {
      year: 2025,
      month: 0, // January - New Year's Day on Jan 1 (Wednesday)
      expected: 2, // Should be Jan 2 (Thursday) since Jan 1 is a holiday
      description: 'January 2025 (New Year\'s Day on Jan 1)',
    },
    {
      year: 2024,
      month: 0, // January - New Year's Day on Jan 1 (Monday)
      expected: 2, // Should be Jan 2 (Tuesday) since Jan 1 is a holiday
      description: 'January 2024 (New Year\'s Day on Jan 1)',
    },
    {
      year: 2025,
      month: 6, // July - Independence Day on July 4 (Friday)
      expected: 1, // Should be July 1 (Tuesday) - holiday doesn't affect first day
      description: 'July 2025 (Independence Day on July 4)',
    },
    {
      year: 2024,
      month: 6, // July - Independence Day on July 4 (Thursday)
      expected: 1, // Should be July 1 (Monday) - holiday doesn't affect first day
      description: 'July 2024 (Independence Day on July 4)',
    },
    {
      year: 2025,
      month: 8, // September - Labor Day (first Monday)
      expected: 2, // Should be Sep 2 (Tuesday) since Sep 1 is Labor Day (Monday)
      description: 'September 2025 (Labor Day on Sep 1)',
    },
    {
      year: 2024,
      month: 8, // September - Labor Day (first Monday, Sep 2)
      expected: 3, // Should be Sep 3 (Tuesday) since Sep 2 is Labor Day and Sep 1 is Sunday
      description: 'September 2024 (Labor Day on Sep 2, Sep 1 is Sunday)',
    },
    {
      year: 2025,
      month: 1, // February - No holidays
      expected: 3, // Should be Feb 3 (Monday) since Feb 1 is Saturday, Feb 2 is Sunday
      description: 'February 2025 (No holidays, Feb 1-2 weekend)',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    // Get the ISM date for the month
    const ismDate = (ismExtractor as any).getISMDate(testCase.year, testCase.month);

    if (!ismDate) {
      console.log(`\n❌ FAILED: ${testCase.description}`);
      console.log(`   No ISM date found`);
      failed++;
      continue;
    }

    const actualDay = ismDate.getDate();
    const dayName = ismDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isHoliday = calendar.isMarketHoliday(ismDate);

    const success = actualDay === testCase.expected && !isHoliday;

    if (success) {
      console.log(`\n✅ PASSED: ${testCase.description}`);
      console.log(`   ISM Date: ${ismDate.toISOString().split('T')[0]} (${dayName})`);
      console.log(`   Expected Day: ${testCase.expected}, Actual Day: ${actualDay}`);
      console.log(`   Is Holiday: ${isHoliday}`);
      passed++;
    } else {
      console.log(`\n❌ FAILED: ${testCase.description}`);
      console.log(`   ISM Date: ${ismDate.toISOString().split('T')[0]} (${dayName})`);
      console.log(`   Expected Day: ${testCase.expected}, Actual Day: ${actualDay}`);
      console.log(`   Is Holiday: ${isHoliday}`);
      console.log(`   Issue: ${isHoliday ? 'ISM date is a holiday!' : 'Day mismatch'}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\nTest Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failed === 0) {
    console.log('\n✅ All tests passed! ISM holiday logic is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please review the ISM calculation logic.');
  }

  return failed === 0;
}

// Run the test
try {
  const success = testISMHolidayLogic();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('Test execution failed:', error);
  process.exit(1);
}
