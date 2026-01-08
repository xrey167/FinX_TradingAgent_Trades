# CPI & NFP Extractor Implementation Specification

**For:** Implementation Agent 1
**From:** Testing Agent 1
**Date:** 2026-01-08

This document provides the expected interface and behavior for the CPI and NFP extractors based on the comprehensive test suites that have been created.

---

## 🎯 CPIExtractor Class Specification

### Location
`src/tools/seasonal-patterns/event-extractors.ts`

### Class Signature
```typescript
/**
 * CPI (Consumer Price Index) Extractor
 * Identifies CPI release periods and analyzes market patterns around CPI events
 *
 * CPI Release Schedule:
 * - Frequency: Monthly (12 times per year)
 * - Timing: Mid-month (~13th), typically 2nd or 3rd week
 * - Release Time: 8:30 AM ET
 * - Source: Bureau of Labor Statistics (BLS)
 *
 * Market Impact:
 * - High volatility: 2.5-2.8× normal during CPI week
 * - Significant price moves especially at release time
 * - Event window: T-5 to T+5 days
 */
export class CPIExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract CPI period for a given timestamp
   * Returns:
   * - 'CPI-Day': The actual CPI release day
   * - 'CPI-Week': Week containing CPI release
   * - null: Not a CPI period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const cpiRelease = this.getCPIReleaseForMonth(date.getFullYear(), date.getMonth());

    if (!cpiRelease) return null;

    // Check if this is the exact release day
    const dateStr = date.toISOString().split('T')[0];
    const releaseStr = cpiRelease.toISOString().split('T')[0];

    if (dateStr === releaseStr) {
      return 'CPI-Day';
    }

    // Check if in the same week
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    if (cpiRelease >= weekStart && cpiRelease <= weekEnd) {
      return 'CPI-Week';
    }

    return null;
  }

  /**
   * Analyze event window around CPI release
   * Returns insights about price action and volatility patterns
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number }>
  ): {
    isCPIWeek: boolean;
    daysUntilRelease: number;
    volatilityIncrease: number;
    insights: string[];
  } {
    const cpiRelease = this.getCPIReleaseForMonth(date.getFullYear(), date.getMonth());

    if (!cpiRelease) {
      return {
        isCPIWeek: false,
        daysUntilRelease: -1,
        volatilityIncrease: 0,
        insights: [],
      };
    }

    const daysUntil = Math.floor((cpiRelease.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const insights: string[] = [];

    // Calculate volatility in CPI week vs normal periods
    const cpiWeekData = priceData.filter(d => {
      const daysDiff = Math.floor((d.date.getTime() - cpiRelease.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= -5 && daysDiff <= 5; // T-5 to T+5
    });

    const normalData = priceData.filter(d => {
      const daysDiff = Math.floor((d.date.getTime() - cpiRelease.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff < -14 && daysDiff >= -30; // Normal period
    });

    const cpiVolatility = this.calculateVolatility(cpiWeekData);
    const normalVolatility = this.calculateVolatility(normalData);
    const volatilityIncrease = (cpiVolatility - normalVolatility) / normalVolatility;

    // Generate insights
    if (volatilityIncrease > 1.5) {
      insights.push(`Extreme volatility spike: ${(volatilityIncrease * 100).toFixed(1)}% above normal`);
    }
    if (daysUntil === 0) {
      insights.push('CPI release today at 8:30 AM ET: Expect immediate market reaction');
    } else if (daysUntil === 1) {
      insights.push('CPI release tomorrow: Markets may position ahead of announcement');
    }

    return {
      isCPIWeek: Math.abs(daysUntil) <= 5,
      daysUntilRelease: daysUntil,
      volatilityIncrease,
      insights,
    };
  }

  /**
   * Get CPI release time
   */
  getReleaseTime(): { hour: number; minute: number; timezone: string } {
    return { hour: 8, minute: 30, timezone: 'ET' };
  }

  /**
   * Get CPI release date for a given month
   * CPI is typically released mid-month (~13th)
   */
  private getCPIReleaseForMonth(year: number, month: number): Date | null {
    // Known CPI dates 2020-2026
    const cpiDates = this.getCPIReleasesForYear(year);
    return cpiDates[month] || null;
  }

  /**
   * Get all CPI release dates for a given year
   * Based on actual BLS release schedule
   */
  private getCPIReleasesForYear(year: number): Date[] {
    const releases: Record<number, Date[]> = {
      2020: [
        new Date('2020-01-14'), new Date('2020-02-13'), new Date('2020-03-11'), new Date('2020-04-10'),
        new Date('2020-05-12'), new Date('2020-06-10'), new Date('2020-07-14'), new Date('2020-08-12'),
        new Date('2020-09-11'), new Date('2020-10-13'), new Date('2020-11-12'), new Date('2020-12-10'),
      ],
      2021: [
        new Date('2021-01-13'), new Date('2021-02-10'), new Date('2021-03-10'), new Date('2021-04-13'),
        new Date('2021-05-12'), new Date('2021-06-10'), new Date('2021-07-13'), new Date('2021-08-11'),
        new Date('2021-09-14'), new Date('2021-10-13'), new Date('2021-11-10'), new Date('2021-12-10'),
      ],
      2022: [
        new Date('2022-01-12'), new Date('2022-02-10'), new Date('2022-03-10'), new Date('2022-04-12'),
        new Date('2022-05-11'), new Date('2022-06-10'), new Date('2022-07-13'), new Date('2022-08-10'),
        new Date('2022-09-13'), new Date('2022-10-13'), new Date('2022-11-10'), new Date('2022-12-13'),
      ],
      2023: [
        new Date('2023-01-12'), new Date('2023-02-14'), new Date('2023-03-14'), new Date('2023-04-12'),
        new Date('2023-05-10'), new Date('2023-06-13'), new Date('2023-07-12'), new Date('2023-08-10'),
        new Date('2023-09-13'), new Date('2023-10-12'), new Date('2023-11-14'), new Date('2023-12-12'),
      ],
      2024: [
        new Date('2024-01-11'), new Date('2024-02-13'), new Date('2024-03-12'), new Date('2024-04-10'),
        new Date('2024-05-15'), new Date('2024-06-12'), new Date('2024-07-11'), new Date('2024-08-14'),
        new Date('2024-09-11'), new Date('2024-10-10'), new Date('2024-11-13'), new Date('2024-12-11'),
      ],
      2025: [
        new Date('2025-01-15'), new Date('2025-02-12'), new Date('2025-03-12'), new Date('2025-04-10'),
        new Date('2025-05-13'), new Date('2025-06-11'), new Date('2025-07-11'), new Date('2025-08-13'),
        new Date('2025-09-10'), new Date('2025-10-14'), new Date('2025-11-12'), new Date('2025-12-10'),
      ],
      // Add 2026 for future proofing
      2026: [
        new Date('2026-01-13'), new Date('2026-02-11'), new Date('2026-03-11'), new Date('2026-04-14'),
        new Date('2026-05-12'), new Date('2026-06-10'), new Date('2026-07-14'), new Date('2026-08-12'),
        new Date('2026-09-15'), new Date('2026-10-13'), new Date('2026-11-13'), new Date('2026-12-11'),
      ],
    };

    return releases[year] || [];
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(data: Array<{ high: number; low: number; close: number }>): number {
    if (data.length < 2) return 0;

    const returns = data.slice(1).map((d, i) => Math.log(d.close / data[i].close));
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
```

---

## 🎯 NFPExtractor Class Specification

### Location
`src/tools/seasonal-patterns/event-extractors.ts`

### Class Signature
```typescript
/**
 * NFP (Non-Farm Payroll) Extractor
 * Identifies NFP release periods and analyzes market patterns around NFP events
 *
 * NFP Release Schedule:
 * - Frequency: Monthly (12 times per year)
 * - Timing: First Friday of every month
 * - Release Time: 8:30 AM ET
 * - Source: Bureau of Labor Statistics (BLS)
 *
 * Market Impact:
 * - High volatility: 1.5-3× normal during NFP release
 * - Characteristic 8:30 AM spike (visible in hourly data)
 * - Event window: T-5 to T+5 days
 */
export class NFPExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract NFP period for a given timestamp
   * Returns:
   * - 'NFP-Day': The actual NFP release day (first Friday)
   * - 'NFP-Week': Week containing NFP release
   * - null: Not an NFP period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const nfpDate = this.getFirstFridayOfMonth(date.getFullYear(), date.getMonth());

    // Check if this is the exact release day
    const dateStr = date.toISOString().split('T')[0];
    const nfpDateStr = nfpDate.toISOString().split('T')[0];

    if (dateStr === nfpDateStr) {
      return 'NFP-Day';
    }

    // Check if in the same week
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    if (nfpDate >= weekStart && nfpDate <= weekEnd) {
      return 'NFP-Week';
    }

    return null;
  }

  /**
   * Analyze event window around NFP release
   * Returns insights about price action and expected impact
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number; open: number }>
  ): {
    isNFPWeek: boolean;
    daysUntilRelease: number;
    expectedImpact: 'high' | 'medium' | 'low';
    insights: string[];
  } {
    const nfpDate = this.getFirstFridayOfMonth(date.getFullYear(), date.getMonth());
    const daysUntil = Math.floor((nfpDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const insights: string[] = [];

    // NFP always has high impact
    const expectedImpact: 'high' | 'medium' | 'low' = 'high';

    // Generate insights
    if (daysUntil === 0) {
      insights.push('NFP release today at 8:30 AM ET: Expect immediate market reaction');
      insights.push('Watch for characteristic 8:30 AM volatility spike');
    } else if (daysUntil === 1) {
      insights.push('NFP release tomorrow: Markets may position ahead of announcement');
    } else if (daysUntil >= -1 && daysUntil <= 2) {
      insights.push(`NFP event window active: ${Math.abs(daysUntil)} days from release`);
    }

    // Calculate win rate if data available
    const nfpDays = priceData.filter(d => {
      const firstFriday = this.getFirstFridayOfMonth(d.date.getFullYear(), d.date.getMonth());
      return d.date.toISOString().split('T')[0] === firstFriday.toISOString().split('T')[0];
    });

    if (nfpDays.length > 5) {
      const wins = nfpDays.filter(d => d.close > d.open).length;
      const winRate = wins / nfpDays.length;
      insights.push(`Historical NFP win rate: ${(winRate * 100).toFixed(1)}%`);
    }

    return {
      isNFPWeek: Math.abs(daysUntil) <= 5,
      daysUntilRelease: daysUntil,
      expectedImpact,
      insights,
    };
  }

  /**
   * Get NFP release time
   */
  getReleaseTime(): { hour: number; minute: number; timezone: string } {
    return { hour: 8, minute: 30, timezone: 'ET' };
  }

  /**
   * Get first Friday of a given month
   * This is the NFP release date
   */
  private getFirstFridayOfMonth(year: number, month: number): Date {
    // Start at the 1st of the month
    const date = new Date(year, month, 1);

    // Find the first Friday
    while (date.getDay() !== 5) {
      // 5 = Friday
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
```

---

## 📋 EventCalendar Integration

### Add CPI and NFP events to EventCalendar

In `src/tools/seasonal-patterns/event-calendar.ts`, add:

```typescript
// Add to CalendarEvent type
type: 'fomc' | 'options-expiry' | 'earnings-season' | 'economic' | 'political' | 'custom';

// Add CPI and NFP to constructor
constructor(config?: EventCalendarConfig) {
  // ... existing code ...

  // Add CPI events
  this.addCPIEvents();

  // Add NFP events
  this.addNFPEvents();
}

private addCPIEvents(): void {
  const cpiExtractor = new CPIExtractor(this);
  // Get all CPI dates for 2020-2026
  for (let year = 2020; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const cpiDate = cpiExtractor.getCPIReleaseForMonth(year, month);
      if (cpiDate) {
        this.events.push({
          date: cpiDate,
          name: 'CPI Release',
          type: 'economic',
          impact: 'high',
          description: 'Consumer Price Index release (8:30 AM ET)',
        });
      }
    }
  }
}

private addNFPEvents(): void {
  const nfpExtractor = new NFPExtractor(this);
  // Get all NFP dates for 2020-2026
  for (let year = 2020; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const nfpDate = nfpExtractor.getFirstFridayOfMonth(year, month);
      this.events.push({
        date: nfpDate,
        name: 'NFP Release',
        type: 'economic',
        impact: 'high',
        description: 'Non-Farm Payroll release (8:30 AM ET, First Friday)',
      });
    }
  }
}
```

---

## ✅ Validation Checklist

Before considering implementation complete:

### CPIExtractor:
- [ ] Class exported from `event-extractors.ts`
- [ ] `extract()` method returns 'CPI-Day', 'CPI-Week', or null
- [ ] `analyzeEventWindow()` method implemented
- [ ] `getReleaseTime()` method returns `{hour: 8, minute: 30, timezone: 'ET'}`
- [ ] CPI dates hardcoded for 2020-2026 (72 dates total)
- [ ] Integration with EventCalendar working
- [ ] Volatility calculation helpers implemented

### NFPExtractor:
- [ ] Class exported from `event-extractors.ts`
- [ ] `extract()` method returns 'NFP-Day', 'NFP-Week', or null
- [ ] `analyzeEventWindow()` method implemented
- [ ] `getReleaseTime()` method returns `{hour: 8, minute: 30, timezone: 'ET'}`
- [ ] First Friday calculation algorithm working
- [ ] Integration with EventCalendar working
- [ ] Handles edge cases (first Friday = 1st of month)

### EventCalendar:
- [ ] CPI events added (72 events for 2020-2026)
- [ ] NFP events added (84 events for 2020-2026)
- [ ] Events accessible via `getEventsForDate()`
- [ ] Event type is 'economic'
- [ ] Event impact is 'high'

---

## 🧪 Test Execution

Once implementation is complete:

```bash
# Rename test files
mv tests/seasonal/test-cpi-events.ts tests/seasonal/test-cpi-events.test.ts
mv tests/seasonal/test-nfp-events.ts tests/seasonal/test-nfp-events.test.ts

# Set API key
export EODHD_API_KEY="your_key_here"

# Run CPI tests
bun test tests/seasonal/test-cpi-events.test.ts

# Run NFP tests
bun test tests/seasonal/test-nfp-events.test.ts

# Run both
bun test tests/seasonal/*.test.ts

# With coverage
bun test --coverage
```

Expected result:
- CPI: 18/18 tests passing
- NFP: 20/20 tests passing
- Coverage: ≥80%

---

**Created by:** Testing Agent 1
**Date:** 2026-01-08
**Status:** Ready for Implementation
