import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Printer, FileSpreadsheet, Calendar, ChevronDown, 
  Download, Inbox, Send, Archive as ArchiveIcon, BarChart3, 
  Search, Filter, CheckCircle2, AlertCircle, Sparkles, Building2,
  FolderOpen, Layers, Clock, Eye, RefreshCw, FileDown, ArrowUpDown
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { db, type Letter, type Archive } from '../lib/db';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { 
  getSchoolConfig, 
  generateAgendaReportHTML, 
  exportAgendaReportPDF,
  generateArchiveReportHTML,
  exportArchiveReportPDF,
  generateRekapSummaryHTML,
  exportRekapSummaryPDF
} from '../lib/printHelper';

type ReportTab = 'inbox' | 'outbox' | 'archives' | 'rekap';
type DatePreset = 'this-month' | 'last-month' | 'q1' | 'q2' | 'q3' | 'q4' | 'this-year' | 'all' | 'custom';

const ARCHIVE_CATEGORIES = [
  'Semua', 'Kepegawaian', 'Kesiswaan', 'Keuangan', 'Kurikulum', 
  'Sarana Prasarana', 'Persuratan (SK/Tugas)', 'Sertifikat / Piagam', 'Laporan & Jurnal', 'Aset & Inventaris', 'Lainnya'
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('inbox');
  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());

  // Additional Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');
  const [showOfficialKop, setShowOfficialKop] = useState<boolean>(true);

  // Print Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const config = getSchoolConfig();
  const schoolName = config.schoolName;
  const schoolKop = config.schoolKop;
  const address = config.address;
  const headmaster = config.headmaster;
  const headmasterNip = config.headmasterNip;
  const adminName = config.adminName;
  const adminNip = config.adminNip;

  // Live Query from Dexie
  const rawLetters = useLiveQuery(() => db.letters.toArray()) || [];
  const rawArchives = useLiveQuery(() => db.archives.toArray()) || [];

  // Handle Preset Changes
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const curYear = now.getFullYear();

    if (preset === 'this-month') {
      const first = new Date(curYear, now.getMonth(), 1);
      const last = new Date(curYear, now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else if (preset === 'last-month') {
      const first = new Date(curYear, now.getMonth() - 1, 1);
      const last = new Date(curYear, now.getMonth(), 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else if (preset === 'q1') {
      setStartDate(`${curYear}-01-01`);
      setEndDate(`${curYear}-03-31`);
    } else if (preset === 'q2') {
      setStartDate(`${curYear}-04-01`);
      setEndDate(`${curYear}-06-30`);
    } else if (preset === 'q3') {
      setStartDate(`${curYear}-07-01`);
      setEndDate(`${curYear}-09-30`);
    } else if (preset === 'q4') {
      setStartDate(`${curYear}-10-01`);
      setEndDate(`${curYear}-12-31`);
    } else if (preset === 'this-year') {
      setStartDate(`${curYear}-01-01`);
      setEndDate(`${curYear}-12-31`);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    const targetType = activeTab === 'inbox' ? 'inbox' : 'outbox';
    return rawLetters.filter(l => {
      if (l.type !== targetType) return false;
      const lDate = l.date ? new Date(l.date).toISOString().split('T')[0] : '';
      if (datePreset !== 'all' && (lDate < startDate || lDate > endDate)) return false;
      
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTitle = l.title?.toLowerCase().includes(query);
        const matchRef = l.referenceNumber?.toLowerCase().includes(query);
        const matchSender = l.senderOrRecipient?.toLowerCase().includes(query);
        const matchDisp = l.disposition?.toLowerCase().includes(query);
        if (!matchTitle && !matchRef && !matchSender && !matchDisp) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawLetters, activeTab, startDate, endDate, datePreset, searchTerm]);

  // Filtered Archives
  const filteredArchives = useMemo(() => {
    return rawArchives.filter(a => {
      const aDate = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
      if (datePreset !== 'all' && (aDate < startDate || aDate > endDate)) return false;

      if (selectedCategory !== 'Semua' && a.category !== selectedCategory) return false;
      if (selectedStatus !== 'Semua' && (a.status || 'Aktif') !== selectedStatus) return false;
      if (selectedCondition !== 'Semua' && (a.condition || 'Baik') !== selectedCondition) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTitle = a.title?.toLowerCase().includes(query);
        const matchCode = a.classificationCode?.toLowerCase().includes(query);
        const matchRef = a.referenceNumber?.toLowerCase().includes(query);
        const matchLoc = a.storageLocation?.toLowerCase().includes(query);
        const matchDesc = a.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchRef && !matchLoc && !matchDesc) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawArchives, startDate, endDate, datePreset, selectedCategory, selectedStatus, selectedCondition, searchTerm]);

  // Rekap Data for Selected Year
  const rekapLetters = useMemo(() => {
    return rawLetters.filter(l => new Date(l.date).getFullYear().toString() === selectedYear);
  }, [rawLetters, selectedYear]);

  const rekapArchives = useMemo(() => {
    return rawArchives.filter(a => new Date(a.date).getFullYear().toString() === selectedYear);
  }, [rawArchives, selectedYear]);

  // Handlers for Print / Export
  const handleOpenPrintPreview = () => {
    if (activeTab === 'inbox' || activeTab === 'outbox') {
      if (filteredLetters.length === 0) {
        toast.error('Tidak ada data surat pada filter periode ini untuk dicetak.');
        return;
      }
    } else if (activeTab === 'archives') {
      if (filteredArchives.length === 0) {
        toast.error('Tidak ada data arsip pada filter periode ini untuk dicetak.');
        return;
      }
    }
    setIsPrintModalOpen(true);
  };

  const handleExportPDF = () => {
    try {
      if (activeTab === 'inbox' || activeTab === 'outbox') {
        if (filteredLetters.length === 0) {
          toast.error('Tidak ada data surat pada periode ini.');
          return;
        }
        exportAgendaReportPDF(activeTab, filteredLetters, startDate, endDate);
        toast.success(`Buku Agenda ${activeTab === 'inbox' ? 'Surat Masuk' : 'Surat Keluar'} berhasil diunduh (PDF)`);
      } else if (activeTab === 'archives') {
        if (filteredArchives.length === 0) {
          toast.error('Tidak ada data arsip pada periode ini.');
          return;
        }
        exportArchiveReportPDF(filteredArchives, selectedCategory, selectedStatus, startDate, endDate);
        toast.success('Daftar Pertelaan Arsip berhasil diunduh (PDF)');
      } else if (activeTab === 'rekap') {
        exportRekapSummaryPDF(rekapLetters, rekapArchives, selectedYear);
        toast.success(`Rekapitulasi Persuratan Tahun ${selectedYear} berhasil diunduh (PDF)`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengunduh file PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      if (activeTab === 'inbox' || activeTab === 'outbox') {
        if (filteredLetters.length === 0) {
          toast.error('Tidak ada data surat untuk diekspor.');
          return;
        }
        const formattedData = filteredLetters.map((l, index) => {
          if (activeTab === 'inbox') {
            return {
              'No. Agenda': l.sequenceNumber || index + 1,
              'Tgl. Diterima': format(new Date(l.date), 'dd/MM/yyyy'),
              'Alamat Pengirim / Asal Surat': l.senderOrRecipient,
              'Tanggal Surat': l.documentDate ? format(new Date(l.documentDate), 'dd/MM/yyyy') : '-',
              'Nomor Surat': l.referenceNumber,
              'Kode Klasifikasi': l.code || '-',
              'Isi Ringkas / Perihal': l.title,
              'Lampiran': l.attachment || '-',
              'Diteruskan Kepada': l.addressedTo || '-',
              'Petunjuk Disposisi': l.disposition || '-',
              'Penerima / Keterangan': l.receivedBy || l.description || '-'
            };
          } else {
            return {
              'No. Agenda': l.sequenceNumber || index + 1,
              'Tgl. Pengiriman / Keluar': format(new Date(l.date), 'dd/MM/yyyy'),
              'Tujuan / Kepada Yth.': l.senderOrRecipient,
              'Tanggal Surat': l.documentDate ? format(new Date(l.documentDate), 'dd/MM/yyyy') : '-',
              'Nomor Surat': l.referenceNumber,
              'Kode Klasifikasi': l.code || '-',
              'Isi Ringkas / Perihal': l.title,
              'Lampiran': l.attachment || '-',
              'Unit Pengolah / Pembuat': l.processingUnit || l.addressedTo || 'Tata Usaha',
              'Keterangan / Ekspedisi': l.description || '-'
            };
          }
        });
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Agenda_${activeTab}`);
        XLSX.writeFile(workbook, `Buku_Agenda_${activeTab === 'inbox' ? 'Surat_Masuk' : 'Surat_Keluar'}_${startDate}_sd_${endDate}.xlsx`);
        toast.success('Buku Agenda Excel berhasil diunduh');
      } else if (activeTab === 'archives') {
        if (filteredArchives.length === 0) {
          toast.error('Tidak ada data arsip untuk diekspor.');
          return;
        }
        const formattedData = filteredArchives.map((a, index) => ({
          'No.': index + 1,
          'Kode Klasifikasi': a.classificationCode || '-',
          'Nomor Berkas / Ref': a.referenceNumber || '-',
          'Indeks & Judul Dokumen': a.title,
          'Uraian / Ringkasan Dokumen': a.description || '-',
          'Kategori Arsip': a.category,
          'Kurun Waktu (Tanggal)': format(new Date(a.date), 'dd/MM/yyyy'),
          'Tingkat Perkembangan': a.developmentLevel || 'Asli',
          'Jumlah / Volume': a.amount || '1 Berkas',
          'Kondisi Fisik': a.condition || 'Baik',
          'Lokasi Simpan Fisik': a.storageLocation || '-',
          'Status Retensi': a.status || 'Aktif',
          'Berkas Digital': a.fileData ? 'Ada Digital' : 'Fisik'
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pertelaan_Arsip');
        XLSX.writeFile(workbook, `Daftar_Pertelaan_Arsip_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast.success('Laporan Pertelaan Arsip Excel berhasil diunduh');
      } else if (activeTab === 'rekap') {
        // Multi sheet rekap
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const monthlyData = months.map((m, idx) => ({
          'Bulan': m,
          'Surat Masuk': rekapLetters.filter(l => l.type === 'inbox' && new Date(l.date).getMonth() === idx).length,
          'Surat Keluar': rekapLetters.filter(l => l.type === 'outbox' && new Date(l.date).getMonth() === idx).length,
          'Arsip Dokumen': rekapArchives.filter(a => new Date(a.date).getMonth() === idx).length
        }));
        const worksheet = XLSX.utils.json_to_sheet(monthlyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_${selectedYear}`);
        XLSX.writeFile(workbook, `Rekapitulasi_Persuratan_Kearsipan_${selectedYear}.xlsx`);
        toast.success('Rekapitulasi Excel berhasil diunduh');
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengekspor Excel');
    }
  };

  const handleExportWord = () => {
    try {
      let content = '';
      let filename = '';

      if (activeTab === 'inbox' || activeTab === 'outbox') {
        content = generateAgendaReportHTML(activeTab, filteredLetters, startDate, endDate);
        filename = `Buku_Agenda_${activeTab === 'inbox' ? 'Surat_Masuk' : 'Surat_Keluar'}_${startDate}_sd_${endDate}.doc`;
      } else if (activeTab === 'archives') {
        content = generateArchiveReportHTML(filteredArchives, selectedCategory, selectedStatus, startDate, endDate);
        filename = `Daftar_Pertelaan_Arsip_${format(new Date(), 'yyyyMMdd')}.doc`;
      } else if (activeTab === 'rekap') {
        content = generateRekapSummaryHTML(rekapLetters, rekapArchives, selectedYear);
        filename = `Rekapitulasi_Persuratan_Kearsipan_${selectedYear}.doc`;
      }

      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Dokumen Word berhasil diunduh');
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengunduh dokumen Word');
    }
  };

  // Get dynamic HTML for print preview modal
  const currentPrintHTML = useMemo(() => {
    if (activeTab === 'inbox' || activeTab === 'outbox') {
      return generateAgendaReportHTML(activeTab, filteredLetters, startDate, endDate);
    } else if (activeTab === 'archives') {
      return generateArchiveReportHTML(filteredArchives, selectedCategory, selectedStatus, startDate, endDate);
    } else if (activeTab === 'rekap') {
      return generateRekapSummaryHTML(rekapLetters, rekapArchives, selectedYear);
    }
    return '';
  }, [activeTab, filteredLetters, filteredArchives, rekapLetters, rekapArchives, startDate, endDate, selectedCategory, selectedStatus, selectedYear]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-sky-400" />
            Rekapitulasi & Agenda Laporan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Pusat penyusunan buku agenda surat, daftar pertelaan arsip dokumen, dan rekapitulasi eksekutif resmi SMPN 3 Kras.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            className="glass-button flex items-center justify-center gap-2 flex-1 md:flex-none !bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 text-sm font-medium"
            title="Ekspor format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={handleExportWord}
            className="glass-button flex items-center justify-center gap-2 flex-1 md:flex-none !bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20 text-sm font-medium"
            title="Ekspor format Word (.doc)"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh Word</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="glass-button flex items-center justify-center gap-2 flex-1 md:flex-none !bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20 text-sm font-medium"
            title="Unduh PDF Resmi Vektor Tajam"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={handleOpenPrintPreview}
            className="glass-button flex items-center justify-center gap-2 flex-1 md:flex-none !bg-sky-500/20 text-white border-sky-500/50 hover:bg-sky-500/30 text-sm font-medium"
            title="Pratinjau Kertas Putih & Cetak Resmi"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'inbox'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-lg shadow-sky-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Agenda Surat Masuk</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-sky-500/20 text-sky-200">
            {rawLetters.filter(l => l.type === 'inbox').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'outbox'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Agenda Surat Keluar</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-200">
            {rawLetters.filter(l => l.type === 'outbox').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('archives')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'archives'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-lg shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArchiveIcon className="w-4 h-4" />
          <span>Pertelaan & Laporan Arsip</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-200">
            {rawArchives.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'rekap'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekapitulasi & Statistik</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              {activeTab === 'rekap' ? 'Parameter Tahun Rekapitulasi' : 'Filter & Periode Laporan'}
            </span>
          </div>

          {/* Quick Date Presets (for non-rekap views) */}
          {activeTab !== 'rekap' && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-slate-400 py-1 mr-1">Preset:</span>
              {[
                { id: 'this-month', label: 'Bulan Ini' },
                { id: 'last-month', label: 'Bulan Lalu' },
                { id: 'this-year', label: 'Tahun Ini' },
                { id: 'all', label: 'Semua Data' },
                { id: 'custom', label: 'Kustom' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handleDatePresetChange(p.id as DatePreset)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    datePreset === p.id 
                      ? 'bg-sky-500 text-white font-medium shadow-sm' 
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'rekap' ? (
          /* Rekap Parameter */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase">Tahun Anggaran / Kalender</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="glass-input w-full"
              >
                {['2027', '2026', '2025', '2024', '2023', '2022'].map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center text-sm text-slate-400 bg-white/5 p-4 rounded-xl border border-white/10">
              <Sparkles className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
              <span>
                Rekapitulasi merangkum seluruh pergerakan surat masuk ({rekapLetters.filter(l => l.type === 'inbox').length}), surat keluar ({rekapLetters.filter(l => l.type === 'outbox').length}), serta inventarisasi arsip dokumen ({rekapArchives.length}) sepanjang tahun {selectedYear}.
              </span>
            </div>
          </div>
        ) : (
          /* Standard Filters */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="glass-input w-full"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="glass-input w-full"
              />
            </div>

            {/* If Archives View: Categories & Status Filters */}
            {activeTab === 'archives' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase">Kategori Arsip</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="glass-input w-full"
                  >
                    {ARCHIVE_CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase">Status Retensi</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="glass-input w-full"
                  >
                    {['Semua', 'Aktif', 'Inaktif', 'Permanen', 'Dimusnahkan'].map(s => (
                      <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              /* If Letters View: Search bar */
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase">Pencarian Cepat</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nomor surat, pengirim/tujuan, perihal, atau disposisi..."
                    className="glass-input w-full pl-9"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Secondary Search for Archives */}
        {activeTab === 'archives' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode klasifikasi, indeks judul dokumen, lokasi simpan fisik..."
                className="glass-input w-full pl-9 text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="glass-input w-full text-sm"
              >
                <option value="Semua" className="bg-slate-900 text-white">Semua Kondisi Fisik</option>
                <option value="Baik" className="bg-slate-900 text-white">Kondisi Baik</option>
                <option value="Rusak Ringan" className="bg-slate-900 text-white">Rusak Ringan</option>
                <option value="Rusak Berat" className="bg-slate-900 text-white">Rusak Berat</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === 'inbox' && (
          <>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{filteredLetters.length}</div>
                <div className="text-xs text-slate-400">Surat Masuk Terfilter</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {filteredLetters.filter(l => !!l.disposition).length}
                </div>
                <div className="text-xs text-slate-400">Telah Didisposisi</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {filteredLetters.filter(l => !l.disposition).length}
                </div>
                <div className="text-xs text-slate-400">Menunggu Disposisi</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {datePreset === 'all' ? 'Semua Waktu' : `${format(new Date(startDate), 'dd/MM/yy')} - ${format(new Date(endDate), 'dd/MM/yy')}`}
                </div>
                <div className="text-xs text-slate-400">Kurun Waktu Terpilih</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'outbox' && (
          <>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{filteredLetters.length}</div>
                <div className="text-xs text-slate-400">Surat Keluar Terfilter</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {new Set(filteredLetters.map(l => l.senderOrRecipient)).size}
                </div>
                <div className="text-xs text-slate-400">Instansi / Tujuan Unik</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {rawLetters.filter(l => l.type === 'outbox').length}
                </div>
                <div className="text-xs text-slate-400">Total Akumulasi Surat Keluar</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {datePreset === 'all' ? 'Semua Waktu' : `${format(new Date(startDate), 'dd/MM/yy')} - ${format(new Date(endDate), 'dd/MM/yy')}`}
                </div>
                <div className="text-xs text-slate-400">Kurun Waktu Terpilih</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'archives' && (
          <>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                <ArchiveIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{filteredArchives.length}</div>
                <div className="text-xs text-slate-400">Dokumen Arsip Terfilter</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {filteredArchives.filter(a => (a.status || 'Aktif') === 'Aktif').length}
                </div>
                <div className="text-xs text-slate-400">Arsip Aktif</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {filteredArchives.filter(a => (a.status || '') === 'Inaktif').length}
                </div>
                <div className="text-xs text-slate-400">Arsip Inaktif / Pasif</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {filteredArchives.filter(a => !!a.fileData).length}
                </div>
                <div className="text-xs text-slate-400">Berkas Digital Tersedia</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'rekap' && (
          <>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {rekapLetters.filter(l => l.type === 'inbox').length}
                </div>
                <div className="text-xs text-slate-400">Surat Masuk ({selectedYear})</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {rekapLetters.filter(l => l.type === 'outbox').length}
                </div>
                <div className="text-xs text-slate-400">Surat Keluar ({selectedYear})</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                <ArchiveIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{rekapArchives.length}</div>
                <div className="text-xs text-slate-400">Arsip Dokumen ({selectedYear})</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {rekapLetters.length + rekapArchives.length}
                </div>
                <div className="text-xs text-slate-400">Total Keseluruhan Berkas</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Table Display */}
      <div className="glass-panel overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              {activeTab === 'inbox' && 'Buku Agenda Surat Masuk'}
              {activeTab === 'outbox' && 'Buku Agenda Surat Keluar'}
              {activeTab === 'archives' && 'Daftar Pertelaan Arsip & Inventaris Dokumen'}
              {activeTab === 'rekap' && `Rekapitulasi Bulanan & Kategori Tahun ${selectedYear}`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({activeTab === 'rekap' ? `${rekapLetters.length} Surat, ${rekapArchives.length} Arsip` : `${activeTab === 'archives' ? filteredArchives.length : filteredLetters.length} Data`})
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>Standar Format Resmi ANRI & Dinas Pendidikan</span>
          </div>
        </div>

        {/* Dynamic Table Content */}
        <div className="overflow-x-auto">
          {activeTab === 'inbox' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-3 w-28">Tgl Terima</th>
                  <th className="py-3 px-3 w-48">Asal Surat / Pengirim</th>
                  <th className="py-3 px-3 w-24 text-center">Tgl Surat</th>
                  <th className="py-3 px-3 w-36">No. Surat</th>
                  <th className="py-3 px-4">Isi Ringkas / Perihal</th>
                  <th className="py-3 px-2 text-center w-16">Lamp.</th>
                  <th className="py-3 px-4 w-44">Diteruskan / Disposisi</th>
                  <th className="py-3 px-3 text-center w-28">Paraf / Penerima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Tidak ada data surat masuk yang sesuai dengan filter periode.
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((letter, idx) => (
                    <tr key={letter.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {letter.sequenceNumber || idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-white">
                        {format(new Date(letter.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-sky-300">{letter.senderOrRecipient}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-400">
                        {letter.documentDate ? format(new Date(letter.documentDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-300">{letter.referenceNumber}</td>
                      <td className="py-3 px-4 font-medium text-white break-words">
                        <div>{letter.title}</div>
                        {letter.code && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Kode: {letter.code}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-slate-400">
                        {letter.attachment || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {letter.addressedTo && (
                          <div className="font-semibold text-amber-300">{letter.addressedTo}</div>
                        )}
                        {letter.disposition ? (
                          <div className="text-[11px] text-slate-300 mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                            {letter.disposition}
                          </div>
                        ) : !letter.addressedTo && (
                          <span className="text-slate-500 italic">- Belum ada disposisi -</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-400">
                        {letter.receivedBy || letter.description || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'outbox' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-3 w-28">Tgl Keluar</th>
                  <th className="py-3 px-3 w-48">Tujuan / Kepada Yth.</th>
                  <th className="py-3 px-3 w-24 text-center">Tgl Surat</th>
                  <th className="py-3 px-3 w-36">No. Surat</th>
                  <th className="py-3 px-4">Isi Ringkas / Perihal</th>
                  <th className="py-3 px-2 text-center w-16">Lamp.</th>
                  <th className="py-3 px-3 w-36">Unit Pengolah</th>
                  <th className="py-3 px-4 w-36">Keterangan / Ekspedisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Tidak ada data surat keluar yang sesuai dengan filter periode.
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((letter, idx) => (
                    <tr key={letter.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {letter.sequenceNumber || idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-white">
                        {format(new Date(letter.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-300">{letter.senderOrRecipient}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-400">
                        {letter.documentDate ? format(new Date(letter.documentDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-300">{letter.referenceNumber}</td>
                      <td className="py-3 px-4 font-medium text-white break-words">
                        <div>{letter.title}</div>
                        {letter.code && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Kode: {letter.code}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-slate-400">
                        {letter.attachment || '-'}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-300">
                        {letter.processingUnit || letter.addressedTo || 'Tata Usaha'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {letter.description || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'archives' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-10">No.</th>
                  <th className="py-3 px-3 w-20">Kode</th>
                  <th className="py-3 px-3 w-28">No. Berkas</th>
                  <th className="py-3 px-4 min-w-[200px]">Indeks & Uraian Berkas</th>
                  <th className="py-3 px-3 w-24 text-center">Kurun Waktu</th>
                  <th className="py-3 px-2 w-16 text-center">Bentuk</th>
                  <th className="py-3 px-2 w-16 text-center">Jumlah</th>
                  <th className="py-3 px-2 w-16 text-center">Kondisi</th>
                  <th className="py-3 px-3 w-32">Lokasi Simpan</th>
                  <th className="py-3 px-2 w-16 text-center">Status</th>
                  <th className="py-3 px-2 w-14 text-center">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredArchives.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      Tidak ada dokumen arsip yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredArchives.map((archive, idx) => (
                    <tr key={archive.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-400 whitespace-nowrap">
                        {archive.classificationCode || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-400">
                        {archive.referenceNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{archive.title}</div>
                        {archive.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{archive.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-300">
                        {format(new Date(archive.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap text-slate-400">{archive.developmentLevel || 'Asli'}</td>
                      <td className="py-3 px-2 text-center whitespace-nowrap text-slate-400">{archive.amount || '1 Berkas'}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          (archive.condition || 'Baik') === 'Baik' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {archive.condition || 'Baik'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px] truncate max-w-[130px]" title={archive.storageLocation}>
                        {archive.storageLocation || '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          (archive.status || 'Aktif') === 'Aktif' 
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {archive.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {archive.fileData ? (
                          <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            Ada
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'rekap' && (
            <div className="p-6 space-y-8">
              {/* Monthly Stats Table */}
              <div>
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Alur Persuratan & Kearsipan Bulanan (Tahun {selectedYear})
                </h3>
                <div className="overflow-x-auto border border-white/10 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 font-semibold uppercase border-b border-white/10">
                        <th className="py-2.5 px-3 text-center w-12">No.</th>
                        <th className="py-2.5 px-4">Bulan</th>
                        <th className="py-2.5 px-4 text-center">Surat Masuk</th>
                        <th className="py-2.5 px-4 text-center">Surat Keluar</th>
                        <th className="py-2.5 px-4 text-center font-bold text-white">Sub Total Surat</th>
                        <th className="py-2.5 px-4 text-center text-teal-300">Arsip Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((mName, mIdx) => {
                        const inCount = rekapLetters.filter(l => l.type === 'inbox' && new Date(l.date).getMonth() === mIdx).length;
                        const outCount = rekapLetters.filter(l => l.type === 'outbox' && new Date(l.date).getMonth() === mIdx).length;
                        const archCount = rekapArchives.filter(a => new Date(a.date).getMonth() === mIdx).length;
                        return (
                          <tr key={mName} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{mIdx + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-white">{mName}</td>
                            <td className="py-2.5 px-4 text-center text-sky-300">{inCount}</td>
                            <td className="py-2.5 px-4 text-center text-emerald-300">{outCount}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-white">{inCount + outCount}</td>
                            <td className="py-2.5 px-4 text-center text-teal-300">{archCount}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-white/10 font-bold text-white border-t border-white/20">
                        <td colSpan={2} className="py-3 px-4 text-right">TOTAL AKUMULASI:</td>
                        <td className="py-3 px-4 text-center text-sky-300">{rekapLetters.filter(l => l.type === 'inbox').length}</td>
                        <td className="py-3 px-4 text-center text-emerald-300">{rekapLetters.filter(l => l.type === 'outbox').length}</td>
                        <td className="py-3 px-4 text-center text-purple-300">{rekapLetters.length}</td>
                        <td className="py-3 px-4 text-center text-teal-300">{rekapArchives.length}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> Distribusi Arsip Berdasarkan Kategori
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ARCHIVE_CATEGORIES.filter(c => c !== 'Semua').map(cat => {
                    const count = rekapArchives.filter(a => a.category === cat).length;
                    const pct = rekapArchives.length > 0 ? ((count / rekapArchives.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={cat} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-white">{cat}</div>
                          <div className="text-xs text-slate-400">{pct}% dari total arsip</div>
                        </div>
                        <div className="text-lg font-bold text-teal-300">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Print Preview & Direct Print Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={
          activeTab === 'inbox'
            ? 'Buku Agenda Surat Masuk'
            : activeTab === 'outbox'
            ? 'Buku Agenda Surat Keluar'
            : activeTab === 'archives'
            ? 'Daftar Pertelaan Arsip & Inventaris Dokumen'
            : `Rekapitulasi Persuratan & Kearsipan ${selectedYear}`
        }
        subtitle={
          activeTab === 'rekap'
            ? `Periode Tahun ${selectedYear} (${rekapLetters.length} Surat, ${rekapArchives.length} Arsip)`
            : `Periode: ${datePreset === 'all' ? 'Semua Waktu' : `${format(new Date(startDate), 'dd MMMM yyyy', { locale: localeId })} s.d. ${format(new Date(endDate), 'dd MMMM yyyy', { locale: localeId })}`}`
        }
        htmlContent={currentPrintHTML}
        onDownloadPdf={handleExportPDF}
        onDownloadWord={handleExportWord}
      />
    </div>
  );
}
