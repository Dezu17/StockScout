import { useEffect, useState } from 'react';
import { Card, Title2, Body1, Button, Spinner } from '@fluentui/react-components';
import { useAuth } from '../AuthenticationContext';
import { getUserWatchlist } from '../watchlist';
import { QuoteCard } from './QuoteCard';
import type { QuoteDto } from '../types';
import '../styles/WatchlistPanel.css';

declare const __API_BASE__: string;

const MAX_VISIBLE_ITEMS = 3;

export const WatchlistPanel: React.FC = () => {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchWatchlistQuotes = async () => {
      if (!token) return;
      try {
        const symbols = await getUserWatchlist(token);
        // Fetch quote data for each symbol
        const quotePromises = symbols.map(async (symbol) => {
          const res = await fetch(`${__API_BASE__}/quote/${encodeURIComponent(symbol)}`);
          if (!res.ok) return null;
          return res.json() as Promise<QuoteDto>;
        });
        const results = await Promise.all(quotePromises);
        setQuotes(results.filter((q): q is QuoteDto => q !== null));
      } catch (error) {
        console.error('Error fetching watchlist quotes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlistQuotes();
  }, [token]);

  const displayedItems = showAll ? quotes : quotes.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = quotes.length > MAX_VISIBLE_ITEMS;

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
              <QuoteCard key={quote.symbol} quote={quote} />
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
