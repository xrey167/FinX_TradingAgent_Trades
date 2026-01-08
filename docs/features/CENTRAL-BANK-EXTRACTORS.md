# Central Bank Decision Day Extractors

**Issues**: #8 (Fed Rate Decision Days), #9 (ECB/BoE/BoJ Central Banks)

Comprehensive implementation of central bank decision day detection with precise timing, timezone conversions, and intraday hourly analysis.

## Overview

The central bank extractors provide day-level and hour-level granularity for identifying market-moving monetary policy decisions from:

- **Federal Reserve (Fed/FOMC)**: US central bank
- **European Central Bank (ECB)**: Eurozone monetary policy
- **Bank of England (BoE)**: UK monetary policy
- **Bank of Japan (BoJ)**: Japanese monetary policy

## Features

### ✅ Implemented

1. **Fed Rate Decision Day Extractor**
   - Precise 2:00 PM EST announcement detection
   - Hourly pattern extraction for intraday analysis
   - Dot plot detection (quarterly: March, June, September, December)
   - Volume spike analysis (5-10× normal at 2 PM)
   - Pre-market anticipation phase detection
   - Post-announcement reaction phase (2:00-4:00 PM)

2. **ECB Decision Day Extractor**
   - Decision time: 8:15 AM CET (2:15 AM EST)
   - Press conference: 8:45 AM CET (2:45 AM EST)
   - US market impact window: 7:45-9:00 AM EST
   - EUR/USD correlation analysis
   - Timezone conversion (CET/CEST ↔ EST/EDT)

3. **BoE Decision Day Extractor**
   - Decision time: 12:00 PM GMT (7:00 AM EST)
   - US market impact: Pre-market and early open
   - GBP/USD correlation
   - Timezone conversion (GMT/BST ↔ EST/EDT)

4. **BoJ Decision Day Extractor**
   - Decision time: ~10:30 AM JST (8:30 PM EST previous day)
   - Press conference: ~3:30 PM JST (2:30 AM EST)
   - Overnight impact for US markets
   - USD/JPY correlation
   - Timezone conversion (JST ↔ EST/EDT)

5. **Complete Calendar Data**
   - All decision dates 2024-2026
   - Fed: 24 meetings (8/year)
   - ECB: 24 meetings (8/year)
   - BoE: 24 meetings (8/year)
   - BoJ: 24 meetings (8/year)
   - **Total: 96 central bank decision events**

## Architecture

### File Structure

```
src/tools/seasonal-patterns/
├── central-bank-extractors.ts    # NEW: Central bank extractors
├── event-extractors.ts            # ENHANCED: Added dot plot to FOMC
├── event-calendar.ts              # Existing calendar infrastructure
├── types.ts                       # Shared types
└── index.ts                       # UPDATED: Export new extractors

tests/seasonal/
└── test-central-banks.ts          # NEW: Comprehensive test suite
```

### Class Hierarchy

```
PeriodExtractor (interface)
├── FedRateDecisionExtractor
│   ├── extract(): Hourly pattern detection
│   ├── hasDotPlot(): Quarterly identification
│   └── analyze2PMSpike(): Volume/volatility analysis
├── ECBDecisionExtractor
│   ├── extract(): EUR/USD impact window
│   └── analyzeEURUSDImpact(): Currency correlation
├── BoEDecisionExtractor
│   └── extract(): GBP/USD impact detection
└── BoJDecisionExtractor
    └── extract(): Overnight impact detection
```

## Usage

### Basic Usage

```typescript
import {
  FedRateDecisionExtractor,
  ECBDecisionExtractor,
  BoEDecisionExtractor,
  BoJDecisionExtractor,
  EventCalendar,
} from './seasonal-patterns';

// Initialize calendar
const calendar = new EventCalendar();

// Create extractors
const fedExtractor = new FedRateDecisionExtractor(calendar);
const ecbExtractor = new ECBDecisionExtractor();
const boeExtractor = new BoEDecisionExtractor();
const bojExtractor = new BoJDecisionExtractor();

// Extract patterns from timestamp
const timestamp = Date.now();
const fedPattern = fedExtractor.extract(timestamp);
// Returns: 'Fed-Decision-Day-2PM' | 'Fed-Decision-Day-PreMarket' |
//          'Fed-Decision-Day-PostAnnouncement' | 'Fed-Decision-Day' |
//          'Fed-Decision-Week' | null
```

### Fed 2:00 PM Spike Analysis

```typescript
// Analyze the 2:00 PM EST announcement spike
const decisionDate = new Date('2024-12-18'); // FOMC meeting day

const hourlyData = [
  // Hourly candles from previous days and decision day
  { date: new Date('2024-12-18T19:00:00Z'), // 2 PM EST = 19:00 UTC
    open: 100.5, high: 102.0, low: 99.5, close: 101.5, volume: 7500000 },
  // ... more hourly data
];

const analysis = fedExtractor.analyze2PMSpike(decisionDate, hourlyData);

console.log(`Price Move: ${analysis.priceMove.toFixed(2)}%`);
console.log(`Volatility: ${analysis.volatility.toFixed(2)}%`);
console.log(`Volume Spike: ${analysis.volumeSpike.toFixed(1)}x`);
console.log(`Has Dot Plot: ${analysis.hasDotPlot}`);
analysis.insights.forEach(insight => console.log(`- ${insight}`));

// Output:
// Price Move: +0.99%
// Volatility: 2.49%
// Volume Spike: 7.1x
// Has Dot Plot: true
// - 📊 Dot Plot Release: Expect increased volatility
// - 💥 Significant price move: +0.99% in 2:00 PM hour
// - 📈 High intraday volatility: 2.49% range
// - 🔥 Extreme volume spike: 7.1× normal 2 PM volume
```

### Dot Plot Detection

```typescript
// Check if FOMC meeting has dot plot release
const marchMeeting = new Date('2024-03-20');
const hasDotPlot = fedExtractor.hasDotPlot(marchMeeting);

console.log(`March meeting has dot plot: ${hasDotPlot}`);
// Output: March meeting has dot plot: true

// Dot plots are published quarterly: March, June, September, December
```

### ECB EUR/USD Impact

```typescript
const ecbDecisionDate = new Date('2024-12-12');

const eurUsdData = [
  { date: new Date('2024-12-12T13:30:00Z'),
    open: 1.0500, high: 1.0520, low: 1.0480, close: 1.0510, volume: 500000 },
  // ... more EUR/USD hourly data
];

const impact = ecbExtractor.analyzeEURUSDImpact(ecbDecisionDate, eurUsdData);

console.log(`EUR/USD Move: ${impact.eurUsdMove.toFixed(2)}%`);
console.log(`Volatility: ${impact.volatility.toFixed(2)}%`);
impact.insights.forEach(insight => console.log(`- ${insight}`));

// Output:
// EUR/USD Move: +0.71%
// Volatility: 0.86%
// - 🇪🇺 ECB decision: 8:15 AM CET announcement
// - 🇺🇸 US market impact: 7:45-9:00 AM EST
// - 💱 EUR/USD significant move: +0.71%
```

### Multi-Bank Detection

```typescript
// Check all central banks for a given day
const checkDate = new Date('2024-12-18T14:00:00-05:00');
const timestamp = checkDate.getTime();

const patterns = {
  fed: fedExtractor.extract(timestamp),
  ecb: ecbExtractor.extract(timestamp),
  boe: boeExtractor.extract(timestamp),
  boj: bojExtractor.extract(timestamp),
};

console.log('Central Bank Activity:', patterns);
// Output:
// {
//   fed: 'Fed-Decision-Day-2PM',
//   ecb: null,
//   boe: null,
//   boj: 'BoJ-Decision-Overnight'
// }
```

## Decision Schedules

### Federal Reserve (FOMC)

**Frequency**: 8 meetings per year (roughly every 6 weeks)

**Timing**:
- Announcement: 2:00 PM EST sharp
- Press Conference: 2:30 PM EST (if scheduled)
- Dot Plot: Quarterly (March, June, September, December)

**Market Impact**:
- Volume: 5-10× normal at 2:00 PM
- Volatility: Extreme (1-2% moves in minutes)
- Duration: Elevated through 4:00 PM close

**2024 Dates**:
- Jan 31, Mar 20, May 1, Jun 12, Jul 31, Sep 18, Nov 7, Dec 18

**2025 Dates**:
- Jan 29, Mar 19, May 7, Jun 18, Jul 30, Sep 17, Nov 5, Dec 17

**2026 Dates**:
- Jan 28, Mar 18, Apr 29, Jun 17, Jul 29, Sep 23, Nov 4, Dec 16

### European Central Bank (ECB)

**Frequency**: 8 meetings per year

**Timing**:
- Decision: 8:15 AM CET/CEST (published)
- Press Conference: 8:45 AM CET/CEST
- US Impact: 7:45-9:00 AM EST (pre-market + open)

**Market Impact**:
- Primary: EUR/USD (high volatility)
- Secondary: European equity indices
- US Markets: Medium impact at open

**2024 Dates**:
- Jan 25, Mar 7, Apr 11, Jun 6, Jul 18, Sep 12, Oct 17, Dec 12

**2025 Dates**:
- Jan 30, Mar 6, Apr 17, Jun 5, Jul 24, Sep 11, Oct 30, Dec 18

**2026 Dates**:
- Jan 22, Mar 5, Apr 23, Jun 4, Jul 23, Sep 10, Oct 29, Dec 17

### Bank of England (BoE)

**Frequency**: 8 meetings per year

**Timing**:
- Announcement: 12:00 PM GMT/BST
- US Time: 7:00 AM EST/EDT
- Minutes: Published simultaneously

**Market Impact**:
- Primary: GBP/USD
- US Markets: Low to medium (pre-market)

**2024 Dates**:
- Feb 1, Mar 21, May 9, Jun 20, Aug 1, Sep 19, Nov 7, Dec 19

**2025 Dates**:
- Feb 6, Mar 20, May 8, Jun 19, Aug 7, Sep 18, Nov 6, Dec 18

**2026 Dates**:
- Feb 5, Mar 19, May 7, Jun 18, Aug 6, Sep 24, Nov 5, Dec 17

### Bank of Japan (BoJ)

**Frequency**: 8 meetings per year

**Timing**:
- Decision: ~10:30 AM JST
- US Time: ~8:30 PM EST previous day (overnight)
- Press Conference: ~3:30 PM JST (~2:30 AM EST)

**Market Impact**:
- Primary: USD/JPY, Japanese equities
- US Markets: Overnight gaps, futures impact

**2024 Dates**:
- Jan 23, Mar 19, Apr 26, Jun 14, Jul 31, Sep 20, Oct 31, Dec 19

**2025 Dates**:
- Jan 24, Mar 19, Apr 25, Jun 13, Jul 31, Sep 19, Oct 31, Dec 19

**2026 Dates**:
- Jan 23, Mar 18, Apr 30, Jun 19, Jul 31, Sep 18, Oct 30, Dec 18

## Timezone Conversions

### Daylight Saving Time Handling

All extractors handle DST automatically:

**US Eastern Time**:
- EST (Standard): UTC-5 (Nov-Mar)
- EDT (Daylight): UTC-4 (Mar-Nov)
- DST Start: 2nd Sunday in March at 2:00 AM
- DST End: 1st Sunday in November at 2:00 AM

**European Times**:
- CET (Central European Time): UTC+1 (Oct-Mar)
- CEST (Summer): UTC+2 (Mar-Oct)

**UK Time**:
- GMT (Greenwich Mean Time): UTC+0 (Oct-Mar)
- BST (British Summer Time): UTC+1 (Mar-Oct)

**Japan Time**:
- JST (Japan Standard Time): UTC+9 (no DST)

### Conversion Examples

```typescript
// Fed: 2:00 PM EST
// Winter (EST): 19:00 UTC
// Summer (EDT): 18:00 UTC

// ECB: 8:15 AM CET
// Winter (CET): 07:15 UTC → 02:15 EST
// Summer (CEST): 06:15 UTC → 02:15 EDT

// BoE: 12:00 PM GMT
// Winter (GMT): 12:00 UTC → 07:00 EST
// Summer (BST): 11:00 UTC → 07:00 EDT

// BoJ: 10:30 AM JST
// Always: 01:30 UTC → 20:30 EST (prev day)
```

## Testing

Run the comprehensive test suite:

```bash
# Using Bun
bun run tests/seasonal/test-central-banks.ts

# Using Node with tsx
tsx tests/seasonal/test-central-banks.ts
```

### Test Coverage

✅ Fed 2:00 PM spike detection
✅ Dot plot identification (quarterly)
✅ ECB EUR/USD impact analysis
✅ BoE timezone conversion
✅ BoJ overnight detection
✅ Multi-bank scenario (busy week)
✅ Hourly pattern extraction
✅ Volume spike calculations
✅ Volatility analysis
✅ All 96 decision dates 2024-2026

## Integration with Seasonal Analysis

### Combining with Existing Patterns

```typescript
import {
  SeasonalAnalyzer,
  FedRateDecisionExtractor,
  ECBDecisionExtractor,
  MonthOfYearExtractor,
  DayOfWeekExtractor,
} from './seasonal-patterns';

const analyzer = new SeasonalAnalyzer({
  symbol: 'SPY',
  years: 3,
  timeframe: 'hourly',
  extractors: [
    new MonthOfYearExtractor(),
    new DayOfWeekExtractor(),
    new FedRateDecisionExtractor(calendar),
    new ECBDecisionExtractor(),
  ],
});

const results = await analyzer.analyze();

// Results will include patterns like:
// - 'Fed-Decision-Day-2PM': avg return, win rate, volatility
// - 'ECB-Decision-Day-USOpen': EUR/USD correlation
// - Combined with regular patterns (months, days, hours)
```

### Filtering Decision Days

```typescript
// Filter for only Fed decision days in dataset
const fedDecisionDays = historicalData.filter(candle => {
  const pattern = fedExtractor.extract(candle.timestamp);
  return pattern !== null;
});

// Analyze specific hour patterns on decision days
const twoPMCandles = fedDecisionDays.filter(candle => {
  const pattern = fedExtractor.extract(candle.timestamp);
  return pattern === 'Fed-Decision-Day-2PM';
});

const avgReturn = twoPMCandles.reduce((sum, c) =>
  sum + ((c.close - c.open) / c.open), 0) / twoPMCandles.length;

console.log(`Average return at 2 PM Fed announcement: ${(avgReturn * 100).toFixed(2)}%`);
```

## Performance Considerations

### API Call Optimization

- Decision dates are hard-coded (no API calls)
- Timezone conversions are computed locally
- No external dependencies for date/time operations

### Memory Efficiency

- Lightweight extractors (~50 KB total)
- No large data structures cached
- Efficient date arithmetic

### Computation Speed

- Extractor operations: O(1) for date checks
- Spike analysis: O(n) where n = hourly candles
- Timezone conversion: O(1) with DST calculation

## Future Enhancements

### Potential Additions

1. **Additional Central Banks**
   - Reserve Bank of Australia (RBA)
   - Swiss National Bank (SNB)
   - Bank of Canada (BoC)

2. **Enhanced Analysis**
   - Pre-decision positioning patterns
   - Post-decision drift analysis
   - Correlation with VIX/volatility indices
   - Multi-asset correlation (stocks, bonds, FX)

3. **Real-time Alerts**
   - Countdown to next decision
   - Live volume spike detection
   - Deviation from historical patterns

4. **Machine Learning Integration**
   - Predict decision outcome from price action
   - Classify hawkish/dovish based on reaction
   - Forecast volatility for upcoming decisions

## Troubleshooting

### Common Issues

**Q: Extractor returns null for known decision day**

A: Check timestamp timezone. Ensure you're using correct UTC offset:

```typescript
// Correct (explicit timezone)
const timestamp = new Date('2024-12-18T19:00:00Z').getTime(); // 2 PM EST = 19:00 UTC

// Incorrect (local timezone assumed)
const timestamp = new Date('2024-12-18T14:00:00').getTime();
```

**Q: 2 PM spike not detected in hourly data**

A: Verify your data uses UTC timestamps and covers 19:00 UTC (winter) or 18:00 UTC (summer) for 2 PM EST:

```typescript
const hour = new Date(timestamp).getUTCHours();
console.log(`Hour in UTC: ${hour}`); // Should be 18 or 19 for 2 PM EST
```

**Q: Dot plot detection incorrect**

A: Dot plots are ONLY in March, June, September, December:

```typescript
const month = new Date('2024-05-01').getMonth(); // May = 4 (0-indexed)
const hasDotPlot = [2, 5, 8, 11].includes(month); // false (not quarterly)
```

## References

### Official Sources

- Federal Reserve Calendar: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- ECB Calendar: https://www.ecb.europa.eu/press/calendars/html/index.en.html
- Bank of England Calendar: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
- Bank of Japan Calendar: https://www.boj.or.jp/en/mopo/mpmsche_minu/index.htm

### Related Documentation

- [Seasonal Pattern Analysis](./SEASONAL-ANALYSIS.md)
- [Event Calendar Configuration](./EVENT-CALENDAR.md)
- [Multi-Timeframe Analysis](./MULTI-TIMEFRAME.md)

## Contributors

Implementation by Claude Agent SDK Implementation Agent 3

Issues #8 and #9 completed: 2026-01-08
