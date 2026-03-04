import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme, Spinner } from '@fluentui/react-components';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/ChatBot';
import { useAuth } from './AuthenticationContext';
import { useTheme } from './ThemeContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <Spinner label="Loading..." />;
  }

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme}>
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
    </FluentProvider>
  );
};
