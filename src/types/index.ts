export interface CoreData {
  balances: { eur: string; usdc: string };
  rate: string;
  usdcArsRate?: string;
  argCriptoBrokerUsdcArsRate?: string;
  fees: { tradingRate: number };
}

export interface TradeHistoryEntry {
  date: string;
  eur: string;
  savings: string;
  usdcReceived: string;
  serviceFee: string;
  arsAmount?: string;
  eurArsRate?: string;
  eurUsdcRate?: string;
  binanceFeeEur?: string;
  usdcDestAddress?: string;
  ripioFeeArs?: string;
  mode?: 'testnet' | 'prod' | 'unknown';
}
