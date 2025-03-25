// main.jsx or index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App';
import './index.css';
import { config } from './config';

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/** ... */}
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);