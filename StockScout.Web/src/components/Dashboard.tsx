import React, { useCallback, useEffect, useState } from 'react';
import { Title1 } from '@fluentui/react-components';
import { StockSearch } from './StockSearch';
import { MarketNews } from './MarketNews';
import { WatchlistPanel } from './WatchlistPanel';
import '../styles/Dashboard.css';
import { getUserWatchlist } from '../watchlist';
import { useAuth } from '../AuthenticationContext';
import type { QuoteDto } from '../types';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [pendingQuote, setPendingQuote] = useState<QuoteDto | null>(null);

  const refreshWatchlist = useCallback(() => {
    if (token) {
      getUserWatchlist(token).then(setSymbols);
    }
  }, [token]);

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  const handleQuoteAdded = useCallback((quote: QuoteDto) => {
    // Only pass quote data to WatchlistPanel - it will add locally
    // Don't update symbols here to avoid triggering duplicate fetch
    setPendingQuote(quote);
  }, []);

  const handleSymbolAdded = useCallback((symbol: string) => {
    // Update symbols after WatchlistPanel has added the quote locally
    setSymbols(prev => prev.includes(symbol) ? prev : [...prev, symbol]);
  }, []);

  const clearPendingQuote = useCallback(() => {
    setPendingQuote(null);
  }, []);

  const handleSymbolRemoved = useCallback((symbol: string) => {
    setSymbols(prev => prev.filter(s => s !== symbol));
  }, []);

  return (
    <div className="dashboardContainer">
      <Title1>StockScout</Title1>
      <div className="dashboardLayout">
        <div className="leftPanel">
          <StockSearch onQuoteAdded={handleQuoteAdded} />
          <MarketNews symbols={symbols} loading={newsLoading} setLoading={setNewsLoading} />
        </div>
        <div className="rightPanel">
          <WatchlistPanel
            symbols={symbols}
            loading={watchlistLoading}
            setLoading={setWatchlistLoading}
            pendingQuote={pendingQuote}
            onPendingQuoteConsumed={clearPendingQuote}
            onSymbolRemoved={handleSymbolRemoved}
            onSymbolAdded={handleSymbolAdded}
          />
        </div>
      </div>
    </div>
  );
};
