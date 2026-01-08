/**
 * Research Orchestrator Wrapper
 *
 * Coordinates the autonomous research loop using AgentRunner interface.
 * Works with both Real (Anthropic API) and Mock (rule-based) agents.
 *
 * Flow: Planning → Action → Validation → Answer (with iteration support)
 *
 * Inspired by: dexter's autonomous research architecture
 */

import type { AgentRunner, AgentContext, AgentResponse } from './agent-wrapper.ts';
import { EODHDClient } from './eodhd-client.ts';

export interface ResearchRequest {
  question: string;
  symbol: string;
  maxIterations?: number;
}

export interface ResearchResult {
  answer: string;
  metadata: {
    iterations: number;
    confidence: number;
    recommendation?: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
    validationDecision: 'APPROVED' | 'NEEDS_MORE_WORK' | 'INSUFFICIENT';
  };
  steps: {
    planning: string;
    execution: string;
    validation: string;
    answer: string;
  };
}

/**
 * Research Orchestrator
 * Manages the autonomous research loop
 */
export class ResearchOrchestrator {
  private agentRunner: AgentRunner;
  private eodhClient: EODHDClient;
  private verbose: boolean;

  constructor(agentRunner: AgentRunner, eodhClient: EODHDClient, verbose = false) {
    this.agentRunner = agentRunner;
    this.eodhClient = eodhClient;
    this.verbose = verbose;
  }

  /**
   * Run autonomous research
   */
  async research(request: ResearchRequest): Promise<ResearchResult> {
    const { question, symbol, maxIterations = 3 } = request;

    if (this.verbose) {
      console.log('🔍 Starting Autonomous Research');
      console.log(`   Question: ${question}`);
      console.log(`   Symbol: ${symbol}`);
      console.log('');
    }

    // Phase 1: Planning
    if (this.verbose) console.log('📋 Phase 1: Planning...');
    const planningContext: AgentContext = { question, symbol };
    const planningResponse = await this.agentRunner.runPlanningAgent(planningContext);
    if (this.verbose) {
      console.log('✅ Research plan created');
      console.log('');
    }

    // Fetch data for the symbol
    if (this.verbose) console.log('📊 Fetching financial data...');
    const fundamentals = await this.eodhClient.getFundamentals(symbol);
    const news = await this.eodhClient.getNews(symbol, 10);

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
    const sentimentScore =
      totalArticles > 0
        ? ((sentimentCounts.positive - sentimentCounts.negative) / totalArticles) * 100
        : 0;

    const sentiment = {
      sentiment_score: sentimentScore,
      total_articles: totalArticles,
      positive_count: sentimentCounts.positive,
      negative_count: sentimentCounts.negative,
      neutral_count: sentimentCounts.neutral,
      recent_articles: news,
    };

    // Extract key fundamentals
    const highlights = fundamentals.Highlights || {};
    const valuation = fundamentals.Valuation || {};

    // Calculate debt/equity and current ratio from balance sheet (most recent quarter)
    const balanceSheetQuarterly = fundamentals.Financials?.Balance_Sheet?.quarterly || {};
    const mostRecentQuarter = Object.keys(balanceSheetQuarterly)[0];
    const recentBalanceSheet = mostRecentQuarter ? balanceSheetQuarterly[mostRecentQuarter] : null;

    const fundamentalsData = {
      company_name: fundamentals.General?.Name,
      sector: fundamentals.General?.Sector,
      industry: fundamentals.General?.Industry,
      market_cap: highlights.MarketCapitalization,
      pe_ratio: highlights.PERatio,
      pb_ratio: valuation.PriceBookMRQ,
      peg_ratio: highlights.PEGRatio,
      roe: highlights.ReturnOnEquityTTM,
      roa: highlights.ReturnOnAssetsTTM,
      net_margin: highlights.ProfitMargin,
      operating_margin: highlights.OperatingMarginTTM,
      debt_equity: recentBalanceSheet
        ? recentBalanceSheet.totalLiab / recentBalanceSheet.totalStockholderEquity
        : undefined,
      current_ratio: recentBalanceSheet
        ? recentBalanceSheet.totalCurrentAssets / recentBalanceSheet.totalCurrentLiabilities
        : undefined,
    };

    if (this.verbose) {
      console.log('✅ Data fetched successfully');
      console.log('');
    }

    let iteration = 1;
    let validationDecision: 'APPROVED' | 'NEEDS_MORE_WORK' | 'INSUFFICIENT' | undefined;
    let actionResponse: AgentResponse;
    let validationResponse: AgentResponse;

    // Iterative research loop
    while (iteration <= maxIterations && validationDecision !== 'APPROVED') {
      if (this.verbose) {
        console.log(`🔄 Iteration ${iteration}/${maxIterations}`);
        console.log('');
      }

      // Phase 2: Action (Execution)
      if (this.verbose) console.log('⚙️  Phase 2: Executing research tasks...');
      const actionContext: AgentContext = {
        question,
        symbol,
        plan: planningResponse.content,
        fundamentals: fundamentalsData,
        sentiment,
      };
      actionResponse = await this.agentRunner.runActionAgent(actionContext);
      if (this.verbose) {
        console.log('✅ Research tasks executed');
        console.log('');
      }

      // Phase 3: Validation
      if (this.verbose) console.log('✔️  Phase 3: Validating research quality...');
      const validationContext: AgentContext = {
        question,
        symbol,
        plan: planningResponse.content,
        executionResults: actionResponse.content,
        fundamentals: fundamentalsData,
        sentiment,
      };
      validationResponse = await this.agentRunner.runValidationAgent(validationContext);
      validationDecision = validationResponse.metadata?.decision || 'NEEDS_MORE_WORK';

      if (this.verbose) {
        console.log(`✅ Validation complete: ${validationDecision}`);
        console.log('');
      }

      if (validationDecision === 'APPROVED') {
        break;
      } else if (validationDecision === 'INSUFFICIENT') {
        if (this.verbose) {
          console.log('❌ Research insufficient - cannot answer question');
          console.log('');
        }
        break;
      } else {
        // NEEDS_MORE_WORK
        if (iteration < maxIterations) {
          if (this.verbose) {
            console.log('⚠️  Additional work needed, continuing...');
            console.log('');
          }
        }
      }

      iteration++;
    }

    // Phase 4: Synthesis
    if (this.verbose) {
      console.log('📝 Phase 4: Synthesizing final answer...');
    }

    const answerContext: AgentContext = {
      question,
      symbol,
      plan: planningResponse.content,
      executionResults: actionResponse!.content,
      validationReport: validationResponse!.content,
      fundamentals: fundamentalsData,
      sentiment,
      allResearchData: {
        fundamentals: fundamentalsData,
        sentiment,
      },
    };

    const answerResponse = await this.agentRunner.runAnswerAgent(answerContext);

    if (this.verbose) {
      console.log('✅ Final answer generated');
      console.log('');
    }

    return {
      answer: answerResponse.content,
      metadata: {
        iterations: iteration,
        confidence: answerResponse.metadata?.confidence || 0.5,
        recommendation: answerResponse.metadata?.recommendation,
        validationDecision: validationDecision || 'APPROVED',
      },
      steps: {
        planning: planningResponse.content,
        execution: actionResponse!.content,
        validation: validationResponse!.content,
        answer: answerResponse.content,
      },
    };
  }
}
