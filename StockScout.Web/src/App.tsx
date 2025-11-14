import { useState } from 'react';
import {
  Input,
  Button,
  Spinner,
  makeStyles,
  Title1,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  useId,
} from '@fluentui/react-components';
import { QuoteCard } from './components/QuoteCard';
import type { QuoteDto } from './types';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  formRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
});

export const App: React.FC = () => {
  const styles = useStyles();
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
    <div className={styles.layout}>
      <Toaster toasterId={toasterId} />
      <Title1>StockScout</Title1>
      <div className={styles.formRow}>
        <Input
          value={symbol}
          onChange={(_, v) => setSymbol(v.value.toUpperCase())}
          placeholder="Ticker symbol"
        />
        <Button appearance="primary" onClick={fetchQuote} disabled={!symbol || loading}>
          Get Quote
        </Button>
      </div>
      {loading && <Spinner label="Loading quote" />}
      {quote && <QuoteCard quote={quote} />}
    </div>
  );
};
