import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Letters from './pages/Letters';
import Archives from './pages/Archives';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ConfirmProvider from './components/ConfirmProvider';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    // Apply saved theme on load (default to High Density)
    const themeColorRgb = localStorage.getItem('themeColorRgb') || '99, 102, 241';
    const themeColorHex = localStorage.getItem('themeColorHex') || '#818cf8';
    const themeStyle = localStorage.getItem('themeStyle') || 'high-density';
    const resolution = localStorage.getItem('appResolution');
    const scale = localStorage.getItem('uiScale') || '1';
    
    document.documentElement.style.fontSize = `${16 * Number(scale)}px`;
    document.body.className = '';
    document.body.classList.add(`theme-${themeStyle}`);
    
    document.documentElement.style.setProperty('--accent-rgb', themeColorRgb);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${themeColorRgb}, 0.5)`);
    document.documentElement.style.setProperty('--accent-text', themeColorHex);

    // Apply resolution
    if (resolution) {
      const isElectron = navigator.userAgent.toLowerCase().includes('electron') || (typeof window !== 'undefined' && 'require' in window);
      if (isElectron) {
        try {
          // @ts-ignore
          const ipcRenderer = window.require('electron').ipcRenderer;
          if (resolution === 'fullscreen') {
            ipcRenderer.send('set-fullscreen', true);
          } else {
            const [width, height] = resolution.split('x').map(Number);
            ipcRenderer.send('resize-window', width, height);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <ConfirmProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="letters" element={<Letters />} />
            <Route path="archives" element={<Archives />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConfirmProvider>
  );
}
