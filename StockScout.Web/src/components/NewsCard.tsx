import React from 'react';
import { Card, Body1, Caption1, Link } from '@fluentui/react-components';
import type { NewsArticleDto } from '../types';
import '../styles/NewsCard.css';

interface NewsCardProps {
  article: NewsArticleDto;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="newsCard">
      {article.imageUrl && <img src={article.imageUrl} alt="" className="newsCardImage" />}
      <div className="newsCardContent">
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="newsCardTitle"
        >
          {article.title}
        </Link>
        {article.description && (
          <Body1 className="newsCardDescription">{article.description}</Body1>
        )}
        <Caption1 className="newsCardMeta">
          {article.source} • {formattedDate}
        </Caption1>
      </div>
    </Card>
  );
};
