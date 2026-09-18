import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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
  ChevronLeft,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  FileDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ToastProvider from './ToastProvider';
import CommandPalette from './CommandPalette';
import CanvaPosterModal from './CanvaPosterModal';
import GoogleDriveDatabaseModal from './GoogleDriveDatabaseModal';
import { getGoogleAccessToken, getGoogleUser } from '../lib/googleDrive';
import { generateFullUserManualPdf } from '../lib/pdfGuideHelper';
import toast from 'react-hot-toast';

export default function Layout() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile/desktop hide
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false);
  const [isDriveDbModalOpen, setIsDriveDbModalOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };
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
    const checkDriveStatus = async () => {
      try {
        const token = await getGoogleAccessToken();
        const user = getGoogleUser();
        setIsDriveConnected(Boolean(token || user));
      } catch (e) {
        setIsDriveConnected(false);
      }
    };
    checkDriveStatus();
    window.addEventListener('driveDatabaseSynced', checkDriveStatus);
    window.addEventListener('googleDriveConfigChanged', checkDriveStatus);
    return () => {
      window.removeEventListener('driveDatabaseSynced', checkDriveStatus);
      window.removeEventListener('googleDriveConfigChanged', checkDriveStatus);
    };
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
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard Admin', badge: 'PORTAL 2' },
    { to: '/letters', icon: Mail, label: 'Register Surat', badge: 'AGENDA' },
    { to: '/', icon: Sparkles, label: 'Portal 1: Guru & Wali', badge: 'PORTAL 1' },
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
          <>
            {/* Mobile Backdrop Overlay for Sidebar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />

            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, width: isSidebarCollapsed ? 72 : 260, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={cn(
                "border-r border-[#1E293B] bg-[#0B0E14]/98 md:bg-[#0B0E14]/95 backdrop-blur-md flex flex-col p-3 gap-3 shrink-0 z-40 md:z-20 print:hidden overflow-hidden transition-all duration-200",
                "fixed inset-y-0 left-0 md:static shadow-2xl md:shadow-none",
                isSidebarCollapsed ? "w-[72px] items-center" : "w-[260px]"
              )}
            >
              {/* Brand Header & Minimize Toggle */}
              <div className={cn(
                "flex items-center pb-3 border-b border-[#1E293B] w-full",
                isSidebarCollapsed ? "justify-center" : "justify-between gap-2"
              )}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/50 border border-indigo-400/30">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0E14]"></span>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0">
                      <h1 className="font-bold text-sm tracking-tight text-white truncate flex items-center gap-1.5">
                        {appName}
                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">PORTAL 2</span>
                      </h1>
                      <p className="text-[11px] text-slate-400 truncate">Dasbor Admin TU • SMPN 3 Kras</p>
                    </div>
                  )}
                </div>

                {/* Close button on mobile / Minimize on desktop */}
                <div className="flex items-center">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
                    title="Tutup Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {!isSidebarCollapsed && (
                    <button
                      onClick={toggleSidebarCollapse}
                      className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                      title="Perkecil / Minimize Menu Sidebar"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 w-full">
                <div>
                  {!isSidebarCollapsed && (
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-2">Modul Persuratan</p>
                  )}
                  <nav className="flex flex-col gap-1 w-full">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        title={isSidebarCollapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center rounded-lg text-xs transition-all duration-150 border group relative',
                            isSidebarCollapsed 
                              ? 'justify-center p-2.5' 
                              : 'justify-between px-3 py-2',
                            isActive
                              ? 'bg-gradient-to-r from-indigo-950/60 to-slate-800 text-white font-semibold border-indigo-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className={cn("flex items-center gap-2.5 truncate", isSidebarCollapsed && "justify-center")}>
                              <item.icon className={cn(
                                "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-indigo-400" : "text-slate-400"
                              )} />
                              {!isSidebarCollapsed && (
                                <span className="truncate">{item.label}</span>
                              )}
                            </div>

                            {!isSidebarCollapsed && item.badge && (
                              <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                                {item.badge}
                              </span>
                            )}

                            {/* Mini Indicator dot for collapsed state */}
                            {isSidebarCollapsed && item.badge && (
                              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </nav>
                </div>

              {/* System / Storage Monitor */}
              {isSidebarCollapsed ? (
                <div 
                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center cursor-help"
                  title="Storage Lokal: Dexie IndexedDB (Terenkripsi & Cepat)"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 animate-pulse"></span>
                </div>
              ) : (
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
              )}
            </div>

            {/* Sidebar Bottom Footer */}
            <div className="space-y-2 pt-2 border-t border-[#1E293B] w-full">
              {/* Expand Toggle button when collapsed */}
              {isSidebarCollapsed && (
                <button
                  onClick={toggleSidebarCollapse}
                  className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-400 hover:text-white transition-all border border-slate-700"
                  title="Perluas / Expand Menu Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}

              {installPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md transition-all",
                    isSidebarCollapsed ? "p-2" : "px-3 py-2"
                  )}
                  title="Instal Aplikasi Desktop / Android PWA"
                >
                  <Download className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Instal Offline</span>}
                </button>
              )}

              <button 
                onClick={() => {
                  sessionStorage.removeItem('isAuthenticated');
                  window.location.reload();
                }}
                className={cn(
                  "w-full flex items-center rounded-lg text-xs font-medium bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/40 transition-all",
                  isSidebarCollapsed ? "justify-center p-2" : "justify-between px-3 py-2"
                )}
                title="Keluar (Logout)"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  {!isSidebarCollapsed && <span>Keluar Sistem</span>}
                </div>
                {!isSidebarCollapsed && <span className="text-[10px] font-mono text-slate-500">Lock</span>}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-hidden print:overflow-visible relative z-10">
        
        {/* Top Header */}
        <header className="h-14 border-b border-[#1E293B] flex items-center justify-between px-4 sm:px-6 bg-[#0F172A]/90 backdrop-blur-md shrink-0 z-20 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  toggleSidebarCollapse();
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isSidebarCollapsed ? "Perluas Menu Sidebar" : "Perkecil / Minimize Menu Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-indigo-400" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white hidden sm:block">
                SPEGA Persuratan & Arsip
              </h2>
              <span className="text-[10px] text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40">
                PORTAL 2: ADMIN TU
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

            {/* Portal 1 Quick Button */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-colors text-xs font-semibold shadow-sm"
              title="Buka Portal 1: Layanan Draf Surat Guru & Wali Murid"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] hidden md:inline">Portal 1: Guru & Wali</span>
            </Link>

            {/* Panduan PDF Manual Button */}
            <button
              onClick={generateFullUserManualPdf}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
              title="Unduh Buku Panduan Lengkap Penggunaan Aplikasi (Format PDF Resmi)"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-medium hidden lg:inline">Panduan PDF</span>
            </button>

            {/* Poster Canva Button */}
            <button
              onClick={() => setIsCanvaModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
              title="Desain Poster & Panduan Canva (Langkah Akses & Nomor Agenda)"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium hidden md:inline">Poster Canva</span>
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

            {/* Google Drive Database Cloud Pill / Button */}
            <button
              onClick={() => setIsDriveDbModalOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all",
                isDriveConnected
                  ? "bg-sky-950/60 hover:bg-sky-900/70 border-sky-500/40 text-sky-300"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white"
              )}
              title="Database Google Drive (Pusat Sinkronisasi & Cadangan Cloud)"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Database Drive</span>
              {isDriveConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" title="Google Drive Terhubung"></span>
              )}
            </button>

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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 md:pb-6 print:overflow-visible print:p-0 relative custom-scrollbar">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation Dock */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.6)] print:hidden">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-[10px] font-medium min-w-[54px]",
                isActive ? "text-indigo-400 font-bold bg-indigo-500/10" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dasbor</span>
          </NavLink>

          <NavLink
            to="/letters"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-[10px] font-medium min-w-[54px]",
                isActive ? "text-indigo-400 font-bold bg-indigo-500/10" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <Mail className="w-4 h-4 mb-0.5" />
            <span>Surat</span>
          </NavLink>

          {/* Highlighted Portal 1 Quick Switch */}
          <Link
            to="/"
            className="flex flex-col items-center justify-center -mt-4 py-1.5 px-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/70 border border-emerald-400/40 min-w-[62px] active:scale-95 transition-transform"
            title="Buka Portal 1: Layanan Guru & Wali Murid"
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-amber-200" />
            <span className="text-[10px] font-bold">Portal 1</span>
          </Link>

          <NavLink
            to="/archives"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-[10px] font-medium min-w-[54px]",
                isActive ? "text-indigo-400 font-bold bg-indigo-500/10" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <Archive className="w-4 h-4 mb-0.5" />
            <span>Arsip</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-[10px] font-medium min-w-[54px]",
              isSidebarOpen ? "text-indigo-400 font-bold bg-indigo-500/10" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>Menu</span>
          </button>
        </nav>

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

      {/* Canva Poster & Guide Modal */}
      <CanvaPosterModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
      />

      {/* Google Drive Cloud Database Modal */}
      <GoogleDriveDatabaseModal
        isOpen={isDriveDbModalOpen}
        onClose={() => setIsDriveDbModalOpen(false)}
      />
    </div>
  );
}
