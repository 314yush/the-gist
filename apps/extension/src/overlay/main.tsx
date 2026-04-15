import React from 'react';
import ReactDOM from 'react-dom/client';
import OverlayApp from './App';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <OverlayApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
