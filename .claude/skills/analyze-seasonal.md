---
description: Analyze seasonal patterns and calendar effects across multiple timeframes
arguments:
  - name: symbol
    required: true
    description: Stock ticker symbol (e.g., AAPL.US, SPY.US)
  - name: years
    required: false
    default: "5"
    description: Number of years of history to analyze
  - name: timeframe
    required: false
    default: "daily"
    description: Analysis timeframe (daily or hourly)
examples:
  - /analyze-seasonal AAPL.US
  - /analyze-seasonal SPY.US 10
  - /analyze-seasonal SPY.US 2 hourly
  - /analyze-seasonal QQQ.US 1 hourly
  - /analyze-seasonal SPY.US 5 daily  # includes event-based patterns
---

# Analyze Seasonal Patterns

Analyzes historical price data for {{symbol}} to identify seasonal patterns and calendar effects across multiple timeframes.

**Daily Analysis** (default):
- Best/worst performing months (e.g., "November rally", "September selloff")
- Quarterly trends (Q4 strength, Q1 weakness, etc.)
- Day-of-week effects (Monday blues, Friday rallies)
- Famous patterns verification (Santa Rally, Sell in May, January Effect)
- API Cost: 1 EODHD API call | History: 5+ years | Cache: 24 hours

**Hourly Analysis** (for day traders):
- Hour-of-day patterns - Identifies best/worst trading hours (0-23 UTC)
- Market session analysis - Pre-Market, Market-Open, Mid-Day, Lunch-Hour, Afternoon, Power-Hour
- Intraday volatility patterns - Which sessions have highest volatility/risk
- Win rates and sample sizes for each hour and session
- API Cost: 5 EODHD API calls | History: 1-2 years | Cache: 48 hours

**Event-Based Analysis** (daily timeframe only):
- FOMC Week patterns - Federal Reserve meeting weeks (8 times per year)
- Options Expiry Week - Monthly options expiration (3rd Friday of each month)
- Earnings Season - Quarterly earnings reporting periods (Jan, Apr, Jul, Oct)
- Automatic event detection with configurable calendar
- Identifies high-impact vs low-impact events

---

Use the `analyze_seasonal` MCP tool to perform the analysis, then format the results in a clear, actionable format.

```typescript
// Daily analysis (default)
const dailyResult = await analyzeSeasonalTool({
  symbol: "{{symbol}}",
  years: {{years}},
  timeframe: "daily"
});

// Hourly analysis (for day traders)
const hourlyResult = await analyzeSeasonalTool({
  symbol: "{{symbol}}",
  years: 2, // Limited to 1-2 years for hourly
  timeframe: "hourly"
});

const data = JSON.parse(result.content[0].text);
```

## Output Format

Present the analysis in these sections:

### 📊 Overview
```
Symbol: {{symbol}}
Period Analyzed: {{years}} years
Data Points: {{dataPoints}} trading days
```

### 📅 Best & Worst Months
Show the top 3 and bottom 3 performing months with:
- Average daily return
- Consistency score (% of years positive)
- Best/worst performing year

Example:
```
🟢 BEST MONTHS:
1. November: +0.12% avg daily, 75% consistent (best: 2021, worst: 2022)
2. December: +0.10% avg daily, 70% consistent (best: 2020, worst: 2018)
3. April: +0.08% avg daily, 68% consistent (best: 2023, worst: 2022)

🔴 WORST MONTHS:
1. September: -0.05% avg daily, 35% consistent (best: 2023, worst: 2022)
2. May: -0.03% avg daily, 42% consistent (best: 2023, worst: 2022)
3. October: -0.02% avg daily, 45% consistent (best: 2023, worst: 2018)
```

### 📈 Quarterly Performance
Show which quarters perform best:
```
Q4 (Oct-Dec): +0.15% avg daily, 65% win rate, 1.8% volatility
Q1 (Jan-Mar): +0.08% avg daily, 58% win rate, 2.1% volatility
Q2 (Apr-Jun): +0.05% avg daily, 54% win rate, 1.9% volatility
Q3 (Jul-Sep): -0.02% avg daily, 48% win rate, 2.3% volatility
```

### 📆 Day of Week Effects
```
Friday: +0.08% avg, 55% win rate (best day)
Monday: +0.03% avg, 51% win rate
Tuesday: +0.05% avg, 52% win rate
Wednesday: +0.04% avg, 51% win rate
Thursday: +0.06% avg, 53% win rate
```

### 🎅 Famous Seasonal Patterns
Verify well-known calendar effects:
```
Santa Rally (Late December):
  - Average Return: +0.15%
  - Win Rate: 72%
  - Status: ✅ CONFIRMED

Sell in May (May-October):
  - Average Return: -0.03%
  - Win Rate: 45%
  - Status: ✅ CONFIRMED

January Effect (January):
  - Average Return: +0.10%
  - Win Rate: 65%
  - Status: ✅ CONFIRMED
```

### 💡 Actionable Insights
List 3-5 key takeaways:
```
1. Strong seasonal months: November, December (60%+ positive consistency)
2. Strongest quarter: Q4 (avg return: 0.15%)
3. Best day: Friday (55% win rate, +0.08% avg)
4. Confirmed patterns: Santa Rally (72% win rate)
5. Weak seasonal months: September (historically negative)
```

### ⚠️ Important Disclaimers
```
- Past performance does not guarantee future results
- Seasonal patterns can break down or reverse
- Use seasonal analysis as ONE input, not the only factor
- Always consider current market conditions and fundamentals
- Seasonal edge is typically small (0.05-0.15% daily)
```

## Trading Implications

Based on the seasonal analysis, provide:

1. **Entry Timing**: Which months/quarters offer best entry points?
2. **Exit Timing**: When to take profits based on seasonal weakness?
3. **Avoid Periods**: When to reduce exposure or hedge?
4. **Pattern Strength**: Which patterns are most reliable (>65% win rate)?

## Example Response

```
📊 SEASONAL ANALYSIS: AAPL.US (5 Years)
============================================================
Data Points: 1,260 trading days

🟢 BEST MONTHS:
1. November: +0.12% avg daily, 80% consistent
2. December: +0.10% avg daily, 75% consistent
3. April: +0.08% avg daily, 70% consistent

🔴 WORST MONTHS:
1. September: -0.05% avg daily, 30% consistent
2. May: -0.03% avg daily, 40% consistent

📈 STRONGEST QUARTER: Q4 (+0.15% avg daily, 68% win rate)

📆 BEST DAY: Friday (+0.08% avg, 56% win rate)

🎅 FAMOUS PATTERNS:
✅ Santa Rally: +0.15%, 72% win rate (CONFIRMED)
✅ Sell in May: -0.03%, 45% win rate (CONFIRMED)
✅ January Effect: +0.10%, 65% win rate (CONFIRMED)

💡 KEY INSIGHTS:
1. Q4 (Oct-Dec) shows strong seasonal strength
2. September historically weakest month
3. Friday rally effect present (56% win rate)
4. Santa Rally pattern confirmed (72% success rate)
5. Consider reducing exposure May-September

⚠️ REMEMBER: Seasonal patterns are probabilistic, not guaranteed.
Always combine with fundamental and technical analysis.
```

### Hourly Analysis Example

```
📊 HOURLY SEASONAL ANALYSIS: AAPL.US (1 Year)
============================================================
Timeframe: hourly (1h candles)
Data Points: 1,951 hourly bars

⏰ HOUR-OF-DAY PATTERNS (Top 5 Hours by Avg Return):
1. Hour-11 (6:00am EST): +0.125% avg, 52.4% win rate (145 samples)
2. Hour-17 (12:00pm EST): +0.036% avg, 52.7% win rate (245 samples)
3. Hour-19 (2:00pm EST): +0.020% avg, 51.0% win rate (102 samples)
4. Hour-16 (11:00am EST): +0.011% avg, 49.8% win rate (245 samples)
5. Hour-15 (10:00am EST): +0.008% avg, 48.4% win rate (246 samples)

📊 MARKET SESSION PATTERNS:
✅ Lunch-Hour (12:00-1:00pm EST): +0.036% avg, 52.7% win rate, 0.375% vol
⚠️ Power-Hour (3:00-4:00pm EST): -0.003% avg, 42.2% win rate, 0.026% vol
   Pre-Market: +0.006% avg, 48.8% win rate, 1.057% vol (HIGH VOLATILITY)
   Market-Open: -0.011% avg, 48.0% win rate, 0.546% vol
   Mid-Day: +0.011% avg, 49.8% win rate, 0.444% vol
   Afternoon: +0.007% avg, 51.1% win rate, 0.272% vol

💡 INTRADAY INSIGHTS:
- Best trading window: Lunch-Hour shows strongest edge (52.7% win rate)
- Avoid: Power-Hour has poor win rate (42.2%)
- High volatility: Pre-Market session (1.057% vol) - increased risk/reward
- Weak hours to avoid: Hour-20 (historically negative)
- Market-Open shows weakness (-0.011% avg) - wait for first hour to pass

⚠️ REMEMBER: Intraday patterns require tighter risk management.
Use with technical analysis and proper position sizing.
```

### Event-Based Analysis Example

```
📊 EVENT-BASED SEASONAL ANALYSIS: SPY.US (5 Years)
============================================================
Timeframe: daily
Data Points: 1,255 trading days

🎯 MARKET EVENT PATTERNS:

✅ Earnings-Season (Jan, Apr, Jul, Oct) - MEDIUM IMPACT
   Average Return: +0.073% daily
   Win Rate: 54.78%
   Volatility: 1.18%
   Sample Size: 418 occurrences
   Status: ✅ POSITIVE BIAS (modest seasonal tailwind)

⚠️ Options-Expiry-Week (3rd Friday) - MEDIUM IMPACT
   Average Return: -0.052% daily
   Win Rate: 48.45%
   Volatility: 1.02%
   Sample Size: 291 occurrences
   Status: ⚠️ NEGATIVE BIAS (increased risk week)

➖ FOMC-Week (Federal Reserve Meetings) - HIGH IMPACT
   Average Return: +0.033% daily
   Win Rate: 51.90%
   Volatility: 0.89%
   Sample Size: 79 occurrences
   Status: ➖ NEUTRAL (no clear pattern)

💡 EVENT-BASED INSIGHTS:
1. Earnings season shows positive bias (54.78% win rate)
2. Options expiry week has negative edge - avoid or hedge (48.45% win rate)
3. FOMC weeks are neutral - pattern not strong enough to trade
4. Options expiry volatility is 1.02% - lower than normal, but win rate poor
5. Consider reducing positions during options expiry week (week of 3rd Friday)

📅 UPCOMING EVENTS (Based on Calendar):
- Next FOMC Meeting: March 19-20, 2025
- Next Options Expiry: 3rd Friday of current month
- Earnings Season: January, April, July, October

🔧 EVENT CALENDAR CONFIGURATION:
Event patterns use .claude/seasonal-events.json for custom events.
Default events include: FOMC meetings (2024-2026), monthly options expiry, earnings seasons.

⚠️ REMEMBER: Event-based patterns capture market behavior around known calendar events.
Combine with news flow and volatility expectations for best results.
```

## Usage Tips

**For Long-Term Investors:**
- Use seasonal analysis for entry timing (buy during weak months)
- Don't let seasonality override fundamentals
- Average into positions during weak seasonal periods

**For Active Traders:**
- Combine seasonal edge with technical setups
- Higher win probability during strong seasonal periods
- Reduce position size during weak seasonal months

**For Day Traders (Hourly Analysis):**
- Focus on high win-rate hours (>55% win rate) for entries
- Avoid historically weak hours and sessions (<45% win rate)
- Be aware of high-volatility sessions (Pre-Market, Market-Open) - wider stops needed
- Best edge typically in Lunch-Hour and Afternoon sessions
- Use hour-of-day patterns to time entries within your trading day

**For Event-Aware Trading:**
- Monitor FOMC meeting dates (8 times per year) - high-impact events
- Be cautious during options expiry week (3rd Friday) - historical negative bias
- Earnings seasons (Jan, Apr, Jul, Oct) show modest positive bias
- Reduce position size or hedge during weak event periods
- Combine event patterns with volatility expectations (VIX, implied vol)
- Custom events can be added to .claude/seasonal-events.json

**For Risk Management:**
- Hedge during historically weak periods
- Increase cash allocation in weak quarters
- Use options strategies to protect downside
- Tighter stops during high-volatility sessions (Pre-Market)
- Reduce exposure during negative-bias events (e.g., Options-Expiry-Week)

Remember: Seasonal analysis provides a statistical edge, not a crystal ball!
