import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Palette, 
  QrCode, 
  Tag, 
  FileText, 
  Share2, 
  Download, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { getSchoolConfig } from '../lib/printHelper';
import canvaPosterMockup from '../assets/images/canva_poster_guide_1788396619079.jpg';

interface CanvaPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CanvaPosterModal({ isOpen, onClose }: CanvaPosterModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'canva_guide' | 'copy_text'>('preview');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const school = getSchoolConfig();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://smpn3kras.sch.id';
  const portalUrl = `${currentOrigin}#/`;

  useEffect(() => {
    // Generate QR Code untuk portal akses
    QRCode.toDataURL(portalUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrCodeDataUrl(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }, [portalUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionKey: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    toast.success(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2500);
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Poster Panduan Persuratan & Agenda Digital - SMPN 3 Kras</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background-color: #ffffff;
            }
            .poster-container {
              width: 100%;
              max-width: 190mm;
              margin: 0 auto;
              border: 2px solid #0284c7;
              border-radius: 12px;
              overflow: hidden;
            }
            .poster-header {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%);
              color: white;
              padding: 16px 20px;
              text-align: center;
              border-bottom: 4px solid #f59e0b;
            }
            .school-tag {
              display: inline-block;
              background: #f59e0b;
              color: #0f172a;
              font-size: 11px;
              font-weight: 800;
              padding: 3px 12px;
              border-radius: 9999px;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            .poster-title {
              font-size: 20px;
              font-weight: 900;
              margin: 0;
              line-height: 1.2;
              letter-spacing: -0.5px;
            }
            .poster-subtitle {
              font-size: 11px;
              color: #bae6fd;
              margin-top: 4px;
              margin-bottom: 0;
            }
            .steps-grid {
              padding: 16px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              background: #f8fafc;
            }
            .step-card {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 12px;
              position: relative;
            }
            .step-card.highlight {
              border: 2px solid #f59e0b;
              background: #fffbeb;
            }
            .step-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background: #0284c7;
              color: white;
              font-weight: bold;
              font-size: 12px;
              border-radius: 50%;
              margin-right: 8px;
            }
            .step-badge.amber {
              background: #f59e0b;
              color: #0f172a;
            }
            .step-title {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              display: flex;
              align-items: center;
              margin-bottom: 6px;
            }
            .step-desc {
              font-size: 10.5px;
              line-height: 1.45;
              color: #334155;
              margin: 0 0 6px 0;
            }
            .step-pills {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            }
            .step-pill {
              font-size: 9.5px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              background: #e0f2fe;
              color: #0369a1;
            }
            .step-pill.amber {
              background: #fef3c7;
              color: #92400e;
            }
            .qr-callout {
              padding: 12px 16px;
              background: #ffffff;
              border-top: 1px solid #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
            }
            .qr-box {
              text-align: center;
              border: 1px solid #cbd5e1;
              padding: 6px;
              border-radius: 8px;
              background: white;
            }
            .qr-box img {
              width: 80px;
              height: 80px;
              display: block;
            }
            .qr-text h4 {
              margin: 0 0 3px 0;
              font-size: 13px;
              color: #0f172a;
              font-weight: 800;
            }
            .qr-text p {
              margin: 0 0 4px 0;
              font-size: 10.5px;
              color: #475569;
              line-height: 1.4;
            }
            .qr-link {
              font-family: monospace;
              font-size: 9.5px;
              background: #f1f5f9;
              padding: 3px 6px;
              border-radius: 4px;
              color: #0284c7;
              display: inline-block;
            }
            .footer-info {
              background: #0f172a;
              color: #94a3b8;
              padding: 10px 16px;
              font-size: 9.5px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .footer-info strong {
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <div class="poster-header">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <img src="${school.rightLogo || '/app-logo.png'}" alt="Logo Sekolah" style="width: 38px; height: 38px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));" />
                <span class="school-tag" style="margin-bottom: 0;">${school.schoolName}</span>
              </div>
              <h1 class="poster-title">PANDUAN PERSURATAN & AGENDA DIGITAL</h1>
              <p class="poster-subtitle">Alur Akses Mandiri, Pengajuan Surat, & Registrasi Nomor Agenda Keluar</p>
            </div>

            <div class="steps-grid">
              <div class="step-card">
                <div class="step-title">
                  <span class="step-badge">1</span>
                  <span>Akses Portal Mandiri</span>
                </div>
                <p class="step-desc">
                  Buka aplikasi melalui browser smartphone atau laptop Anda. Cukup scan kode QR di bawah atau akses tautan resmi, lalu pilih nama Anda dari daftar GTK tanpa perlu registrasi akun baru.
                </p>
                <div class="step-pills">
                  <span class="step-pill">Bisa di HP / Laptop</span>
                  <span class="step-pill">Pilih Nama Guru</span>
                </div>
              </div>

              <div class="step-card">
                <div class="step-title">
                  <span class="step-badge">2</span>
                  <span>Ajukan Draf Surat Otomatis</span>
                </div>
                <p class="step-desc">
                  Pilih menu <strong>Ajukan Draf Surat</strong>. Masukkan data perihal dan tujuan. Sistem secara otomatis menyusun naskah lengkap ber-kop resmi sekolah beserta QR code pengesahan.
                </p>
                <div class="step-pills">
                  <span class="step-pill">SPT / Tugas</span>
                  <span class="step-pill">Ket. Mengajar</span>
                  <span class="step-pill">Rekomendasi</span>
                </div>
              </div>

              <div class="step-card highlight">
                <div class="step-title">
                  <span class="step-badge amber">3</span>
                  <span style="color: #92400e;">Minta Nomor Agenda Saja</span>
                </div>
                <p class="step-desc">
                  <strong>Punya naskah surat sendiri di Word/Docs?</strong> Cukup klik tombol kuning <strong>"Minta Nomor Agenda Saja"</strong>. Nomor agenda surat keluar resmi langsung terbit seketika tanpa antre!
                </p>
                <div class="step-pills">
                  <span class="step-pill amber">Cepat 5 Detik</span>
                  <span class="step-pill amber">Salin Nomor Langsung</span>
                </div>
              </div>

              <div class="step-card">
                <div class="step-title">
                  <span class="step-badge">4</span>
                  <span>Slip Bukti & Disposisi</span>
                </div>
                <p class="step-desc">
                  Setelah nomor terbit, Anda mendapatkan <strong>Struk / Slip Bukti Registrasi</strong> yang dapat dicetak atau dibagikan via WhatsApp. Pantau status persetujuan kepala sekolah secara transparan.
                </p>
                <div class="step-pills">
                  <span class="step-pill">Slip Bertanda Tangan</span>
                  <span class="step-pill">Share WhatsApp</span>
                </div>
              </div>
            </div>

            <div class="qr-callout">
              <div class="qr-text">
                <h4>Scan Barcode Untuk Membuka Aplikasi:</h4>
                <p>Arahkan kamera smartphone Anda ke barcode berikut untuk langsung diarahkan ke Portal Persuratan & Pengajuan Agenda Mandiri SMPN 3 Kras.</p>
                <div class="qr-link">${portalUrl}</div>
              </div>
              <div class="qr-box">
                <img src="${qrCodeDataUrl}" alt="QR Code Portal" />
                <div style="font-size: 8.5px; font-weight: bold; color: #475569; margin-top: 3px;">SCAN DISINI</div>
              </div>
            </div>

            <div class="footer-info">
              <div>
                <strong>Layanan Tata Usaha:</strong> Senin – Jumat (07.00 – 14.30 WIB) | Gedung TU SMPN 3 Kras
              </div>
              <div>
                <strong>Bantuan:</strong> ${school.phone || '0812-3456-7890'} (Ruang TU)
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fullCopywritingCanva = `=====================================================
DESAIN POSTER CANVA: PANDUAN PERSURATAN & AGENDA DIGITAL
SMP NEGERI 3 KRAS KEDIRI
=====================================================

[KOP / HEADER UTAMA]
SMP NEGERI 3 KRAS KEDIRI
PANDUAN PERSURATAN & AGENDA DIGITAL
Layanan Mandiri Guru & Tenaga Kependidikan: Cepat, Tertib, dan Terarsip Rapi

-----------------------------------------------------
[BAGIAN 1: LANGKAH 1 - AKSES PORTAL MANDIRI]
Judul: 1. AKSES PORTAL GURU & WALI
Penjelasan:
- Buka kamera ponsel Anda dan scan Barcode QR di poster ini.
- Atau ketikkan tautan portal pada browser HP / Laptop Anda:
  ${portalUrl}
- Pilih nama Anda dari daftar Dewan Guru & Tenaga Kependidikan (tanpa perlu mendaftar akun baru).

-----------------------------------------------------
[BAGIAN 2: LANGKAH 2 - AJUKAN DRAF SURAT OTOMATIS]
Judul: 2. PENGAJUAN SURAT RESMI
Penjelasan:
- Butuh surat resmi sekolah? Pilih menu "Ajukan Draf Surat".
- Pilih jenis surat: Surat Perintah Tugas (SPT), Keterangan Mengajar, Rekomendasi Lomba, atau Undangan.
- Lengkapi data kegiatan, tanggal, dan nama siswa/guru.
- Format surat ber-kop resmi dan barcode pengesahan langsung jadi otomatis!

-----------------------------------------------------
[BAGIAN 3: LANGKAH 3 - MINTA NOMOR AGENDA SAJA (FITUR CEPAT)]
Judul: 3. MINTA NOMOR AGENDA SAJA (KHUSUS NASKAH MANDIRI)
Penjelasan:
- Mengetik naskah sendiri di Word / Google Docs dan hanya butuh nomor agenda dinas?
- Klik tombol kuning "Minta Nomor Agenda Saja".
- Masukkan nama pemohon, perihal, dan pilih format standar (SPT 420.3, Keterangan 421, dll).
- Nomor agenda keluar resmi langsung terbit seketika (contoh: 420.3/024/418.20.2.62.03/${new Date().getFullYear()}).
- Klik "Salin Nomor" lalu tempelkan langsung ke dokumen Word Anda.

-----------------------------------------------------
[BAGIAN 4: LANGKAH 4 - STRUK BUKTI REGISTRASI & VERIFIKASI]
Judul: 4. STRUK BUKTI & VERIFIKASI TATA USAHA
Penjelasan:
- Unduh / cetak lembar "Bukti Registrasi Nomor Agenda" sebagai tanda terima fisik.
- Atau kirim konfirmasi nomor agenda ke Ruang TU / WhatsApp Kedinasan.
- Pantau status persetujuan Kepala Sekolah secara real-time.

-----------------------------------------------------
[FOOTER & INFORMASI BANTUAN]
Lokasi Layanan: Ruang Tata Usaha (TU) SMP Negeri 3 Kras
Jam Pelayanan: Senin - Jumat (07.00 - 14.30 WIB) | Sabtu (07.00 - 13.00 WIB)
Helpdesk TU: ${school.phone || '0812-3456-7890'} | Email: ${school.email || 'smpn3kras@kedirikab.go.id'}
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-900/40">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Desain Poster & Panduan Canva
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Canva Ready
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Ukuran A4 / Digital
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Langkah-langkah Akses Aplikasi, Pengajuan Surat, dan Registrasi Nomor Agenda Keluar Guru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPoster}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
              title="Cetak Poster Langsung ke Printer / PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak Poster</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-5 pt-2 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'preview'
                ? 'border-sky-500 text-sky-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pratinjau Poster A4 (Siap Cetak)</span>
          </button>
          <button
            onClick={() => setActiveTab('canva_guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'canva_guide'
                ? 'border-amber-500 text-amber-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Panduan & Kit Desain Canva</span>
          </button>
          <button
            onClick={() => setActiveTab('copy_text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'copy_text'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Teks Siap Salin (Copy-Paste)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
          
          {/* TAB 1: PREVIEW POSTER SIAP CETAK */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Poster di bawah siap dicetak menggunakan kertas <strong>A4</strong> atau <strong>A3</strong> untuk ditempel di Papan Pengumuman Ruang Guru dan Ruang Tata Usaha.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPoster}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Cetak Sekarang (A4/PDF)</span>
                  </button>
                  <a
                    href="https://www.canva.com/create/posters/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <span>Buka Canva</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* POSTER CARD (Visual Rendition in App) */}
              <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-sky-600 overflow-hidden font-sans">
                
                {/* Header Poster */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 text-white p-5 text-center border-b-4 border-amber-500 relative">
                  <div className="inline-block bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-sm">
                    {school.schoolName} KEDIRI
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                    PANDUAN PERSURATAN & AGENDA DIGITAL
                  </h2>
                  <p className="text-xs sm:text-sm text-sky-200 mt-1 font-medium">
                    Tata Cara Akses Mandiri, Pembuatan Draf Surat, dan Pengambilan Nomor Agenda
                  </p>
                </div>

                {/* Body 4 Steps */}
                <div className="p-5 bg-slate-50 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Step 1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                          <h4 className="font-extrabold text-sm text-slate-900">Akses Portal Mandiri</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          Buka di browser smartphone atau laptop Anda. Cukup scan barcode QR di samping atau buka tautan portal, lalu pilih nama guru Anda.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">Tanpa Password</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">HP & Laptop</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                          <h4 className="font-extrabold text-sm text-slate-900">Ajukan Draf Surat</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          Pilih menu <strong>Ajukan Surat</strong>. Pilih format standar (Surat Tugas SPT, Keterangan Mengajar, Rekomendasi), isi formulir, naskah resmi ber-kop sekolah otomatis tersusun.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">SPT Tugas</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">Ket. Mengajar</span>
                      </div>
                    </div>

                    {/* Step 3 - Highlighted for Agenda */}
                    <div className="bg-amber-50/80 p-3.5 rounded-xl border-2 border-amber-400 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                          <h4 className="font-extrabold text-sm text-amber-950">Minta Nomor Agenda Saja</h4>
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed mb-3">
                          <strong>Punya naskah sendiri di Word/Docs?</strong> Klik tombol kuning <strong>"Minta Nomor Agenda Saja"</strong>. Nomor agenda surat keluar resmi terbit seketika tanpa antre!
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950">Khusus Naskah Mandiri</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950">Salin Nomor 1 Klik</span>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                          <h4 className="font-extrabold text-sm text-slate-900">Slip Bukti & Disposisi</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          Setelah nomor terbit, Anda mendapatkan <strong>Struk / Slip Bukti Registrasi</strong>. Cetak bukti untuk tanda tangan TU atau bagikan via WhatsApp. Pantau proses persetujuan kepala sekolah.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Slip Tanda Terima</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">Kirim WhatsApp</span>
                      </div>
                    </div>

                  </div>

                  {/* QR Box Banner */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900">Scan Barcode Ini Lewat Ponsel:</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                        Kamera ponsel Anda akan langsung mengarahkan ke halaman Portal Guru & Wali Mandiri SMPN 3 Kras.
                      </p>
                      <span className="inline-block mt-2 font-mono text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 truncate max-w-xs sm:max-w-md">
                        {portalUrl}
                      </span>
                    </div>
                    <div className="p-1.5 bg-white border-2 border-slate-300 rounded-lg shrink-0 text-center shadow-sm">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR Code Portal" className="w-20 h-20 sm:w-24 sm:h-24" />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
                      )}
                      <span className="text-[9px] font-bold text-slate-700 block mt-1">SCAN DISINI</span>
                    </div>
                  </div>
                </div>

                {/* Footer Poster */}
                <div className="bg-slate-900 text-slate-300 p-3.5 px-5 text-xs flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ruang Tata Usaha (TU) SMPN 3 Kras</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Senin - Jumat: 07.00 - 14.30 WIB</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN & KIT DESAIN CANVA */}
          {activeTab === 'canva_guide' && (
            <div className="space-y-6">
              
              {/* Row 1: Mockup Visual + Quick Specs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Visual Image Mockup */}
                <div className="lg:col-span-5 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-800 group">
                    <img 
                      src={canvaPosterMockup} 
                      alt="Mockup Desain Poster Canva" 
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                        INSPIRASI DESAIN CANVA
                      </span>
                      <p className="text-[11px] text-slate-200 mt-1 font-medium">
                        Layout 4 Langkah Infografis SMP Negeri 3 Kras
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2.5">
                    Contoh visual hasil desain di Canva dengan warna biru dinas & emas.
                  </p>
                </div>

                {/* Canva Setup Specifications */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Spesifikasi Dimensi */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>1. Ukuran Kanvas di Canva</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-sky-400 block">POSTER CETAK (A4)</span>
                        <p className="text-xs font-semibold text-white mt-0.5">21.0 x 29.7 cm</p>
                        <span className="text-[10px] text-slate-400 block">Papan Ruang Guru / TU</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-emerald-400 block">POSTER BESAR (A3)</span>
                        <p className="text-xs font-semibold text-white mt-0.5">29.7 x 42.0 cm</p>
                        <span className="text-[10px] text-slate-400 block">Lobi Sekolah / Mading</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 block">DIGITAL / STORY WA</span>
                        <p className="text-xs font-semibold text-white mt-0.5">1080 x 1920 px</p>
                        <span className="text-[10px] text-slate-400 block">Broadcast Grup Guru</span>
                      </div>
                    </div>
                  </div>

                  {/* Palet Warna Canva */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>2. Kode Warna HEX Resmi Canva</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      
                      <div 
                        onClick={() => handleCopy('#0F172A', 'hex_navy', 'Warna Deep Navy')}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#0F172A] border border-slate-700 shrink-0"></div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">Deep Navy</span>
                          <span className="text-[11px] font-mono font-bold text-white">#0F172A</span>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCopy('#0284C7', 'hex_blue', 'Warna Sky Blue')}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#0284C7] shrink-0"></div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">Sky Blue Dinas</span>
                          <span className="text-[11px] font-mono font-bold text-sky-400">#0284C7</span>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCopy('#F59E0B', 'hex_amber', 'Warna Amber Gold')}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#F59E0B] shrink-0"></div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">Amber Agenda</span>
                          <span className="text-[11px] font-mono font-bold text-amber-400">#F59E0B</span>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCopy('#10B981', 'hex_green', 'Warna Emerald Green')}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#10B981] shrink-0"></div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">Emerald Status</span>
                          <span className="text-[11px] font-mono font-bold text-emerald-400">#10B981</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Rekomendasi Font Gratis Canva */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>3. Font Gratis Terbaik di Canva</span>
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Judul Utama & Header:</span>
                        <span className="font-bold text-white">Montserrat (Extra Bold) / League Spartan</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Sub-Judul & Poin Langkah:</span>
                        <span className="font-bold text-sky-300">Poppins (Semi Bold)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Paragraf Penjelas:</span>
                        <span className="font-medium text-slate-200">Inter / Plus Jakarta Sans (Reguler)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Nomor Agenda & Link:</span>
                        <span className="font-mono font-bold text-amber-300">Space Mono / Roboto Mono</span>
                      </div>
                    </div>
                  </div>

                  {/* Kata Kunci Elemen Canva */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-400" />
                      <span>4. Kata Kunci Cari Elemen & Ikon di Canva</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ketikkan kata kunci berikut di tab <strong>"Elements / Elemen"</strong> Canva untuk menemukan stiker & ilustrasi yang cocok:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['school administration 3d', 'qr code frame', 'document checklist', 'stamp approved', 'number badge amber', 'calendar agenda', 'digital signature icon'].map(keyword => (
                        <button
                          key={keyword}
                          onClick={() => handleCopy(keyword, keyword, `Kata kunci "${keyword}"`)}
                          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1 transition-all"
                          title="Klik untuk menyalin kata kunci"
                        >
                          <span>{keyword}</span>
                          <Copy className="w-3 h-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Direct Canva Launch Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Siap Mulai Mendesain di Canva?</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Gunakan template kosong Poster A4 di Canva, lalu tempelkan susunan teks yang telah disiapkan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(fullCopywritingCanva, 'all_canva_text', 'Seluruh teks copywriting Canva')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>Salin Seluruh Teks Canva</span>
                  </button>
                  <a
                    href="https://www.canva.com/create/posters/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                  >
                    <span>Buka Canva.com</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TEKS SIAP SALIN (COPY-PASTE) */}
          {activeTab === 'copy_text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-300">
                  <span>Klik tombol <strong>Salin</strong> pada masing-masing bagian untuk ditempel langsung ke kotak teks Canva Anda:</span>
                </div>
                <button
                  onClick={() => handleCopy(fullCopywritingCanva, 'all_canva_text', 'Seluruh teks')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Salin Semua Sekaligus</span>
                </button>
              </div>

              {/* Section 1: Header */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Bagian Kop & Judul Poster</span>
                  <button
                    onClick={() => handleCopy(`SMP NEGERI 3 KRAS KEDIRI\nPANDUAN PERSURATAN & AGENDA DIGITAL\nLayanan Mandiri Guru & Tenaga Kependidikan: Cepat, Tertib, dan Terarsip Rapi`, 'header_text', 'Teks Kop & Judul')}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSection === 'header_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {`SMP NEGERI 3 KRAS KEDIRI
PANDUAN PERSURATAN & AGENDA DIGITAL
Layanan Mandiri Guru & Tenaga Kependidikan: Cepat, Tertib, dan Terarsip Rapi`}
                </div>
              </div>

              {/* Section 2: Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Langkah 1: Akses Portal Mandiri</span>
                  <button
                    onClick={() => handleCopy(`1. AKSES PORTAL GURU & WALI\n- Buka kamera ponsel Anda dan scan Barcode QR di poster ini.\n- Atau akses tautan pada browser HP / Laptop:\n  ${portalUrl}\n- Pilih nama Anda dari daftar Dewan Guru & Tenaga Kependidikan (tanpa perlu mendaftar akun baru).`, 'step1_text', 'Langkah 1')}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSection === 'step1_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {`1. AKSES PORTAL GURU & WALI
- Buka kamera ponsel Anda dan scan Barcode QR di poster ini.
- Atau akses tautan pada browser HP / Laptop:
  ${portalUrl}
- Pilih nama Anda dari daftar Dewan Guru & Tenaga Kependidikan (tanpa perlu mendaftar akun baru).`}
                </div>
              </div>

              {/* Section 3: Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Langkah 2: Ajukan Draf Surat Otomatis</span>
                  <button
                    onClick={() => handleCopy(`2. PENGAJUAN SURAT RESMI\n- Butuh surat resmi sekolah? Pilih menu "Ajukan Draf Surat".\n- Pilih template: Surat Perintah Tugas (SPT), Keterangan Mengajar, Rekomendasi Lomba, atau Undangan.\n- Lengkapi data kegiatan, tanggal, dan nama peserta.\n- Format surat ber-kop resmi dan barcode pengesahan langsung jadi otomatis!`, 'step2_text', 'Langkah 2')}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSection === 'step2_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {`2. PENGAJUAN SURAT RESMI
- Butuh surat resmi sekolah? Pilih menu "Ajukan Draf Surat".
- Pilih template: Surat Perintah Tugas (SPT), Keterangan Mengajar, Rekomendasi Lomba, atau Undangan.
- Lengkapi data kegiatan, tanggal, dan nama peserta.
- Format surat ber-kop resmi dan barcode pengesahan langsung jadi otomatis!`}
                </div>
              </div>

              {/* Section 4: Step 3 (Agenda Only) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Langkah 3: Minta Nomor Agenda Saja (Fitur Cepat)</span>
                  <button
                    onClick={() => handleCopy(`3. MINTA NOMOR AGENDA SAJA (KHUSUS NASKAH MANDIRI)\n- Mengetik naskah sendiri di Word / Google Docs dan hanya butuh nomor agenda dinas?\n- Klik tombol kuning "Minta Nomor Agenda Saja".\n- Masukkan nama pemohon, perihal, dan pilih format standar (SPT 420.3, Keterangan 421, dll).\n- Nomor agenda keluar resmi langsung terbit seketika (contoh: 420.3/024/418.20.2.62.03/${new Date().getFullYear()}).\n- Klik "Salin Nomor" lalu tempelkan langsung ke dokumen Word Anda.`, 'step3_text', 'Langkah 3')}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-xs text-amber-300 flex items-center gap-1 border border-amber-500/30"
                  >
                    {copiedSection === 'step3_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-amber-200/90 leading-relaxed whitespace-pre-line">
                  {`3. MINTA NOMOR AGENDA SAJA (KHUSUS NASKAH MANDIRI)
- Mengetik naskah sendiri di Word / Google Docs dan hanya butuh nomor agenda dinas?
- Klik tombol kuning "Minta Nomor Agenda Saja".
- Masukkan nama pemohon, perihal, dan pilih format standar (SPT 420.3, Keterangan 421, dll).
- Nomor agenda keluar resmi langsung terbit seketika (contoh: 420.3/024/418.20.2.62.03/${new Date().getFullYear()}).
- Klik "Salin Nomor" lalu tempelkan langsung ke dokumen Word Anda.`}
                </div>
              </div>

              {/* Section 5: Step 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Langkah 4: Struk Bukti Registrasi & Verifikasi TU</span>
                  <button
                    onClick={() => handleCopy(`4. STRUK BUKTI & VERIFIKASI TATA USAHA\n- Unduh / cetak lembar "Bukti Registrasi Nomor Agenda" sebagai tanda terima fisik.\n- Atau kirim konfirmasi nomor agenda ke Ruang TU / WhatsApp Kedinasan.\n- Pantau status persetujuan Kepala Sekolah secara real-time.`, 'step4_text', 'Langkah 4')}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSection === 'step4_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {`4. STRUK BUKTI & VERIFIKASI TATA USAHA
- Unduh / cetak lembar "Bukti Registrasi Nomor Agenda" sebagai tanda terima fisik.
- Atau kirim konfirmasi nomor agenda ke Ruang TU / WhatsApp Kedinasan.
- Pantau status persetujuan Kepala Sekolah secara real-time.`}
                </div>
              </div>

              {/* Section 6: Footer Help */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bagian Footer & Kontak Layanan</span>
                  <button
                    onClick={() => handleCopy(`Lokasi Layanan: Ruang Tata Usaha (TU) SMP Negeri 3 Kras\nJam Pelayanan: Senin - Jumat (07.00 - 14.30 WIB) | Sabtu (07.00 - 13.00 WIB)\nHelpdesk TU: ${school.phone || '0812-3456-7890'} | Email: ${school.email || 'smpn3kras@kedirikab.go.id'}`, 'footer_text', 'Kontak Layanan')}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSection === 'footer_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                  {`Lokasi Layanan: Ruang Tata Usaha (TU) SMP Negeri 3 Kras
Jam Pelayanan: Senin - Jumat (07.00 - 14.30 WIB) | Sabtu (07.00 - 13.00 WIB)
Helpdesk TU: ${school.phone || '0812-3456-7890'} | Email: ${school.email || 'smpn3kras@kedirikab.go.id'}`}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Format nomor surat dinas: <strong>[Kode]/[No. Agenda]/418.20.2.62.03/{new Date().getFullYear()}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPoster}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Cetak Pratinjau (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
