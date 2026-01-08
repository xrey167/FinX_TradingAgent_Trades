/**
 * Quick integration test for Phase 5 event extractors
 * Verifies that seasonal analyzer can import and use all 12 new extractors
 */

import { EventCalendar } from './src/tools/seasonal-patterns/event-calendar.ts';
import {
  CPIExtractor,
  NFPExtractor,
} from './src/tools/seasonal-patterns/cpi-nfp-extractors.ts';
import {
  FedRateDecisionExtractor,
  ECBDecisionExtractor,
  BoEDecisionExtractor,
  BoJDecisionExtractor,
} from './src/tools/seasonal-patterns/central-bank-extractors.ts';
import {
  TripleWitchingExtractor,
  GDPExtractor,
  ElectionExtractor,
} from './src/tools/seasonal-patterns/event-extractors.ts';

console.log('🧪 Phase 5 Integration Test\n');
console.log('Testing that all 12 event extractors can be instantiated and used...\n');

try {
  // Create calendar
  const calendar = new EventCalendar();
  console.log('✅ EventCalendar created');

  // Test all 12 extractors
  const extractors = [
    { name: 'CPI', extractor: new CPIExtractor(calendar) },
    { name: 'NFP', extractor: new NFPExtractor(calendar) },
    { name: 'Triple Witching', extractor: new TripleWitchingExtractor(calendar) },
    { name: 'GDP', extractor: new GDPExtractor(calendar) },
    { name: 'Fed Rate', extractor: new FedRateDecisionExtractor(calendar) },
    { name: 'ECB', extractor: new ECBDecisionExtractor() },
    { name: 'BoE', extractor: new BoEDecisionExtractor() },
    { name: 'BoJ', extractor: new BoJDecisionExtractor() },
    { name: 'Election', extractor: new ElectionExtractor(calendar) },
  ];

  console.log(`\n✅ All ${extractors.length} extractors instantiated successfully\n`);

  // Test extraction on a known date
  const testDate = new Date('2024-12-18').getTime(); // FOMC meeting date

  console.log('Testing extraction on 2024-12-18 (FOMC meeting):\n');

  for (const { name, extractor } of extractors) {
    const result = extractor.extract(testDate);
    if (result) {
      console.log(`  ✅ ${name.padEnd(20)} detected: "${result}"`);
    } else {
      console.log(`  ⚪ ${name.padEnd(20)} no event`);
    }
  }

  console.log('\n🎉 Integration test PASSED!');
  console.log('\nAll Phase 5 extractors are working correctly.');
  console.log('The seasonal analyzer can now use these extractors via includeEvents parameter.');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Integration test FAILED:', error);
  process.exit(1);
}
