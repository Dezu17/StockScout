import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  Input,
  Button,
  Spinner,
  Title1,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  useId,
} from '@fluentui/react-components';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { QuoteCard } from './components/QuoteCard';
import { Chatbot } from './components/ChatBot';
import { useAuth } from './AuthenticationContext';
import type { QuoteDto } from './types';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const Dashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('MSFT');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  async function fetchQuote() {
    if (!symbol) return;
    setLoading(true);
    setQuote(null);
    try {
      const res = await fetch(`${__API_BASE__}/quote/${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QuoteDto = await res.json();
      setQuote(data);
    } catch (e: unknown) {
      // Narrow the error to extract a message safely
      const message = e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error';
      dispatchToast(
        <Toast appearance="inverted">
          <ToastTitle>Failed to load quote: {message}</ToastTitle>
        </Toast>
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboardContainer">
      <div className="dashboardLayout">
        <Toaster toasterId={toasterId} />
        <Title1>StockScout</Title1>
        <div className="dashboardFormRow">
          <Input
            value={symbol}
            onChange={(_, v) => setSymbol(v.value.toUpperCase())}
            placeholder="Ticker symbol"
            size="large"
          />
          <Button
            appearance="primary"
            onClick={fetchQuote}
            disabled={!symbol || loading}
            size="large"
          >
            Get Quote
          </Button>
        </div>
        {loading && <Spinner label="Loading quote" />}
        {quote && <QuoteCard quote={quote} />}
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
