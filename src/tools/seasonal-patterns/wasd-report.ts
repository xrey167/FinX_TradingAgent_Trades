/**
 * WASD Report Generator
 */

export interface WASDReportData {
  symbol: string;
  period: string;
  dataPoints: number;
  timeframe: string;
  weekly: any;
  annual: any;
  seasonal: any;
  daily?: any;
  insights: any[];
}

export function generateWASDReport(analysisResult: any): WASDReportData {
  const {
    symbol,
    period,
    dataPoints,
    timeframe,
    monthlyStats,
    quarterlyStats,
    dayOfWeekStats,
    hourOfDayStats,
  } = analysisResult;

  const rankedDays = [...(dayOfWeekStats || [])].sort((a, b) => b.avgReturn - a.avgReturn);
  const rankedMonths = [...(monthlyStats || [])].sort((a, b) => b.avgReturn - a.avgReturn);
  const rankedQuarters = [...(quarterlyStats || [])].sort((a, b) => b.avgReturn - a.avgReturn);

  return {
    symbol,
    period,
    dataPoints,
    timeframe,
    weekly: {
      best: rankedDays[0],
      worst: rankedDays[rankedDays.length - 1],
      allDays: rankedDays,
    },
    annual: {
      best: rankedMonths[0],
      worst: rankedMonths[rankedMonths.length - 1],
      top3: rankedMonths.slice(0, 3),
      bottom3: rankedMonths.slice(-3).reverse(),
    },
    seasonal: {
      best: rankedQuarters[0],
      worst: rankedQuarters[rankedQuarters.length - 1],
      allQuarters: rankedQuarters,
    },
    insights: [],
  };
}

export function formatWASDReport(report: WASDReportData): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('WASD REPORT: ' + report.symbol + ' (' + report.period + ')');
  lines.push('============================================================');
  lines.push('');
  
  lines.push('WEEKLY PATTERNS:');
  if (report.weekly.best) {
    lines.push('Best Day: ' + report.weekly.best.day + ' (' + report.weekly.best.avgReturn.toFixed(2) + '% avg, ' + report.weekly.best.winRate.toFixed(0) + '% win rate)');
  }
  if (report.weekly.worst) {
    lines.push('Worst Day: ' + report.weekly.worst.day + ' (' + report.weekly.worst.avgReturn.toFixed(2) + '% avg, ' + report.weekly.worst.winRate.toFixed(0) + '% win rate)');
  }
  lines.push('');

  lines.push('ANNUAL PATTERNS:');
  if (report.annual.best) {
    lines.push('Best Month: ' + report.annual.best.month + ' (' + report.annual.best.avgReturn.toFixed(2) + '% avg, ' + report.annual.best.consistency.toFixed(0) + '% consistent)');
  }
  if (report.annual.worst) {
    lines.push('Worst Month: ' + report.annual.worst.month + ' (' + report.annual.worst.avgReturn.toFixed(2) + '% avg, ' + report.annual.worst.consistency.toFixed(0) + '% consistent)');
  }
  lines.push('');

  lines.push('SEASONAL PATTERNS:');
  if (report.seasonal.best) {
    lines.push('Best Quarter: ' + report.seasonal.best.quarter + ' (' + report.seasonal.best.avgReturn.toFixed(2) + '% avg)');
  }
  if (report.seasonal.worst) {
    lines.push('Worst Quarter: ' + report.seasonal.worst.quarter + ' (' + report.seasonal.worst.avgReturn.toFixed(2) + '% avg)');
  }
  lines.push('');

  lines.push('KEY INSIGHTS:');
  if (report.insights.length === 0) {
    lines.push('  No significant patterns detected');
  }
  lines.push('');

  return lines.join('\n');
}
