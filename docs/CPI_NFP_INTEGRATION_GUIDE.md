# CPI and NFP Extractor Integration Guide

## Overview

This guide explains how to integrate and use the CPI (Consumer Price Index) and NFP (Non-Farm Payroll) extractors for seasonal pattern analysis in your trading strategies.

## Quick Start

### 1. Import the Extractors

```typescript
import {
  EventCalendar,
  CPIExtractor,
  NFPExtractor
} from './src/tools/seasonal-patterns';
```

### 2. Initialize Calendar and Extractors

```typescript
// Create event calendar
const calendar = new EventCalendar();

// Create extractors
const cpiExtractor = new CPIExtractor(calendar);
const nfpExtractor = new NFPExtractor(calendar);
```

### 3. Extract Patterns from Timestamps

```typescript
// Check if a date is within CPI event window
const timestamp = Date.now();
const cpiPattern = cpiExtractor.extract(timestamp);

if (cpiPattern) {
  console.log(`CPI Event: ${cpiPattern}`);
  // Outputs: 'CPI-Release-Day', 'CPI-T-3', 'CPI-T+2', etc.
}

// Check if a date is within NFP event window
const nfpPattern = nfpExtractor.extract(timestamp);

if (nfpPattern) {
  console.log(`NFP Event: ${nfpPattern}`);
  // Outputs: 'NFP-Release-Day', 'NFP-T-1', 'NFP-T+5', etc.
}
```

## Understanding Event Windows

### CPI Event Window (T-5 to T+5)

The CPI extractor identifies 11-day windows around each CPI release:

```
T-5  T-4  T-3  T-2  T-1  T-0  T+1  T+2  T+3  T+4  T+5
|----|----|----|----|----|----|----|----|----|----|
     Pre-Release      Release    Post-Release
```

**Typical Market Behavior:**
- **T-5 to T-3**: Normal volatility, positioning begins
- **T-2 to T-1**: Reduced volatility, anticipation builds
- **T-0 (Release Day)**: 8:30 AM EST spike, maximum volatility
- **T+1 to T+2**: High volatility, market digests data
- **T+3 to T+5**: Volatility normalizes

### NFP Event Window (T-5 to T+5)

The NFP extractor identifies 11-day windows around each NFP release (first Friday):

```
T-5  T-4  T-3  T-2  T-1  T-0  T+1  T+2  T+3  T+4  T+5
|----|----|----|----|----|----|----|----|----|----|
     Pre-Release      Release    Post-Release
```

**Typical Market Behavior:**
- **T-5 to T-3**: Normal trading, pre-positioning
- **T-2**: Volatility begins to pick up
- **T-1 (Thursday)**: Markets typically quiet, "calm before storm"
- **T-0 (Friday)**: 8:30 AM EST spike, EXTREME volatility
- **T+1 to T+3**: High volatility continues, trend emergence
- **T+4 to T+5**: Volatility subsides

## Integration with Seasonal Analysis

### Using with analyzeSeasonalTool

```typescript
import { analyzeSeasonalTool } from './src/tools/seasonal-patterns';

const result = await analyzeSeasonalTool({
  symbol: 'SPY',
  years: 3,
  timeframe: 'daily',
  patterns: ['month-of-year', 'day-of-week'],
  includeEvents: true, // This will include CPI and NFP patterns
});

// Access CPI patterns
const cpiPatterns = result.patterns['custom-event']?.filter(
  p => p.label.startsWith('CPI-')
);

// Access NFP patterns
const nfpPatterns = result.patterns['custom-event']?.filter(
  p => p.label.startsWith('NFP-')
);
```

## Advanced Usage

### 1. Filtering Data by Event Windows

```typescript
function filterCPIEventWindow(data: CandleData[], position: string) {
  return data.filter(candle => {
    const pattern = cpiExtractor.extract(new Date(candle.date).getTime());
    return pattern === position;
  });
}

// Get all T-1 (day before CPI) candles
const t1Candles = filterCPIEventWindow(historicalData, 'CPI-T-1');

// Calculate average return on CPI-T-1
const avgReturn = t1Candles.reduce((sum, c) =>
  sum + ((c.close - c.open) / c.open), 0
) / t1Candles.length;
```

### 2. Building Event-Driven Strategies

```typescript
interface EventStrategy {
  entry: string;    // e.g., 'CPI-T-2'
  exit: string;     // e.g., 'CPI-T+1'
  direction: 'long' | 'short';
}

const strategy: EventStrategy = {
  entry: 'CPI-T-2',
  exit: 'CPI-T+1',
  direction: 'long',
};

function shouldEnter(timestamp: number): boolean {
  const pattern = cpiExtractor.extract(timestamp);
  return pattern === strategy.entry;
}

function shouldExit(timestamp: number): boolean {
  const pattern = cpiExtractor.extract(timestamp);
  return pattern === strategy.exit;
}
```

### 3. Combining CPI and NFP Signals

```typescript
function getEconomicEventSignal(timestamp: number): {
  type: 'CPI' | 'NFP' | 'BOTH' | 'NONE';
  pattern: string | null;
} {
  const cpiPattern = cpiExtractor.extract(timestamp);
  const nfpPattern = nfpExtractor.extract(timestamp);

  if (cpiPattern && nfpPattern) {
    return { type: 'BOTH', pattern: `${cpiPattern} + ${nfpPattern}` };
  }

  if (cpiPattern) {
    return { type: 'CPI', pattern: cpiPattern };
  }

  if (nfpPattern) {
    return { type: 'NFP', pattern: nfpPattern };
  }

  return { type: 'NONE', pattern: null };
}
```

### 4. Hourly Analysis for 8:30 AM Spike

```typescript
// For hourly data, check both date and hour
function analyzeReleaseHourSpike(
  hourlyData: CandleData[],
  extractor: CPIExtractor | NFPExtractor
) {
  return hourlyData.filter(candle => {
    const date = new Date(candle.date);
    const pattern = extractor.extract(date.getTime());
    const hour = date.getUTCHours();

    // 8:30 AM EST = 13:30 UTC (or 12:30 UTC during DST)
    const isReleaseHour = hour === 13 || hour === 12;
    const isReleaseDay = pattern?.endsWith('Release-Day');

    return isReleaseDay && isReleaseHour;
  });
}

// Calculate average spike on CPI release at 8:30 AM
const cpiSpikes = analyzeReleaseHourSpike(hourlyData, cpiExtractor);
const avgSpike = cpiSpikes.reduce((sum, c) =>
  sum + ((c.high - c.low) / c.low), 0
) / cpiSpikes.length;
```

## Pattern Labels Reference

### CPI Patterns
- `CPI-Release-Day`: CPI release day (8:30 AM EST)
- `CPI-T-5`: 5 trading days before CPI release
- `CPI-T-4`: 4 trading days before CPI release
- `CPI-T-3`: 3 trading days before CPI release
- `CPI-T-2`: 2 trading days before CPI release
- `CPI-T-1`: 1 trading day before CPI release
- `CPI-T+1`: 1 trading day after CPI release
- `CPI-T+2`: 2 trading days after CPI release
- `CPI-T+3`: 3 trading days after CPI release
- `CPI-T+4`: 4 trading days after CPI release
- `CPI-T+5`: 5 trading days after CPI release

### NFP Patterns
- `NFP-Release-Day`: NFP release day (8:30 AM EST, first Friday)
- `NFP-T-5`: 5 trading days before NFP release
- `NFP-T-4`: 4 trading days before NFP release
- `NFP-T-3`: 3 trading days before NFP release
- `NFP-T-2`: 2 trading days before NFP release
- `NFP-T-1`: 1 trading day before NFP release (Thursday)
- `NFP-T+1`: 1 trading day after NFP release
- `NFP-T+2`: 2 trading days after NFP release
- `NFP-T+3`: 3 trading days after NFP release
- `NFP-T+4`: 4 trading days after NFP release
- `NFP-T+5`: 5 trading days after NFP release

## CPI Release Schedule (2024-2026)

### 2024
- January 11, February 13, March 12, April 10, May 15, June 12
- July 11, August 14, September 11, October 10, November 13, December 11

### 2025
- January 15, February 12, March 12, April 10, May 13, June 11
- July 10, August 13, September 10, October 14, November 12, December 10

### 2026
- January 14, February 11, March 11, April 14, May 12, June 10
- July 14, August 12, September 15, October 14, November 12, December 10

## NFP Release Calculation

NFP is released on the **first Friday of each month**. The extractor calculates this dynamically for any month/year:

```typescript
// Example: February 2024
// 1st is Thursday, so first Friday is February 2nd

// Example: March 2024
// 1st is Friday, so first Friday is March 1st
```

## Common Use Cases

### 1. Pre-Event Volatility Suppression Strategy
```typescript
// Enter short volatility positions on T-2 (typically quiet)
// Exit on T-0 or T+1 (volatility spike)
```

### 2. Event Breakout Strategy
```typescript
// Enter on T-0 at 8:30 AM in direction of initial move
// Exit on T+1 or T+2
```

### 3. Post-Event Trend Following
```typescript
// Wait for initial volatility to settle (T+1)
// Enter in direction of T-0 to T+1 trend
// Hold through T+5
```

### 4. Calendar Spread Strategy
```typescript
// Short front month options on T-2
// Long back month options
// Profit from volatility spike on T-0
```

## Best Practices

1. **Combine with Other Indicators**: Don't rely solely on event windows. Use technical analysis, volume, and sentiment.

2. **Account for Overnight Gaps**: NFP Friday opens often gap significantly from Thursday close.

3. **Consider Time Zones**: All releases are at 8:30 AM EST. Adjust for your local timezone.

4. **Backtest Thoroughly**: Historical patterns may not predict future behavior, especially during regime changes.

5. **Risk Management**: Event days can be extremely volatile. Use appropriate position sizing.

6. **Stay Updated**: CPI and NFP release dates can occasionally change due to holidays. Monitor BLS announcements.

## Troubleshooting

### Pattern Returns Null
- Ensure the date is within the T-5 to T+5 window
- Check that CPI dates are loaded correctly in EventCalendar
- Verify NFP first Friday calculation with a calendar

### Unexpected Pattern Label
- Verify timestamp is in milliseconds (not seconds)
- Check timezone offset if using hourly data
- Ensure Date object is created correctly

### Performance Issues
- Cache extractor instances instead of creating new ones
- Use indexed access for large datasets
- Consider pre-filtering data by month before extracting patterns

## Support and Documentation

- **Main Documentation**: `README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Test Examples**: `src/tools/seasonal-patterns/test-cpi-nfp.ts`
- **Source Code**:
  - `src/tools/seasonal-patterns/cpi-nfp-extractors.ts`
  - `src/tools/seasonal-patterns/event-calendar.ts`

## Related Issues

- Issue #4: CPI Release Days Implementation
- Issue #5: NFP Non-Farm Payroll Implementation
- Phase 3: Event-Based Pattern Extractors

---

**Created**: January 2026
**Authors**: Implementation Agent 1
**Version**: 1.0.0
