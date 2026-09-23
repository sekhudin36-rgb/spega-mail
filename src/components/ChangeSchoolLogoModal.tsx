import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Eye, 
  Shield, 
  Award, 
  Image as ImageIcon, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DEFAULT_LEFT_LOGO, DEFAULT_RIGHT_LOGO } from '../lib/printHelper';

export interface LogoPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  src: string;
  badge: string;
}

export const OFFICIAL_LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'perisai-emas',
    name: 'Perisai Emas Abhi Praya (Resmi)',
    category: 'SMPN 3 Kras',
    description: 'Lambang perisai teratai biru royal dengan pena bersayap emas, kobaran api obor, bintang dan semboyan Abhi Praya Widya Sakanti.',
    src: '/logos/smpn3-perisai-emas.png',
    badge: 'Rekomendasi Utama'
  },
  {
    id: 'lingkaran-resmi',
    name: 'Emblem Lingkaran Kedinasan',
    category: 'SMPN 3 Kras',
    description: 'Segel lingkaran heraldik biru dongker dengan padi kapas keemasan dan aksen futuristik modern.',
    src: '/logos/smpn3-lingkaran-resmi.png',
    badge: 'Modern Seal'
  },
  {
    id: 'lotus-klasik',
    name: 'Perisai Lotus Spega Klasik',
    category: 'SMPN 3 Kras',
    description: 'Varian perisai biru dengan outline kuning kontras tinggi, ideal untuk tampilan kop surat kedinasan.',
    src: '/logos/smpn3-lotus-klasik.png',
    badge: 'Klasik'
  },
  {
    id: 'pemkab-kediri',
    name: 'Lambang Pemkab Kediri',
    category: 'Pemerintah Daerah',
    description: 'Lambang resmi Pemerintah Kabupaten Kediri dengan ornamen padi kapas dan candi simetris.',
    src: DEFAULT_LEFT_LOGO,
    badge: 'Kop Kiri Resmi'
  }
];

interface ChangeSchoolLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeSchoolLogoModal({ isOpen, onClose }: ChangeSchoolLogoModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<string>('');
  const [customLogoPreview, setCustomLogoPreview] = useState<string>('');
  const [applyToApp, setApplyToApp] = useState<boolean>(true);
  const [applyToKopRight, setApplyToKopRight] = useState<boolean>(true);
  const [applyToKopLeft, setApplyToKopLeft] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = localStorage.getItem('appLogo') || localStorage.getItem('rightLogo') || '/app-logo.png';
      setSelectedLogo(current);
      setCustomLogoPreview(current.startsWith('data:') ? current : '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Format berkas harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomLogoPreview(dataUrl);
      setSelectedLogo(dataUrl);
      toast.success('Gambar logo berhasil dimuat. Klik "Simpan & Terapkan" untuk menyimpan.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogo = () => {
    if (!selectedLogo) {
      toast.error('Pilih logo terlebih dahulu');
      return;
    }

    try {
      if (applyToApp) {
        localStorage.setItem('appLogo', selectedLogo);
      }
      if (applyToKopRight) {
        localStorage.setItem('rightLogo', selectedLogo);
        localStorage.setItem('schoolLogoRight', selectedLogo);
      }
      if (applyToKopLeft) {
        localStorage.setItem('leftLogo', selectedLogo);
        localStorage.setItem('schoolLogoLeft', selectedLogo);
      }

      // Dispatch real-time events for instant update
      window.dispatchEvent(new CustomEvent('app-logo-updated', { detail: { logo: selectedLogo } }));
      window.dispatchEvent(new Event('storage'));

      toast.success('Logo sekolah berhasil diperbarui di seluruh portal & dokumen!', {
        icon: '✨',
        duration: 4000
      });
      onClose();
    } catch (err: any) {
      toast.error('Gagal menyimpan logo: ' + (err?.message || 'Memori browser penuh'));
    }
  };

  const handleResetDefault = () => {
    const defaultLogo = '/logos/smpn3-perisai-emas.png';
    setSelectedLogo(defaultLogo);
    localStorage.removeItem('appLogo');
    localStorage.setItem('rightLogo', '/app-logo.png');
    localStorage.setItem('leftLogo', DEFAULT_LEFT_LOGO);

    window.dispatchEvent(new CustomEvent('app-logo-updated', { detail: { logo: '/app-logo.png' } }));
    window.dispatchEvent(new Event('storage'));

    toast.success('Logo dikembalikan ke konfigurasi standar sekolah');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#0F172A] to-[#0B0E14] border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-950/50 overflow-hidden my-auto">
        {/* Header glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Ubah & Sesuaikan Logo Sekolah
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SMPN 3 Kras
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih desain resmi sekolah atau unggah berkas logo kustom (PNG transparan/SVG)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'preset'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4" /> Koleksi Desain Logo Resmi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4" /> Unggah Berkas Kustom (File Gambar)
            </button>
          </div>

          {/* TAB 1: Preset Logos */}
          {activeTab === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {OFFICIAL_LOGO_PRESETS.map((preset) => {
                const isSelected = selectedLogo === preset.src;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedLogo(preset.src)}
                    className={`cursor-pointer group relative p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                        : 'bg-slate-900/50 border-white/10 hover:border-white/30 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={preset.src}
                        alt={preset.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {preset.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dipilih
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Upload Custom Logo */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Klik untuk Memilih Berkas Logo Sekolah
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                  Format didukung: PNG transparan, JPG, SVG, WebP (Maksimal 5MB). Disarankan rasio 1:1.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-amber-300 font-medium">
                  <ImageIcon className="w-3.5 h-3.5" /> Pilih dari Komputer / Smartphone
                </span>
              </div>

              {customLogoPreview && (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-400/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 flex items-center justify-center shrink-0">
                      <img src={customLogoPreview} alt="Pratinjau Kustom" className="max-h-full max-w-full object-contain filter drop-shadow-md" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Berkas Kustom Siap Diterapkan</div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Berkas berhasil diproses & terpilih
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLogoPreview('');
                      setSelectedLogo('/logos/smpn3-perisai-emas.png');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Batalkan Berkas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scope & Target Settings */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Terapkan Logo Ke Bagian:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-white/5 cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToApp}
                  onChange={(e) => setApplyToApp(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-white font-medium">Logo Utama Aplikasi & PWA</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-white/5 cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToKopRight}
                  onChange={(e) => setApplyToKopRight(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span className="text-xs text-white font-medium">Kop Surat (Kanan - Sekolah)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-white/5 cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToKopLeft}
                  onChange={(e) => setApplyToKopLeft(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-400 w-4 h-4"
                />
                <span className="text-xs text-white font-medium">Kop Surat (Kiri - Pemda)</span>
              </label>
            </div>
          </div>

          {/* Live Kop Preview with selected logo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-400">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" /> Pratinjau Tampilan Kop Surat Naskah Dinas
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Sesuai Permendikbud & Kearsipan</span>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-slate-900 border border-slate-300 shadow-md">
              <div style={{ borderBottom: '3px double #000000', paddingBottom: '6px' }} className="flex items-center justify-between gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <img
                    src={applyToKopLeft ? selectedLogo : DEFAULT_LEFT_LOGO}
                    alt="Logo Kiri"
                    className="max-h-14 max-w-14 object-contain"
                  />
                </div>
                <div className="text-center flex-1 px-2 font-serif uppercase">
                  <div className="text-[11px] font-bold text-slate-900">PEMERINTAH KABUPATEN KEDIRI</div>
                  <div className="text-[11px] font-bold text-slate-900">DINAS PENDIDIKAN</div>
                  <div className="text-sm font-extrabold text-black tracking-wide my-0.5">SMP NEGERI 3 KRAS</div>
                  <div className="text-[9.5px] font-sans font-normal normal-case text-slate-700">
                    Jalan Raya Jabang Kras, Kediri, Jawa Timur • Telp: (0354) XXXXXX
                  </div>
                </div>
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <img
                    src={applyToKopRight ? selectedLogo : (applyToApp ? selectedLogo : '/logos/smpn3-perisai-emas.png')}
                    alt="Logo Kanan"
                    className="max-h-14 max-w-14 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Kembalikan ke Standar Sekolah
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyLogo}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4" /> Simpan & Terapkan Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
