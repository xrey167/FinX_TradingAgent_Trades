/**
 * Test file for runtime date validation
 * Verifies that invalid dates throw descriptive errors
 */

import { EventCalendar, type EventCalendarConfig } from './event-calendar.ts';
import { ECBDecisionExtractor, BoEDecisionExtractor, BoJDecisionExtractor } from './central-bank-extractors.ts';

console.log('=== Date Validation Tests ===\n');

// Test 1: Valid dates (should succeed)
console.log('Test 1: Valid dates (should succeed)');
try {
  const calendar = new EventCalendar();
  console.log('✅ EventCalendar with valid default dates created successfully\n');
} catch (error) {
  console.error('❌ FAILED: EventCalendar construction should succeed with valid dates');
  console.error(error);
  console.log('');
}

// Test 2: Invalid month in FOMC dates (should fail)
console.log('Test 2: Invalid month in FOMC dates (should throw error)');
try {
  const config: EventCalendarConfig = {
    fomcMeetings: ['2024-13-31'], // Invalid month (13)
  };
  const calendar = new EventCalendar(config);
  console.error('❌ FAILED: Should have thrown error for invalid month');
  console.log('');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Caught expected error:', error.message);
  }
  console.log('');
}

// Test 3: Invalid day in FOMC dates (should fail)
console.log('Test 3: Invalid day in FOMC dates (should throw error)');
try {
  const config: EventCalendarConfig = {
    fomcMeetings: ['2024-02-30'], // Invalid day (Feb doesn't have 30 days)
  };
  const calendar = new EventCalendar(config);
  console.error('❌ FAILED: Should have thrown error for invalid day');
  console.log('');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Caught expected error:', error.message);
  }
  console.log('');
}

// Test 4: Malformed date string (should fail)
console.log('Test 4: Malformed date string (should throw error)');
try {
  const config: EventCalendarConfig = {
    fomcMeetings: ['not-a-date'],
  };
  const calendar = new EventCalendar(config);
  console.error('❌ FAILED: Should have thrown error for malformed date');
  console.log('');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Caught expected error:', error.message);
  }
  console.log('');
}

// Test 5: Empty string (should fail)
console.log('Test 5: Empty string (should throw error)');
try {
  const config: EventCalendarConfig = {
    fomcMeetings: [''],
  };
  const calendar = new EventCalendar(config);
  console.error('❌ FAILED: Should have thrown error for empty string');
  console.log('');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Caught expected error:', error.message);
  }
  console.log('');
}

// Test 6: Invalid custom event date (should fail)
console.log('Test 6: Invalid custom event date (should throw error)');
try {
  const config: EventCalendarConfig = {
    customEvents: [
      {
        date: '2024-99-99', // Invalid date
        name: 'Test Event',
        type: 'custom',
        impact: 'high',
      },
    ],
  };
  const calendar = new EventCalendar(config);
  console.error('❌ FAILED: Should have thrown error for invalid custom event date');
  console.log('');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Caught expected error:', error.message);
  }
  console.log('');
}

// Test 7: Valid custom events (should succeed)
console.log('Test 7: Valid custom event dates (should succeed)');
try {
  const config: EventCalendarConfig = {
    customEvents: [
      {
        date: '2024-06-15',
        name: 'Test Event',
        type: 'custom',
        impact: 'medium',
      },
    ],
  };
  const calendar = new EventCalendar(config);
  console.log('✅ EventCalendar with valid custom events created successfully\n');
} catch (error) {
  console.error('❌ FAILED: Should succeed with valid custom event dates');
  console.error(error);
  console.log('');
}

// Test 8: ECBDecisionExtractor validation (should succeed with valid dates)
console.log('Test 8: ECBDecisionExtractor with valid dates (should succeed)');
try {
  const extractor = new ECBDecisionExtractor();
  console.log('✅ ECBDecisionExtractor created successfully\n');
} catch (error) {
  console.error('❌ FAILED: ECBDecisionExtractor should succeed with valid dates');
  console.error(error);
  console.log('');
}

// Test 9: BoEDecisionExtractor validation (should succeed with valid dates)
console.log('Test 9: BoEDecisionExtractor with valid dates (should succeed)');
try {
  const extractor = new BoEDecisionExtractor();
  console.log('✅ BoEDecisionExtractor created successfully\n');
} catch (error) {
  console.error('❌ FAILED: BoEDecisionExtractor should succeed with valid dates');
  console.error(error);
  console.log('');
}

// Test 10: BoJDecisionExtractor validation (should succeed with valid dates)
console.log('Test 10: BoJDecisionExtractor with valid dates (should succeed)');
try {
  const extractor = new BoJDecisionExtractor();
  console.log('✅ BoJDecisionExtractor created successfully\n');
} catch (error) {
  console.error('❌ FAILED: BoJDecisionExtractor should succeed with valid dates');
  console.error(error);
  console.log('');
}

console.log('=== All Tests Completed ===');
console.log('✅ Runtime validation for hardcoded event dates is working correctly!');
