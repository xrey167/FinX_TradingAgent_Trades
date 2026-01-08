# FinX Trading Agent - Test Suite

This directory contains all test files for the FinX Trading Agent project.

## 📁 Test Structure

```
tests/
├── seasonal/           # Seasonal analysis tests
│   ├── test-all-phases-final.ts         # Final comprehensive test (25 tests)
│   ├── test-seasonal.ts                 # Basic seasonal test
│   ├── test-seasonal-comprehensive.ts   # Phase 1+2 comprehensive (5 tests)
│   ├── test-seasonal-events.ts          # Phase 3 event patterns (3 tests)
│   ├── test-seasonal-week-patterns.ts   # Phase 4 week patterns (6 tests)
│   ├── test-seasonal-hourly.ts          # Hourly pattern tests
│   └── test-spy-hourly-debug.ts         # Debug/development test
├── api/                # API integration tests
│   └── test-eodhd.ts                    # EODHD API test
├── research/           # Research system tests
│   └── test-research-system.ts          # Research agent workflow test
├── tools/              # Tool selection tests
│   └── test-tool-selector.ts            # LLM tool selection test
├── TESTING.md          # General testing guide
└── TESTING-WINDOWS.md  # Windows-specific testing

```

## 🚀 Running Tests

### Prerequisites

```bash
# Ensure environment variables are set
export ANTHROPIC_API_KEY="your-key"
export EODHD_API_KEY="your-key"
```

### Run All Seasonal Analysis Tests

```bash
# Final comprehensive test (all 4 phases)
bun run tests/seasonal/test-all-phases-final.ts

# Phase 1+2 (multi-timeframe + hourly)
bun run tests/seasonal/test-seasonal-comprehensive.ts

# Phase 3 (event-based patterns)
bun run tests/seasonal/test-seasonal-events.ts

# Phase 4 (week positioning patterns)
bun run tests/seasonal/test-seasonal-week-patterns.ts
```

### Run Individual Tests

```bash
# API test
bun run tests/api/test-eodhd.ts

# Research system test
bun run tests/research/test-research-system.ts

# Tool selection test
bun run tests/tools/test-tool-selector.ts
```

## ✅ Test Results

### Seasonal Analysis Suite (Final)
```
═══════════════════════════════════════════════════════════════
                    FINAL TEST SUMMARY
═══════════════════════════════════════════════════════════════
Total Tests: 25
✅ Passed: 25
❌ Failed: 0
Success Rate: 100%
═══════════════════════════════════════════════════════════════
```

**Test Coverage:**
- ✅ Phase 1: Daily analysis (backward compatibility)
- ✅ Phase 2: Hourly analysis (hour-of-day, market sessions)
- ✅ Phase 3: Event-based analysis (FOMC, options expiry, earnings)
- ✅ Phase 4: Week positioning (week-of-month, turn-of-month)
- ✅ Data validation (NaN/Infinity checks)
- ✅ Cache versioning (v5 schema)
- ✅ Multi-phase insights generation

**Real-World Validation:**
- SPY.US (5 years, 1,255 trading days)
- AAPL.US (1 year, 1,951 hourly bars)
- QQQ.US (validation data)

## 📊 Test Breakdown

### Seasonal Analysis Tests

#### test-all-phases-final.ts (25 tests)
**Purpose:** Final integration test validating all 4 phases
**Test Suites:**
1. Phase 1 - Daily Analysis (3 tests)
2. Phase 2 - Hourly Analysis (3 tests)
3. Phase 3 - Event-Based Analysis (3 tests)
4. Phase 4 - Week Positioning (4 tests)
5. Data Validation (5 tests)
6. Cache Versioning (3 tests)
7. Insights Generation (4 tests)

#### test-seasonal-comprehensive.ts (5 tests)
**Purpose:** Phase 1+2 validation
**Coverage:**
- Daily analysis backward compatibility
- Hourly patterns (hour-of-day)
- Market sessions (DST-aware)
- Insights generation
- Data point counts

#### test-seasonal-events.ts (3 tests)
**Purpose:** Phase 3 event calendar validation
**Coverage:**
- EventCalendar date detection
- Event extractors (FOMC, Options Expiry, Earnings)
- Full seasonal analysis with events

#### test-seasonal-week-patterns.ts (6 tests)
**Purpose:** Phase 4 week positioning validation
**Coverage:**
- Week position stats (First-Monday, Last-Friday)
- Week of month stats (Week-1 through Week-5)
- Day of month stats (Day-1 through Day-31)
- Insights generation
- Minimum sample size filtering
- Data validation

### API Tests

#### test-eodhd.ts
**Purpose:** Validate EODHD API integration
**Coverage:**
- EOD data fetching
- Intraday data fetching
- Error handling
- Rate limiting

### Research System Tests

#### test-research-system.ts
**Purpose:** Validate multi-agent research workflow
**Coverage:**
- Planning agent
- Action agent with tool selection
- Validation agent
- Answer agent
- Research orchestrator

### Tool Tests

#### test-tool-selector.ts
**Purpose:** Validate LLM-based tool selection
**Coverage:**
- Dynamic tool selection based on task
- Minimum necessary tools principle
- Tool availability checking

## 🐛 Debugging Tests

### test-spy-hourly-debug.ts
**Purpose:** Debug hourly patterns for SPY
**Usage:** Development/troubleshooting only
**Note:** Not part of production test suite

## ⚙️ Test Configuration

### Environment Variables Required

```bash
# Claude API (for agent tests)
ANTHROPIC_API_KEY="sk-ant-..."

# EODHD API (for market data tests)
EODHD_API_KEY="your-eodhd-key"
```

### Test Timeouts

- Seasonal tests: 120 seconds (2 minutes)
- Research tests: 180 seconds (3 minutes)
- API tests: 60 seconds (1 minute)

### Cache Behavior

Tests use production cache settings:
- Daily data: 24-hour TTL
- Hourly data: 48-hour TTL
- Clear cache before running full test suite: `rm -rf .cache/`

## 🔧 Writing New Tests

### Test Template

```typescript
/**
 * Test Description
 * Purpose: What this test validates
 */

async function testFeature() {
  console.log('Testing feature...');

  try {
    // Setup
    const result = await yourFunction();

    // Assertions
    if (!result.expected) {
      throw new Error('Test failed: description');
    }

    console.log('✅ Test passed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test
testFeature()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
```

### Best Practices

1. **Use descriptive test names** - `test-feature-specific-aspect.ts`
2. **Include error messages** - Clear failure descriptions
3. **Clean up resources** - Close connections, clear caches
4. **Test real data** - Use actual API calls with real symbols
5. **Document expected results** - Comment what should happen
6. **Handle async properly** - Use async/await, proper error handling
7. **Validate all fields** - Check structure, types, and values

## 📝 Test Maintenance

### Adding New Tests

1. Create test file in appropriate subdirectory
2. Follow naming convention: `test-[feature]-[aspect].ts`
3. Add test to this README
4. Update package.json scripts if needed
5. Ensure test passes before committing

### Updating Existing Tests

1. Keep backward compatibility
2. Update expected results if behavior changes
3. Document breaking changes
4. Update version in cache keys if schema changes

### Removing Tests

1. Ensure no dependencies
2. Remove from README documentation
3. Archive or delete file
4. Update any references in other tests

## 🎯 Test Coverage Goals

Current coverage:
- ✅ Seasonal analysis: 100% (25/25 tests)
- ✅ Phase 1 (multi-timeframe): Complete
- ✅ Phase 2 (hourly patterns): Complete
- ✅ Phase 3 (event calendar): Complete
- ✅ Phase 4 (week positioning): Complete
- ⚠️ Research system: Partial (needs expansion)
- ⚠️ Tool selection: Partial (needs expansion)
- ⚠️ Agent personas: Not covered

Future coverage targets:
- [ ] Agent persona tests (Warren Buffett, Charlie Munger, etc.)
- [ ] Full research orchestrator workflow
- [ ] Rate limiting edge cases
- [ ] Cache invalidation scenarios
- [ ] Error recovery and retry logic
- [ ] Integration tests with multiple tools
- [ ] Performance/load tests

## 📚 Additional Resources

- **Testing Guide:** [TESTING.md](TESTING.md)
- **Windows Testing:** [TESTING-WINDOWS.md](TESTING-WINDOWS.md)
- **Seasonal Analysis Docs:** [../docs/seasonal-analysis/](../docs/seasonal-analysis/)
- **Main README:** [../README.md](../README.md)

---

**Last Updated:** 2026-01-08
**Test Suite Version:** 1.0.0
**Status:** ✅ All Core Tests Passing
