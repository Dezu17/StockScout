import { createRoot } from 'react-dom/client';
import { AuthProvider } from './AuthenticationContext';
import { ThemeProvider } from './ThemeContext';
import { App } from './App';
import './styles/themes.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
