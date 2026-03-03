import React, { useEffect, useState } from 'react';
import { Title1 } from '@fluentui/react-components';
import { StockSearch } from './StockSearch';
import { MarketNews } from './MarketNews';
import { WatchlistPanel } from './WatchlistPanel';
import '../styles/Dashboard.css';
import { getUserWatchlist } from '../watchlist';
import { useAuth } from '../AuthenticationContext';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getUserWatchlist(token).then(setSymbols);
    }
  }, [token]);

  return (
    <div className="dashboardContainer">
      <Title1>StockScout</Title1>
      <div className="dashboardLayout">
        <div className="leftPanel">
          <StockSearch />
          <MarketNews symbols={symbols} loading={newsLoading} setLoading={setNewsLoading} />
        </div>
        <div className="rightPanel">
          <WatchlistPanel
            symbols={symbols}
            loading={watchlistLoading}
            setLoading={setWatchlistLoading}
          />
        </div>
      </div>
    </div>
  );
};
