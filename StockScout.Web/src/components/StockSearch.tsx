import { useState } from 'react';
import {
  Input,
  Button,
  Spinner,
  Card,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  useId,
  Title2,
} from '@fluentui/react-components';
import { QuoteCard } from './QuoteCard';
import type { QuoteDto } from '../types';
import '../styles/StockSearch.css';

declare const __API_BASE__: string;

interface Props {
  onQuoteAdded?: (quote: QuoteDto) => void;
}

export const StockSearch: React.FC<Props> = ({ onQuoteAdded }) => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const toasterId = useId('stock-search-toaster');
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
    <>
      <Toaster toasterId={toasterId} />
      <Card className="searchContainer">
        <Title2>Quote Lookup</Title2>
        <div className="searchFormRow">
          <Input
            value={symbol}
            onChange={(_, v) => setSymbol(v.value.toUpperCase())}
            placeholder="Search a stock symbol"
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
        {quote && <QuoteCard quote={quote} onQuoteAdded={onQuoteAdded} />}
      </Card>
    </>
  );
};
