import { useEffect, useState } from 'react';
import { Card, Title2, Body1, Button, Spinner } from '@fluentui/react-components';
import { QuoteCard } from './QuoteCard';
import type { QuoteDto } from '../types';
import '../styles/WatchlistPanel.css';

// Uncomment to use real API (requires API key with sufficient quota)
// declare const __API_BASE__: string;

const MAX_VISIBLE_ITEMS = 3;

// Mock quote generator to avoid API rate limits (25/day on free tier)
const createMockQuote = (symbol: string): QuoteDto => ({
  symbol,
  price: Math.round((100 + Math.random() * 400) * 100) / 100,
  open: Math.round((100 + Math.random() * 400) * 100) / 100,
  high: Math.round((100 + Math.random() * 400) * 100) / 100,
  low: Math.round((100 + Math.random() * 400) * 100) / 100,
  previousClose: Math.round((100 + Math.random() * 400) * 100) / 100,
  change: Math.round((Math.random() * 10 - 5) * 100) / 100,
  changePercent: `${(Math.random() * 5 - 2.5).toFixed(2)}%`,
  volume: Math.floor(Math.random() * 50000000),
  latestTradingDay: new Date().toISOString().split('T')[0],
});

interface Props {
  symbols: string[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onWatchlistChange?: () => void;
}

export const WatchlistPanel: React.FC<Props> = ({ symbols, loading, setLoading, onWatchlistChange }) => {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchWatchlistQuotes = async () => {
      if (symbols.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // ===== MOCK DATA (comment out to use real API) =====
        const mockQuotes = symbols.map(createMockQuote);
        setQuotes(mockQuotes);
        // ===== END MOCK DATA =====

        // ===== REAL API (uncomment to use real quotes) =====
        // const quotePromises = symbols.map(async (symbol) => {
        //   const res = await fetch(`${__API_BASE__}/quote/${encodeURIComponent(symbol)}`);
        //   if (!res.ok) return null;
        //   return res.json() as Promise<QuoteDto>;
        // });
        // const results = await Promise.all(quotePromises);
        // setQuotes(results.filter((q): q is QuoteDto => q !== null));
        // ===== END REAL API =====
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlistQuotes();
  }, [symbols, setLoading]);

  // Sort quotes by price (highest to lowest)
  const sortedQuotes = [...quotes].sort((a, b) => b.price - a.price);
  const displayedItems = showAll ? sortedQuotes : sortedQuotes.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = sortedQuotes.length > MAX_VISIBLE_ITEMS;

  return (
    <Card className="watchlistPanel">
      <Title2>My Watchlist</Title2>
      {loading ? (
        <Spinner label="Loading watchlist..." />
      ) : quotes.length === 0 ? (
        <Body1 className="watchlistEmpty">No stocks in your watchlist yet.</Body1>
      ) : (
        <>
          <div className="watchlistItems">
            {displayedItems.map((quote) => (
              <QuoteCard key={quote.symbol} quote={quote} onWatchlistChange={onWatchlistChange} />
            ))}
          </div>
          {hasMore && !showAll && (
            <Button appearance="subtle" onClick={() => setShowAll(true)}>
              See more ({quotes.length - MAX_VISIBLE_ITEMS} more)
            </Button>
          )}
        </>
      )}
    </Card>
  );
};
