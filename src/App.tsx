import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Letters from './pages/Letters';
import Archives from './pages/Archives';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SystemLogs from './pages/SystemLogs';
import Login from './pages/Login';
import PortalGuruWali from './pages/PortalGuruWali';
import Legalisir from './pages/Legalisir';
import ConfirmProvider from './components/ConfirmProvider';
import { applyTheme, getCurrentTheme, THEME_EVENT } from './lib/themeHelper';

// Admin only route guard
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  const userRole = sessionStorage.getItem('userRole');

  if (isAuthenticated && userRole !== 'guru_wali') {
    return <>{children}</>;
  }

  const isGuest = sessionStorage.getItem('isGuestAuthenticated') === 'true' || userRole === 'guru_wali';
  if (isGuest) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    // Apply saved theme on load (default to High Density)
    const savedTheme = localStorage.getItem('themeStyle');
    // If it was forced to 'light' in the previous session causing white screen issue, reset to high-density
    const initialTheme = (!savedTheme || savedTheme === 'light') ? 'high-density' : savedTheme;
    if (savedTheme === 'light') {
      localStorage.setItem('themeStyle', 'high-density');
    }
    applyTheme(initialTheme);

    const scale = localStorage.getItem('uiScale') || '1';
    document.documentElement.style.fontSize = `${16 * Number(scale)}px`;

    const handleThemeChange = (e: any) => {
      const activeTheme = e?.detail?.theme || getCurrentTheme();
      document.body.className = '';
      document.body.classList.add(`theme-${activeTheme}`);
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);

    // Apply resolution
    const resolution = localStorage.getItem('appResolution');
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

    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
    };
  }, []);

  return (
    <ConfirmProvider>
      <HashRouter>
        <Routes>
          {/* PORTAL 1: Layanan Draf Surat Guru & Wali Murid (Halaman Utama saat web dibuka) */}
          <Route path="/" element={<PortalGuruWali />} />
          <Route path="/portal-1" element={<PortalGuruWali />} />
          <Route path="/portal-guru-wali" element={<PortalGuruWali />} />
          <Route path="/ajukan-surat" element={<PortalGuruWali />} />

          {/* LAYANAN LEGALISIR PUBLIK (Siswa, Alumni, Wali Murid) */}
          <Route path="/legalisir" element={<div className="min-h-screen p-4 md:p-8"><Legalisir isAdmin={false} /></div>} />
          <Route path="/legalisir-sekolah" element={<div className="min-h-screen p-4 md:p-8"><Legalisir isAdmin={false} /></div>} />
          <Route path="/lacak-legalisir" element={<div className="min-h-screen p-4 md:p-8"><Legalisir isAdmin={false} /></div>} />

          {/* Autentikasi / Login */}
          <Route path="/login" element={<Login />} />

          {/* PORTAL 2: Admin Tata Usaha & Kearsipan (Akses PIN / Akun Petugas TU) */}
          <Route path="/admin" element={<AdminProtectedRoute><Layout /></AdminProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="letters" element={<Letters />} />
            <Route path="legalisir" element={<Legalisir isAdmin={true} />} />
            <Route path="archives" element={<Archives />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="reports" element={<Reports />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Direct module routes with layout protection */}
          <Route element={<AdminProtectedRoute><Layout /></AdminProtectedRoute>}>
            <Route path="/letters" element={<Letters />} />
            <Route path="/legalisir-admin" element={<Legalisir isAdmin={true} />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/logs" element={<SystemLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Default fallback: Kembali ke Portal 1 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ConfirmProvider>
  );
}
