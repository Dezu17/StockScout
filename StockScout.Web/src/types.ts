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

export interface WatchlistItemDto {
  symbol: string;
}

export interface NewsArticleDto {
  uuid: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
}
