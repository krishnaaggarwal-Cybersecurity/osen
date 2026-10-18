'use client';

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LoginPage } from './views/LoginPage';
import { OpsLayout } from './components/layout/OpsLayout';
import { DashboardPage } from './views/DashboardPage';
import { DemoPage } from './views/DemoPage';
import { IncidentsPage } from './views/IncidentsPage';
import { IncidentDetailPage } from './views/IncidentDetailPage';
import { MapPage } from './views/MapPage';
import { CamerasPage } from './views/CamerasPage';
import { SettingsPage } from './views/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Operator Route Shell */}
          <Route element={<OpsLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/cameras/:id" element={<CamerasPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
