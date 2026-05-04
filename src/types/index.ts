export interface CoreData {
  balances: { eur: string; usdc: string };
  rate: string;
  usdcArsRate?: string;
  nexoUsdcArsRate?: string;
  fees: { tradingRate: number };
}
