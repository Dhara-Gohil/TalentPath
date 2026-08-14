import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem',
          },
        }}
      />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

