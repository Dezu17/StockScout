import { Card, Title2, Body1 } from '@fluentui/react-components';
import '../styles/MarketNews.css';

export const MarketNews: React.FC = () => {
  return (
    <Card className="marketNewsCard">
      <Title2>Market News</Title2>
      <div className="marketNewsPlaceholder">
        <Body1>News events will appear here.</Body1>
      </div>
    </Card>
  );
};
