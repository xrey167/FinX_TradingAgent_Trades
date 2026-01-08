# Event Extractors Quick Reference

Quick reference guide for using Triple Witching and GDP extractors.

---

## Triple Witching

### Quick Facts
- **Frequency**: 4 times per year
- **Dates**: 3rd Friday of March, June, September, December
- **Impact**: High (extreme volume 2-3×, high volatility)
- **Key Insight**: Entire week shows elevated activity, Friday is peak

### Usage

```typescript
import { EventCalendar, TripleWitchingExtractor } from './src/tools/seasonal-patterns';

const calendar = new EventCalendar();
const extractor = new TripleWitchingExtractor(calendar);

// Basic detection
const date = new Date('2024-03-15');
const result = extractor.extract(date.getTime());
// Returns: 'Triple-Witching-Day' | 'Triple-Witching-Week' | null

// Volume spike check
const isSpike = extractor.detectVolumeSpike(250_000_000, 100_000_000);
// Returns: true (2.5× volume)

// Full analysis
const analysis = extractor.analyzeEventWindow(date, priceData);
// Returns: { isTripleWitching, daysUntilEvent, avgVolumeSpike, volatilityIncrease, insights }
```

### 2024-2026 Dates

```
2024: Mar 15, Jun 21, Sep 20, Dec 20
2025: Mar 21, Jun 20, Sep 19, Dec 19
2026: Mar 20, Jun 19, Sep 18, Dec 18
```

---

## GDP Release

### Quick Facts
- **Frequency**: 12 times per year (4 quarters × 3 estimates)
- **Types**: Advance (~30d), Second (~60d), Third (~90d)
- **Impact**:
  - Advance: High
  - Second: Medium
  - Third: Low (unless major revision)

### Usage

```typescript
import { EventCalendar, GDPExtractor } from './src/tools/seasonal-patterns';

const calendar = new EventCalendar();
const extractor = new GDPExtractor(calendar);

// Basic detection
const date = new Date('2024-04-27');
const result = extractor.extract(date.getTime());
// Returns: 'GDP-Advance-Day' | 'GDP-Advance-Week' | null

// Full analysis
const analysis = extractor.analyzeEventWindow(date, priceData);
// Returns: { isGDPWeek, releaseType, daysUntilRelease, expectedImpact, insights }
```

### 2024 Schedule

**Q1 2024 Releases:**
- Advance: Apr 27 (high impact)
- Second: May 25 (medium impact)
- Third: Jun 22 (low impact)

**Q2 2024 Releases:**
- Advance: Jul 27
- Second: Aug 24
- Third: Sep 21

**Q3 2024 Releases:**
- Advance: Oct 26
- Second: Nov 23
- Third: Dec 21

---

## Event Calendar Methods

```typescript
const calendar = new EventCalendar();

// Check specific event types
calendar.isFOMCWeek(date);              // Federal Reserve meetings
calendar.isOptionsExpiryWeek(date);     // Monthly options (every month)
calendar.isTripleWitchingWeek(date);    // Triple Witching (4× per year)
calendar.isGDPReleaseWeek(date);        // GDP releases (12× per year)
calendar.isEarningsSeason(date);        // Earnings (Jan, Apr, Jul, Oct)

// Get all events for a date
const events = calendar.getEventsForDate(date);
// Returns: CalendarEvent[]
```

---

## Event Types & Impacts

| Event Type | Type String | Typical Impact | Frequency |
|------------|-------------|----------------|-----------|
| FOMC Meeting | `'fomc'` | High | 8× per year |
| Options Expiry | `'options-expiry'` | Medium | 12× per year |
| Triple Witching | `'triple-witching'` | High | 4× per year |
| GDP Release | `'gdp-release'` | High/Medium/Low* | 12× per year |
| Earnings Season | `'earnings-season'` | Medium | 4× per year |

*GDP impact depends on estimate type (Advance/Second/Third)

---

## Pattern Labels

### Triple Witching
- `'Triple-Witching-Day'` - The actual 3rd Friday
- `'Triple-Witching-Week'` - The week containing the event

### GDP Release
- `'GDP-Advance-Day'` - Advance estimate release day
- `'GDP-Advance-Week'` - Week containing advance estimate
- `'GDP-Second-Day'` - Second estimate release day
- `'GDP-Second-Week'` - Week containing second estimate
- `'GDP-Third-Day'` - Third estimate release day
- `'GDP-Third-Week'` - Week containing third estimate

---

## Integration with Seasonal Analysis

Both extractors integrate seamlessly with the seasonal analysis pipeline:

```typescript
import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';

const result = await analyzeSeasonalTool.handler({
  symbol: 'SPY.US',
  years: 5,
  timeframe: 'daily',
  includeEvents: true,  // Enable event detection
});

// Result includes eventBasedStats
const tripleWitchingStats = result.eventBasedStats.find(
  e => e.event === 'Triple-Witching-Week'
);

const gdpAdvanceStats = result.eventBasedStats.find(
  e => e.event === 'GDP-Advance-Week'
);
```

---

## Common Patterns

### Check if today is an event day

```typescript
const today = new Date();
const calendar = new EventCalendar();

if (calendar.isTripleWitchingWeek(today)) {
  console.log('Triple Witching week - expect high volume!');
}

if (calendar.isGDPReleaseWeek(today)) {
  const events = calendar.getEventsForDate(today);
  const gdpEvent = events.find(e => e.type === 'gdp-release');
  console.log(`GDP ${gdpEvent.name} - Impact: ${gdpEvent.impact}`);
}
```

### Analyze upcoming events

```typescript
const extractor = new TripleWitchingExtractor(calendar);

for (let i = 0; i < 30; i++) {
  const date = new Date();
  date.setDate(date.getDate() + i);

  const result = extractor.extract(date.getTime());
  if (result) {
    console.log(`${date.toDateString()}: ${result}`);
  }
}
```

### Historical pattern analysis

```typescript
// Fetch historical data
const priceData = await fetchHistoricalData('SPY.US', 5);

// Analyze each Triple Witching event
const tripleWitchingDates = [
  '2024-03-15', '2024-06-21', '2024-09-20', '2024-12-20'
];

for (const dateStr of tripleWitchingDates) {
  const date = new Date(dateStr);
  const analysis = extractor.analyzeEventWindow(date, priceData);

  console.log(`${dateStr}:`);
  console.log(`  Volume Spike: ${analysis.avgVolumeSpike.toFixed(2)}×`);
  console.log(`  Volatility: +${(analysis.volatilityIncrease * 100).toFixed(1)}%`);
  console.log(`  Insights: ${analysis.insights.join(', ')}`);
}
```

---

## Error Handling

Both extractors return `null` when:
- Date is not an event period
- Calendar data is unavailable
- Date is outside covered range

Always check for null:

```typescript
const result = extractor.extract(timestamp);
if (result === null) {
  // Not an event period, skip special handling
} else {
  // Event detected, apply special logic
}
```

---

## Testing

Run the comprehensive test suite:

```bash
bun run tests/seasonal/test-triple-witching-gdp.ts
```

Expected: All tests pass with ✅ indicators.

---

## Performance Notes

- **Fast**: Both extractors use algorithmic date calculation (no lookups)
- **Efficient**: Minimal memory footprint
- **No API calls**: Works with existing daily data
- **Cacheable**: Results can be cached by date

---

## Support & Questions

For implementation questions or issues:
- See: `docs/seasonal-analysis/TRIPLE-WITCHING-GDP-IMPLEMENTATION.md`
- Check: `tests/seasonal/test-triple-witching-gdp.ts` for examples
- Review: `src/tools/seasonal-patterns/event-extractors.ts` for source code
