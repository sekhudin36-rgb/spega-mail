import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, Download, FileText, X, CheckCircle2, Sliders, 
  Edit3, Eye, RotateCcw, Maximize2, Type, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Bold, Italic, 
  Underline, ZoomIn, ZoomOut, MoveVertical, Sparkles,
  Plus, Minus, RefreshCw
} from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLayoutTools, setShowLayoutTools] = useState(false);

  // Layout & Spacing Controls State
  const [lineHeight, setLineHeight] = useState<number>(1.35); // 0.9 to 2.0
  const [fontSizePercent, setFontSizePercent] = useState<number>(100); // 80% to 130%
  const [paperPadding, setPaperPadding] = useState<number>(28); // in px (12 to 50)
  const [signatureGap, setSignatureGap] = useState<number>(45); // in px (20 to 90)
  const [fontFamily, setFontFamily] = useState<'Arial' | 'Times New Roman' | 'Calibri' | 'Georgia'>('Arial');
  
  // Track modified HTML
  const [currentHtml, setCurrentHtml] = useState<string>(htmlContent);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Sync initial or updated htmlContent
  useEffect(() => {
    setCurrentHtml(htmlContent);
    // Reset spacing to defaults for each new document
    setLineHeight(1.35);
    setFontSizePercent(100);
    setPaperPadding(28);
    setSignatureGap(45);
    setIsEditMode(false);
  }, [htmlContent, isOpen]);

  if (!isOpen) return null;

  // Execute rich text formatting commands for contentEditable
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentEditableRef.current) {
      setCurrentHtml(contentEditableRef.current.innerHTML);
    }
  };

  // Handle direct typing / editing inside document
  const handleContentInput = () => {
    if (contentEditableRef.current) {
      setCurrentHtml(contentEditableRef.current.innerHTML);
    }
  };

  // Quick Preset: Fit to 1 Page A4 (Compact)
  const handleFitOnePage = () => {
    setLineHeight(1.15);
    setFontSizePercent(90);
    setPaperPadding(16);
    setSignatureGap(25);
    toast.success('Tata letak dipadatkan agar muat pas 1 Halaman A4!', { icon: '📄' });
  };

  // Reset to original draft
  const handleResetDraft = () => {
    setCurrentHtml(htmlContent);
    setLineHeight(1.35);
    setFontSizePercent(100);
    setPaperPadding(28);
    setSignatureGap(45);
    setFontFamily('Arial');
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = htmlContent;
    }
    toast.success('Dokumen dikembalikan ke draf naskah awal');
  };

  // Prepare full styled HTML with user custom line-height, font-size, padding, and font-family
  const getExportableHTML = () => {
    const liveBodyHTML = contentEditableRef.current ? contentEditableRef.current.innerHTML : currentHtml;
    
    // Inject custom CSS styling for spacing and layout
    const customStyle = `
      <style>
        .doc-wrapper {
          line-height: ${lineHeight} !important;
          font-size: ${fontSizePercent}% !important;
          font-family: ${fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : fontFamily + ', sans-serif'} !important;
        }
        .doc-wrapper p, .doc-wrapper div, .doc-wrapper td, .doc-wrapper th, .doc-wrapper li {
          line-height: ${lineHeight} !important;
        }
        .doc-wrapper .sig-gap, .doc-wrapper div[style*="height: 45px"], .doc-wrapper div[style*="height: 50px"], .doc-wrapper div[style*="height: 60px"], .doc-wrapper div[style*="height: 70px"] {
          height: ${signatureGap}px !important;
        }
        @media print {
          @page {
            size: A4 ${orientation};
            margin: ${paperPadding * 0.4}mm;
          }
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
          .doc-wrapper {
            padding: ${paperPadding}px !important;
          }
        }
      </style>
      <div class="doc-wrapper" style="line-height: ${lineHeight}; font-size: ${fontSizePercent}%; font-family: ${fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : fontFamily + ', sans-serif'}; padding: ${paperPadding}px;">
        ${liveBodyHTML}
      </div>
    `;
    return customStyle;
  };

  // Print with live user edits and custom spacing
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const styledHTML = getExportableHTML();
      const success = await printHTMLContent(styledHTML, title, orientation);
      if (success) {
        toast.success('Jendela cetak telah dibuka dengan naskah terbaru', { icon: '🖨️' });
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

  // Direct Word Export (.doc) preserving all user edits & spacing
  const handleDirectWordDownload = () => {
    try {
      const styledHTML = getExportableHTML();
      const cleanDocName = (defaultDocName || title || 'Dokumen_Resmi').replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: ${orientation === 'landscape' ? '297mm 210mm' : '210mm 297mm'};
      margin: 20mm 20mm 20mm 20mm;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: ${fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 'Arial, sans-serif'};
      font-size: 10pt;
      line-height: ${lineHeight};
      color: #000000;
    }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
  </style>
</head>
<body>
  <div class="Section1">
    ${styledHTML}
  </div>
</body>
</html>`;

      const blob進 = new Blob(['\ufeff' + header], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob進);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanDocName}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Berkas Word (.doc) berhasil diunduh dengan teks editan Anda!', { icon: '📝' });
    } catch (e) {
      console.error(e);
      if (onDownloadWord) onDownloadWord();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden border border-sky-500/20 shadow-2xl bg-slate-900"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-400">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="px-3 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Mode Selector & Formatting Trigger */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  !isEditMode 
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30 border border-sky-400/40' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Cetak</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  isEditMode 
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30 border border-amber-400/40 animate-pulse' 
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Kata & Teks</span>
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

              <button
                type="button"
                onClick={() => setShowLayoutTools(prev => !prev)}
                className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  showLayoutTools 
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
                title="Atur spasi baris, margin, ukuran huruf & jarak TTD"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Atur Spasi & Baris</span>
              </button>

              <button
                type="button"
                onClick={handleFitOnePage}
                className="text-xs py-1.5 px-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-medium transition-all"
                title="Sesuaikan spasi secara otomatis agar muat rapi dalam 1 halaman A4"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pas 1 Halaman A4</span>
              </button>
            </div>

            {/* Action Buttons: Print, PDF, Word */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <button
                type="button"
                onClick={handleDirectWordDownload}
                className="glass-button text-xs py-1.5 px-3 flex items-center gap-1.5 !bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30"
                title="Unduh berkas Word (.doc) berisi teks hasil editan"
              >
                <FileText className="w-3.5 h-3.5" /> 
                <span className="hidden sm:inline">Unduh</span> Word (.doc)
              </button>

              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="glass-button text-xs py-1.5 px-3 flex items-center gap-1.5 !bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30"
                  title="Unduh PDF resmi"
                >
                  <Download className="w-3.5 h-3.5" /> 
                  <span className="hidden sm:inline">Unduh</span> PDF
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="glass-button text-xs py-1.5 px-4 flex items-center gap-2 !bg-sky-600 hover:!bg-sky-500 text-white font-bold shadow-lg shadow-sky-950/40 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? 'Menyiapkan...' : 'Cetak Dokumen (Print)'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Layout & Spacing Panel */}
          {showLayoutTools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 bg-slate-950/90 border-b border-indigo-500/20 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0"
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Spasi Baris (Line Height) */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <MoveVertical className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-400 font-medium">Spasi Baris:</span>
                  <button
                    type="button"
                    onClick={() => setLineHeight(prev => Math.max(0.9, +(prev - 0.1).toFixed(2)))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Rapatkan baris (-)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-indigo-300 font-bold px-1 min-w-[36px] text-center">{lineHeight.toFixed(2)}x</span>
                  <button
                    type="button"
                    onClick={() => setLineHeight(prev => Math.min(2.5, +(prev + 0.1).toFixed(2)))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Renggangkan baris (+)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <div className="flex gap-1 ml-1">
                    <button
                      type="button"
                      onClick={() => setLineHeight(1.15)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${lineHeight === 1.15 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Rapat
                    </button>
                    <button
                      type="button"
                      onClick={() => setLineHeight(1.35)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${lineHeight === 1.35 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Standar
                    </button>
                    <button
                      type="button"
                      onClick={() => setLineHeight(1.6)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${lineHeight === 1.6 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Longgar
                    </button>
                  </div>
                </div>

                {/* Ukuran Huruf (Font Scale) */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <Type className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-400 font-medium">Ukuran Teks:</span>
                  <button
                    type="button"
                    onClick={() => setFontSizePercent(prev => Math.max(75, prev - 5))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Perkecil huruf"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-sky-300 font-bold px-1 min-w-[42px] text-center">{fontSizePercent}%</span>
                  <button
                    type="button"
                    onClick={() => setFontSizePercent(prev => Math.min(140, prev + 5))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Perbesar huruf"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Margin Tepi Kertas */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium">Margin Kertas:</span>
                  <button
                    type="button"
                    onClick={() => setPaperPadding(prev => Math.max(10, prev - 4))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Sempitkan margin"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-emerald-300 font-bold px-1 min-w-[36px] text-center">{paperPadding}px</span>
                  <button
                    type="button"
                    onClick={() => setPaperPadding(prev => Math.min(50, prev + 4))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Lebarkan margin"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Ruang Tanda Tangan (Signature Gap) */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium">Jarak TTD:</span>
                  <button
                    type="button"
                    onClick={() => setSignatureGap(prev => Math.max(15, prev - 10))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Rapatkan ruang TTD"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-amber-300 font-bold px-1 min-w-[36px] text-center">{signatureGap}px</span>
                  <button
                    type="button"
                    onClick={() => setSignatureGap(prev => Math.min(100, prev + 10))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Perlebar ruang TTD"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Jenis Huruf */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium">Font:</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Arial">Arial (Standar Modern)</option>
                    <option value="Times New Roman">Times New Roman (Klasik Dinas)</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
              </div>

              {/* Reset to Original Draft */}
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-all ml-auto"
                title="Kembalikan semua teks dan format ke draf awal"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Reset ke Draf Awal</span>
              </button>
            </motion.div>
          )}

          {/* Quick Rich Text Format Bar (Active when Edit Mode is On) */}
          {isEditMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-amber-950/30 border-b border-amber-500/30 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Edit3 className="w-3.5 h-3.5" />
                  Mode Edit Aktif:
                </span>
                <span className="text-[11px] text-amber-200/80">
                  Klik langsung pada teks/kata mana saja di kertas untuk mengedit, menambah, atau menghapus baris.
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => executeCommand('bold')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Tebal (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('italic')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Miring (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('underline')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Garis Bawah (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1"></div>

                <button
                  type="button"
                  onClick={() => executeCommand('justifyLeft')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Rata Kiri"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('justifyCenter')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Rata Tengah"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('justifyRight')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Rata Kanan"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand('justifyFull')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  title="Rata Kiri Kanan (Justify)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Live Document Preview & Editable Canvas */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/60 custom-scrollbar flex justify-center items-start">
            <div 
              ref={contentEditableRef}
              contentEditable={isEditMode}
              suppressContentEditableWarning={true}
              onInput={handleContentInput}
              onBlur={handleContentInput}
              className={`w-full ${orientation === 'landscape' ? 'max-w-[1040px]' : 'max-w-[780px]'} bg-white text-black rounded shadow-2xl min-h-[560px] transition-all overflow-x-auto outline-none ${
                isEditMode 
                  ? 'ring-2 ring-amber-500/80 cursor-text select-text focus:ring-4 focus:ring-amber-400' 
                  : 'select-text'
              }`}
              style={{
                fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : fontFamily + ', Arial, sans-serif',
                fontSize: `${fontSizePercent}%`,
                lineHeight: lineHeight,
                padding: `${paperPadding}px`,
                boxShadow: isEditMode 
                  ? '0 0 0 3px rgba(245, 158, 11, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.7)' 
                  : '0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 10px 15px -5px rgba(0, 0, 0, 0.3)'
              }}
              dangerouslySetInnerHTML={{ __html: currentHtml }}
            />
          </div>

          {/* Dynamic Style Injection for live DOM preview (Signature gap & Line height overrides) */}
          <style>{`
            ${contentEditableRef.current ? `
              div[ref] p, div[ref] td, div[ref] th, div[ref] li {
                line-height: ${lineHeight} !important;
              }
            ` : ''}
          `}</style>

          {/* Footer Note */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                <strong>Pratinjau Interaktif:</strong> Anda dapat mengedit kata secara langsung, mengatur spasi baris ({lineHeight}x), ukuran font ({fontSizePercent}%), dan margin kertas ({paperPadding}px).
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perubahan Teks Tersimpan
                </span>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1 text-slate-400 hover:text-white rounded text-xs transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

