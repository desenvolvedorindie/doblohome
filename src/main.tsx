import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectProvider } from './context/ProjectContext';
import { SolarProvider } from './context/SolarContext';
import { App } from './App';
import '../css/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProjectProvider>
      <SolarProvider>
        <App />
      </SolarProvider>
    </ProjectProvider>
  </React.StrictMode>
);
