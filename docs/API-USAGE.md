# Seasonal Pattern Analysis API - Usage Guide

Complete guide for integrating and using the FinX Seasonal Pattern Analysis system.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Basic Usage](#basic-usage)
- [Extractors Reference](#extractors-reference)
- [Data Fetching](#data-fetching)
- [Event Calendar](#event-calendar)
- [Advanced Features](#advanced-features)
- [Type Definitions](#type-definitions)
- [Common Pitfalls](#common-pitfalls)
- [Performance Optimization](#performance-optimization)

---

## Quick Start

### Installation

```typescript
import { EventCalendar } from './tools/seasonal-patterns/event-calendar.ts';
import { CPIExtractor } from './tools/seasonal-patterns/cpi-nfp-extractors.ts';
import { DailyDataFetcher } from './tools/seasonal-patterns/data-fetcher.ts';
```

### Minimal Example

```typescript
// 1. Create event calendar
const calendar = new EventCalendar();

// 2. Create extractor
const cpiExtractor = new CPIExtractor(calendar);

// 3. Check if timestamp is a CPI event
const timestamp = Date.now();
const pattern = cpiExtractor.extract(timestamp);

if (pattern) {
  console.log(`Found pattern: ${pattern}`);
  // Output: "CPI-Day" or "CPI-Week"
}
```

### Complete Analysis Example

```typescript
// Fetch 5 years of daily data
const fetcher = new DailyDataFetcher();
const data = await fetcher.fetch('SPY.US', 5);

// Analyze patterns
const results = cpiExtractor.analyzePattern(data);

console.log(`Found ${results.totalEvents} CPI events`);
console.log(`Average volatility: ${(results.avgVolatility * 100).toFixed(2)}%`);
```

---

## Core Concepts

### 1. Extractors

Extractors identify specific patterns in market data:
- **Period Extractors**: Detect recurring patterns (day-of-week, month-of-year)
- **Event Extractors**: Detect calendar events (FOMC, CPI, elections)
- **Economic Extractors**: Detect economic indicators (NFP, ISM, retail sales)
- **Central Bank Extractors**: Detect central bank decisions (Fed, ECB, BoJ)

### 2. Event Calendar

Central repository for market events:
- FOMC decision dates
- Economic indicator releases
- Market holidays
- Election dates
- Index rebalancing dates

### 3. Timeframes

Three supported timeframes:
- **Daily**: Long-term patterns, cost-efficient (1 API call)
- **Hourly**: Intraday patterns, announcement spikes (5 API calls)
- **5-Minute**: High-frequency patterns (warning: expensive, 50+ API calls)

### 4. Event Windows

Analyze market behavior around events:
- **T-5 to T+5**: Standard 10-day window
- **T-2 to T+2**: Short window for routine events
- **T-10 to T+10**: Extended window for major events

---

## Basic Usage

### Creating an Extractor

```typescript
import { EventCalendar } from './tools/seasonal-patterns/event-calendar.ts';
import { NFPExtractor } from './tools/seasonal-patterns/cpi-nfp-extractors.ts';

// All extractors require an EventCalendar instance
const calendar = new EventCalendar();
const nfpExtractor = new NFPExtractor(calendar);
```

### Single Timestamp Check

```typescript
// Check if specific date is NFP day
const timestamp = new Date('2024-12-06').getTime();
const pattern = nfpExtractor.extract(timestamp);

if (pattern === 'NFP-Day') {
  console.log('This is a Non-Farm Payrolls release day!');
}
```

### Batch Analysis

```typescript
// Analyze historical data for patterns
const fetcher = new DailyDataFetcher();
const data = await fetcher.fetch('AAPL.US', 5);

const analysis = nfpExtractor.analyzePattern(data);

console.log('NFP Analysis:');
console.log(`- Total Events: ${analysis.totalEvents}`);
console.log(`- Avg Volatility: ${(analysis.avgVolatility * 100).toFixed(2)}%`);
console.log(`- Highest Volatility: ${(analysis.maxVolatility * 100).toFixed(2)}%`);
console.log(`- Insights:`, analysis.insights);
```

---

## Extractors Reference

### CPI Extractor (Consumer Price Index)

Detects CPI release dates and analyzes inflation data impact.

```typescript
import { CPIExtractor } from './tools/seasonal-patterns/cpi-nfp-extractors.ts';

const extractor = new CPIExtractor(calendar);

// Returns: "CPI-Day" or "CPI-Week" or null
const pattern = extractor.extract(timestamp);

// Full analysis with market data
const analysis = extractor.analyzePattern(priceData);
```

**Release Schedule**: Monthly, usually 2nd week, 8:30 AM EST
**Market Impact**: High (2.5-2.8× normal volatility)

### NFP Extractor (Non-Farm Payrolls)

Detects employment report releases.

```typescript
import { NFPExtractor } from './tools/seasonal-patterns/cpi-nfp-extractors.ts';

const extractor = new NFPExtractor(calendar);
const pattern = extractor.extract(timestamp);
```

**Release Schedule**: First Friday of month, 8:30 AM EST
**Market Impact**: Very High (3-4× normal volatility)

### FOMC Week Extractor

Identifies Federal Reserve meeting weeks.

```typescript
import { FOMCWeekExtractor } from './tools/seasonal-patterns/event-extractors.ts';

const extractor = new FOMCWeekExtractor(calendar);

if (extractor.extract(timestamp) === 'FOMC-Week') {
  console.log('Fed meeting this week!');
}
```

**Release Schedule**: 8 times per year
**Market Impact**: Extreme (decision at 2:00 PM EST)

### Fed Rate Decision Extractor

Hourly-level FOMC decision day analysis.

```typescript
import { FedRateDecisionExtractor } from './tools/seasonal-patterns/central-bank-extractors.ts';

const extractor = new FedRateDecisionExtractor(calendar);

// Requires hourly data
const hourlyFetcher = new HourlyDataFetcher();
const data = await hourlyFetcher.fetch('SPY.US', 1);

const analysis = extractor.analyzePattern(data);
```

**Announcement Time**: 2:00 PM EST
**Best Timeframe**: Hourly (captures 2PM spike)

### Triple Witching Extractor

Identifies options/futures expiration dates.

```typescript
import { TripleWitchingExtractor } from './tools/seasonal-patterns/event-extractors.ts';

const extractor = new TripleWitchingExtractor(calendar);
const pattern = extractor.extract(timestamp);
```

**Schedule**: Third Friday of Mar, Jun, Sep, Dec
**Market Impact**: High volume and volatility

### Retail Sales Extractor

Tracks consumer spending reports.

```typescript
import { RetailSalesExtractor } from './tools/seasonal-patterns/economic-indicator-extractors.ts';

const extractor = new RetailSalesExtractor(calendar);
const pattern = extractor.extract(timestamp);
```

**Release Schedule**: Mid-month, 8:30 AM EST
**Market Impact**: Medium-High

### ISM Manufacturing Extractor

Detects ISM PMI releases.

```typescript
import { ISMExtractor } from './tools/seasonal-patterns/economic-indicator-extractors.ts';

const extractor = new ISMExtractor(calendar);
const pattern = extractor.extract(timestamp);
```

**Release Schedule**: First business day of month, 10:00 AM EST
**Market Impact**: Medium

### Jobless Claims Extractor

Weekly unemployment claims.

```typescript
import { JoblessClaimsExtractor } from './tools/seasonal-patterns/economic-indicator-extractors.ts';

const extractor = new JoblessClaimsExtractor(calendar);
const pattern = extractor.extract(timestamp);
```

**Release Schedule**: Every Thursday, 8:30 AM EST
**Market Impact**: Medium

### Central Bank Extractors

ECB, BoE, BoJ, and SNB decision trackers.

```typescript
import {
  ECBDecisionExtractor,
  BoEDecisionExtractor,
  BoJDecisionExtractor,
  SNBDecisionExtractor
} from './tools/seasonal-patterns/central-bank-extractors.ts';

const ecbExtractor = new ECBDecisionExtractor(calendar);
```

---

## Data Fetching

### Daily Data (Recommended)

Cost-efficient for long-term pattern analysis.

```typescript
import { DailyDataFetcher } from './tools/seasonal-patterns/data-fetcher.ts';

const fetcher = new DailyDataFetcher();

// Fetch 5 years of daily OHLCV data
const data = await fetcher.fetch('AAPL.US', 5);

console.log(`Fetched ${data.length} daily candles`);
console.log(`API Cost: ${fetcher.getCostEstimate()} calls`); // 1 call
```

**Use Cases**: Monthly patterns, earnings seasons, long-term trends
**Cost**: 1 API call
**Data Limit**: 20+ years available

### Hourly Data

For intraday announcement analysis.

```typescript
import { HourlyDataFetcher } from './tools/seasonal-patterns/data-fetcher.ts';

const fetcher = new HourlyDataFetcher();

// Fetch 1 year of hourly data
const data = await fetcher.fetch('SPY.US', 1);

console.log(`API Cost: ${fetcher.getCostEstimate()} calls`); // 5 calls
```

**Use Cases**: FOMC decisions (2PM spike), CPI releases (8:30AM spike)
**Cost**: 5 API calls
**Data Limit**: ~2 years (EODHD limitation)

### 5-Minute Data

High-frequency analysis (use sparingly).

```typescript
import { FiveMinuteDataFetcher } from './tools/seasonal-patterns/data-fetcher.ts';

const fetcher = new FiveMinuteDataFetcher();

// Only fetch a few days at a time!
const data = await fetcher.fetch('SPY.US', 0.1); // 0.1 years ≈ 36 days

console.log(`API Cost: ${fetcher.getCostEstimate()} calls`); // 50+ calls
```

**Use Cases**: Flash crash analysis, high-frequency trading research
**Cost**: 50+ API calls
**Warning**: Very expensive, limited data availability

---

## Event Calendar

### Checking Market Holidays

```typescript
const calendar = new EventCalendar();

const date = new Date('2024-07-04'); // Independence Day
if (calendar.isMarketHoliday(date)) {
  console.log('Market is closed today');
}
```

### Checking FOMC Weeks

```typescript
if (calendar.isFOMCWeek(date)) {
  console.log('Federal Reserve meeting this week!');
}
```

### Validating Calendar Data

```typescript
// Calendar automatically validates dates on construction
try {
  const calendar = new EventCalendar();
  // If no errors, calendar data is valid
} catch (error) {
  console.error('Calendar validation failed:', error);
}
```

### Data Expiration Warnings

The calendar automatically warns when event data approaches expiration:

```
⚠️  Event calendar expires in 11 months (2026-12-31).
    Update EVENT_DATES in event-calendar.ts to extend coverage.
```

---

## Advanced Features

### Event Window Analysis

Analyze market behavior T-days before/after events.

```typescript
import { EventWindowExtractor } from './tools/seasonal-patterns/event-window-extractor.ts';

const extractor = new EventWindowExtractor(calendar, {
  eventType: 'fomc',
  windowSize: 5,      // T-5 to T+5
  timeframe: 'daily',
  skipWeekends: true,
  skipHolidays: true,
});

// Returns: "FOMC-T-5", "FOMC-T-3", "FOMC-T+0", "FOMC-T+2", etc.
const position = extractor.extract(timestamp);
```

### Combined Event Extraction

Extract multiple patterns simultaneously.

```typescript
import { CombinedEventExtractor } from './tools/seasonal-patterns/combined-event-extractor.ts';

const extractor = new CombinedEventExtractor(calendar);

// Add extractors
extractor.addExtractor(new CPIExtractor(calendar));
extractor.addExtractor(new NFPExtractor(calendar));
extractor.addExtractor(new FOMCWeekExtractor(calendar));

// Get all matching patterns for a timestamp
const patterns = extractor.extractMultiple(timestamp);
console.log(patterns); // ["CPI-Week", "FOMC-Week"]
```

### Custom Event Types

Create your own pattern extractors.

```typescript
import type { PeriodExtractor, PeriodType } from './tools/seasonal-patterns/types.ts';

class CustomExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Your custom logic
    if (this.isSpecialDay(date)) {
      return 'MyCustomEvent';
    }

    return null;
  }

  private isSpecialDay(date: Date): boolean {
    // Implement your pattern detection logic
    return date.getDate() === 15;
  }
}
```

---

## Type Definitions

### CandleData

```typescript
interface CandleData {
  date: string;          // ISO date string
  timestamp?: number;    // Unix timestamp (ms)
  open: number;          // Opening price
  high: number;          // Highest price
  low: number;           // Lowest price
  close: number;         // Closing price
  volume: number;        // Trading volume
}
```

### PatternAnalysis

```typescript
interface PatternAnalysis {
  totalEvents: number;
  avgVolatility: number;
  maxVolatility: number;
  minVolatility: number;
  insights: string[];
}
```

### SeasonalTimeframe

```typescript
type SeasonalTimeframe = 'daily' | 'hourly' | '5min';
```

### PeriodType

```typescript
type PeriodType =
  | 'day-of-week'
  | 'week-of-month'
  | 'month-of-year'
  | 'calendar-day'
  | 'custom-event';
```

---

## Common Pitfalls

### ❌ Wrong: Creating Calendar per Extract

```typescript
// BAD: Creates new calendar every time
function checkCPI(timestamp: number): string | null {
  const calendar = new EventCalendar(); // ❌ Expensive!
  const extractor = new CPIExtractor(calendar);
  return extractor.extract(timestamp);
}
```

### ✅ Right: Reuse Calendar

```typescript
// GOOD: Create once, reuse many times
const calendar = new EventCalendar();
const cpiExtractor = new CPIExtractor(calendar);

function checkCPI(timestamp: number): string | null {
  return cpiExtractor.extract(timestamp); // ✅ Fast!
}
```

### ❌ Wrong: Analyzing with Wrong Timeframe

```typescript
// BAD: Using daily data for hourly extractor
const dailyData = await new DailyDataFetcher().fetch('SPY.US', 5);
const fedExtractor = new FedRateDecisionExtractor(calendar);

// ❌ Won't detect 2PM spike with daily data!
const analysis = fedExtractor.analyzePattern(dailyData);
```

### ✅ Right: Match Timeframe to Extractor

```typescript
// GOOD: Use hourly data for hourly patterns
const hourlyData = await new HourlyDataFetcher().fetch('SPY.US', 1);
const fedExtractor = new FedRateDecisionExtractor(calendar);

// ✅ Captures 2PM announcement spike
const analysis = fedExtractor.analyzePattern(hourlyData);
```

### ❌ Wrong: Forgetting Null Checks

```typescript
// BAD: Assumes pattern is always found
const pattern = extractor.extract(timestamp);
console.log(pattern.toUpperCase()); // ❌ Crashes if null!
```

### ✅ Right: Always Check for Null

```typescript
// GOOD: Handle null case
const pattern = extractor.extract(timestamp);
if (pattern) {
  console.log(pattern.toUpperCase()); // ✅ Safe
}
```

---

## Performance Optimization

### 1. Use Appropriate Timeframe

- **Daily**: 10,000 extractions in ~200ms
- **Hourly**: 10,000 extractions in ~120ms
- **5-Minute**: Avoid unless necessary

### 2. Reuse Extractor Instances

```typescript
// Create once
const calendar = new EventCalendar();
const extractors = {
  cpi: new CPIExtractor(calendar),
  nfp: new NFPExtractor(calendar),
  fomc: new FOMCWeekExtractor(calendar),
};

// Reuse many times
for (const timestamp of timestamps) {
  const cpi = extractors.cpi.extract(timestamp);
  const nfp = extractors.nfp.extract(timestamp);
}
```

### 3. Cache Results

```typescript
const cache = new Map<number, string | null>();

function getCachedPattern(timestamp: number): string | null {
  if (cache.has(timestamp)) {
    return cache.get(timestamp)!;
  }

  const pattern = extractor.extract(timestamp);
  cache.set(timestamp, pattern);
  return pattern;
}
```

### 4. Use Event Window Optimization

EventWindowExtractor automatically uses O(1) lookup for calendar-based events:

```typescript
// ✅ Fast: Uses calendar's indexed events
const fomcWindow = new EventWindowExtractor(calendar, {
  eventType: 'fomc',
  windowSize: 5,
});

// ⚠️  Slower: Must iterate through all days
const customWindow = new EventWindowExtractor(calendar, {
  eventType: 'options-expiry', // Computed at runtime
  windowSize: 5,
});
```

---

## Additional Resources

- **Type Definitions**: See `src/tools/seasonal-patterns/types.ts`
- **Constants**: See `src/tools/seasonal-patterns/constants.ts`
- **Examples**: See `tests/seasonal/` directory
- **Benchmarks**: Run `bun test tests/seasonal/benchmark-extractors.test.ts`

---

## Need Help?

- Check existing tests for usage examples
- Review JSDoc comments in source code
- Run performance benchmarks to understand costs
- Validate your calendar data with `EventCalendar` constructor

**Happy pattern hunting! 📈**
