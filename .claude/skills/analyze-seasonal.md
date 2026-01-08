---
description: Analyze seasonal patterns and calendar effects in historical price data
arguments:
  - name: symbol
    required: true
    description: Stock ticker symbol (e.g., AAPL.US, SPY.US)
  - name: years
    required: false
    default: "5"
    description: Number of years of history to analyze
examples:
  - /analyze-seasonal AAPL.US
  - /analyze-seasonal SPY.US 10
  - /analyze-seasonal TSLA.US 3
---

# Analyze Seasonal Patterns

Analyzes historical price data for {{symbol}} to identify seasonal patterns and calendar effects over the past {{years}} years.

**What you'll discover:**
- Best/worst performing months (e.g., "November rally", "September selloff")
- Quarterly trends (Q4 strength, Q1 weakness, etc.)
- Day-of-week effects (Monday blues, Friday rallies)
- Famous patterns verification (Santa Rally, Sell in May, January Effect)
- Multi-year consistency scores

**API Cost:** 1 EODHD API call

**Caching:** Results cached for 24 hours (seasonal patterns don't change frequently)

---

Use the `analyze_seasonal` MCP tool to perform the analysis, then format the results in a clear, actionable format.

```typescript
// Example tool call
const result = await analyzeSeasonalTool({
  symbol: "{{symbol}}",
  years: {{years}}
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

## Usage Tips

**For Long-Term Investors:**
- Use seasonal analysis for entry timing (buy during weak months)
- Don't let seasonality override fundamentals
- Average into positions during weak seasonal periods

**For Active Traders:**
- Combine seasonal edge with technical setups
- Higher win probability during strong seasonal periods
- Reduce position size during weak seasonal months

**For Risk Management:**
- Hedge during historically weak periods
- Increase cash allocation in weak quarters
- Use options strategies to protect downside

Remember: Seasonal analysis provides a statistical edge, not a crystal ball!
