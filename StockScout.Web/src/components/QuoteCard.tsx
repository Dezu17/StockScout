import { Card, CardHeader, Body1, Caption1, Divider } from '@fluentui/react-components';
import type { QuoteDto } from '../types';
import './QuoteCard.css';

interface Props {
  quote: QuoteDto;
}

export const QuoteCard: React.FC<Props> = ({ quote }) => {
  const change = quote.change ?? 0;
  const isUp = change >= 0;
  const changeClass = isUp ? 'quoteChangePositive' : 'quoteChangeNegative';
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
    </Card>
  );
};
