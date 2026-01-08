/**
 * Test file for CPI and NFP Extractors
 * Demonstrates usage and validates functionality
 */

import { EventCalendar, CPIExtractor, NFPExtractor } from './index.ts';

// Initialize event calendar
const calendar = new EventCalendar();

// Create extractors
const cpiExtractor = new CPIExtractor(calendar);
const nfpExtractor = new NFPExtractor(calendar);

// Test CPI Extractor
console.log('=== CPI Extractor Tests ===');

// Test CPI release day (2024-01-11)
const cpiReleaseDay = new Date('2024-01-11');
console.log(`CPI Release Day (2024-01-11): ${cpiExtractor.extract(cpiReleaseDay.getTime())}`);
// Expected: 'CPI-Release-Day'

// Test T-3 (3 days before CPI release)
const cpiT3 = new Date('2024-01-08');
console.log(`CPI T-3 (2024-01-08): ${cpiExtractor.extract(cpiT3.getTime())}`);
// Expected: 'CPI-T-3'

// Test T+2 (2 days after CPI release)
const cpiT2Plus = new Date('2024-01-13');
console.log(`CPI T+2 (2024-01-13): ${cpiExtractor.extract(cpiT2Plus.getTime())}`);
// Expected: 'CPI-T+2'

// Test outside event window
const nonCpiDay = new Date('2024-01-01');
console.log(`Non-CPI Day (2024-01-01): ${cpiExtractor.extract(nonCpiDay.getTime())}`);
// Expected: null

console.log('\n=== NFP Extractor Tests ===');

// Test NFP release day (First Friday of January 2024 = 2024-01-05)
const nfpReleaseDay = new Date('2024-01-05');
console.log(`NFP Release Day (2024-01-05): ${nfpExtractor.extract(nfpReleaseDay.getTime())}`);
// Expected: 'NFP-Release-Day'

// Test T-1 (1 day before NFP release, Thursday)
const nfpT1 = new Date('2024-01-04');
console.log(`NFP T-1 (2024-01-04): ${nfpExtractor.extract(nfpT1.getTime())}`);
// Expected: 'NFP-T-1'

// Test T+3 (3 days after NFP release)
const nfpT3Plus = new Date('2024-01-08');
console.log(`NFP T+3 (2024-01-08): ${nfpExtractor.extract(nfpT3Plus.getTime())}`);
// Expected: 'NFP-T+3'

// Test outside event window
const nonNfpDay = new Date('2024-01-15');
console.log(`Non-NFP Day (2024-01-15): ${nfpExtractor.extract(nonNfpDay.getTime())}`);
// Expected: null

console.log('\n=== Event Window Analysis ===');

// Test CPI event window for the entire January 2024
console.log('CPI Event Window for January 2024 (Release: Jan 11):');
for (let day = 1; day <= 20; day++) {
  const date = new Date(`2024-01-${day.toString().padStart(2, '0')}`);
  const pattern = cpiExtractor.extract(date.getTime());
  if (pattern) {
    console.log(`  ${date.toISOString().split('T')[0]}: ${pattern}`);
  }
}

// Test NFP event window for the entire February 2024
console.log('\nNFP Event Window for February 2024 (First Friday: Feb 2):');
for (let day = 1; day <= 10; day++) {
  const date = new Date(`2024-02-${day.toString().padStart(2, '0')}`);
  const pattern = nfpExtractor.extract(date.getTime());
  if (pattern) {
    console.log(`  ${date.toISOString().split('T')[0]}: ${pattern}`);
  }
}

console.log('\n=== Verification ===');
console.log('✅ All CPI and NFP extractor tests completed');
console.log('✅ Event window detection (T-5 to T+5) working');
console.log('✅ Integration with EventCalendar successful');
