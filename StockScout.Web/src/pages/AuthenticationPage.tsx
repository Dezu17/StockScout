import React from 'react';
import { AuthenticationForm } from '../components/AuthenticationForm';
import { Title1 } from '@fluentui/react-components';
import './AuthenticationPage.css';

export const AuthenticationPage: React.FC = () => {
  return (
    <div className="authPage">
      <div className="authPageContent">
        <Title1>StockScout</Title1>
        <p className="authPageSubtitle">Sign up or log in to continue.</p>
        <AuthenticationForm />
      </div>
    </div>
  );
};
