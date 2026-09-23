import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ArrowRight, 
  WifiOff, 
  ShieldCheck, 
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import toast from 'react-hot-toast';

interface MobilePWAProps {
  /** Optional bottom offset class (e.g. 'bottom-20' if bottom nav is present) */
  bottomOffset?: string;
  className?: string;
}

/**
 * Dialog panduan instalasi PWA lengkap untuk pengguna ponsel (Android / iOS)
 */
export const MobilePWAInstallModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isIOS) {
      setActiveDeviceTab('ios');
    }
  }, [isIOS]);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    setIsInstalling(true);
    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        toast.success('Aplikasi SPEGA MAIL berhasil dipasang di layar utama HP Anda!', { duration: 5000 });
        onClose();
      } else if (outcome === 'unsupported') {
        toast('Gunakan menu browser (titik tiga) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"', {
          icon: 'ℹ️',
          duration: 6000
        });
      }
    } catch (e) {
      toast.error('Gagal memicu instalasi otomatis. Silakan gunakan menu browser Anda.');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full max-w-lg bg-[#0F172A] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-900/40 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <img src="/pwa-192x192.png" alt="Icon" className="w-8 h-8 rounded-lg object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Pasang Aplikasi Mobile</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">SPEGA MAIL v3 di Layar Utama HP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keunggulan PWA */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <Zap className="w-4 h-4 text-amber-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-200 block">Lebih Cepat</span>
            <span className="text-[9px] text-slate-400 block leading-tight">Tanpa perlu ketik URL</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <WifiOff className="w-4 h-4 text-sky-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-200 block">Siap Offline</span>
            <span className="text-[9px] text-slate-400 block leading-tight">Tetap buka arsip lokal</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-200 block">Sangat Ringan</span>
            <span className="text-[9px] text-slate-400 block leading-tight">Hemat memori &lt; 2 MB</span>
          </div>
        </div>

        {/* Status jika sudah terpasang */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 my-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <p className="leading-relaxed">
              Aplikasi sudah terpasang di perangkat ini dan saat ini berjalan dalam mode mandiri (standalone app).
            </p>
          </div>
        ) : (
          <>
            {/* Tombol Langsung jika Browser Mendukung Native Prompt */}
            {isInstallable && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  disabled={isInstalling}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Memproses Instalasi...' : 'Pasang Aplikasi di HP Sekarang'}</span>
                </button>
              </div>
            )}

            {/* Tab Pilihan Panduan: Android vs iOS */}
            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('android')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeDeviceTab === 'android'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android (Chrome / Edge)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('ios')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeDeviceTab === 'ios'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>iPhone / iPad (Safari)</span>
                </button>
              </div>

              {/* Langkah Android */}
              {activeDeviceTab === 'android' && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Melalui Notifikasi Browser Otomatis</span>
                  </div>
                  <p className="text-slate-400 pl-6 leading-relaxed">
                    Jika tombol <strong>"Pasang Aplikasi"</strong> di atas muncul, cukup klik tombol tersebut dan konfirmasi pemasangan.
                  </p>

                  <div className="font-semibold text-white flex items-center gap-1.5 pt-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Melalui Menu Titik Tiga (Opsi Manual)</span>
                  </div>
                  <ol className="list-decimal list-inside pl-6 space-y-1.5 text-slate-400">
                    <li>Ketuk ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser Chrome/Edge.</li>
                    <li>Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                    <li>Ketuk <strong>"Instal"</strong>. Ikon SPEGA MAIL akan langsung muncul di menu dan layar HP Anda.</li>
                  </ol>
                </div>
              )}

              {/* Langkah iOS Safari */}
              {activeDeviceTab === 'ios' && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Pada perangkat Apple (iOS), buka web ini di browser <strong>Safari</strong> untuk memasang PWA.</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="font-semibold text-white">Ketuk Tombol Bagikan (Share)</p>
                        <p className="text-slate-400 text-[11px]">Ikon kotak dengan panah menghadap ke atas di bilah menu bawah Safari.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="font-semibold text-white">Pilih "Tambahkan ke Layar Utama"</p>
                        <p className="text-slate-400 text-[11px]">Gulir ke bawah menu lalu temukan opsi <em>"Add to Home Screen"</em> (+).</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="font-semibold text-white">Ketuk "Tambah" (Add)</p>
                        <p className="text-slate-400 text-[11px]">Aplikasi SPEGA MAIL akan terinstal di layar iPhone/iPad Anda.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">PWA COMPLIANT • STANDALONE</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Floating Banner untuk Tampilan Mobile (khusus mobile screen: md:hidden)
 */
export const MobilePWAFloatingPrompt: React.FC<MobilePWAProps> = ({ 
  bottomOffset = 'bottom-3',
  className = '' 
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('dismissPwaMobileBanner') === 'true' : false;
  });

  // Jangan tampilkan jika sudah dalam mode terinstal / standalone
  if (isInstalled) {
    return null;
  }

  // Jika pengguna menutup banner untuk sesi ini
  if (isDismissed) {
    return (
      <MobilePWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    );
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('dismissPwaMobileBanner', 'true');
  };

  const handleAction = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        toast.success('Aplikasi berhasil dipasang di layar utama HP!');
        return;
      }
    }
    // Jika belum ada deferred prompt atau iOS, buka modal panduan
    setIsModalOpen(true);
  };

  return (
    <>
      {/* TAMPIL KHUSUS MOBILE: md:hidden */}
      <div 
        className={`fixed ${bottomOffset} left-3 right-3 z-40 md:hidden pointer-events-auto transition-all ${className}`}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.96 }}
          className="p-3 rounded-2xl bg-[#0F172A]/95 backdrop-blur-xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/70 text-white flex items-center justify-between gap-3"
        >
          {/* Info & Icon */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <img src="/pwa-192x192.png" alt="Icon" className="w-7 h-7 rounded-md object-contain" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">Pasang di Layar HP</p>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shrink-0">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Lebih cepat & bisa dibuka offline</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAction}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 flex items-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instal</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      <MobilePWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

/**
 * Tombol instal PWA khusus untuk mobile header / navbar
 */
export const MobilePWAHeaderButton: React.FC<{
  className?: string;
  variant?: 'pill' | 'icon';
}> = ({ className = '', variant = 'pill' }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        toast.success('Aplikasi berhasil dipasang di layar utama!');
        return;
      }
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'pill'
            ? `md:hidden px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-sky-600/30 hover:from-indigo-600/50 hover:to-sky-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${className}`
            : `md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition-all active:scale-95 ${className}`
        }
        title="Instal Aplikasi PWA di Layar Utama HP"
      >
        <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        {variant === 'pill' && <span>Instal App</span>}
      </button>

      <MobilePWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
