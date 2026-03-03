import { useEffect, useState } from 'react';
import { Card, Title2, Body1, Spinner } from '@fluentui/react-components';
import { NewsCard } from './NewsCard';
import type { NewsArticleDto } from '../types';
import '../styles/MarketNews.css';

declare const __API_BASE__: string;

const MAX_ARTICLES = 3;

interface Props {
  symbols: string[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const MarketNews: React.FC<Props> = ({ symbols, loading, setLoading }) => {
  const [articles, setArticles] = useState<NewsArticleDto[]>([]);
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no symbols exist in the user's watchlist, don't fetch news
    if (symbols.length === 0) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchNews = async () => {
      try {
        const symbolsParam = symbols.join(',');
        const res = await fetch(
          `${__API_BASE__}/news?limit=${MAX_ARTICLES}&symbols=${symbolsParam}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: NewsArticleDto[] = await res.json();
        setArticles(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load news';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [symbols, setLoading]);

  return (
    <Card className="marketNewsCard">
      <Title2>Market News</Title2>
      {loading ? (
        <Spinner label="Loading..." />
      ) : error ? (
        <Body1 className="marketNewsError">{error}</Body1>
      ) : articles.length === 0 ? (
        <Body1 className="marketNewsPlaceholder">No news available at the moment.</Body1>
      ) : (
        <div className="marketNewsList">
          {articles.map((article) => (
            <NewsCard key={article.uuid} article={article} />
          ))}
        </div>
      )}
    </Card>
  );
};
