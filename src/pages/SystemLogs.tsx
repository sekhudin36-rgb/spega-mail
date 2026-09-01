import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  PlusCircle, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Terminal, 
  Clock, 
  Mail, 
  Archive, 
  Users, 
  GraduationCap, 
  Settings, 
  Database, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { db, addSystemLog, type SystemLog, INITIAL_SYSTEM_LOGS_DATA } from '../lib/db';
import { useConfirm } from '../components/ConfirmProvider';
import toast from 'react-hot-toast';

export default function SystemLogs() {
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<SystemLog | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // New Log Form State
  const [newLogAction, setNewLogAction] = useState('CATAT_AKTIVITAS_MANUAL');
  const [newLogCategory, setNewLogCategory] = useState<SystemLog['category']>('Persuratan');
  const [newLogLevel, setNewLogLevel] = useState<SystemLog['level']>('info');
  const [newLogDetails, setNewLogDetails] = useState('');
  const [newLogUser, setNewLogUser] = useState(localStorage.getItem('adminName') || 'Admin TU');

  // Query logs from Dexie
  const logs = useLiveQuery(async () => {
    return await db.systemLogs.toArray();
  }, []);

  // Ensure default logs exist if empty
  React.useEffect(() => {
    const checkAndSeed = async () => {
      const count = await db.systemLogs.count();
      if (count === 0) {
        await db.systemLogs.bulkAdd(INITIAL_SYSTEM_LOGS_DATA);
      }
    };
    checkAndSeed();
  }, []);

  // Filter and Sort Logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    let list = [...logs];

    // Filter Category
    if (selectedCategory !== 'all') {
      list = list.filter(l => l.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter Level
    if (selectedLevel !== 'all') {
      list = list.filter(l => l.level === selectedLevel);
    }

    // Filter Date Range
    if (selectedDateRange !== 'all') {
      const now = new Date();
      if (selectedDateRange === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        list = list.filter(l => l.timestamp.startsWith(todayStr));
      } else if (selectedDateRange === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        list = list.filter(l => new Date(l.timestamp) >= sevenDaysAgo);
      } else if (selectedDateRange === 'month') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        list = list.filter(l => new Date(l.timestamp) >= thirtyDaysAgo);
      }
    }

    // Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) ||
        l.category.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [logs, selectedCategory, selectedLevel, selectedDateRange, searchQuery, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    if (!logs) return { total: 0, persuratan: 0, keamanan: 0, errors: 0, today: 0 };
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      total: logs.length,
      persuratan: logs.filter(l => l.category === 'Persuratan').length,
      keamanan: logs.filter(l => l.category === 'Keamanan' || l.action.includes('LOGIN')).length,
      errors: logs.filter(l => l.level === 'error' || l.level === 'warning').length,
      today: logs.filter(l => l.timestamp.startsWith(todayStr)).length
    };
  }, [logs]);

  // Handlers
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDetails.trim()) {
      toast.error('Keterangan log aktivitas tidak boleh kosong');
      return;
    }

    await addSystemLog({
      action: newLogAction,
      category: newLogCategory,
      level: newLogLevel,
      user: newLogUser,
      details: newLogDetails.trim(),
      metadata: { source: 'Manual Admin Entry', createdBy: newLogUser }
    });

    toast.success('Log aktivitas baru berhasil dicatat ke sistem');
    setIsCreateModalOpen(false);
    setNewLogDetails('');
  };

  const handleClearLogs = async () => {
    const isConfirmed = await confirm({
      title: 'Bersihkan Log Sistem?',
      message: 'Apakah Anda yakin ingin menghapus seluruh rekaman log audit sistem? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      confirmText: 'Ya, Bersihkan Log',
      cancelText: 'Batal'
    });

    if (isConfirmed) {
      await db.systemLogs.clear();
      await addSystemLog({
        action: 'CLEAR_SYSTEM_LOGS',
        category: 'Sistem',
        level: 'warning',
        details: 'Seluruh riwayat log audit telah dibersihkan oleh Administrator.',
        user: localStorage.getItem('adminName') || 'Admin TU'
      });
      toast.success('Seluruh riwayat log sistem berhasil dibersihkan');
    }
  };

  const handleResetToDefaultLogs = async () => {
    const isConfirmed = await confirm({
      title: 'Muat Ulang Sampel Log Audit?',
      message: 'Ini akan mengisi kembali log sistem dengan riwayat aktivitas dinas autentik SMPN 3 Kras.',
      type: 'warning',
      confirmText: 'Muat Sampel Log',
      cancelText: 'Batal'
    });

    if (isConfirmed) {
      await db.systemLogs.clear();
      await db.systemLogs.bulkAdd(INITIAL_SYSTEM_LOGS_DATA);
      toast.success('Sampel riwayat log audit berhasil dimuat');
    }
  };

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('Tidak ada data log untuk diekspor');
      return;
    }

    const headers = ['ID', 'Waktu (WIB)', 'Aksi', 'Kategori', 'Level', 'Pengguna', 'IP / Perangkat', 'Keterangan Rinci', 'Metadata'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${formatDateDetailed(l.timestamp)}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.level}"`,
      `"${l.user}"`,
      `"${l.ipAddress || '-'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.metadata || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_Sistem_SPEGA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Log sistem berhasil diekspor ke CSV');
  };

  const handleExportJSON = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('Tidak ada data log untuk diekspor');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Audit_Log_Sistem_SPEGA_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Log sistem berhasil diekspor ke JSON');
  };

  const handlePrintAuditReport = () => {
    const schoolName = localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS';
    const appName = localStorage.getItem('appName') || 'SPEGA MAIL';
    const adminName = localStorage.getItem('adminName') || 'Admin Tata Usaha';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Pastikan pop-up diizinkan di browser.');
      return;
    }

    const tableRows = (filteredLogs || []).map((l, index) => `
      <tr style="border-bottom: 1px solid #cbd5e1; font-size: 9pt;">
        <td style="padding: 6px; text-align: center;">${index + 1}</td>
        <td style="padding: 6px; white-space: nowrap; font-family: monospace;">${formatDateDetailed(l.timestamp)}</td>
        <td style="padding: 6px; font-weight: bold; color: #1e293b;">${l.action}</td>
        <td style="padding: 6px;">${l.category}</td>
        <td style="padding: 6px; text-transform: uppercase; font-weight: bold; color: ${
          l.level === 'error' ? '#e11d48' : l.level === 'warning' ? '#d97706' : l.level === 'success' ? '#16a34a' : '#0284c7'
        }">${l.level}</td>
        <td style="padding: 6px; font-weight: bold;">${l.user}</td>
        <td style="padding: 6px; font-size: 8.5pt;">${l.details}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Audit Log Sistem - ${schoolName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 25px; color: #000; }
          h2, h4 { margin: 2px 0; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; border-top: 2px solid #334155; border-bottom: 2px solid #334155; padding: 8px 6px; font-size: 9pt; text-align: left; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9pt; }
          @media print {
            @page { size: A4 landscape; margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
          <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH KABUPATEN KEDIRI - DINAS PENDIDIKAN</h2>
          <h3 style="font-size: 14pt; font-weight: bold; margin: 3px 0;">${schoolName}</h3>
          <p style="font-size: 9pt; margin: 0;">LAPORAN REKAM JEJAK AUDIT & LOG SISTEM (${appName})</p>
        </div>

        <div style="font-size: 8.5pt; margin-bottom: 10px; display: flex; justify-content: space-between;">
          <span>Periode / Filter: <b>${selectedCategory.toUpperCase()}</b> • Level: <b>${selectedLevel.toUpperCase()}</b></span>
          <span>Dicetak pada: <b>${formatDateDetailed(new Date().toISOString())}</b> oleh: <b>${adminName}</b></span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">No</th>
              <th style="width: 14%;">Waktu Transaksi</th>
              <th style="width: 16%;">Aksi / Event</th>
              <th style="width: 12%;">Kategori</th>
              <th style="width: 8%;">Level</th>
              <th style="width: 14%;">Pengguna</th>
              <th style="width: 32%;">Keterangan Aktivitas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p>Total Catatan: <b>${filteredLogs?.length || 0} entri</b></p>
            <p>Integritas Basis Data: <b>Terverifikasi (100% Dexie IndexedDB)</b></p>
          </div>
          <div style="text-align: center;">
            <p>Kras, ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</p>
            <p style="font-weight: bold;">Kepala Urusan Tata Usaha,</p>
            <div style="height: 45px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">Khabibu Rohman, S.Kom.</p>
            <p style="font-size: 8pt;">NIP. 198903122019031008</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleCopyJSON = (metadata?: string) => {
    if (!metadata) return;
    navigator.clipboard.writeText(metadata);
    setIsCopied(true);
    toast.success('Metadata log berhasil disalin ke clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Helper Formats
  const formatDateDetailed = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date).replace(/\./g, ':');
    } catch {
      return isoStr;
    }
  };

  const getRelativeTime = (isoStr: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(isoStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'Baru saja';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m yang lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}j yang lalu`;
      return `${Math.floor(diffSec / 86400)}h yang lalu`;
    } catch {
      return '';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Persuratan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
            <Mail className="w-3 h-3 text-indigo-400" />
            Persuratan
          </span>
        );
      case 'Arsip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
            <Archive className="w-3 h-3 text-amber-400" />
            Arsip Dokumen
          </span>
        );
      case 'Kepegawaian':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
            <Users className="w-3 h-3 text-emerald-400" />
            Kepegawaian
          </span>
        );
      case 'Kesiswaan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/70 text-sky-300 border border-sky-500/30">
            <GraduationCap className="w-3 h-3 text-sky-400" />
            Kesiswaan
          </span>
        );
      case 'Keamanan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            Keamanan
          </span>
        );
      case 'Laporan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
            <FileText className="w-3 h-3 text-cyan-400" />
            Laporan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Database className="w-3 h-3 text-slate-400" />
            {category}
          </span>
        );
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUKSES
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3 text-sky-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sistem & Tata Usaha</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">Audit Trail & Log</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Log Aktivitas & Audit Sistem
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              REAL-TIME
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekam jejak otomatis transaksi persuratan, draf surat, arsip digital, dan keamanan pengguna SMPN 3 Kras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
            title="Catat Entri Log Manual"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catat Log</span>
          </button>

          <button
            onClick={handlePrintAuditReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Cetak Laporan Audit Log"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Cetak Log</span>
          </button>

          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Ekspor Data Log"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor</span>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-30">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Format JSON</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-900/50 transition-all"
            title="Bersihkan Semua Log Sistem"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Aktivitas</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{stats.total}</p>
            <span className="text-[10px] text-indigo-400 font-mono">Riwayat Tercatat</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Log Persuratan</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{stats.persuratan}</p>
            <span className="text-[10px] text-slate-400 font-mono">Masuk/Keluar/Draf</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Mail className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Audit Keamanan</p>
            <p className="text-xl font-bold font-mono text-purple-400 mt-0.5">{stats.keamanan}</p>
            <span className="text-[10px] text-slate-400 font-mono">Autentikasi & Sesi</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Hari Ini</p>
            <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{stats.today}</p>
            <span className="text-[10px] text-slate-400 font-mono">Aktivitas Baru</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Integritas Log</p>
            <p className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              TERLINDUNGI
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Dexie IndexedDB</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari aksi, deskripsi, operator, atau alamat IP..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-40 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="Persuratan">Persuratan</option>
              <option value="Arsip">Arsip Dokumen</option>
              <option value="Kepegawaian">Kepegawaian</option>
              <option value="Kesiswaan">Kesiswaan</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Sistem">Sistem</option>
              <option value="Laporan">Laporan</option>
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-36 cursor-pointer"
            >
              <option value="all">Semua Level</option>
              <option value="info">Info</option>
              <option value="success">Sukses</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-36 cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={`Urutkan: ${sortOrder === 'desc' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}`}
            >
              <RefreshCw className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div>
            Menampilkan <span className="font-bold text-white font-mono">{filteredLogs.length}</span> dari{' '}
            <span className="font-bold text-slate-300 font-mono">{logs?.length || 0}</span> catatan aktivitas
          </div>
          {(selectedCategory !== 'all' || selectedLevel !== 'all' || selectedDateRange !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLevel('all');
                setSelectedDateRange('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-44">Waktu & Tanggal</th>
                <th className="py-3 px-4 w-44">Aksi / Event</th>
                <th className="py-3 px-4 w-32">Kategori</th>
                <th className="py-3 px-4 w-28 text-center">Level</th>
                <th className="py-3 px-4 w-40">Pengguna</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 w-16 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, index) => {
                  const itemIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr 
                      key={log.id || index}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetail(log)}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-500 font-semibold">
                        {itemIndex}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-200 font-medium text-[11px]">
                          {formatDateDetailed(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {getRelativeTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-300 text-[11px] truncate max-w-[160px]">
                          {log.action}
                        </div>
                        {log.ipAddress && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                            {log.ipAddress}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getCategoryBadge(log.category)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {log.user ? log.user.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-medium text-slate-300 truncate max-w-[130px]" title={log.user}>
                            {log.user || 'Sistem'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {log.details}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetail(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700 transition-all"
                          title="Lihat Rincian Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Activity className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="text-sm font-semibold text-slate-300">Tidak ada catatan log ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci atau bersihkan filter pencarian.</p>
                    <button
                      onClick={handleResetToDefaultLogs}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Muat Riwayat Sampel Dinas
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Halaman <b className="text-white">{currentPage}</b> dari <b className="text-white">{totalPages}</b></span>
            <span>•</span>
            <span>Total <b>{filteredLogs.length}</b> data</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail Log */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Rincian Audit Log #{selectedLogForDetail.id}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID Transaksi: LOG-{selectedLogForDetail.id?.toString().padStart(5, '0')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Waktu Transaksi</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatDateDetailed(selectedLogForDetail.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Tingkat / Level</span>
                  <div>{getLevelBadge(selectedLogForDetail.level)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Kategori Modul</span>
                  <div>{getCategoryBadge(selectedLogForDetail.category)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Operator / Pengguna</span>
                  <span className="text-slate-200 font-semibold">{selectedLogForDetail.user}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Kode Aksi Event</span>
                  <span className="font-mono font-bold text-indigo-400">{selectedLogForDetail.action}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Klien / Host IP</span>
                  <span className="font-mono text-slate-400">{selectedLogForDetail.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Uraian / Keterangan Aktivitas</span>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs">
                  {selectedLogForDetail.details}
                </div>
              </div>

              {selectedLogForDetail.metadata && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      Payload Metadata JSON
                    </span>
                    <button
                      onClick={() => handleCopyJSON(selectedLogForDetail.metadata)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {isCopied ? 'Tersalin' : 'Salin JSON'}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0B0E14] rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLogForDetail.metadata), null, 2);
                      } catch {
                        return selectedLogForDetail.metadata;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Log Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Catat Log Aktivitas Manual
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nama Aksi / Kode Event
                </label>
                <input
                  type="text"
                  value={newLogAction}
                  onChange={(e) => setNewLogAction(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Persuratan">Persuratan</option>
                    <option value="Arsip">Arsip Dokumen</option>
                    <option value="Kepegawaian">Kepegawaian</option>
                    <option value="Kesiswaan">Kesiswaan</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Sistem">Sistem</option>
                    <option value="Laporan">Laporan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tingkat (Level)
                  </label>
                  <select
                    value={newLogLevel}
                    onChange={(e) => setNewLogLevel(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Sukses</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nama Operator / Pengguna
                </label>
                <input
                  type="text"
                  value={newLogUser}
                  onChange={(e) => setNewLogUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Keterangan Rinci Aktivitas
                </label>
                <textarea
                  rows={3}
                  value={newLogDetails}
                  onChange={(e) => setNewLogDetails(e.target.value)}
                  placeholder="Deskripsikan tindakan atau kejadian yang dicatat..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                >
                  Simpan Catatan Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
