import React from 'react';
import ReactDOM from 'react-dom/client';
import { SolarProvider } from './context/SolarContext';
import { App } from './App';
import '../css/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolarProvider>
      <App />
    </SolarProvider>
  </React.StrictMode>
);

