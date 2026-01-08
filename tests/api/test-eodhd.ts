/**
 * Test script for EODHD API integration
 *
 * Tests the EODHD client with DEMO token to verify:
 * - EOD data fetching
 * - Fundamental data fetching
 * - News/sentiment data fetching
 */

import { EODHDClient } from './src/lib/eodhd-client.ts';

async function testEODHD() {
  console.log('🚀 Testing EODHD API Integration\n');
  console.log('=' .repeat(60));

  const apiKey = process.env.EODHD_API_KEY || 'DEMO';
  console.log(`Using API Key: ${apiKey}\n`);

  const client = new EODHDClient({ apiToken: apiKey });

  // Test 1: Fetch EOD Data for AAPL.US
  console.log('📊 Test 1: Fetching EOD data for AAPL.US...');
  try {
    const eodData = await client.getEODData('AAPL.US');
    console.log(`✅ Success! Retrieved ${eodData.length} candles`);
    console.log(`   Latest: ${eodData[eodData.length - 1].date} - Close: $${eodData[eodData.length - 1].close}`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('');

  // Test 2: Fetch Fundamental Data for TSLA.US
  console.log('📈 Test 2: Fetching fundamental data for TSLA.US...');
  try {
    const fundamentals = await client.getFundamentals('TSLA.US');
    console.log(`✅ Success!`);
    console.log(`   Company: ${fundamentals.General.Name}`);
    console.log(`   Sector: ${fundamentals.General.Sector}`);
    console.log(`   P/E Ratio: ${fundamentals.Highlights.PERatio}`);
    console.log(`   Market Cap: $${(fundamentals.Highlights.MarketCapitalization / 1e9).toFixed(2)}B`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('');

  // Test 3: Fetch News for AAPL.US
  console.log('📰 Test 3: Fetching news for AAPL.US...');
  try {
    const news = await client.getNews('AAPL.US', 5);
    console.log(`✅ Success! Retrieved ${news.length} articles`);
    news.slice(0, 2).forEach((article, i) => {
      console.log(`   ${i + 1}. [${article.sentiment}] ${article.title.substring(0, 60)}...`);
    });
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('');

  console.log('=' .repeat(60));
  console.log('✅ EODHD API integration test complete!\n');
}

// Run the test
testEODHD().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
