import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AuthGate } from './components/auth/AuthScreen';
import { ProjectProvider } from './context/ProjectContext';
import { SolarProvider } from './context/SolarContext';
import { App } from './App';
import '../css/style.css';
import '../css/auth.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <ProjectProvider>
          <SolarProvider>
            <App />
          </SolarProvider>
        </ProjectProvider>
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>
);
