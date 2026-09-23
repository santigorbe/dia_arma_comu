import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { HomePage } from './features/public/HomePage';
import { MapPage } from './features/public/MapPage';
import { PublicShell } from './features/public/PublicShell';
import { RegisterPage } from './features/public/RegisterPage';
import { SchedulePage } from './features/public/SchedulePage';
import { VisitProvider } from './features/visits/VisitProvider';
import { AdminRoutes } from './features/admin/AdminApp';
import './styles/index.css';

export function App() { return <BrowserRouter><AdminRoutes /><Routes><Route element={<PublicShell />}><Route path="/" element={<HomePage />} /><Route path="/cronograma" element={<SchedulePage />} /><Route path="/mapa" element={<MapPage />} /><Route path="/register" element={<RegisterPage />} /></Route></Routes></BrowserRouter>; }

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <VisitProvider>
        <App />
      </VisitProvider>
    </React.StrictMode>
  );
}
