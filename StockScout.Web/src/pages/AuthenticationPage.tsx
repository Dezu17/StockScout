import React from 'react';
import { AuthenticationForm } from '../components/AuthenticationForm';
import { Title1 } from '@fluentui/react-components';

export const AuthenticationPage: React.FC = () => {
  return (
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        alignItems: 'flex-start',
      }}
    >
      <Title1>StockScout</Title1>
      <p style={{ margin: 0 }}>Sign up or log in to continue.</p>
      <AuthenticationForm />
    </div>
  );
};
