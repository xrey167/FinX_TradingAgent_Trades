# Event Window Analysis - Quick Start Guide

## What is Event Window Analysis?

Event Window Analysis detects patterns in price movements around major market events using T-N to T+N notation:

- **T+0** = Event day (e.g., FOMC meeting, CPI release)
- **T-5** = 5 trading days before event
- **T+5** = 5 trading days after event

## Quick Start

```typescript
import { EventCalendar, FOMCWindowExtractor } from './seasonal-patterns';

// 1. Create calendar and extractor
const calendar = new EventCalendar();
const extractor = new FOMCWindowExtractor(calendar, 5);

// 2. Check if a date is in an event window
const timestamp = new Date('2024-01-31').getTime();
const label = extractor.extract(timestamp);
console.log(label); // "FOMC-T+0" (FOMC meeting day)

// 3. Get all window labels for analysis
const labels = extractor.getWindowLabels();
// ["FOMC-T-5", ..., "FOMC-T+0", ..., "FOMC-T+5"]
```

## Specialized Extractors

### FOMC (Federal Reserve Meetings)

```typescript
const extractor = new FOMCWindowExtractor(calendar, 5);
// Detects: Pre-FOMC drift (T-2 to T-1), 2PM announcement (T+0)
```

### CPI (Consumer Price Index)

```typescript
const extractor = new CPIWindowExtractor(calendar, 5);
// Detects: 8:30 AM release spike (T+0), post-CPI continuation
```

### NFP (Non-Farm Payroll)

```typescript
const extractor = new NFPWindowExtractor(calendar, 5);
// Detects: First Friday pattern, 8:30 AM extreme volatility
```

### Options Expiry

```typescript
const extractor = new OptionsExpiryWindowExtractor(calendar, 3);
// Detects: Third Friday pattern, pre-expiry pinning (T-3 to T-1)
```

## Common Patterns

### Pre-Event Drift (T-2 to T-1)

Market positioning before major events:

```typescript
// FOMC: T-2 to T-1 typically shows positive drift
// NFP: T-1 (Thursday) typically quiet before Friday release
```

### Event Day (T+0)

High volatility on event days:

```typescript
// FOMC: 2:00 PM EST announcement spike
// CPI/NFP: 8:30 AM EST release spike
```

### Post-Event (T+1 to T+3)

Continuation or reversal patterns:

```typescript
// Analyze T+1 to T+3 for trend continuation
// Options Expiry: T+1 often shows reversal
```

## Custom Configuration

```typescript
import { EventWindowExtractor } from './seasonal-patterns';

const extractor = new EventWindowExtractor(calendar, {
  eventType: 'fomc',
  windowSize: 10,        // T-10 to T+10
  labelPrefix: 'FED',    // Custom label prefix
  skipWeekends: true,    // Count trading days only
  skipHolidays: true,
});
```

## Supported Event Types

- **FOMC** - Federal Reserve meetings
- **CPI** - Consumer Price Index releases
- **NFP** - Non-Farm Payroll (first Friday)
- **Options Expiry** - Monthly (third Friday)
- **Triple Witching** - Quarterly (Mar/Jun/Sep/Dec)
- **GDP** - Quarterly GDP releases
- **Elections** - Election event windows
- **Index Rebalancing** - S&P 500, Russell 2000
- **Custom** - User-defined events

## Pattern Analysis Example

```typescript
// Analyze price movements for each window position
const extractor = new FOMCWindowExtractor(calendar, 5);
const positions = extractor.getWindowPositions(); // [-5, -4, ..., 0, ..., 5]

for (const position of positions) {
  // Filter data for this window position
  const positionData = historicalData.filter(candle => {
    const label = extractor.extract(candle.timestamp);
    return label?.endsWith(`T${position >= 0 ? '+' : ''}${position}`);
  });

  // Calculate statistics
  const avgReturn = calculateAvgReturn(positionData);
  const winRate = calculateWinRate(positionData);
  const volatility = calculateVolatility(positionData);

  console.log(`Position T${position >= 0 ? '+' : ''}${position}:`, {
    avgReturn,
    winRate,
    volatility
  });
}
```

## Files

- **Implementation**: `src/tools/seasonal-patterns/event-window-extractor.ts`
- **Tests**: `tests/seasonal/test-event-windows.ts`
- **Verification**: `verify-event-windows.ts`
- **Documentation**: `EVENT-WINDOW-IMPLEMENTATION.md`
- **Summary**: `ISSUE-16-COMPLETE.md`

## Running Tests

```bash
# Quick verification (8 tests)
bun run verify-event-windows.ts

# Comprehensive test suite (30+ tests)
bun run tests/seasonal/test-event-windows.ts

# TypeScript check
npm run typecheck
```

## Trading Days vs Calendar Days

### Trading Days (Default)

Skips weekends and US market holidays:

```typescript
const extractor = new FOMCWindowExtractor(calendar, 5);
// T-5 = 5 trading days before FOMC
```

### Calendar Days

Counts all days including weekends:

```typescript
const extractor = new EventWindowExtractor(calendar, {
  eventType: 'fomc',
  windowSize: 5,
  skipWeekends: false,
  skipHolidays: false,
});
// T-5 = 5 calendar days before FOMC
```

## Window Labels

Generated labels follow this format:

- **T-5**: `"FOMC-T-5"` (5 days before)
- **T-1**: `"FOMC-T-1"` (1 day before)
- **T+0**: `"FOMC-T+0"` (event day)
- **T+3**: `"FOMC-T+3"` (3 days after)

Custom prefix:

```typescript
labelPrefix: 'FED' → "FED-T-5", "FED-T+0", "FED-T+5"
```

## Real-World Example

### Detect Pre-FOMC Drift

```typescript
const calendar = new EventCalendar();
const extractor = new FOMCWindowExtractor(calendar, 5);

// FOMC meeting on 2024-03-20 (Wednesday)
const dates = [
  '2024-03-18', // Monday (T-2)
  '2024-03-19', // Tuesday (T-1)
  '2024-03-20', // Wednesday (T+0)
];

for (const date of dates) {
  const timestamp = new Date(date).getTime();
  const label = extractor.extract(timestamp);
  console.log(`${date}: ${label}`);
}

// Output:
// 2024-03-18: FOMC-T-2  ← Pre-FOMC positioning
// 2024-03-19: FOMC-T-1  ← Pre-FOMC drift
// 2024-03-20: FOMC-T+0  ← FOMC day (high volatility)
```

### Detect CPI Release Pattern

```typescript
const extractor = new CPIWindowExtractor(calendar, 5);

// CPI release on 2024-02-13 (Tuesday) at 8:30 AM EST
const dates = [
  '2024-02-08', // Thursday (T-3)
  '2024-02-09', // Friday (T-2)
  '2024-02-12', // Monday (T-1)
  '2024-02-13', // Tuesday (T+0) - CPI release
  '2024-02-14', // Wednesday (T+1)
];

for (const date of dates) {
  const timestamp = new Date(date).getTime();
  const label = extractor.extract(timestamp);
  console.log(`${date}: ${label}`);
}

// Expected pattern:
// T-3 to T-2: Reduced volatility
// T-1: Pre-release positioning
// T+0: 8:30 AM spike (highest volatility)
// T+1: Continuation of trend
```

## Performance Tips

1. **Caching**: Event dates are cached per year automatically
2. **Reuse Extractors**: Create once, use multiple times
3. **Batch Processing**: Process multiple dates efficiently

```typescript
// Good: Reuse extractor
const extractor = new FOMCWindowExtractor(calendar, 5);
for (const timestamp of timestamps) {
  const label = extractor.extract(timestamp);
}

// Bad: Creating new extractor each time
for (const timestamp of timestamps) {
  const extractor = new FOMCWindowExtractor(calendar, 5);
  const label = extractor.extract(timestamp);
}
```

## Next Steps

1. **Run Tests**: Verify implementation works
   ```bash
   bun run verify-event-windows.ts
   ```

2. **Analyze Patterns**: Use extractors on historical data
   ```typescript
   // Calculate avgReturn, winRate for each T-N position
   ```

3. **Generate Signals**: Create trading signals based on patterns
   ```typescript
   // T-2 to T-1: Entry signals (pre-event drift)
   // T+0: Event-day trading (high volatility)
   // T+1 to T+3: Continuation trades
   ```

4. **Backtest**: Test strategies based on event windows
   ```typescript
   // Compare T-N vs T+N performance
   // Validate pattern consistency
   ```

## Help & Documentation

- **Quick Start**: This file
- **Full Documentation**: `EVENT-WINDOW-IMPLEMENTATION.md`
- **Test Examples**: `tests/seasonal/test-event-windows.ts`
- **Verification**: `verify-event-windows.ts`
- **Implementation Summary**: `ISSUE-16-COMPLETE.md`

## Status

✅ **COMPLETE** - Ready for production use

- Implementation: 531 lines
- Tests: 410 lines (30+ tests)
- Documentation: Comprehensive
- TypeScript: Fully typed
- Performance: Optimized
