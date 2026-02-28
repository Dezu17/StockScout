import { Card, CardHeader, Body1, Caption1, Divider, Button } from '@fluentui/react-components';
import type { QuoteDto } from '../types';
import './QuoteCard.css';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthenticationContext';
import { addToUserWatchlist, getUserWatchlist, removeFromUserWatchlist } from '../watchlist';

interface Props {
  quote: QuoteDto;
}

export const QuoteCard: React.FC<Props> = ({ quote }) => {
  const { token } = useAuth();
  const [isInUserWatchlist, setIsInUserWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = quote.change ?? 0;
  const isUp = change >= 0;
  const changeClass = isUp ? 'quoteChangePositive' : 'quoteChangeNegative';

  // Check if the symbol is in the user's watchlist on mount
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!token) return;
      try {
        const userWatchlist = await getUserWatchlist(token);
        setIsInUserWatchlist(userWatchlist.includes(quote.symbol));
      } catch (error) {
        console.error("Error checking user's watchlist:", error);
      }
    };
    checkWatchlist();
  }, [token, quote.symbol]);

  // Handles user clicks on 'add/remove from user watchlist' button
  const handleToggleUserWatchlist = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isInUserWatchlist) {
        await removeFromUserWatchlist(token, quote.symbol);
        setIsInUserWatchlist(false);
      } else {
        await addToUserWatchlist(token, quote.symbol);
        setIsInUserWatchlist(true);
      }
    } catch (error) {
      console.error("Error updating user's watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="quoteCard">
      <CardHeader
        header={<strong>{quote.symbol}</strong>}
        description={
          quote.latestTradingDay && `As of ${new Date(quote.latestTradingDay).toLocaleDateString()}`
        }
      />
      <div className="quotePrice">{quote.price.toFixed(2)}</div>
      <Body1>
        Open {quote.open?.toFixed(2) ?? '-'} · High {quote.high?.toFixed(2) ?? '-'} · Low{' '}
        {quote.low?.toFixed(2) ?? '-'}
      </Body1>
      <Divider />
      <Body1 className={changeClass}>
        {isUp ? '▲' : '▼'} {change.toFixed(2)} ({quote.changePercent ?? ''})
      </Body1>
      <Caption1>
        Prev Close {quote.previousClose?.toFixed(2) ?? '-'} · Volume{' '}
        {quote.volume?.toLocaleString() ?? '-'}
      </Caption1>
      <Button
        appearance={isInUserWatchlist ? 'secondary' : 'primary'}
        onClick={handleToggleUserWatchlist}
        disabled={loading || !token}
      >
        {isInUserWatchlist ? 'Remove from "My Watchlist"' : 'Add to "My Watchlist"'}
      </Button>
    </Card>
  );
};
