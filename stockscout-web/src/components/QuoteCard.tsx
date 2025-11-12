import { Card, CardHeader, Body1, Caption1, Divider, makeStyles, tokens } from '@fluentui/react-components';
import type { QuoteDto } from '../types';

const useStyles = makeStyles({
  price: { fontSize: '2rem', fontWeight: 600 },
  changePos: { color: tokens.colorStatusSuccessForeground1 },
  changeNeg: { color: tokens.colorStatusDangerForeground1 }
});

interface Props { quote: QuoteDto; }

export const QuoteCard: React.FC<Props> = ({ quote }) => {
  const styles = useStyles();
  const change = quote.change ?? 0;
  const isUp = change >= 0;
  const changeClass = isUp ? styles.changePos : styles.changeNeg;
  return (
    <Card style={{ maxWidth: 420 }}>
      <CardHeader header={<strong>{quote.symbol}</strong>} description={quote.latestTradingDay && `As of ${new Date(quote.latestTradingDay).toLocaleDateString()}`} />
      <div className={styles.price}>{quote.price.toFixed(2)}</div>
      <Body1>
        Open {quote.open?.toFixed(2) ?? '-'} · High {quote.high?.toFixed(2) ?? '-'} · Low {quote.low?.toFixed(2) ?? '-'}
      </Body1>
      <Divider />
      <Body1 className={changeClass}>
        {isUp ? '▲' : '▼'} {change.toFixed(2)} ({quote.changePercent ?? ''})
      </Body1>
      <Caption1>Prev Close {quote.previousClose?.toFixed(2) ?? '-'} · Volume {quote.volume?.toLocaleString() ?? '-'}</Caption1>
    </Card>
  );
};
