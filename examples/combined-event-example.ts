/**
 * Example: Using Combined Event Extractor
 * Demonstrates how to detect and analyze event combinations
 */

import {
  EventCalendar,
  CombinedEventExtractor,
  type EventCombination,
  type EventCombinationType
} from '../src/tools/seasonal-patterns/index.ts';

console.log('='.repeat(70));
console.log('COMBINED EVENT EXTRACTOR - USAGE EXAMPLES');
console.log('='.repeat(70));
console.log();

// Initialize
const calendar = new EventCalendar();
const extractor = new CombinedEventExtractor(calendar);

// Example 1: Check current week for event combinations
console.log('Example 1: Check Current Week');
console.log('-'.repeat(70));

const today = new Date();
const currentCombination = extractor.detectEventCombination(today);

console.log(`Current Date: ${today.toISOString().split('T')[0]}`);

if (currentCombination) {
  console.log(`\n⚠️  HIGH VOLATILITY WEEK DETECTED!`);
  console.log(`   Combination: ${currentCombination.type}`);
  console.log(`   Impact Level: ${currentCombination.expectedImpact.toUpperCase()}`);
  console.log(`   Expected Volatility: ${currentCombination.volatilityMultiplier}x normal`);
  console.log(`   Description: ${currentCombination.description}`);
  console.log(`\n   Events This Week:`);
  currentCombination.events.forEach(e => {
    console.log(`     - ${e.name} (${e.impact} impact)`);
  });
  console.log(`\n   Trading Recommendation:`);
  console.log(`     • Reduce position sizes by ${currentCombination.volatilityMultiplier}x`);
  console.log(`     • Widen stop losses`);
  console.log(`     • Consider shorter time horizons`);
  console.log(`     • Monitor intraday volatility closely`);
} else {
  console.log('\n✅ Normal week - no significant event combinations detected');
}

console.log();

// Example 2: Scan upcoming weeks for high-risk periods
console.log('\nExample 2: Scan Next 90 Days for High-Risk Weeks');
console.log('-'.repeat(70));

const daysToScan = 90;
const highRiskWeeks = new Map<string, EventCombination>();

for (let i = 0; i < daysToScan; i++) {
  const scanDate = new Date(today);
  scanDate.setDate(scanDate.getDate() + i);

  const combo = extractor.detectEventCombination(scanDate);

  if (combo && (combo.expectedImpact === 'extreme' || combo.expectedImpact === 'very-high')) {
    const weekKey = `${combo.week.start.toISOString().split('T')[0]} to ${combo.week.end.toISOString().split('T')[0]}`;

    if (!highRiskWeeks.has(weekKey)) {
      highRiskWeeks.set(weekKey, combo);
    }
  }
}

console.log(`\nFound ${highRiskWeeks.size} high-risk week(s) in next ${daysToScan} days:\n`);

let weekNum = 1;
for (const [weekRange, combo] of highRiskWeeks) {
  console.log(`${weekNum}. Week of ${weekRange}`);
  console.log(`   Combination: ${combo.type}`);
  console.log(`   Impact: ${combo.expectedImpact.toUpperCase()} (${combo.volatilityMultiplier}x volatility)`);
  console.log(`   Events: ${combo.events.map(e => e.name).join(', ')}`);
  console.log();
  weekNum++;
}

if (highRiskWeeks.size === 0) {
  console.log('No extreme or very-high impact combinations in next 90 days.\n');
}

// Example 3: Historical analysis of a specific date
console.log('\nExample 3: Historical Event Analysis');
console.log('-'.repeat(70));

const historicalDates = [
  { date: new Date('2024-09-18'), desc: 'September 2024 FOMC Week' },
  { date: new Date('2024-01-11'), desc: 'January 2024 CPI Release' },
  { date: new Date('2024-03-20'), desc: 'March 2024 FOMC Meeting' },
];

for (const testCase of historicalDates) {
  const combo = extractor.detectEventCombination(testCase.date);

  console.log(`\n${testCase.desc} (${testCase.date.toISOString().split('T')[0]})`);

  if (combo) {
    console.log(`   Combination Type: ${combo.type}`);
    console.log(`   Impact Level: ${combo.expectedImpact}`);
    console.log(`   Volatility Multiplier: ${combo.volatilityMultiplier}x`);
    console.log(`   Events: ${combo.events.map(e => e.name).join(', ')}`);
  } else {
    console.log(`   No combination detected (normal week)`);
  }
}

// Example 4: Position sizing calculator
console.log('\n\nExample 4: Position Sizing Calculator');
console.log('-'.repeat(70));

function calculateAdjustedPositionSize(
  normalSize: number,
  date: Date,
  extractor: CombinedEventExtractor
): { adjustedSize: number; reason: string; multiplier: number } {
  const combo = extractor.detectEventCombination(date);

  if (!combo) {
    return {
      adjustedSize: normalSize,
      reason: 'Normal market conditions',
      multiplier: 1.0,
    };
  }

  const adjustedSize = Math.round(normalSize / combo.volatilityMultiplier);

  return {
    adjustedSize,
    reason: `${combo.type} detected (${combo.expectedImpact} impact)`,
    multiplier: combo.volatilityMultiplier,
  };
}

const normalPositionSize = 100; // shares/contracts
const tradingDate = new Date('2024-09-18'); // FOMC + Triple Witching week

const adjustment = calculateAdjustedPositionSize(normalPositionSize, tradingDate, extractor);

console.log(`\nNormal Position Size: ${normalPositionSize} shares`);
console.log(`Trading Date: ${tradingDate.toISOString().split('T')[0]}`);
console.log(`\nAdjustment:`);
console.log(`   Volatility Multiplier: ${adjustment.multiplier}x`);
console.log(`   Adjusted Position Size: ${adjustment.adjustedSize} shares`);
console.log(`   Reason: ${adjustment.reason}`);
console.log(`   Risk Reduction: ${((1 - adjustment.adjustedSize / normalPositionSize) * 100).toFixed(0)}%`);

// Example 5: Get all available combination types
console.log('\n\nExample 5: Available Combination Types');
console.log('-'.repeat(70));

const allCombinations = extractor.getAllCombinations();

console.log(`\nTotal combination types: ${allCombinations.length}\n`);

// Group by impact level
const byImpact: Record<string, { type: EventCombinationType; multiplier: number }[]> = {
  extreme: [],
  'very-high': [],
  high: [],
};

for (const comboType of allCombinations) {
  const multiplier = extractor.getVolatilityMultiplier(comboType);

  // Categorize by multiplier
  if (multiplier >= 3.0) {
    byImpact.extreme.push({ type: comboType, multiplier });
  } else if (multiplier >= 2.5) {
    byImpact['very-high'].push({ type: comboType, multiplier });
  } else {
    byImpact.high.push({ type: comboType, multiplier });
  }
}

console.log('EXTREME IMPACT (3.0x+):');
byImpact.extreme
  .sort((a, b) => b.multiplier - a.multiplier)
  .forEach(combo => {
    console.log(`   • ${combo.type.padEnd(35)} ${combo.multiplier}x`);
  });

console.log('\nVERY HIGH IMPACT (2.5x - 3.0x):');
byImpact['very-high']
  .sort((a, b) => b.multiplier - a.multiplier)
  .forEach(combo => {
    console.log(`   • ${combo.type.padEnd(35)} ${combo.multiplier}x`);
  });

console.log('\nHIGH IMPACT (< 2.5x):');
byImpact.high
  .sort((a, b) => b.multiplier - a.multiplier)
  .forEach(combo => {
    console.log(`   • ${combo.type.padEnd(35)} ${combo.multiplier}x`);
  });

console.log('\n' + '='.repeat(70));
console.log('✅ Examples complete!');
console.log('='.repeat(70));
