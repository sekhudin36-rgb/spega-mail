import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mail, 
  Award, 
  Grid, 
  Sparkles, 
  X, 
  Archive, 
  Users, 
  GraduationCap, 
  PieChart, 
  Activity, 
  Settings, 
  Database, 
  Search, 
  LogOut, 
  FilePlus, 
  PlusCircle, 
  Palette, 
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ThemeToggleButton from './ThemeToggleButton';
import AppLogo from './AppLogo';

interface AdminBottomNavProps {
  onOpenCommandPalette: () => void;
  onOpenCanvaModal: () => void;
  onOpenDriveDbModal: () => void;
  onDownloadPdfGuide: () => void;
  isDriveConnected: boolean;
  adminName: string;
}

export default function AdminBottomNav({
  onOpenCommandPalette,
  onOpenCanvaModal,
  onOpenDriveDbModal,
  onDownloadPdfGuide,
  isDriveConnected,
  adminName,
}: AdminBottomNavProps) {
  const navigate = useNavigate();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  return (
    <>
      {/* Sleek Futuristic Mobile Bottom Dock */}
      <nav 
        id="admin-mobile-bottom-dock"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0E1A]/94 backdrop-blur-2xl border-t border-slate-800/90 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom)] print:hidden select-none"
      >
        {/* Subtle Cyber Glow Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent"></div>

        <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
          
          {/* TAB 1: Dasbor */}
          <NavLink
            to="/admin"
            end
            onClick={() => {
              setIsQuickActionOpen(false);
              setIsMenuDrawerOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
                isActive && !isQuickActionOpen && !isMenuDrawerOpen
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isQuickActionOpen && !isMenuDrawerOpen && (
                  <motion.div 
                    layoutId="adminActivePill"
                    className="absolute inset-0 bg-indigo-500/15 rounded-xl border border-indigo-500/30" 
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <LayoutDashboard className="w-5 h-5 mb-0.5 relative z-10" />
                <span className="text-[10px] tracking-tight relative z-10">Dasbor</span>
              </>
            )}
          </NavLink>

          {/* TAB 2: Register Surat */}
          <NavLink
            to="/letters"
            onClick={() => {
              setIsQuickActionOpen(false);
              setIsMenuDrawerOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
                isActive && !isQuickActionOpen && !isMenuDrawerOpen
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isQuickActionOpen && !isMenuDrawerOpen && (
                  <motion.div 
                    layoutId="adminActivePill"
                    className="absolute inset-0 bg-indigo-500/15 rounded-xl border border-indigo-500/30" 
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Mail className="w-5 h-5 mb-0.5 relative z-10" />
                <span className="text-[10px] tracking-tight relative z-10">Surat</span>
              </>
            )}
          </NavLink>

          {/* CENTER HERO HUB: Quick Actions Center */}
          <div className="flex flex-col items-center justify-center -mt-5 relative z-20">
            <button
              type="button"
              id="btn-admin-quick-hub"
              onClick={() => {
                setIsMenuDrawerOpen(false);
                setIsQuickActionOpen(prev => !prev);
              }}
              className="group relative flex flex-col items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-[0_4px_22px_rgba(79,70,229,0.55)] active:scale-90 transition-all duration-200"
              title="Pusat Aksi Cepat Admin TU"
            >
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/40 blur-md group-hover:blur-lg transition-all animate-pulse pointer-events-none"></div>

              <div className={cn(
                "w-full h-full rounded-[14px] flex flex-col items-center justify-center transition-all",
                isQuickActionOpen ? "bg-indigo-700 text-white rotate-45" : "bg-[#0F172A] text-sky-300"
              )}>
                {isQuickActionOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </div>
            </button>
            <span className="text-[9px] font-extrabold text-sky-300 tracking-tight mt-0.5 drop-shadow-sm">
              Aksi Cepat
            </span>
          </div>

          {/* TAB 3: Loket Legalisir */}
          <NavLink
            to="/admin/legalisir"
            onClick={() => {
              setIsQuickActionOpen(false);
              setIsMenuDrawerOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
                isActive && !isQuickActionOpen && !isMenuDrawerOpen
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isQuickActionOpen && !isMenuDrawerOpen && (
                  <motion.div 
                    layoutId="adminActivePill"
                    className="absolute inset-0 bg-indigo-500/15 rounded-xl border border-indigo-500/30" 
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Award className="w-5 h-5 mb-0.5 relative z-10" />
                <span className="text-[10px] tracking-tight relative z-10">Legalisir</span>
              </>
            )}
          </NavLink>

          {/* TAB 4: Menu Lengkap (Modular Sheet) */}
          <button
            type="button"
            id="btn-admin-more-menu"
            onClick={() => {
              setIsQuickActionOpen(false);
              setIsMenuDrawerOpen(prev => !prev);
            }}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
              isMenuDrawerOpen
                ? "text-indigo-300 font-bold bg-indigo-600/20 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Grid className="w-5 h-5 mb-0.5 relative z-10" />
            <span className="text-[10px] tracking-tight relative z-10">Menu</span>
          </button>

        </div>
      </nav>

      {/* Futuristic Center Quick Action Sheet */}
      <AnimatePresence>
        {isQuickActionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsQuickActionOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F172A] border-t border-indigo-500/40 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.95)] max-h-[85vh] overflow-y-auto pb-8 pt-3 px-4 font-sans select-none"
            >
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Aksi Cepat Admin TU</h3>
                    <p className="text-[11px] text-slate-400">Pusat Pintasan Efisiensi Kerja</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                {/* Registrasi Surat Keluar */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    navigate('/letters?tab=outbox');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-indigo-500/40 flex flex-col justify-between gap-3 text-left group active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300">Surat Keluar</div>
                    <div className="text-[10px] text-slate-400">Agenda & Registrasi Nomor</div>
                  </div>
                </button>

                {/* Surat Masuk */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    navigate('/letters?tab=inbox');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/50 border border-emerald-500/40 flex flex-col justify-between gap-3 text-left group active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
                    <FilePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">Surat Masuk</div>
                    <div className="text-[10px] text-slate-400">Pencatatan & Disposisi</div>
                  </div>
                </button>

                {/* Global Search / Spotlight */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950/50 border border-sky-500/40 flex flex-col justify-between gap-3 text-left group active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-600/30 text-sky-300 border border-sky-500/40 flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300">Pencarian Cepat</div>
                    <div className="text-[10px] text-slate-400">Cari Surat, Arsip, Guru</div>
                  </div>
                </button>

                {/* Google Drive Database */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    onOpenDriveDbModal();
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/50 border border-cyan-500/40 flex flex-col justify-between gap-3 text-left group active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center relative">
                    <Database className="w-5 h-5" />
                    {isDriveConnected && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300">Database Drive</div>
                    <div className="text-[10px] text-slate-400">{isDriveConnected ? 'Terhubung Sinkron' : 'Konfigurasi Cloud'}</div>
                  </div>
                </button>
              </div>

              {/* Switch Portal Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-center justify-between group active:scale-95 transition-all"
                  title="Buka Portal 1: Layanan Draf Guru & Wali Murid"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">Portal 1</div>
                      <div className="text-[10px] text-slate-400 truncate">Guru & Wali</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                    Buka
                  </span>
                </Link>

                <Link
                  to="/admin/legalisir"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/40 flex items-center justify-between group active:scale-95 transition-all"
                  title="Buka Portal 2: Layanan Pengesahan & Legalisir Ijazah"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">Portal 2</div>
                      <div className="text-[10px] text-slate-400 truncate">Legalisir</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                    Buka
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Futuristic Comprehensive Menu Drawer Sheet */}
      <AnimatePresence>
        {isMenuDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMenuDrawerOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F172A] border-t border-indigo-500/40 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.95)] max-h-[88vh] overflow-y-auto pb-8 pt-3 px-4 font-sans select-none"
            >
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <AppLogo size="sm" withGlow className="w-8 h-8" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Semua Modul & Pengaturan</h3>
                    <p className="text-[11px] text-slate-400">Portal 3: Admin Tata Usaha • SMPN 3 Kras</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Admin Info */}
              <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{adminName}</div>
                    <div className="text-[10px] text-indigo-300 font-mono">Kepala Tata Usaha</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Keluar</span>
                </button>
              </div>

              {/* Complete Module Links */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                  Master Data & Dokumen
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <NavLink
                    to="/archives"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Arsip Dokumen</div>
                      <div className="text-[10px] text-slate-400 truncate">Berkas digital</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/teachers"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Dewan Guru</div>
                      <div className="text-[10px] text-slate-400 truncate">Data GTK & NIP</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/students"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Peserta Didik</div>
                      <div className="text-[10px] text-slate-400 truncate">NISN & Kelas</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/reports"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Rekapitulasi</div>
                      <div className="text-[10px] text-slate-400 truncate">Laporan & Ekspor</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/logs"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Log Sistem</div>
                      <div className="text-[10px] text-slate-400 truncate">Audit keamanan</div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/settings"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Pengaturan</div>
                      <div className="text-[10px] text-slate-400 truncate">Konfigurasi & PIN</div>
                    </div>
                  </NavLink>
                </div>

                {/* Additional Utilities */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Tema Tampilan</span>
                  <ThemeToggleButton variant="pill" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
