export interface QuoteDto {
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: string;
  volume?: number;
  latestTradingDay?: string;
}
