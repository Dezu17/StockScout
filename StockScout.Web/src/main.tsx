import { createRoot } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from './AuthenticationContext';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <FluentProvider theme={webLightTheme}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </FluentProvider>
);
