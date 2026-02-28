import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/ChatBot';
import { useAuth } from './AuthenticationContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <AuthenticationPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Chatbot />
    </Router>
  );
};
