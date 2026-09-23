import React, { useState } from 'react';
import { 
  FilePlus, 
  Hash, 
  Clock, 
  Sparkles, 
  Grid, 
  X, 
  Award, 
  FileDown, 
  Palette, 
  Lock, 
  LogOut, 
  User, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ThemeToggleButton from './ThemeToggleButton';
import SecretAdminMarker from './SecretAdminTrigger';
import AppLogo from './AppLogo';

interface PortalBottomNavProps {
  activeTab: 'buat_draf' | 'riwayat' | 'registrasi_agenda';
  setActiveTab: (tab: 'buat_draf' | 'riwayat' | 'registrasi_agenda') => void;
  myLettersCount: number;
  nextAgendaNumber: string;
  onOpenQuickAgenda: () => void;
  onOpenCanvaModal: () => void;
  onOpenAdminPin: () => void;
  onDownloadPdfGuide: () => void;
  userName: string;
  userRole: 'guru' | 'wali';
  onLogout: () => void;
}

export default function PortalBottomNav({
  activeTab,
  setActiveTab,
  myLettersCount,
  nextAgendaNumber,
  onOpenQuickAgenda,
  onOpenCanvaModal,
  onOpenAdminPin,
  onDownloadPdfGuide,
  userName,
  userRole,
  onLogout,
}: PortalBottomNavProps) {
  const navigate = useNavigate();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleTabSelect = (tab: 'buat_draf' | 'riwayat' | 'registrasi_agenda') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Futuristic Mobile Bottom Navigation Bar (md:hidden) */}
      <nav 
        id="portal-mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0E1A]/92 backdrop-blur-2xl border-t border-slate-800/80 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom)] print:hidden select-none"
      >
        {/* Subtle Futuristic Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent"></div>

        <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
          
          {/* TAB 1: Buat Draf */}
          <button
            type="button"
            id="btn-tab-buat-draf"
            onClick={() => handleTabSelect('buat_draf')}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
              activeTab === 'buat_draf' && !isMoreMenuOpen
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {activeTab === 'buat_draf' && !isMoreMenuOpen && (
              <motion.div 
                layoutId="portalActivePill"
                className="absolute inset-0 bg-indigo-500/15 rounded-xl border border-indigo-500/30" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <FilePlus className="w-5 h-5 mb-0.5 relative z-10" />
            <span className="text-[10px] tracking-tight relative z-10">Buat Draf</span>
          </button>

          {/* TAB 2: Buku Agenda */}
          <button
            type="button"
            id="btn-tab-buku-agenda"
            onClick={() => handleTabSelect('registrasi_agenda')}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
              activeTab === 'registrasi_agenda' && !isMoreMenuOpen
                ? "text-sky-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {activeTab === 'registrasi_agenda' && !isMoreMenuOpen && (
              <motion.div 
                layoutId="portalActivePill"
                className="absolute inset-0 bg-sky-500/15 rounded-xl border border-sky-500/30" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <div className="relative">
              <Hash className="w-5 h-5 mb-0.5 relative z-10" />
              {nextAgendaNumber && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-sky-500 text-slate-950 font-mono text-[9px] font-black z-10 shadow-sm">
                  #{nextAgendaNumber}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight relative z-10">Agenda</span>
          </button>

          {/* CENTER HERO HUB: Fast Action - Ambil Nomor Agenda Instan */}
          <div className="flex flex-col items-center justify-center -mt-5 relative z-20">
            <button
              type="button"
              id="btn-hero-ambil-nomor"
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenQuickAgenda();
              }}
              className="group relative flex flex-col items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-sky-500 p-[1.5px] shadow-[0_4px_20px_rgba(79,70,229,0.5)] active:scale-90 transition-all duration-200"
              title="Minta Nomor Agenda Cepat (Instan 10 Detik)"
            >
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/40 blur-md group-hover:blur-lg transition-all animate-pulse pointer-events-none"></div>

              <div className="w-full h-full rounded-[14px] bg-[#0F172A] flex flex-col items-center justify-center transition-colors group-hover:bg-[#131C31]">
                <Sparkles className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </div>
            </button>
            <span className="text-[9px] font-extrabold text-amber-300 tracking-tight mt-0.5 drop-shadow-sm">
              Minta No.
            </span>
          </div>

          {/* TAB 3: Riwayat / Draf Saya */}
          <button
            type="button"
            id="btn-tab-riwayat-draf"
            onClick={() => handleTabSelect('riwayat')}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
              activeTab === 'riwayat' && !isMoreMenuOpen
                ? "text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {activeTab === 'riwayat' && !isMoreMenuOpen && (
              <motion.div 
                layoutId="portalActivePill"
                className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <div className="relative">
              <Clock className="w-5 h-5 mb-0.5 relative z-10" />
              {myLettersCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] z-10 shadow-sm">
                  {myLettersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight relative z-10">Riwayat</span>
          </button>

          {/* TAB 4: Menu Layanan Lainnya (Futuristic Drawer Trigger) */}
          <button
            type="button"
            id="btn-tab-menu-layanan"
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[60px] relative active:scale-95",
              isMoreMenuOpen
                ? "text-indigo-300 font-bold bg-indigo-600/20 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Grid className="w-5 h-5 mb-0.5 relative z-10" />
            <span className="text-[10px] tracking-tight relative z-10">Layanan</span>
          </button>

        </div>
      </nav>

      {/* Futuristic Bottom Sheet Drawer for "Layanan Lainnya" */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMoreMenuOpen(false)}
            />

            {/* Bottom Sheet Modal Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F172A] border-t border-indigo-500/30 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto pb-8 pt-3 px-4 font-sans select-none"
            >
              {/* Sheet Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <AppLogo size="sm" withGlow className="w-8 h-8" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Menu & Layanan Mandiri</h3>
                    <p className="text-[11px] text-slate-400">SMP Negeri 3 Kras • Portal 1</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{userName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Sesi {userRole === 'guru' ? 'Guru & Tendik' : 'Wali Murid'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Keluar</span>
                </button>
              </div>

              {/* Grid Menu Items */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                  Layanan & Fasilitas
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Legalisir Ijazah */}
                  <Link
                    to="/legalisir"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/40 border border-indigo-500/30 flex flex-col justify-between gap-2 text-left group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300">Portal 2: Legalisir</div>
                      <div className="text-[10px] text-slate-400">Pengesahan Ijazah & Raport</div>
                    </div>
                  </Link>

                  {/* Poster & Canva */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenCanvaModal();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-sky-950/40 border border-sky-500/30 flex flex-col justify-between gap-2 text-left group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">Poster & Canva</div>
                      <div className="text-[10px] text-slate-400">Panduan Desain Infografis</div>
                    </div>
                  </button>

                  {/* Unduh Panduan PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onDownloadPdfGuide();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-between gap-2 text-left group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">Buku Panduan PDF</div>
                      <div className="text-[10px] text-slate-400">Pedoman Lengkap Penggunaan</div>
                    </div>
                  </button>

                  {/* Agenda Surat Terbit */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleTabSelect('registrasi_agenda');
                    }}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-sky-950/40 border border-sky-500/30 flex flex-col justify-between gap-2 text-left group transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">Agenda Surat</div>
                      <div className="text-[10px] text-slate-400">Daftar Nomor Surat Terbit</div>
                    </div>
                  </button>
                </div>

                {/* Quick Preferences Bar with Discreet Secret Admin Marker */}
                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Pilihan Tema</span>
                    <ThemeToggleButton variant="pill" />
                  </div>
                  
                  {/* Discreet Admin Marker: looks like normal version badge to users, but tapping opens Admin PIN */}
                  <SecretAdminMarker
                    variant="version"
                    onTrigger={() => {
                      setIsMoreMenuOpen(false);
                      onOpenAdminPin();
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
