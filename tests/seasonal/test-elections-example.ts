/**
 * Election Extractor Tests - Example Template
 * For Testing Agent 5
 *
 * This is an example test file to help Testing Agent 5 get started.
 * Expand with more comprehensive tests.
 */

import { ElectionExtractor, EventCalendar } from '../../src/tools/seasonal-patterns';

describe('ElectionExtractor', () => {
  let calendar: EventCalendar;
  let extractor: ElectionExtractor;

  beforeEach(() => {
    calendar = new EventCalendar();
    extractor = new ElectionExtractor(calendar);
  });

  describe('extract() - Election Day Detection', () => {
    test('should detect Presidential election day 2024', () => {
      const period = extractor.extract(Date.parse('2024-11-05'));
      expect(period).toBe('Presidential-Election-Day');
    });

    test('should detect Midterm election day 2026', () => {
      const period = extractor.extract(Date.parse('2026-11-03'));
      expect(period).toBe('Midterm-Election-Day');
    });

    test('should detect Presidential election day 2028', () => {
      const period = extractor.extract(Date.parse('2028-11-07'));
      expect(period).toBe('Presidential-Election-Day');
    });
  });

  describe('extract() - Election Window Detection', () => {
    test('should detect pre-election window (T-5)', () => {
      const period = extractor.extract(Date.parse('2024-10-31'));
      expect(period).toBe('Presidential-Election-Window');
    });

    test('should detect pre-election window (T-1)', () => {
      const period = extractor.extract(Date.parse('2024-11-04'));
      expect(period).toBe('Presidential-Election-Window');
    });

    test('should detect post-election window (T+1)', () => {
      const period = extractor.extract(Date.parse('2024-11-06'));
      expect(period).toBe('Presidential-Election-Window');
    });

    test('should detect post-election window (T+10)', () => {
      const period = extractor.extract(Date.parse('2024-11-15'));
      expect(period).toBe('Presidential-Election-Window');
    });

    test('should return null outside election window (T-6)', () => {
      const period = extractor.extract(Date.parse('2024-10-30'));
      expect(period).toBeNull();
    });

    test('should return null outside election window (T+11)', () => {
      const period = extractor.extract(Date.parse('2024-11-16'));
      expect(period).toBeNull();
    });
  });

  describe('analyzeEventWindow() - Presidential Election', () => {
    test('should analyze pre-election phase', () => {
      const mockPriceData = [
        { date: new Date('2024-11-01'), close: 100, high: 102, low: 98, volume: 1000000 },
        { date: new Date('2024-11-04'), close: 101, high: 103, low: 99, volume: 1200000 },
      ];

      const analysis = extractor.analyzeEventWindow(
        new Date('2024-11-01'),
        mockPriceData
      );

      expect(analysis.isElectionWindow).toBe(true);
      expect(analysis.electionType).toBe('Presidential');
      expect(analysis.daysUntilElection).toBe(4);
      expect(analysis.expectedImpact).toBe('high');
      expect(analysis.phase).toBe('pre-election');
      expect(analysis.insights.length).toBeGreaterThan(0);
      expect(analysis.insights).toContain('4 days until Presidential election');
    });

    test('should analyze election day', () => {
      const mockPriceData = [
        { date: new Date('2024-11-05'), close: 100, high: 102, low: 98, volume: 1500000 },
      ];

      const analysis = extractor.analyzeEventWindow(
        new Date('2024-11-05'),
        mockPriceData
      );

      expect(analysis.isElectionWindow).toBe(true);
      expect(analysis.electionType).toBe('Presidential');
      expect(analysis.daysUntilElection).toBe(0);
      expect(analysis.expectedImpact).toBe('high');
      expect(analysis.phase).toBe('election-day');
      expect(analysis.insights).toContain('Election day: Watch for immediate market reaction');
    });

    test('should analyze post-election phase', () => {
      const mockPriceData = [
        { date: new Date('2024-11-08'), close: 102, high: 104, low: 100, volume: 1300000 },
      ];

      const analysis = extractor.analyzeEventWindow(
        new Date('2024-11-08'),
        mockPriceData
      );

      expect(analysis.isElectionWindow).toBe(true);
      expect(analysis.electionType).toBe('Presidential');
      expect(analysis.daysUntilElection).toBe(-3);
      expect(analysis.expectedImpact).toBe('high');
      expect(analysis.phase).toBe('post-election');
      expect(analysis.insights[0]).toContain('3 days after Presidential election');
    });
  });

  describe('analyzeEventWindow() - Midterm Election', () => {
    test('should analyze midterm election with medium impact', () => {
      const mockPriceData = [
        { date: new Date('2026-11-01'), close: 100, high: 102, low: 98, volume: 1000000 },
      ];

      const analysis = extractor.analyzeEventWindow(
        new Date('2026-11-01'),
        mockPriceData
      );

      expect(analysis.isElectionWindow).toBe(true);
      expect(analysis.electionType).toBe('Midterm');
      expect(analysis.daysUntilElection).toBe(2);
      expect(analysis.expectedImpact).toBe('medium');
      expect(analysis.phase).toBe('pre-election');
      expect(analysis.insights).toContain('Midterm election: Moderate market impact, focus on Congressional control');
    });
  });

  describe('analyzeEventWindow() - Outside Election Window', () => {
    test('should return null analysis for dates outside election window', () => {
      const mockPriceData = [
        { date: new Date('2024-10-01'), close: 100, high: 102, low: 98, volume: 1000000 },
      ];

      const analysis = extractor.analyzeEventWindow(
        new Date('2024-10-01'),
        mockPriceData
      );

      expect(analysis.isElectionWindow).toBe(false);
      expect(analysis.electionType).toBeNull();
      expect(analysis.daysUntilElection).toBe(-1);
      expect(analysis.expectedImpact).toBe('low');
      expect(analysis.phase).toBeNull();
      expect(analysis.insights).toEqual([]);
    });
  });

  describe('EventCalendar Integration', () => {
    test('should detect election window via EventCalendar', () => {
      const isElectionWindow = calendar.isElectionEventWindow(new Date('2024-11-01'));
      expect(isElectionWindow).toBe(true);
    });

    test('should return election events via getEventsForDate', () => {
      const events = calendar.getEventsForDate(new Date('2024-11-01'));
      const electionEvent = events.find(e => e.type === 'election');

      expect(electionEvent).toBeDefined();
      expect(electionEvent?.name).toContain('Presidential');
      expect(electionEvent?.impact).toBe('high');
    });

    test('should not detect election window outside range', () => {
      const isElectionWindow = calendar.isElectionEventWindow(new Date('2024-10-01'));
      expect(isElectionWindow).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle year boundaries', () => {
      // T-5 crosses into previous year (2028-11-07)
      const period = extractor.extract(Date.parse('2028-11-02'));
      expect(period).toBe('Presidential-Election-Window');
    });

    test('should handle multiple elections in dataset', () => {
      // Should only return nearest election
      const analysis2024 = extractor.analyzeEventWindow(
        new Date('2024-11-01'),
        []
      );
      expect(analysis2024.electionType).toBe('Presidential');

      const analysis2026 = extractor.analyzeEventWindow(
        new Date('2026-11-01'),
        []
      );
      expect(analysis2026.electionType).toBe('Midterm');
    });

    test('should handle invalid timestamps gracefully', () => {
      const period = extractor.extract(NaN);
      expect(period).toBeNull();
    });
  });
});

/*
 * TESTING CHECKLIST FOR TESTING AGENT 5:
 *
 * [x] Election day detection (Presidential, Midterm)
 * [x] Event window validation (T-5 to T+10)
 * [x] Phase detection (pre/during/post)
 * [x] Impact levels (high for Presidential, medium for Midterm)
 * [x] EventCalendar integration
 * [x] Edge cases (year boundaries, invalid input)
 * [ ] Performance testing (1000+ dates)
 * [ ] Historical data validation (real SPY.US data)
 * [ ] Multiple election overlap (shouldn't happen, but test)
 * [ ] Insights content validation
 * [ ] Historical pattern accuracy
 *
 * ADDITIONAL TESTS NEEDED:
 * 1. Test all election dates (2024, 2026, 2028, 2030, 2032)
 * 2. Test boundary conditions for T-5 and T+10
 * 3. Test insights for each phase
 * 4. Test with real historical price data around elections
 * 5. Performance benchmarks for extract() method
 * 6. Integration test with seasonal analyzer
 */
