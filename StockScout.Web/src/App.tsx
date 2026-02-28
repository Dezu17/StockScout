import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Title1 } from '@fluentui/react-components';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { StockSearch } from './components/StockSearch';
import { Chatbot } from './components/ChatBot';
import { useAuth } from './AuthenticationContext';
import './App.css';
import { MarketNews } from './components/MarketNews';
import { WatchlistPanel } from './components/WatchlistPanel';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const Dashboard: React.FC = () => {
  return (
    <div className="dashboardContainer">
      <Title1>StockScout</Title1>
      <div className="dashboardLayout">
        <div className="leftPanel">
          <StockSearch />
          <MarketNews />
        </div>
        <div className="rightPanel">
          <WatchlistPanel/>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <AuthenticationPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Chatbot />
    </Router>
  );
};
