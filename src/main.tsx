import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx'; // Import AuthProvider
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
          <Router>

      <App />
          </Router>

    </AuthProvider>
  </StrictMode>
);
