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
  pendingQuote?: QuoteDto | null;
  onPendingQuoteConsumed?: () => void;
  onSymbolRemoved?: (symbol: string) => void;
  onSymbolAdded?: (symbol: string) => void;
}

export const WatchlistPanel: React.FC<Props> = ({
  symbols,
  loading,
  setLoading,
  pendingQuote,
  onPendingQuoteConsumed,
  onSymbolRemoved,
  onSymbolAdded,
}) => {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [fetchedSymbols, setFetchedSymbols] = useState<Set<string>>(new Set());

  // Fetch quotes only for symbols we haven't fetched yet
  useEffect(() => {
    const newSymbols = symbols.filter((s) => !fetchedSymbols.has(s));

    if (newSymbols.length === 0) {
      if (symbols.length === 0) {
        setQuotes([]);
      }
      setLoading(false);
      return;
    }

    const fetchNewQuotes = async () => {
      setLoading(true);
      try {
        // ===== MOCK DATA (comment out to use real API) =====
        const newQuotes = newSymbols.map(createMockQuote);
        setQuotes((prev) => [...prev, ...newQuotes]);
        // ===== END MOCK DATA =====

        // ===== REAL API (uncomment to use real quotes) =====
        // const quotePromises = newSymbols.map(async (symbol) => {
        //   const res = await fetch(`${__API_BASE__}/quote/${encodeURIComponent(symbol)}`);
        //   if (!res.ok) return null;
        //   return res.json() as Promise<QuoteDto>;
        // });
        // const results = await Promise.all(quotePromises);
        // setQuotes(prev => [...prev, ...results.filter((q): q is QuoteDto => q !== null)]);
        // ===== END REAL API =====

        setFetchedSymbols((prev) => new Set([...prev, ...newSymbols]));
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewQuotes();
  }, [symbols, setLoading, fetchedSymbols]);

  // Reuse existing quote data from stock search component
  useEffect(() => {
    if (pendingQuote && !quotes.some((q) => q.symbol === pendingQuote.symbol)) {
      setQuotes((prev) => [...prev, pendingQuote]);
      setFetchedSymbols((prev) => new Set([...prev, pendingQuote.symbol]));
      onSymbolAdded?.(pendingQuote.symbol); // Update symbols in Dashboard
      onPendingQuoteConsumed?.();
    }
  }, [pendingQuote, quotes, onPendingQuoteConsumed, onSymbolAdded]);

  // Handle local removal of a quote
  const handleSymbolRemoved = (symbol: string) => {
    setQuotes((prev) => prev.filter((q) => q.symbol !== symbol));
    setFetchedSymbols((prev) => {
      const next = new Set(prev);
      next.delete(symbol);
      return next;
    });
    onSymbolRemoved?.(symbol);
  };

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
              <QuoteCard key={quote.symbol} quote={quote} onSymbolRemoved={handleSymbolRemoved} />
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
