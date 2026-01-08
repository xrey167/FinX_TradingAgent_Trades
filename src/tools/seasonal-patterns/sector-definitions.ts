/**
 * Sector Definitions and Mappings for Event Calendar (Issue #18)
 * Maps economic events to affected market sectors
 */

export type MarketSector =
  | 'all'
  | 'technology'
  | 'financial'
  | 'healthcare'
  | 'consumer-discretionary'
  | 'consumer-staples'
  | 'energy'
  | 'industrial'
  | 'materials'
  | 'real-estate'
  | 'utilities'
  | 'communication'
  | 'cryptocurrency';

export const SECTOR_TICKERS: Record<MarketSector, string[]> = {
  'all': ['SPY', 'DIA', 'IWM', 'VTI'],
  'technology': ['QQQ', 'XLK', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'TSLA'],
  'financial': ['XLF', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C'],
  'healthcare': ['XLV', 'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO'],
  'consumer-discretionary': ['XLY', 'XRT', 'AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
  'consumer-staples': ['XLP', 'PG', 'KO', 'PEP', 'WMT', 'COST', 'PM'],
  'energy': ['XLE', 'XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  'industrial': ['XLI', 'BA', 'CAT', 'GE', 'HON', 'UNP', 'UPS'],
  'materials': ['XLB', 'LIN', 'APD', 'SHW', 'FCX', 'NEM'],
  'real-estate': ['XLRE', 'IYR', 'AMT', 'PLD', 'CCI', 'EQIX'],
  'utilities': ['XLU', 'NEE', 'DUK', 'SO', 'D', 'AEP'],
  'communication': ['XLC', 'GOOGL', 'META', 'DIS', 'NFLX', 'T', 'VZ'],
  'cryptocurrency': ['COIN', 'MSTR', 'RIOT', 'MARA', 'SQ'],
};

export interface SectorImpact {
  sector: MarketSector;
  impact: 'high' | 'medium' | 'low';
  reason?: string;
}

export const EVENT_SECTOR_MAPPING: Record<string, SectorImpact[]> = {
  'CPI Release': [
    { sector: 'all', impact: 'high', reason: 'Inflation affects all sectors and Fed policy expectations' },
  ],
  'NFP Release': [
    { sector: 'all', impact: 'high', reason: 'Employment data affects Fed policy and consumer spending' },
  ],
  'FOMC Meeting': [
    { sector: 'all', impact: 'high', reason: 'Interest rate decisions affect all asset classes' },
  ],
  'Retail Sales Release': [
    { sector: 'consumer-discretionary', impact: 'high', reason: 'Direct measure of consumer spending' },
    { sector: 'consumer-staples', impact: 'medium', reason: 'Indicates consumer health and spending power' },
    { sector: 'financial', impact: 'low', reason: 'Credit card spending indicator' },
  ],
  'Retail-Sales-Week': [
    { sector: 'consumer-discretionary', impact: 'high', reason: 'Direct measure of consumer spending' },
    { sector: 'consumer-staples', impact: 'medium', reason: 'Indicates consumer health' },
  ],
  'Retail-Sales-Day': [
    { sector: 'consumer-discretionary', impact: 'high', reason: 'Direct measure of consumer spending' },
    { sector: 'consumer-staples', impact: 'medium', reason: 'Indicates consumer health' },
  ],
  'ISM Manufacturing PMI': [
    { sector: 'industrial', impact: 'high', reason: 'Direct measure of manufacturing activity' },
    { sector: 'materials', impact: 'high', reason: 'Raw materials demand indicator' },
    { sector: 'technology', impact: 'medium', reason: 'Tech hardware manufacturing' },
    { sector: 'energy', impact: 'low', reason: 'Industrial energy demand' },
  ],
  'ISM-Week': [
    { sector: 'industrial', impact: 'high', reason: 'Manufacturing activity indicator' },
    { sector: 'materials', impact: 'high', reason: 'Raw materials demand' },
    { sector: 'technology', impact: 'medium', reason: 'Tech manufacturing component' },
  ],
  'ISM-Day': [
    { sector: 'industrial', impact: 'high', reason: 'Manufacturing activity indicator' },
    { sector: 'materials', impact: 'high', reason: 'Raw materials demand' },
    { sector: 'technology', impact: 'medium', reason: 'Tech manufacturing component' },
  ],
  'GDP Release': [
    { sector: 'all', impact: 'high', reason: 'Overall economic health indicator' },
  ],
  'Jobless-Claims-Day': [
    { sector: 'all', impact: 'medium', reason: 'Weekly employment indicator' },
    { sector: 'consumer-discretionary', impact: 'medium', reason: 'Employment affects consumer spending' },
  ],
  'Earnings-Season': [
    { sector: 'all', impact: 'medium', reason: 'Corporate earnings affect all sectors' },
  ],
  'Tech Earnings Season': [
    { sector: 'technology', impact: 'high', reason: 'Major tech company earnings' },
    { sector: 'communication', impact: 'medium', reason: 'Tech-related communication companies' },
  ],
  'Options-Expiry-Week': [
    { sector: 'all', impact: 'medium', reason: 'Affects all liquid securities with options' },
  ],
  'Triple-Witching-Week': [
    { sector: 'all', impact: 'high', reason: 'Simultaneous expiration creates volatility across markets' },
  ],
  'Triple-Witching-Day': [
    { sector: 'all', impact: 'high', reason: 'Maximum volatility and volume across all sectors' },
  ],
  'Presidential Election': [
    { sector: 'all', impact: 'high', reason: 'Policy uncertainty affects all markets' },
    { sector: 'healthcare', impact: 'high', reason: 'Healthcare policy uncertainty' },
    { sector: 'energy', impact: 'high', reason: 'Energy policy uncertainty' },
    { sector: 'financial', impact: 'medium', reason: 'Regulatory policy uncertainty' },
  ],
  'Midterm Election': [
    { sector: 'all', impact: 'medium', reason: 'Congressional control affects policy' },
    { sector: 'healthcare', impact: 'medium', reason: 'Healthcare legislation risk' },
    { sector: 'financial', impact: 'low', reason: 'Regulatory changes possible' },
  ],
};

export function getSectorImpacts(eventName: string): SectorImpact[] | null {
  if (EVENT_SECTOR_MAPPING[eventName]) {
    return EVENT_SECTOR_MAPPING[eventName];
  }
  const normalizedName = eventName.toLowerCase().trim();
  for (const [key, impacts] of Object.entries(EVENT_SECTOR_MAPPING)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return impacts;
    }
  }
  return null;
}

export function getEventImpactForSector(
  eventName: string,
  sector: MarketSector
): { impact: 'high' | 'medium' | 'low'; reason?: string } | null {
  const impacts = getSectorImpacts(eventName);
  if (!impacts) return null;
  const allSectorImpact = impacts.find(i => i.sector === 'all');
  if (allSectorImpact) {
    return { impact: allSectorImpact.impact, reason: allSectorImpact.reason };
  }
  const sectorImpact = impacts.find(i => i.sector === sector);
  if (sectorImpact) {
    return { impact: sectorImpact.impact, reason: sectorImpact.reason };
  }
  return null;
}

export function filterEventsBySector(
  events: string[],
  sector: MarketSector,
  minImpact?: 'high' | 'medium' | 'low'
): string[] {
  const impactLevels = { low: 1, medium: 2, high: 3 };
  const threshold = minImpact ? impactLevels[minImpact] : 0;
  return events.filter(eventName => {
    const impact = getEventImpactForSector(eventName, sector);
    if (!impact) return false;
    return impactLevels[impact.impact] >= threshold;
  });
}

export function getTickersForSector(sector: MarketSector): string[] {
  return SECTOR_TICKERS[sector] || [];
}

export function getSectorForTicker(ticker: string): MarketSector | null {
  const normalizedTicker = ticker.toUpperCase().replace('.US', '');
  for (const [sector, tickers] of Object.entries(SECTOR_TICKERS)) {
    if (tickers.some(t => t.toUpperCase().replace('.US', '') === normalizedTicker)) {
      return sector as MarketSector;
    }
  }
  return null;
}

export function analyzeSectorImpact(eventName: string): {
  eventName: string;
  affectedSectors: Array<{
    sector: MarketSector;
    impact: 'high' | 'medium' | 'low';
    reason?: string;
    tickers: string[];
  }>;
  broadMarketImpact: boolean;
} {
  const impacts = getSectorImpacts(eventName) || [];
  const broadMarketImpact = impacts.some(i => i.sector === 'all');
  const affectedSectors = impacts.map(impact => ({
    sector: impact.sector,
    impact: impact.impact,
    reason: impact.reason,
    tickers: getTickersForSector(impact.sector),
  }));
  return {
    eventName,
    affectedSectors,
    broadMarketImpact,
  };
}
