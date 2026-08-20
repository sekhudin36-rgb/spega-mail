import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, FileText, X, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { printHTMLContent } from '../lib/printHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  htmlContent: string;
  onDownloadPdf?: () => void;
  onDownloadWord?: () => void;
  defaultDocName?: string;
  orientation?: 'landscape' | 'portrait';
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle = 'Pratinjau dokumen cetak resmi instansi',
  htmlContent,
  onDownloadPdf,
  onDownloadWord,
  defaultDocName = 'Dokumen_Resmi',
  orientation = 'landscape'
}: PrintPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const success = await printHTMLContent(htmlContent, title, orientation);
      if (success) {
        toast.success('Jendela cetak telah dibuka', { icon: '🖨️' });
      } else {
        toast.error('Gagal membuka cetak. Pastikan pop-up diizinkan.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Terjadi kesalahan saat memproses cetak');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-sky-500/20 shadow-2xl bg-slate-900"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  {title}
                </h3>
                <p className="text-xs text-slate-400">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-emerald-400">Format Resmi: A4 {orientation === 'landscape' ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}</span>
              <span className="text-slate-500">• Kop Sekolah & Tanda Tangan Resmi</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onDownloadWord && (
                <button
                  type="button"
                  onClick={onDownloadWord}
                  className="glass-button text-xs py-1.5 px-3 flex items-center gap-1.5 !bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30"
                >
                  <FileText className="w-3.5 h-3.5" /> Unduh Word (.doc)
                </button>
              )}

              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="glass-button text-xs py-1.5 px-3 flex items-center gap-1.5 !bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh PDF Resmi
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="glass-button text-xs py-1.5 px-4 flex items-center gap-2 !bg-sky-600 hover:!bg-sky-500 text-white font-medium shadow-md disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? 'Menyiapkan...' : 'Cetak Dokumen (Print)'}</span>
              </button>
            </div>
          </div>

          {/* Live Document Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 custom-scrollbar flex justify-center items-start">
            <div 
              className={`w-full ${orientation === 'landscape' ? 'max-w-[1040px]' : 'max-w-[780px]'} bg-white text-black p-6 sm:p-10 rounded shadow-2xl min-h-[520px] transition-all overflow-x-auto`}
              style={{
                fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 10px 15px -5px rgba(0, 0, 0, 0.3)'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <span>💡 <i>Standar Resmi:</i> Laporan disusun dengan Kop Resmi Sekolah, Format A4 Landscape, dan Lembar Pengesahan Tanda Tangan Kepala Sekolah & Petugas Persuratan.</span>
            <button
              onClick={onClose}
              className="px-3 py-1 text-slate-400 hover:text-white rounded text-xs transition"
            >
              Tutup Pratinjau
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
