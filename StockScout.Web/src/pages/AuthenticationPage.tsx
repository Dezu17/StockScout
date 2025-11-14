import React, { useEffect } from 'react';
import { useAuth } from '../AuthenticationContext';
import { useNavigate } from 'react-router-dom';
import { AuthenticationForm } from '../components/AuthenticationForm';
import { Title1 } from '@fluentui/react-components';

export const AuthenticationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
