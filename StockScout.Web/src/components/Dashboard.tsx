import React, { useCallback, useEffect, useState } from 'react';
import { DataTrending24Filled, WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons';
import { StockSearch } from './StockSearch';
import { MarketNews } from './MarketNews';
import { WatchlistPanel } from './WatchlistPanel';
import '../styles/Dashboard.css';
import { getUserWatchlist } from '../watchlist';
import { useAuth } from '../AuthenticationContext';
import { useTheme } from '../ThemeContext';
import type { QuoteDto } from '../types';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    setSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
  }, []);

  const clearPendingQuote = useCallback(() => {
    setPendingQuote(null);
  }, []);

  const handleSymbolRemoved = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  }, []);

  return (
    <div className="dashboardContainer">
      <button
        className="themeToggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
      </button>
      <header className="dashboardHeader">
        <div className="dashboardLogo">
          <DataTrending24Filled />
        </div>
        <h1 className="dashboardTitle">StockScout</h1>
        <p className="dashboardTagline">Track. Analyze. Invest.</p>
      </header>
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
