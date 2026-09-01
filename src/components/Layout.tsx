import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Users, 
  GraduationCap, 
  LayoutDashboard, 
  Wifi, 
  WifiOff, 
  Menu, 
  X, 
  Settings, 
  PieChart, 
  Archive, 
  Download, 
  Search, 
  Sparkles,
  Bell,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
  Database,
  Calendar,
  LogOut,
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ToastProvider from './ToastProvider';
import CommandPalette from './CommandPalette';
import toast from 'react-hot-toast';

export default function Layout() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const getStoredAdminName = () => {
    const saved = localStorage.getItem('adminName');
    if (!saved || saved.toLowerCase().includes('sekhudin')) {
      return 'Admin';
    }
    return saved;
  };

  const [adminName, setAdminName] = useState(getStoredAdminName);
  const [appName, setAppName] = useState(localStorage.getItem('appName') || 'SPEGA MAIL');
  const [schoolName, setSchoolName] = useState(localStorage.getItem('schoolName') || 'SMP Negeri 3 Kras');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, title: 'Engine Persuratan Aktif', time: 'Baru saja', desc: 'Dexie IndexedDB lokal siap melayani register', unread: true },
    { id: 2, title: 'Verifikasi Naskah Digital', time: '10m lalu', desc: 'QR Code validator siap untuk semua draf surat', unread: true },
    { id: 3, title: 'Buku Agenda Otomatis', time: '1 jam lalu', desc: 'Penomoran otomatis surat keluar aktif', unread: false },
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      toast.success('Aplikasi SPEGA MAIL berhasil diinstal di perangkat Anda!');
    }
  };
  
  useEffect(() => {
    const handleStorageChange = () => {
      setAdminName(getStoredAdminName());
      setAppName(localStorage.getItem('appName') || 'SPEGA MAIL');
      setSchoolName(localStorage.getItem('schoolName') || 'SMP Negeri 3 Kras');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Koneksi internet terhubung kembali');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('Mode Offline Aktif. Basis data lokal tetap berfungsi penuh.', { icon: '📡' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close notifications when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: 'LIVE' },
    { to: '/letters', icon: Mail, label: 'Register Surat', badge: 'AGENDA' },
    { to: '/archives', icon: Archive, label: 'Arsip Dokumen', badge: null },
    { to: '/teachers', icon: Users, label: 'Data Dewan Guru', badge: null },
    { to: '/students', icon: GraduationCap, label: 'Data Peserta Didik', badge: null },
    { to: '/reports', icon: PieChart, label: 'Rekapitulasi & Agenda', badge: null },
    { to: '/logs', icon: Activity, label: 'Log Sistem', badge: 'AUDIT' },
    { to: '/settings', icon: Settings, label: 'Konfigurasi Sistem', badge: null },
  ];

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible relative bg-[#0B0E14] text-[#E2E8F0] font-sans">
      {/* Background Ambient Grid Glow */}
      <div className="fixed inset-0 bg-tech-grid opacity-30 pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[260px] border-r border-[#1E293B] bg-[#0B0E14]/95 backdrop-blur-md flex flex-col p-4 gap-4 shrink-0 z-20 print:hidden overflow-hidden"
          >
            {/* Brand Header */}
            <div className="flex items-center gap-3 pb-3.5 border-b border-[#1E293B]">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/50 border border-indigo-400/30">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0E14]"></span>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm tracking-tight text-white truncate flex items-center gap-1.5">
                  {appName}
                  <span className="text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/30">v3.0</span>
                </h1>
                <p className="text-[11px] text-slate-400 truncate">SMPN 3 Kras Kediri</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-2">Modul Persuratan</p>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 border',
                          isActive
                            ? 'bg-gradient-to-r from-indigo-950/60 to-slate-800 text-white font-semibold border-indigo-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>

              {/* System / Storage Monitor */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Database className="w-3 h-3 text-indigo-400" />
                    Storage Lokal
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">TERENKRIPSI</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 w-[65%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Dexie IndexedDB</span>
                  <span className="text-slate-300">Aman & Cepat</span>
                </div>
              </div>
            </div>

            {/* Sidebar Bottom Footer */}
            <div className="space-y-2 pt-2 border-t border-[#1E293B]">
              {installPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md transition-all"
                  title="Instal Aplikasi Desktop / Android PWA"
                >
                  <Download className="w-3.5 h-3.5" />
                  Instal Aplikasi Offline
                </button>
              )}

              <button 
                onClick={() => {
                  sessionStorage.removeItem('isAuthenticated');
                  window.location.reload();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/40 transition-all"
                title="Keluar (Logout)"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Keluar Sistem</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Lock</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-hidden print:overflow-visible relative z-10">
        
        {/* Top Header */}
        <header className="h-14 border-b border-[#1E293B] flex items-center justify-between px-4 sm:px-6 bg-[#0F172A]/90 backdrop-blur-md shrink-0 z-20 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Sembunyikan / Tampilkan Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white hidden sm:block">
                SPEGA Persuratan & Arsip
              </h2>
              <span className="text-[10px] text-indigo-300 font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30">
                SMPN 3 KRAS
              </span>
            </div>

            {/* Quick Spotlight Search Launcher */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-slate-200 text-xs transition-all ml-3 shadow-inner"
              title="Buka Global Search (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cari surat, arsip, guru...</span>
              <kbd className="ml-2 px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-slate-400 shadow-sm">
                Ctrl K
              </kbd>
            </button>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
              title="Cari Cepat"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                      <span className="text-xs font-bold text-white">Notifikasi Sistem</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">3 Info</span>
                    </div>
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-left transition-colors">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-500">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{n.desc}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80 shadow-sm">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]")}></span>
              <span className={cn("font-mono text-[11px] font-semibold", isOnline ? "text-emerald-400" : "text-rose-400")}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>

            {/* Live Clock */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs text-white font-mono font-bold">
                {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(currentTime).replace(/\./g, ':')} WIB
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(currentTime)}
              </span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{adminName}</p>
                <p className="text-[10px] text-indigo-400 font-mono">Kepala TU</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 border border-indigo-400/40 flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0 relative custom-scrollbar">
          <Outlet />
        </div>

        {/* High Density Footer */}
        <footer className="h-9 bg-[#0B0E14] border-t border-slate-800/80 px-6 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-mono print:hidden">
          <div className="flex gap-4 items-center">
            <span className="text-slate-400">NODE: SMPN3-KRAS-KDR</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">PWA READY</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">STORAGE: INDEXEDDB</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span className="text-slate-300">INTEGRITY 100%</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
              <span className="text-slate-300">SPEGA MAIL v3</span>
            </div>
          </div>
        </footer>
      </main>
      
      {/* Global Spotlight Search Mount */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ToastProvider />
    </div>
  );
}
