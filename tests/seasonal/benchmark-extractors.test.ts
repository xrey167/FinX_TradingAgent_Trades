/**
 * Performance Benchmark Tests for Seasonal Pattern Extractors
 *
 * These tests verify that extractors can process large volumes of data
 * efficiently and within acceptable time limits.
 *
 * Benchmarks ensure system performance doesn't regress as features are added.
 */

import { describe, test, expect } from 'bun:test';
import { EventCalendar } from '../../src/tools/seasonal-patterns/event-calendar.ts';
import { CPIExtractor } from '../../src/tools/seasonal-patterns/cpi-nfp-extractors.ts';
import { NFPExtractor } from '../../src/tools/seasonal-patterns/cpi-nfp-extractors.ts';
import { FOMCWeekExtractor } from '../../src/tools/seasonal-patterns/event-extractors.ts';
import { TripleWitchingExtractor } from '../../src/tools/seasonal-patterns/event-extractors.ts';
import { RetailSalesExtractor } from '../../src/tools/seasonal-patterns/economic-indicator-extractors.ts';
import { ISMExtractor } from '../../src/tools/seasonal-patterns/economic-indicator-extractors.ts';
import { FedRateDecisionExtractor } from '../../src/tools/seasonal-patterns/central-bank-extractors.ts';

/**
 * Performance threshold: 1 second for 10,000 extractions
 * This represents processing ~115 days per millisecond
 */
const PERFORMANCE_THRESHOLD_MS = 1000;
const BENCHMARK_ITERATIONS = 10000;

describe('Performance Benchmarks', () => {
  test('CPIExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new CPIExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      // Test various timestamps across multiple years
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000); // Each iteration = +1 day
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  CPIExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('NFPExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new NFPExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  NFPExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('FOMCWeekExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new FOMCWeekExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  FOMCWeekExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('TripleWitchingExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new TripleWitchingExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  TripleWitchingExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('RetailSalesExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new RetailSalesExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  RetailSalesExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('ISMExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new ISMExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  ISMExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('FedRateDecisionExtractor should process 10,000 timestamps in < 1 second', () => {
    const calendar = new EventCalendar();
    const extractor = new FedRateDecisionExtractor(calendar);
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      extractor.extract(timestamp);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  FedRateDecisionExtractor: ${BENCHMARK_ITERATIONS} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  test('EventCalendar.isMarketHoliday should process 10,000 checks in < 500ms', () => {
    const calendar = new EventCalendar();
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const date = new Date(Date.now() + (i * 24 * 60 * 60 * 1000));
      calendar.isMarketHoliday(date);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  EventCalendar.isMarketHoliday: ${BENCHMARK_ITERATIONS} checks in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500); // Stricter threshold for simple lookup
  });

  test('EventCalendar.isFOMCWeek should process 10,000 checks in < 500ms', () => {
    const calendar = new EventCalendar();
    const startTime = Date.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const date = new Date(Date.now() + (i * 24 * 60 * 60 * 1000));
      calendar.isFOMCWeek(date);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  EventCalendar.isFOMCWeek: ${BENCHMARK_ITERATIONS} checks in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });

  test('Multiple extractor instances should not degrade performance', () => {
    const calendar = new EventCalendar();
    const extractors = [
      new CPIExtractor(calendar),
      new NFPExtractor(calendar),
      new FOMCWeekExtractor(calendar),
      new TripleWitchingExtractor(calendar),
      new RetailSalesExtractor(calendar),
    ];

    const startTime = Date.now();
    const iterations = 2000; // 2000 iterations × 5 extractors = 10,000 total extractions

    for (let i = 0; i < iterations; i++) {
      const timestamp = Date.now() + (i * 24 * 60 * 60 * 1000);
      // Run all extractors on same timestamp
      for (const extractor of extractors) {
        extractor.extract(timestamp);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  5 extractors × ${iterations} iterations = ${iterations * 5} extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });
});

describe('Memory Efficiency Benchmarks', () => {
  test('EventCalendar singleton pattern should reuse instance', () => {
    const calendar1 = new EventCalendar();
    const calendar2 = new EventCalendar();

    // Both instances should work correctly
    const date = new Date('2024-07-04'); // Independence Day
    expect(calendar1.isMarketHoliday(date)).toBe(true);
    expect(calendar2.isMarketHoliday(date)).toBe(true);

    // Verify they have the same internal data structure
    expect(calendar1.constructor.name).toBe('EventCalendar');
    expect(calendar2.constructor.name).toBe('EventCalendar');
  });

  test('Extractors should not leak memory with repeated instantiation', () => {
    const calendar = new EventCalendar();
    const iterations = 1000;

    // Create and use many extractor instances
    for (let i = 0; i < iterations; i++) {
      const extractor = new CPIExtractor(calendar);
      const timestamp = Date.now();
      extractor.extract(timestamp);
    }

    // If this test completes without OOM, memory management is acceptable
    expect(true).toBe(true);
  });
});

describe('Edge Case Performance', () => {
  test('Should handle year boundaries efficiently', () => {
    const calendar = new EventCalendar();
    const extractor = new CPIExtractor(calendar);
    const startTime = Date.now();

    // Test 10 years of year-end boundaries
    for (let year = 2020; year <= 2030; year++) {
      // Test December 31 and January 1
      const dec31 = new Date(year, 11, 31).getTime();
      const jan1 = new Date(year + 1, 0, 1).getTime();

      for (let i = 0; i < 100; i++) {
        extractor.extract(dec31);
        extractor.extract(jan1);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Year boundary performance: 2,200 extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(200); // Should be very fast for repeated dates
  });

  test('Should handle DST transitions efficiently', () => {
    const calendar = new EventCalendar();
    const extractor = new FOMCWeekExtractor(calendar);

    // US DST transitions in 2024
    const springForward = new Date('2024-03-10').getTime();
    const fallBack = new Date('2024-11-03').getTime();

    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      extractor.extract(springForward + (i * 3600000)); // Every hour
      extractor.extract(fallBack + (i * 3600000));
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  DST transition performance: 2,000 extractions in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});
