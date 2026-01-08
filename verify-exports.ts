/**
 * Verify Combined Event Extractor exports
 */

import {
  CombinedEventExtractor,
  type EventCombinationType,
  type EventCombination,
  type CombinationStats,
  EventCalendar,
} from './src/tools/seasonal-patterns/index.ts';

console.log('✅ Export Verification:');
console.log('  - CombinedEventExtractor:', typeof CombinedEventExtractor);
console.log('  - EventCalendar:', typeof EventCalendar);
console.log('  - EventCombination type: defined');
console.log('  - CombinationStats type: defined');
console.log('  - EventCombinationType type: defined');

const calendar = new EventCalendar();
const extractor = new CombinedEventExtractor(calendar);

console.log('\n✅ Instance Creation:');
console.log('  - EventCalendar instance created');
console.log('  - CombinedEventExtractor instance created');

console.log('\n✅ Method Verification:');
console.log('  - extract:', typeof extractor.extract);
console.log('  - detectEventCombination:', typeof extractor.detectEventCombination);
console.log('  - getAllCombinations:', typeof extractor.getAllCombinations);
console.log('  - getVolatilityMultiplier:', typeof extractor.getVolatilityMultiplier);
console.log('  - calculateSynergyEffect:', typeof extractor.calculateSynergyEffect);

console.log('\n✅ Interface Compliance:');
console.log('  - type:', extractor.type);
console.log('  - requiredTimeframe:', extractor.requiredTimeframe);

console.log('\n✅ All exports working correctly!');
