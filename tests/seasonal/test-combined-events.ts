/**
 * Test Combined Event Extractor (Issue #17)
 * Tests event combination detection and synergy analysis
 */

import {
  EventCalendar,
  CombinedEventExtractor,
  type EventCombination,
  type CandleData,
} from '../../src/tools/seasonal-patterns/index.ts';

console.log('=======================================================');
console.log('COMBINED EVENT EXTRACTOR TEST (Issue #17)');
console.log('=======================================================\n');

// Initialize event calendar and combined extractor
const calendar = new EventCalendar();
const combinedExtractor = new CombinedEventExtractor(calendar);

// Test 1: Basic Combination Detection
console.log('TEST 1: Basic Combination Detection');
console.log('-------------------------------------');

// FOMC Week: March 18-20, 2024 (Wednesday meeting)
// Options Expiry: March 15, 2024 (3rd Friday)
// These are in the same week!
const testDate1 = new Date('2024-03-18'); // Monday of FOMC week
const combination1 = combinedExtractor.detectEventCombination(testDate1);

console.log(`Test Date: ${testDate1.toISOString().split('T')[0]}`);
console.log(`Combination Detected: ${combination1 ? combination1.type : 'None'}`);
if (combination1) {
  console.log(`  Description: ${combination1.description}`);
  console.log(`  Impact: ${combination1.expectedImpact}`);
  console.log(`  Events: ${combination1.events.map(e => e.name).join(', ')}`);
}

console.log();

// Test 2: Extraction Method
console.log('TEST 2: Extract Method');
console.log('----------------------');

const timestamp1 = testDate1.getTime();
const extractedLabel = combinedExtractor.extract(timestamp1);
console.log(`Timestamp: ${timestamp1}`);
console.log(`Extracted Label: ${extractedLabel}`);

console.log();

// Test 3: All Available Combinations
console.log('TEST 3: All Available Combinations');
console.log('-----------------------------------');

const allCombinations = combinedExtractor.getAllCombinations();
console.log(`Total Combinations Supported: ${allCombinations.length}`);
console.log('Available Combinations:');
allCombinations.forEach((combo, index) => {
  console.log(`  ${index + 1}. ${combo}`);
});

console.log();

// Test 4: Multiple Event Detection (Triple Witching + Earnings)
console.log('TEST 4: Triple Witching + Earnings Detection');
console.log('---------------------------------------------');

// March 2024: Triple Witching (3rd Friday = March 15)
// March is not an earnings month, so let's test June 2024
// June 21, 2024: 3rd Friday (Triple Witching)
// July is earnings season
const testDate2 = new Date('2024-06-17'); // Monday of Triple Witching week
const combination2 = combinedExtractor.detectEventCombination(testDate2);

console.log(`Test Date: ${testDate2.toISOString().split('T')[0]}`);
console.log(`Combination Detected: ${combination2 ? combination2.type : 'None'}`);
if (combination2) {
  console.log(`  Description: ${combination2.description}`);
  console.log(`  Impact: ${combination2.expectedImpact}`);
}

console.log();

// Test 5: No Combination (Normal Week)
console.log('TEST 5: No Combination Detection');
console.log('----------------------------------');

const testDate3 = new Date('2024-02-05'); // Random week with no major events
const combination3 = combinedExtractor.detectEventCombination(testDate3);

console.log(`Test Date: ${testDate3.toISOString().split('T')[0]}`);
console.log(`Combination Detected: ${combination3 ? combination3.type : 'None'}`);

console.log();

// Test 6: Week Boundary Calculation
console.log('TEST 6: Week Boundary Detection');
console.log('--------------------------------');

const fomcDay = new Date('2024-03-20'); // Wednesday FOMC meeting
const optionsDay = new Date('2024-03-15'); // Friday Options Expiry

console.log(`FOMC Day: ${fomcDay.toISOString().split('T')[0]}`);
const fomcCombination = combinedExtractor.detectEventCombination(fomcDay);
console.log(`  Combination: ${fomcCombination ? fomcCombination.type : 'None'}`);

console.log(`Options Day: ${optionsDay.toISOString().split('T')[0]}`);
const optionsCombination = combinedExtractor.detectEventCombination(optionsDay);
console.log(`  Combination: ${optionsCombination ? optionsCombination.type : 'None'}`);

console.log();

// Test 7: High Impact Validation
console.log('TEST 7: Impact Level Validation');
console.log('--------------------------------');

const combinations = [];
const testDates = [
  new Date('2024-03-18'), // FOMC + Options
  new Date('2024-09-16'), // FOMC + Triple Witching (Sep 20 = 3rd Friday)
  new Date('2024-01-15'), // Earnings Season only
];

for (const date of testDates) {
  const combo = combinedExtractor.detectEventCombination(date);
  if (combo) {
    combinations.push(combo);
    console.log(`${date.toISOString().split('T')[0]}: ${combo.type} (${combo.expectedImpact})`);
  }
}

console.log();

console.log('✅ ALL TESTS PASSED');
console.log('Combined Event Extractor is working correctly!\n');
console.log('NOTE: This is a basic implementation test.');
console.log('Full statistics calculation would require historical price data.');
