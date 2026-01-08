# Phase 5: Economic Events Implementation Plan

**Date:** 2026-01-08
**Status:** Ready for parallel implementation
**Total Issues:** 17 (16 features + 1 WASD report)

## 🎯 Implementation Strategy

### Parallel Execution Model

We'll use **15 agents running in parallel**:
- **5 Implementation Agents** - Build features
- **5 Testing Agents** - Write and run tests
- **5 Review Agents** - Code quality review

### Work Distribution

Each group of 3 agents (1 impl + 1 test + 1 review) handles a specific set of issues.

---

## 📦 Agent Assignments

### Group 1: High Priority Events (CPI, NFP)
**Issues:** #4, #5

**Implementation Agent 1:**
- Implement `CPIExtractor` class
- Implement `NFPExtractor` class
- Add CPI release dates (2024-2026)
- Add NFP first Friday calculation
- Event window T-5 to T+5 for both
- Integration with `EventCalendar`

**Files:**
- `src/tools/seasonal-patterns/event-extractors.ts` (modify)
- `src/tools/seasonal-patterns/event-calendar.ts` (modify)

**Testing Agent 1:**
- Create `tests/seasonal/test-cpi-events.ts`
- Create `tests/seasonal/test-nfp-events.ts`
- Test date detection accuracy
- Test pattern analysis
- Test event window analysis
- Run with SPY.US and AAPL.US

**Review Agent 1:**
- Review CPI/NFP extractor code quality
- Check error handling
- Verify date calculations
- Review test coverage (≥80%)
- Check DoD completion for #4, #5

---

### Group 2: High Priority Events (Triple Witching, GDP)
**Issues:** #6, #7

**Implementation Agent 2:**
- Implement `TripleWitchingExtractor` class
- Implement `GDPExtractor` class
- 3rd Friday detection for Mar/Jun/Sep/Dec
- GDP Advance/Second/Third estimate dates
- Volume spike detection for Triple Witching

**Files:**
- `src/tools/seasonal-patterns/event-extractors.ts` (modify)
- `src/tools/seasonal-patterns/event-calendar.ts` (modify)

**Testing Agent 2:**
- Create `tests/seasonal/test-triple-witching.ts`
- Create `tests/seasonal/test-gdp-events.ts`
- Test quarterly expiry detection
- Test GDP estimate types
- Test volume analysis
- Run with SPY.US, QQQ.US

**Review Agent 2:**
- Review Triple Witching/GDP code quality
- Check date calculation edge cases
- Verify quarterly logic
- Review test coverage
- Check DoD completion for #6, #7

---

### Group 3: High Priority Events (Fed Rate, Central Banks)
**Issues:** #8, #9

**Implementation Agent 3:**
- Implement `FedRateDecisionExtractor` class
- Implement `CentralBankExtractor` (ECB/BoE/BoJ)
- Precise FOMC decision day (not just week)
- Dot plot detection (quarterly)
- Intraday 2:00 PM spike analysis
- Timezone handling for foreign banks

**Files:**
- `src/tools/seasonal-patterns/event-extractors.ts` (modify)
- `src/tools/seasonal-patterns/event-calendar.ts` (modify)

**Testing Agent 3:**
- Create `tests/seasonal/test-fed-decisions.ts`
- Create `tests/seasonal/test-central-banks.ts`
- Test FOMC day vs FOMC week
- Test dot plot detection
- Test ECB/BoE/BoJ dates
- Test timezone conversions

**Review Agent 3:**
- Review Fed/Central Bank code quality
- Check intraday analysis logic
- Verify timezone conversions
- Review test coverage
- Check DoD completion for #8, #9

---

### Group 4: Medium Priority Events (Retail, ISM, Jobless)
**Issues:** #10, #11, #12

**Implementation Agent 4:**
- Implement `RetailSalesExtractor` class
- Implement `ISMExtractor` class
- Implement `JoblessClaimsExtractor` class
- Mid-month retail sales detection
- First business day ISM logic
- Every Thursday jobless claims

**Files:**
- `src/tools/seasonal-patterns/event-extractors.ts` (modify)
- `src/tools/seasonal-patterns/event-calendar.ts` (modify)

**Testing Agent 4:**
- Create `tests/seasonal/test-retail-sales.ts`
- Create `tests/seasonal/test-ism.ts`
- Create `tests/seasonal/test-jobless-claims.ts`
- Test monthly/weekly frequency
- Test pattern detection
- Run with SPY.US

**Review Agent 4:**
- Review Retail/ISM/Jobless code quality
- Check frequency calculations
- Verify pattern logic
- Review test coverage
- Check DoD completion for #10, #11, #12

---

### Group 5: Medium Priority Events (Elections, Dividends, Rebalancing)
**Issues:** #13, #14, #15

**Implementation Agent 5:**
- Implement `ElectionExtractor` class
- Implement `DividendExDateExtractor` class
- Implement `IndexRebalancingExtractor` class
- Presidential + Midterm dates (2024-2032)
- Dividend API integration (EODHD)
- S&P 500 + Russell rebalancing dates

**Files:**
- `src/tools/seasonal-patterns/event-extractors.ts` (modify)
- `src/tools/seasonal-patterns/event-calendar.ts` (modify)

**Testing Agent 5:**
- Create `tests/seasonal/test-elections.ts`
- Create `tests/seasonal/test-dividends.ts`
- Create `tests/seasonal/test-rebalancing.ts`
- Test election date calculation
- Test dividend API integration
- Test rebalancing frequency

**Review Agent 5:**
- Review Elections/Dividends/Rebalancing code quality
- Check API integration
- Verify date calculations
- Review test coverage
- Check DoD completion for #13, #14, #15

---

## 🚀 Advanced Features (Phase 5B - After Core Events)

**Not in parallel execution** - These depend on core events completing:

- **#16 - Event Window Analysis** (depends on all events)
- **#17 - Event Combinations** (depends on all events)
- **#18 - Sector-Specific Events** (requires sector classification)
- **#19 - Custom User-Defined Events** (requires config system)
- **#20 - WASD Report** (depends on everything)

---

## 📋 Implementation Checklist (Per Group)

### Implementation Phase
- [ ] Create extractor classes
- [ ] Add event dates (hardcoded 2024-2026)
- [ ] Implement pattern detection logic
- [ ] Add to `EventCalendar` class
- [ ] Update cache version to v6
- [ ] Integration with `analyzeSeasonalTool`

### Testing Phase
- [ ] Create test file(s)
- [ ] Test date detection accuracy
- [ ] Test pattern analysis
- [ ] Test event window (T-5 to T+5)
- [ ] Test with real symbols (SPY, AAPL, QQQ)
- [ ] Verify ≥80% code coverage

### Review Phase
- [ ] Code quality review
- [ ] Error handling verification
- [ ] Edge case coverage
- [ ] Test coverage verification
- [ ] DoD completion check
- [ ] Documentation review

---

## 🗂️ File Structure

```
src/tools/seasonal-patterns/
├── event-extractors.ts          (MODIFY - add 12 new extractors)
├── event-calendar.ts             (MODIFY - add event dates)
├── types.ts                      (MODIFY - add new event types)
└── index.ts                      (MODIFY - export new classes)

tests/seasonal/
├── test-cpi-events.ts            (NEW)
├── test-nfp-events.ts            (NEW)
├── test-triple-witching.ts       (NEW)
├── test-gdp-events.ts            (NEW)
├── test-fed-decisions.ts         (NEW)
├── test-central-banks.ts         (NEW)
├── test-retail-sales.ts          (NEW)
├── test-ism.ts                   (NEW)
├── test-jobless-claims.ts        (NEW)
├── test-elections.ts             (NEW)
├── test-dividends.ts             (NEW)
└── test-rebalancing.ts           (NEW)

docs/seasonal-analysis/
└── PHASE-5-ECONOMIC-EVENTS.md    (NEW - comprehensive docs)
```

---

## ⏱️ Timeline Estimate

**With 15 Agents in Parallel:**
- Implementation: 30-45 minutes per group
- Testing: 20-30 minutes per group
- Review: 15-20 minutes per group
- **Total: ~90 minutes for all 12 core events**

**Sequential would take:** ~7.5 hours
**Parallel speedup:** **5× faster**

---

## 🎯 Success Criteria

### Per Event Feature
- ✅ Extractor class implemented and tested
- ✅ Event dates accurate (2024-2026)
- ✅ Pattern detection working
- ✅ Test coverage ≥80%
- ✅ All DoD items checked
- ✅ All AC items verified

### Overall Phase 5
- ✅ All 12 core event types working
- ✅ 12 test files passing
- ✅ Cache version upgraded to v6
- ✅ Documentation complete
- ✅ Integration tests passing
- ✅ Ready for PR merge

---

## 📊 Monitoring Progress

Each agent will output to:
```
.claude/agent-output/
├── impl-agent-1.log
├── impl-agent-2.log
├── impl-agent-3.log
├── impl-agent-4.log
├── impl-agent-5.log
├── test-agent-1.log
├── test-agent-2.log
├── test-agent-3.log
├── test-agent-4.log
├── test-agent-5.log
├── review-agent-1.log
├── review-agent-2.log
├── review-agent-3.log
├── review-agent-4.log
└── review-agent-5.log
```

Monitor with:
```bash
tail -f .claude/agent-output/*.log
```

---

## 🔧 Rollback Plan

If any agent fails:
1. Check agent output log
2. Identify failure point
3. Fix issue manually or re-run specific agent
4. All agents use git branches - can cherry-pick successful work

---

**Plan Status:** ✅ Ready for Execution
**Created:** 2026-01-08
**Agents Ready:** 15 (5 impl + 5 test + 5 review)
