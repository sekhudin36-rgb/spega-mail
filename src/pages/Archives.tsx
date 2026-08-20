import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Archive, COMMON_LETTER_CODES, seedCompleteSchoolData } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive as ArchiveIcon, Plus, FileText, Search, Edit2, 
  Trash2, X, Download, FileJson, Calendar, Settings, Image as ImageIcon,
  Printer, Eye, MapPin, Tag, Info, FileDown, UploadCloud, FileSpreadsheet, LayoutGrid, List as ListIcon, MoreVertical, Filter, Cloud, Database, Sparkles, AlertCircle, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useConfirm } from '../components/ConfirmProvider';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import GoogleDriveModal from '../components/GoogleDriveModal';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { generateArchiveCardHTML, getSchoolConfig, printHTMLContent } from '../lib/printHelper';

const CATEGORIES = [
  'Semua', 'Kepegawaian', 'Kesiswaan', 'Keuangan', 'Kurikulum', 
  'Sarana Prasarana', 'Persuratan (SK/Tugas)', 'Sertifikat / Piagam', 'Laporan & Jurnal', 'Aset & Inventaris', 'Lainnya'
];

const generateCardHTML = (archive: Archive, asWord: boolean, adminName: string, adminNip: string, schoolName: string, schoolAddress: string, schoolContact: string) => {
    const dateStr = format(new Date(archive.date), 'dd MMMM yyyy', { locale: localeId });
    const judulDoc = archive.title || '-';
    const schoolKop = localStorage.getItem('schoolKop') || 'PEMERINTAH KABUPATEN / KOTA\nDINAS PENDIDIKAN';
    const kopLines = schoolKop.split('\n').filter(l => l.trim() !== '');
    const kopHtml = kopLines.map(line => `<h2>${line}</h2>`).join('');

    const htmlHead = asWord ? 
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
         <head><meta charset="utf-8"><title>Kartu Arsip</title>` :
        `<html><head><meta charset="utf-8"><title>Kartu Arsip</title>`;

    const sharedCSS = `
        body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: black; background: white; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        .kop { text-align: center; border-bottom: 3px solid black; padding-bottom: 5px; margin-bottom: 10px; position: relative; }
        .kop::after { content: ""; position: absolute; bottom: -4px; left: 0; width: 100%; border-bottom: 1px solid black; }
        .kop h2 { margin: 0; font-size: 11pt; text-transform: uppercase; font-weight: normal; font-family: Arial, sans-serif; }
        .kop h1 { margin: 2px 0; font-size: 14pt; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; }
        .kop p { margin: 0; font-size: 9pt; font-family: Arial, sans-serif; }
        
        .title-section { text-align: center; margin-bottom: 8px; }
        .title-section h3 { margin: 0; font-size: 12pt; font-weight: bold; text-decoration: underline; }
        
        .content-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
        .content-table td { padding: 3px 0; vertical-align: top; border: none; }
        .label-col { width: 140px; font-weight: bold; }
        .colon-col { width: 15px; text-align: center; font-weight: bold; }
        .value-col { border-bottom: 1px dotted #ccc; }
        
        .info-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .info-table td { border: 1px solid black; padding: 4px; width: 25%; text-align: center; }
        .info-label { display: block; font-size: 8pt; text-transform: uppercase; color: #555; margin-bottom: 2px; }
        .info-value { font-size: 10pt; font-weight: bold; }

        .signature-table { width: 100%; border: none; }
        .signature-table td { border: none; }
    `;

    const getCardContent = () => `
        <div class="card" ${asWord ? 'style="border: 2px solid black; padding: 10mm; margin-bottom: 5mm;"' : ''}>
          <div class="kop">
            ${kopHtml}
            <h1>${schoolName}</h1>
            <p>${schoolAddress}</p>
            <p style="font-style: italic;">${schoolContact}</p>
          </div>
          
          <div class="title-section">
            <h3>KARTU ARSIP DOKUMEN</h3>
          </div>

          <table class="content-table">
            <tr><td class="label-col">Kode Klasifikasi</td><td class="colon-col">:</td><td class="value-col" style="font-family: monospace; font-weight: bold; font-size: 12pt;">${archive.classificationCode || '-'}</td></tr>
            <tr><td class="label-col">Indeks / Judul</td><td class="colon-col">:</td><td class="value-col" style="font-weight: bold;">${judulDoc}</td></tr>
            <tr><td class="label-col">Isi Ringkas</td><td class="colon-col">:</td><td class="value-col">${(archive.description || '-').replace(/\n/g, '<br/>')}</td></tr>
            <tr><td class="label-col">Nomor Dokumen</td><td class="colon-col">:</td><td class="value-col">${archive.referenceNumber || '-'}</td></tr>
            <tr><td class="label-col">Tanggal</td><td class="colon-col">:</td><td class="value-col">${dateStr}</td></tr>
            <tr><td class="label-col">Lokasi Simpan Fisik</td><td class="colon-col">:</td><td class="value-col" style="font-style: italic; font-weight: bold;">${archive.storageLocation || '-'}</td></tr>
          </table>

          <table class="info-table">
            <tr>
              <td><span class="info-label">Kategori</span><span class="info-value">${archive.category}</span></td>
              <td><span class="info-label">Tingkat Perk.</span><span class="info-value">${archive.developmentLevel || 'Asli'}</span></td>
              <td><span class="info-label">Jumlah</span><span class="info-value">${archive.amount || '1 Berkas'}</span></td>
              <td><span class="info-label">Kondisi</span><span class="info-value">${archive.condition || 'Baik'}</span></td>
            </tr>
          </table>

           <table class="signature-table" ${asWord ? 'style="margin-top: 30px;"' : 'style="margin-top: auto;"'}>
              <tr>
                <td style="width: 60%;"></td>
                <td style="text-align: center; vertical-align: bottom; height: 60px;">
                  <p style="margin: 0 0 40px 0;">Petugas Administrasi / Arsiparis</p>
                  <p style="margin: 0; font-weight: bold; text-decoration: underline;">${adminName}</p>
                  <p style="margin: 0; font-size: 10pt;">NIP. ${adminNip}</p>
                </td>
              </tr>
            </table>
        </div>
    `;

    const printLayoutCSS = `
         @media print {
            @page { size: A4 portrait; margin: 0 !important; }
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { width: 210mm; height: 296mm; padding: 12mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; page-break-after: always; overflow: hidden; }
            .card { flex: 1; border: 2px solid black; padding: 7mm; display: flex; flex-direction: column; overflow: hidden; position: relative; max-height: calc(50% - 4mm); }
            .cut-line { display: block; border-top: 1px dashed black; margin: auto 0; position: relative; text-align: center; height: 0; }
            .cut-line::after { content: "----------------------- potong di sini -----------------------"; font-size: 10px; background: white; padding: 0 10px; position: relative; top: -7px; color: #666; font-family: monospace; }
         }
         @media screen {
            body { background: #525659; padding: 20px; display: flex; justify-content: center; min-height: 100vh; margin: 0; align-items: flex-start; }
            .page { background: white; width: 210mm; height: 297mm; padding: 15mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            .card { flex: 1; border: 2px solid black; padding: 7mm; display: flex; flex-direction: column; overflow: hidden; position: relative; max-height: calc(50% - 4mm); }
            .cut-line { display: block; border-top: 1px dashed black; margin: auto 0; position: relative; text-align: center; height: 0; }
            .cut-line::after { content: "----------------------- potong di sini -----------------------"; font-size: 10px; background: white; padding: 0 10px; position: relative; top: -7px; color: #666; font-family: monospace; }
         }
    `;

    return `
      ${htmlHead}
        <style>
         ${sharedCSS}
         ${!asWord ? printLayoutCSS : ''}
        </style>
      </head>
      <body>
        ${!asWord ? `
        <div class="page">
          ${getCardContent()}
          <div class="cut-line"></div>
          ${getCardContent()}
        </div>
        ` : `
        ${getCardContent()}
        <br/>
        <hr style="border-top: 1px dashed black;"/>
        <br/>
        ${getCardContent()}
        `}
      </body>
      </html>
    `;
};

export default function Archives() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Archive | null>(null);
  const [viewingArchive, setViewingArchive] = useState<Archive | null>(null);
  const [exportArchive, setExportArchive] = useState<Archive | null>(null);
  const [driveModalArchive, setDriveModalArchive] = useState<Archive | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const fileImportRef = useRef<HTMLInputElement>(null);
  
  const { confirm } = useConfirm();
  const rawArchives = useLiveQuery(() => db.archives.toArray()) || [];

  const handleSeedData = async () => {
    try {
      const result = await seedCompleteSchoolData(false);
      if (result.lettersCount > 0 || result.archivesCount > 0) {
        toast.success(`Berhasil memuat ${result.archivesCount} arsip dan ${result.lettersCount} register surat!`);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } else {
        toast.success('Data arsip dokumen sekolah sudah lengkap!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui data arsip');
    }
  };
  
  const adminName = localStorage.getItem('adminName') || 'Administrator';
  const adminNip = localStorage.getItem('adminNip') || '-';
  const schoolName = localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS';
  const schoolAddress = localStorage.getItem('schoolAddress') || 'Jl. Pendidikan No. 1, Kota Bangsa';
  const schoolContact = localStorage.getItem('schoolContact') || 'Telp: (021) 1234567 | Email: info@sekolah.sch.id';

  const availableYears = Array.from(new Set(rawArchives.map(a => new Date(a.date).getFullYear().toString()))).sort((a,b)=>b.localeCompare(a));

  const archives = rawArchives
    .filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (a.classificationCode?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || a.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || (a.status || 'Aktif') === selectedStatus;
      const matchYear = selectedYear === 'all' || new Date(a.date).getFullYear().toString() === selectedYear;
      return matchSearch && matchCategory && matchStatus && matchYear;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      return 0;
    });

  const handlePrintDirect = async () => {
    if (!exportArchive) return;
    try {
      const content = generateCardHTML(exportArchive, false, adminName, adminNip, schoolName, schoolAddress, schoolContact);
      await printHTMLContent(content, `Kartu_Arsip_${exportArchive.title}`);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mencetak kartu arsip');
    }
  };

  const handleExportWord = () => {
    if (!exportArchive) return;
    
    const content = generateCardHTML(exportArchive, true, adminName, adminNip, schoolName, schoolAddress, schoolContact);
    
    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kartu_Arsip_${exportArchive.title.replace(/[^a-z0-9]/gi, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Kartu Arsip diexport ke Word');
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Kode Klasifikasi', 'Indeks / Judul', 'Kategori', 'Nomor Dokumen', 'Tanggal', 'Tingkat Perk.', 'Jumlah', 'Kondisi', 'Lokasi Simpan', 'Status', 'Deskripsi'];
    const rows = archives.map((a, i) => [
      i + 1,
      `"${a.classificationCode || ''}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.referenceNumber || ''}"`,
      `"${format(new Date(a.date), 'dd/MM/yyyy')}"`,
      `"${a.developmentLevel || ''}"`,
      `"${a.amount || ''}"`,
      `"${a.condition || ''}"`,
      `"${a.storageLocation || ''}"`,
      `"${a.status || ''}"`,
      `"${(a.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Arsip_Dokumen_${format(new Date(), 'ddMMyyyy')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Laporan Arsip berhasil diexport (CSV)');
    setIsToolsOpen(false);
  };

  const handleExportExcel = () => {
    const data = archives.map((a, i) => ({
      'No': i + 1,
      'Kode Klasifikasi': a.classificationCode || '',
      'Indeks / Judul Document': a.title,
      'Kategori': a.category,
      'Nomor Dokumen': a.referenceNumber || '',
      'Tanggal': format(new Date(a.date), 'dd/MM/yyyy'),
      'Tingkat Perk.': a.developmentLevel || '',
      'Jumlah': a.amount || '',
      'Kondisi': a.condition || '',
      'Lokasi Simpan Fisik': a.storageLocation || '',
      'Status': a.status || 'Aktif',
      'Deskripsi': a.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Arsip");
    XLSX.writeFile(wb, `Laporan_Arsip_Dokumen_${format(new Date(), 'ddMMyyyy')}.xlsx`);
    toast.success('Laporan Arsip berhasil diexport (Excel)');
    setIsToolsOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('LAPORAN ARSIP DOKUMEN', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const tableColumn = ["No", "Kode Klasifikasi", "Indeks / Judul", "Kategori", "Nomor Dokumen", "Tanggal", "Lokasi Simpan", "Status"];
    const tableRows = archives.map((a, i) => [
      i + 1,
      a.classificationCode || '-',
      a.title,
      a.category,
      a.referenceNumber || '-',
      format(new Date(a.date), 'dd/MM/yyyy'),
      a.storageLocation || '-',
      a.status || 'Aktif'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 62, 80] }
    });

    doc.save(`Laporan_Arsip_Dokumen_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast.success('Laporan Arsip berhasil diexport (PDF)');
    setIsToolsOpen(false);
  };

  const handleBackupJSON = () => {
    const blob = new Blob([JSON.stringify(rawArchives, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Data_Arsip_${format(new Date(), 'ddMMyyyy')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Data Arsip berhasil dibackup (JSON)');
    setIsToolsOpen(false);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (await confirm({
      title: "Restore Data Arsip",
      message: "Data arsip yang ada akan ditimpa dengan data dari file backup ini. Apakah Anda yakin ingin melanjutkan?",
      confirmText: "Ya, Restore",
      cancelText: "Batal",
      type: "danger"
    })) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedData)) {
            await db.archives.clear();
            
            // Remove id from imported data to auto-increment properly, or keep it if restoring exact state.
            // Using bulkAdd without keys will preserve the IDs if they exist.
            await db.archives.bulkAdd(importedData);
            
            toast.success('Data Arsip berhasil di-restore!');
          } else {
             toast.error('Format file tidak valid. Pastikan ini adalah file backup arsip (.json).');
          }
        } catch (error) {
          toast.error('Gagal me-restore data. File mungkin rusak atau tidak valid.');
        }
      };
      reader.readAsText(file);
    }
    
    // reset file input
    if (fileImportRef.current) fileImportRef.current.value = '';
    setIsToolsOpen(false);
  };

  const handleDownload = (archive: Archive) => {
    if (!archive.fileData) {
      toast.error('File tidak tersedia');
      return;
    }
    const a = document.createElement('a');
    a.href = archive.fileData;
    a.download = archive.fileName || `document-${archive.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: number) => {
    if (await confirm({
      title: "Hapus Arsip",
      message: "Apakah Anda yakin ingin menghapus dokumen arsip ini? Data yang dihapus tidak dapat dikembalikan.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      type: "danger"
    })) {
      await db.archives.delete(id);
      toast.success('Arsip berhasil dihapus');
      if (viewingArchive?.id === id) setIsDetailOpen(false);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileJson className="w-5 h-5 text-slate-400" />;
    if (fileType.includes('image')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    return <FileText className="w-5 h-5 text-sky-400" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Aktif': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Inaktif': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Dimusnahkan': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Permanen': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      default: return 'text-slate-300 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="relative">
      <input type="file" ref={fileImportRef} onChange={handleImportJSON} className="hidden" accept=".json" />
      
      {/* MAIN VIEW */}
      <div className="p-4 md:p-8 space-y-6">
        <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-30">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ArchiveIcon className="w-8 h-8 text-sky-400" style={{ color: 'var(--accent-text)' }} />
              Daftar Arsip Dokumen
            </h1>
            <p className="text-slate-400 mt-1">Penyimpanan digital dan rekam jejak dokumen resmi institusi</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 relative">
            <button
              onClick={handleSeedData}
              className="glass-button flex items-center gap-2 px-4 py-2.5 rounded-xl !bg-amber-500/15 hover:!bg-amber-500/25 text-amber-300 border-amber-500/30 transition-all font-medium whitespace-nowrap"
              title="Lengkapi & Perbarui Data Contoh Arsip Resmi Sekolah"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Lengkapi Data Contoh</span>
            </button>

             <div className="relative">
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="glass-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all font-medium"
                >
                  <MoreVertical className="w-5 h-5" />
                  Alat & Laporan
                </button>
                
                 {isToolsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                     <div className="p-2 space-y-1">
                        <button onClick={handleExportPDF} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left text-sm text-slate-300 hover:text-white transition-colors">
                           <FileText className="w-4 h-4 text-rose-400" /> Export Laporan (PDF)
                        </button>
                        <button onClick={handleExportExcel} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left text-sm text-slate-300 hover:text-white transition-colors">
                           <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Laporan (Excel)
                        </button>
                        <button onClick={handleExportCSV} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left text-sm text-slate-300 hover:text-white transition-colors">
                           <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Laporan (CSV)
                        </button>
                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                        <button onClick={handleBackupJSON} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left text-sm text-slate-300 hover:text-white transition-colors">
                           <Download className="w-4 h-4 text-sky-400" /> Backup Data (JSON)
                        </button>
                        <button onClick={() => fileImportRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left text-sm text-slate-300 hover:text-white transition-colors">
                           <UploadCloud className="w-4 h-4 text-amber-400" /> Restore Data (JSON)
                        </button>
                     </div>
                  </div>
                )}
             </div>

            <button
              onClick={() => {
                setEditingArchive(null);
                setIsModalOpen(true);
              }}
              className="glass-button flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all font-medium whitespace-nowrap"
              style={{ color: 'var(--accent-text)' }}
            >
              <Plus className="w-5 h-5" />
              Tambah Arsip
            </button>
          </div>
        </div>

        {/* Quick Stats Summary Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ArchiveIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Dokumen Arsip</p>
              <p className="text-xl font-bold text-white">{rawArchives.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Arsip Aktif</p>
              <p className="text-xl font-bold text-emerald-300">{rawArchives.filter(a => (a.status || 'Aktif') === 'Aktif').length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Arsip Inaktif / Pasif</p>
              <p className="text-xl font-bold text-amber-300">{rawArchives.filter(a => a.status === 'Inaktif').length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Arsip Permanen / Abadi</p>
              <p className="text-xl font-bold text-purple-300">{rawArchives.filter(a => a.status === 'Permanen').length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="glass-panel relative flex-1 flex items-center min-w-[250px]">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, nomor, atau kode klasifikasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-12 w-full border-none ring-0 focus:ring-0 rounded-xl"
            />
          </div>
          
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn("glass-panel px-4 py-2 flex items-center gap-2 transition-colors", isFiltersOpen ? "bg-white/10 text-white" : "text-slate-300 hover:text-white")}
          >
            <Filter className="w-5 h-5" />
            Filter { (selectedCategory !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all' || sortBy !== 'date-desc') && <span className="w-2 h-2 rounded-full bg-sky-400"></span> }
          </button>

          <div className="glass-panel p-1 flex gap-1">
             <button
               onClick={() => setViewMode('grid')}
               className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
               title="Tampilan Grid (Kartu)"
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button
               onClick={() => setViewMode('table')}
               className={cn("p-2 rounded-lg transition-colors", viewMode === 'table' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
               title="Tampilan Tabel (Daftar)"
             >
               <ListIcon className="w-5 h-5" />
             </button>
          </div>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Kategori</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    {CATEGORIES.map((cat) => {
                       const val = cat.toLowerCase() === 'semua' ? 'all' : cat;
                       return <option key={cat} value={val} className="text-black">{cat}</option>;
                    })}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Status</label>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua</option>
                    <option value="Aktif" className="text-black">Aktif</option>
                    <option value="Inaktif" className="text-black">Inaktif</option>
                    <option value="Dimusnahkan" className="text-black">Dimusnahkan</option>
                    <option value="Permanen" className="text-black">Permanen</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Tahun</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua Tahun</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="text-black">{year}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Urutkan</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="date-desc" className="text-black">Tanggal Terbaru</option>
                    <option value="date-asc" className="text-black">Tanggal Terlama</option>
                    <option value="title-asc" className="text-black">Judul (A-Z)</option>
                    <option value="title-desc" className="text-black">Judul (Z-A)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {archives.map((archive) => (
              <motion.div
                key={archive.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-6 flex flex-col group relative overflow-hidden transition-all hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                    {getFileIcon(archive.fileType)}
                  </div>
                  <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setExportArchive(archive)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                      title="Cetak/Export Kartu Arsip"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewingArchive(archive);
                        setIsDetailOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDriveModalArchive(archive);
                        setIsDriveModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                      title="Simpan ke Google Drive"
                    >
                      <Cloud className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingArchive(archive);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(archive.id!)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                      {archive.category}
                    </span>
                    <span className={cn("inline-block px-2.5 py-1 rounded-md border text-xs font-medium", getStatusColor(archive.status))}>
                      {archive.status || 'Aktif'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{archive.title}</h3>
                  
                  {(archive.referenceNumber || archive.classificationCode) && (
                    <p className="text-sm text-slate-400 font-mono mb-2">
                      {archive.classificationCode && <span className="text-sky-300 mr-2">[{archive.classificationCode}]</span>}
                      {archive.referenceNumber}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{archive.description}</p>
                </div>

                <div className="pt-4 mt-auto border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(archive.date), 'dd MMM yyyy', { locale: localeId })}
                  </div>
                  {archive.storageLocation ? (
                    <div className="flex items-center gap-1.5 max-w-[120px] truncate" title={archive.storageLocation}>
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{archive.storageLocation}</span>
                    </div>
                  ) : archive.fileName ? (
                    <div className="flex items-center gap-1.5 max-w-[120px] truncate" title={archive.fileName}>
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{archive.fileName}</span>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
            {archives.length === 0 && (
              <div className="col-span-full glass-panel p-12 text-center">
                <ArchiveIcon className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40" />
                <h3 className="text-lg font-semibold text-white mb-1">Belum ada arsip dokumen</h3>
                <p className="text-sm text-slate-400 mb-6">Mulai tambahkan arsip dokumen sekolah atau muat contoh data standar resmi.</p>
                <button
                  type="button"
                  onClick={handleSeedData}
                  className="glass-button !bg-sky-500 hover:!bg-sky-600 !text-white text-sm font-medium px-5 py-2.5 inline-flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Muat Contoh Data Arsip Sekolah
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel overflow-hidden w-full">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-sm font-medium tracking-wide">
                       <th className="p-4 px-6">Klasifikasi & Nomor</th>
                       <th className="p-4">Indeks / Judul Dokumen</th>
                       <th className="p-4">Kategori</th>
                       <th className="p-4">Tanggal</th>
                       <th className="p-4">Lokasi Simpan (Fisik)</th>
                       <th className="p-4">Status</th>
                       <th className="p-4 pr-6 text-center">Aksi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {archives.map(a => (
                     <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                       <td className="p-4 px-6">
                         <div className="font-mono text-sky-300 text-sm">{a.classificationCode || '-'}</div>
                         <div className="text-xs text-slate-400">{a.referenceNumber || '-'}</div>
                       </td>
                       <td className="p-4">
                         <div className="flex items-center gap-3">
                           {getFileIcon(a.fileType)}
                           <div className="max-w-[250px] truncate w-full text-white font-medium" title={a.title}>{a.title}</div>
                         </div>
                       </td>
                       <td className="p-4">
                         <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                           {a.category}
                         </span>
                       </td>
                       <td className="p-4 text-sm text-slate-300">
                         {format(new Date(a.date), 'dd MMM yyyy', { locale: localeId })}
                       </td>
                       <td className="p-4 text-sm text-slate-300 truncate max-w-[180px]" title={a.storageLocation}>
                         {a.storageLocation || '-'}
                       </td>
                       <td className="p-4">
                         <span className={cn("px-2.5 py-1 rounded-md border text-xs font-medium", getStatusColor(a.status))}>
                           {a.status || 'Aktif'}
                         </span>
                       </td>
                       <td className="p-4 pr-6">
                         <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setExportArchive(a)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Export Kartu">
                             <Printer className="w-4 h-4" />
                           </button>
                           <button onClick={() => { setViewingArchive(a); setIsDetailOpen(true); }} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors" title="Detail">
                             <Eye className="w-4 h-4" />
                           </button>
                           <button onClick={() => { setDriveModalArchive(a); setIsDriveModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors" title="Simpan ke Google Drive">
                             <Cloud className="w-4 h-4" />
                           </button>
                           <button onClick={() => { setEditingArchive(a); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Edit">
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDelete(a.id!)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors" title="Hapus">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {archives.length === 0 && (
                     <tr>
                       <td colSpan={7} className="p-12 text-center text-slate-400">
                         <ArchiveIcon className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-40" />
                         <p className="font-medium text-slate-300 mb-1">Tidak ada data arsip dokumen yang terdaftar.</p>
                         <p className="text-xs text-slate-400 mb-4">Klik tombol di bawah untuk mengisi data arsip standar resmi sekolah.</p>
                         <button
                           type="button"
                           onClick={handleSeedData}
                           className="glass-button !bg-sky-500 hover:!bg-sky-600 !text-white text-xs font-medium px-4 py-2"
                         >
                           <Database className="w-3.5 h-3.5 mr-1.5" />
                           Muat Contoh Data Arsip Sekolah
                         </button>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {isDetailOpen && viewingArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-sky-400" /> Detail Arsip Dokumen
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExportArchive(viewingArchive)}
                    className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex gap-2 items-center text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak / Export
                  </button>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{viewingArchive.title}</h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full badge-glass bg-white/5 border-white/10 text-sm text-slate-300">
                        {viewingArchive.category}
                      </span>
                      <span className={cn("px-3 py-1 rounded-full badge-glass text-sm border font-medium", getStatusColor(viewingArchive.status))}>
                        {viewingArchive.status || 'Aktif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDriveModalArchive(viewingArchive);
                        setIsDriveModalOpen(true);
                      }}
                      className="glass-button flex flex-col items-center p-3 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-all font-medium"
                      title="Simpan ke Google Drive"
                    >
                      <Cloud className="w-5 h-5 mb-1" />
                      <span className="text-xs">Google Drive</span>
                    </button>
                    {viewingArchive.fileData && (
                      <button
                        onClick={() => handleDownload(viewingArchive)}
                        className="glass-button flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium"
                      >
                        <Download className="w-5 h-5 mb-1" />
                        <span className="text-xs">Unduh File</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Kode Klasifikasi" value={viewingArchive.classificationCode || '-'} icon={<Tag className="w-4 h-4 text-slate-400" />} />
                  <DetailItem label="Nomor Dokumen" value={viewingArchive.referenceNumber || '-'} icon={<FileText className="w-4 h-4 text-slate-400" />} />
                  <DetailItem label="Tanggal Dokumen" value={format(new Date(viewingArchive.date), 'dd MMMM yyyy', { locale: localeId })} icon={<Calendar className="w-4 h-4 text-slate-400" />} />
                  <DetailItem label="Lokasi Simpan (Fisik)" value={viewingArchive.storageLocation || '-'} icon={<MapPin className="w-4 h-4 text-slate-400" />} />
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Informasi Fisik Arsip</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="block text-xs uppercase text-slate-500 mb-1">Tingkat Perk.</span>
                      <span className="font-medium text-white">{viewingArchive.developmentLevel || 'Asli'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-slate-500 mb-1">Jumlah</span>
                      <span className="font-medium text-white">{viewingArchive.amount || '1 Berkas'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-slate-500 mb-1">Kondisi</span>
                      <span className="font-medium text-white">{viewingArchive.condition || 'Baik'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Deskripsi / Uraian Informasi</h4>
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-slate-300 min-h-[80px]">
                     {viewingArchive.description || <span className="italic opacity-50">Tidak ada deskripsi.</span>}
                  </div>
                </div>
                
                {viewingArchive.fileName && (
                   <div>
                     <h4 className="text-sm font-medium text-slate-400 mb-2">File Lampiran</h4>
                     <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                       {getFileIcon(viewingArchive.fileType)}
                       <span className="text-sm font-medium text-white">{viewingArchive.fileName}</span>
                     </div>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingArchive ? 'Edit Data Arsip' : 'Tambah Arsip Dokumen Entry Data'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto w-full">
                <ArchiveForm 
                  initialData={editingArchive} 
                  onSubmit={async (data) => {
                    try {
                      if (editingArchive?.id) {
                        await db.archives.update(editingArchive.id, data);
                        toast.success('Dokuemen berhasil diperbarui');
                      } else {
                        await db.archives.add({ ...data, createdAt: new Date().toISOString() });
                        toast.success('Dokuemen berhasil ditambahkan');
                      }
                      setIsModalOpen(false);
                    } catch (e) {
                      toast.error('Gagal menyimpan dokumen');
                    }
                  }}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT PREVIEW & EXPORT MODAL */}
      <PrintPreviewModal
        isOpen={!!exportArchive}
        onClose={() => setExportArchive(null)}
        title={`Kartu Arsip - ${exportArchive?.title || ''}`}
        subtitle={`Pratinjau & Pencetakan Kartu Arsip Dokumen Resmi`}
        htmlContent={exportArchive ? generateCardHTML(exportArchive, false, adminName, adminNip, schoolName, schoolAddress, schoolContact) : ''}
        onDownloadPdf={() => {
          if (!exportArchive) return;
          handlePrintDirect();
        }}
        onDownloadWord={() => {
          if (!exportArchive) return;
          handleExportWord();
        }}
      />
      {/* Google Drive Upload Modal for Archive */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => {
          setIsDriveModalOpen(false);
          setDriveModalArchive(null);
        }}
        targetArchive={driveModalArchive}
        mode="single"
      />
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="p-2 bg-white/5 rounded-lg border border-white/10 h-min">
        {icon}
      </div>
      <div>
        <span className="block text-xs font-medium text-slate-400">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
    </div>
  );
}

function ArchiveForm({ initialData, onSubmit, onCancel }: { initialData: Archive | null, onSubmit: (d: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    classificationCode: initialData?.classificationCode || '',
    category: initialData?.category || 'Lainnya',
    referenceNumber: initialData?.referenceNumber || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    developmentLevel: initialData?.developmentLevel || 'Asli',
    amount: initialData?.amount || '1 Berkas',
    condition: initialData?.condition || 'Baik',
    storageLocation: initialData?.storageLocation || '',
    status: initialData?.status || 'Aktif',
    description: initialData?.description || '',
    fileData: initialData?.fileData || '',
    fileName: initialData?.fileName || '',
    fileType: initialData?.fileType || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Opps, ukuran file maksimal 5MB untuk kinerja stabil');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          fileData: event.target?.result as string,
          fileName: file.name,
          fileType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      
      {/* SECTION: IDENTITAS DOKUMEN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold tracking-wider text-sky-400 uppercase">Identitas Dokumen</h3>
          <span className="text-xs text-slate-400">Pilih kode klasifikasi standar di bawah untuk pengisian cepat</span>
        </div>

        {/* Quick Classification Chips */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {COMMON_LETTER_CODES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                let matchedCategory = 'Lainnya';
                if (item.code.startsWith('421.1') || item.code.startsWith('423')) matchedCategory = 'Kurikulum';
                else if (item.code.startsWith('421.2')) matchedCategory = 'Kesiswaan';
                else if (item.code.startsWith('421.3') || item.code.startsWith('800')) matchedCategory = 'Kepegawaian';
                else if (item.code.startsWith('421.4') || item.code.startsWith('028')) matchedCategory = 'Sarana Prasarana';
                else if (item.code.startsWith('422') || item.code.startsWith('900')) matchedCategory = 'Keuangan';
                else if (item.code.startsWith('005') || item.code.startsWith('420')) matchedCategory = 'Umum / TU';

                setFormData({
                  ...formData,
                  classificationCode: item.code,
                  category: matchedCategory
                });
              }}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5",
                formData.classificationCode === item.code
                  ? "bg-sky-500/20 border-sky-500 text-sky-300 font-medium"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"
              )}
            >
              <span className="font-mono font-semibold text-sky-400">{item.code}</span>
              <span className="truncate max-w-[140px]">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-medium text-slate-300">Indeks / Judul Dokumen <span className="text-rose-500">*</span></label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="glass-input w-full" placeholder="Contoh: SK Pembagian Tugas Genap 2024" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Kode Klasifikasi</label>
            <input type="text" value={formData.classificationCode} onChange={(e) => setFormData({ ...formData, classificationCode: e.target.value })} className="glass-input w-full font-mono text-sm" placeholder="Contoh: 421.3 / KP.01" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Kategori <span className="text-rose-500">*</span></label>
            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="glass-input w-full">
              {CATEGORIES.filter(c => c !== 'Semua').map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Nomor Dokumen</label>
            <input type="text" value={formData.referenceNumber} onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} className="glass-input w-full" placeholder="Nomor resmi jika ada" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Tanggal Dokumen <span className="text-rose-500">*</span></label>
            <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="glass-input w-full" />
          </div>
        </div>
      </div>

      {/* SECTION: FISIK & PENYIMPANAN */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-wider text-emerald-400 uppercase border-b border-white/10 pb-2">Informasi Fisik & Penyimpanan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-medium text-slate-300">Lokasi Simpan (Fisik) <span className="text-rose-500">*</span></label>
            <input type="text" required value={formData.storageLocation} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} className="glass-input w-full" placeholder="Contoh: Lemari 1, Ordner A / Laci Kepegawaian" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Lemari Arsip 01 / Rak Kurikulum', 'Ordner SK / Rak A1', 'Filing Cabinet GTK / Laci 02', 'Boks Arsip Sarpras / Rak B3', 'Ruang Kepala Sekolah / Brankas'].map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFormData({ ...formData, storageLocation: loc })}
                  className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-300 border border-white/5 transition-colors"
                >
                  + {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Tingkat Perkembangan</label>
            <select value={formData.developmentLevel} onChange={(e) => setFormData({ ...formData, developmentLevel: e.target.value })} className="glass-input w-full">
              <option value="Asli">Asli</option>
              <option value="Salinan">Salinan</option>
              <option value="Tembusan">Tembusan</option>
              <option value="Fotokopi">Fotokopi</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Jumlah / Volume</label>
            <input type="text" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="glass-input w-full" placeholder="Contoh: 1 Berkas, 2 Lembar" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Kondisi Fisik</label>
            <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="glass-input w-full">
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Status Retensi</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="glass-input w-full">
              <option value="Aktif">Aktif</option>
              <option value="Inaktif">Inaktif / Pasif</option>
              <option value="Dimusnahkan">Telah Dimusnahkan</option>
              <option value="Permanen">Arsip Permanen</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION: DESKRIPSI & LAMPIRAN */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-wider text-amber-400 uppercase border-b border-white/10 pb-2">Uraian & Lampiran Digital</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">Uraian Informasi / Deskripsi Singkat</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="glass-input w-full min-h-[80px]" placeholder="Ringkasan isi dokumen..." />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">File Dokumen Digital (Opsional, Maks 5MB)</label>
            <div className="w-full relative">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
              <div onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <ArchiveIcon className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="truncate">
                    {formData.fileName ? (
                      <p className="text-sm font-medium text-white truncate">{formData.fileName}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Pilih atau letakkan file di sini...</p>
                    )}
                    {formData.fileName && <p className="text-xs text-emerald-400 font-medium">File siap disimpan</p>}
                  </div>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium text-white whitespace-nowrap">Cari File</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-8 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 z-10 bg-slate-900 shadow-[-10px_-20px_30px_rgba(15,23,42,1)] py-4">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-medium transition-colors">Batal</button>
        <button type="submit" className="glass-button px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          {initialData ? 'Simpan Perubahan' : 'Tambahkan Arsip'}
        </button>
      </div>
    </form>
  )
}
