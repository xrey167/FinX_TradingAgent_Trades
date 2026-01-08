/**
 * Simple CLI Research - Direct EODHD Client Usage
 *
 * No Anthropic API Required - Just TypeScript + EODHD API
 *
 * Usage:
 *   EODHD_API_KEY=DEMO bun cli-research-simple.ts TSLA.US
 *   EODHD_API_KEY=DEMO bun cli-research-simple.ts AAPL.US
 */

import { EODHDClient } from './src/lib/eodhd-client.ts';

async function simpleResearch(symbol: string) {
  const apiKey = process.env.EODHD_API_KEY || 'DEMO';

  console.log('🔍 FinX Simple CLI Research');
  console.log('='.repeat(60));
  console.log(`📊 Symbol: ${symbol}`);
  console.log(`🔑 API Key: ${apiKey === 'DEMO' ? 'DEMO (limited)' : 'Custom'}`);
  console.log('');

  const client = new EODHDClient({ apiToken: apiKey });

  try {
    // Fetch fundamental data
    console.log('📈 Fetching fundamental data...');
    const fundamentals = await client.getFundamentals(symbol);
    console.log('✅ Retrieved');
    console.log('');

    // Fetch news & sentiment
    console.log('📰 Fetching news...');
    const news = await client.getNews(symbol, 10);
    console.log(`✅ Retrieved ${news.length} articles`);
    console.log('');

    // Calculate sentiment
    const sentimentCounts = news.reduce(
      (acc, article) => {
        const sent = typeof article.sentiment === 'string' ? article.sentiment.toLowerCase() : 'neutral';
        if (sent === 'positive') acc.positive++;
        else if (sent === 'negative') acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );
    const totalArticles = news.length;
    // Sentiment score: 0-100 scale (0=very negative, 50=neutral, 100=very positive)
    const sentimentScore =
      totalArticles > 0
        ? 50 + ((sentimentCounts.positive - sentimentCounts.negative) / totalArticles) * 50
        : 50;

    // Display Results
    console.log('='.repeat(60));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(60));
    console.log('');

    // Company Info
    console.log('🏢 COMPANY');
    console.log('-'.repeat(60));
    console.log(`Name: ${fundamentals.General?.Name || 'N/A'}`);
    console.log(`Sector: ${fundamentals.General?.Sector || 'N/A'}`);
    console.log(`Industry: ${fundamentals.General?.Industry || 'N/A'}`);
    console.log(`Country: ${fundamentals.General?.CountryName || 'N/A'}`);
    console.log('');

    // Valuation
    const highlights = fundamentals.Highlights || {};
    const valuation = fundamentals.Valuation || {};
    console.log('💰 VALUATION');
    console.log('-'.repeat(60));
    console.log(`Market Cap: $${highlights.MarketCapitalization ? (highlights.MarketCapitalization / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    console.log(`P/E Ratio: ${highlights.PERatio?.toFixed(2) || 'N/A'}`);
    console.log(`P/B Ratio: ${valuation.PriceBookMRQ?.toFixed(2) || 'N/A'}`);
    console.log(`EV/EBITDA: ${valuation.EnterpriseValueEbitda?.toFixed(2) || 'N/A'}`);
    console.log(`PEG Ratio: ${highlights.PEGRatio?.toFixed(2) || 'N/A'}`);
    console.log('');

    // Profitability
    console.log('💪 PROFITABILITY');
    console.log('-'.repeat(60));
    console.log(`ROE: ${highlights.ReturnOnEquityTTM ? (highlights.ReturnOnEquityTTM * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`ROA: ${highlights.ReturnOnAssetsTTM ? (highlights.ReturnOnAssetsTTM * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`Profit Margin: ${highlights.ProfitMargin ? (highlights.ProfitMargin * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`Operating Margin: ${highlights.OperatingMarginTTM ? (highlights.OperatingMarginTTM * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log('');

    // Growth
    console.log('📈 GROWTH');
    console.log('-'.repeat(60));
    console.log(`Revenue Growth (YoY): ${highlights.QuarterlyRevenueGrowthYOY ? (highlights.QuarterlyRevenueGrowthYOY * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`Earnings Growth (YoY): ${highlights.QuarterlyEarningsGrowthYOY ? (highlights.QuarterlyEarningsGrowthYOY * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`EPS Estimate Next Quarter: ${highlights.EPSEstimateNextQuarter || 'N/A'}`);
    console.log('');

    // Financial Health - Calculate from balance sheet
    const balanceSheetQuarterly = fundamentals.Financials?.Balance_Sheet?.quarterly || {};
    const mostRecentQuarter = Object.keys(balanceSheetQuarterly)[0];
    const recentBalanceSheet = mostRecentQuarter ? balanceSheetQuarterly[mostRecentQuarter] : null;

    const debtToEquity = recentBalanceSheet && recentBalanceSheet.totalStockholderEquity
      ? (recentBalanceSheet.totalLiab / recentBalanceSheet.totalStockholderEquity)
      : null;
    const currentRatio = recentBalanceSheet && recentBalanceSheet.totalCurrentLiabilities
      ? (recentBalanceSheet.totalCurrentAssets / recentBalanceSheet.totalCurrentLiabilities)
      : null;

    // Calculate Working Capital = Current Assets - Current Liabilities
    const workingCapital = recentBalanceSheet &&
                          recentBalanceSheet.totalCurrentAssets !== undefined &&
                          recentBalanceSheet.totalCurrentLiabilities !== undefined
      ? (recentBalanceSheet.totalCurrentAssets - recentBalanceSheet.totalCurrentLiabilities)
      : null;

    const netDebt = recentBalanceSheet?.netDebt !== undefined ? recentBalanceSheet.netDebt : null;

    console.log('🏦 FINANCIAL HEALTH');
    console.log('-'.repeat(60));
    console.log(`Debt/Equity: ${debtToEquity !== null ? debtToEquity.toFixed(2) : 'N/A'}`);
    console.log(`Current Ratio: ${currentRatio !== null ? currentRatio.toFixed(2) : 'N/A'}`);
    console.log(`Working Capital: ${workingCapital !== null ? '$' + (workingCapital / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    console.log(`Net Debt: ${netDebt !== null ? '$' + (netDebt / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    console.log('');

    // Sentiment
    console.log('📰 SENTIMENT');
    console.log('-'.repeat(60));
    console.log(`Sentiment Score: ${sentimentScore.toFixed(1)}/100`);
    console.log(`Positive: ${sentimentCounts.positive} | Neutral: ${sentimentCounts.neutral} | Negative: ${sentimentCounts.negative}`);
    console.log('');
    console.log('Recent Headlines:');
    news.slice(0, 5).forEach((article, i) => {
      const sent = typeof article.sentiment === 'string' ? article.sentiment.toUpperCase() : 'NEUTRAL';
      console.log(`  ${i + 1}. [${sent}] ${article.title}`);
    });
    console.log('');

    // Simple Recommendation
    console.log('='.repeat(60));
    console.log('🤖 SIMPLE RECOMMENDATION');
    console.log('='.repeat(60));
    console.log('');

    let score = 0;
    const peRatio = highlights.PERatio || 0;
    const roe = (highlights.ReturnOnEquityTTM || 0) * 100;
    const profitMargin = (highlights.ProfitMargin || 0) * 100;

    // Valuation scoring
    if (peRatio > 0 && peRatio < 15) score += 2;
    else if (peRatio >= 15 && peRatio < 25) score += 1;

    // Profitability scoring
    if (roe > 15 && profitMargin > 15) score += 2;
    else if (roe > 10 || profitMargin > 10) score += 1;

    // Sentiment scoring (0-100 scale, 50=neutral)
    if (sentimentScore > 60) score += 2;
    else if (sentimentScore > 50) score += 1;
    else if (sentimentScore < 40) score -= 1;

    // Risk scoring (low debt is good)
    if (debtToEquity !== null) {
      if (debtToEquity < 0.5) score += 1;
      else if (debtToEquity > 2.0) score -= 1;
    }

    console.log(`Investment Score: ${score}/7`);
    console.log('');

    if (score >= 6) {
      console.log('🟢 STRONG BUY');
      console.log('   Excellent fundamentals, good value, positive sentiment');
    } else if (score >= 4) {
      console.log('🟡 BUY');
      console.log('   Good fundamentals, consider position sizing');
    } else if (score >= 2) {
      console.log('🟠 HOLD');
      console.log('   Mixed signals, suitable for existing positions');
    } else {
      console.log('🔴 AVOID');
      console.log('   Weak fundamentals or unfavorable conditions');
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Research Complete (No Anthropic API used!)');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Set EODHD_API_KEY environment variable');
    console.error('  2. Use DEMO key for: AAPL.US, TSLA.US, EURUSD.FOREX');
    console.error('  3. Use proper format: TICKER.EXCHANGE (e.g., TSLA.US)');
    process.exit(1);
  }
}

const symbol = process.argv[2];
if (!symbol) {
  console.error('Usage: bun cli-research-simple.ts <SYMBOL>');
  console.error('');
  console.error('Examples:');
  console.error('  EODHD_API_KEY=DEMO bun cli-research-simple.ts TSLA.US');
  console.error('  EODHD_API_KEY=DEMO bun cli-research-simple.ts AAPL.US');
  process.exit(1);
}

simpleResearch(symbol);
