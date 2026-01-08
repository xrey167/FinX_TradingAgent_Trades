#!/bin/bash

# Run All Seasonal Tests
# Tests for Elections (#13), Dividends (#14), and Index Rebalancing (#15)

echo "========================================================"
echo "SEASONAL PATTERNS TEST SUITE"
echo "Testing Agent 5: Elections, Dividends, Index Rebalancing"
echo "========================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=3

# Function to run a test
run_test() {
  local test_name=$1
  local test_file=$2

  echo "----------------------------------------"
  echo "Running: $test_name"
  echo "----------------------------------------"

  if bun run "$test_file"; then
    echo -e "${GREEN}✅ $test_name PASSED${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ $test_name FAILED${NC}"
    ((TESTS_FAILED++))
  fi

  echo ""
}

# Run tests
run_test "Elections Test (#13)" "tests/seasonal/test-elections.ts"
run_test "Dividends Test (#14)" "tests/seasonal/test-dividends.ts"
run_test "Index Rebalancing Test (#15)" "tests/seasonal/test-rebalancing.ts"

# Summary
echo "========================================================"
echo "TEST SUITE SUMMARY"
echo "========================================================"
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo "========================================================"
  exit 0
else
  echo ""
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo "========================================================"
  exit 1
fi
