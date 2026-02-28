import React from 'react';
import { Title1 } from '@fluentui/react-components';
import { StockSearch } from './StockSearch';
import { MarketNews } from './MarketNews';
import { WatchlistPanel } from './WatchlistPanel';
import '../styles/Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboardContainer">
      <Title1>StockScout</Title1>
      <div className="dashboardLayout">
        <div className="leftPanel">
          <StockSearch />
          <MarketNews />
        </div>
        <div className="rightPanel">
          <WatchlistPanel />
        </div>
      </div>
    </div>
  );
};
