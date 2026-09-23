import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Letter } from '../lib/db';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  GraduationCap, 
  Clock, 
  BarChart3, 
  Mail, 
  Plus, 
  Activity, 
  Sparkles, 
  FileText, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Archive,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Bookmark,
  Eye,
  FileCheck,
  Send,
  HelpCircle,
  ExternalLink,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import LetterTemplateWizard from '../components/LetterTemplateWizard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [adminName, setAdminName] = useState(() => {
    const saved = localStorage.getItem('adminName');
    if (!saved || saved.toLowerCase().includes('sekhudin')) {
      return 'Admin';
    }
    return saved;
  });
  const [schoolName, setSchoolName] = useState(localStorage.getItem('schoolName') || 'SMP Negeri 3 Kras');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi');
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  const stats = useLiveQuery(async () => {
    const letters = await db.letters.toArray();
    const lettersCount = letters.length;
    const inboxCount = letters.filter(l => l.type === 'inbox').length;
    const outboxCount = letters.filter(l => l.type === 'outbox').length;
    const archivedCount = letters.filter(l => l.status === 'archived').length;
    const activeCount = letters.filter(l => l.status === 'active').length;
    
    const archivesCount = await db.archives.count();
    const teachersCount = await db.teachers.count();
    const studentsCount = await db.students.count();

    const pendingSubmissions = letters.filter(l => (l.source === 'portal_guru_wali' || Boolean(l.applicantName)) && l.submissionStatus === 'pending_approval');
    const pendingSubmissionsCount = pendingSubmissions.length;
    
    // Legalisir stats
    const legalisirList = await db.legalisir.toArray();
    const legalisirCount = legalisirList.length;
    const legalisirPending = legalisirList.filter(l => l.status === 'pending').length;
    const legalisirReady = legalisirList.filter(l => l.status === 'ready').length;

    // Sort recent letters
    const recentLetters = [...letters].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).slice(0, 6);

    // Group letters by month for bar chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const letterStatsMap = new Map();
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      letterStatsMap.set(key, { 
        name: monthNames[d.getMonth()], 
        'Surat Masuk': 0, 
        'Surat Keluar': 0,
        sortOrder: d.getTime()
      });
    }

    letters.forEach(l => {
      const d = new Date(l.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (letterStatsMap.has(key)) {
        const entry = letterStatsMap.get(key);
        if (l.type === 'inbox') entry['Surat Masuk']++;
        else if (l.type === 'outbox') entry['Surat Keluar']++;
      }
    });

    const chartData = Array.from(letterStatsMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    letters.forEach(l => {
      const cat = l.category || 'Persuratan (SK/Tugas)';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const pieData = [
       { name: 'Guru & GTK', value: teachersCount || 1, color: '#6366f1' },
       { name: 'Peserta Didik', value: studentsCount || 1, color: '#10b981' }
    ];

    return { 
      lettersCount, inboxCount, outboxCount, archivedCount, activeCount, 
      archivesCount, teachersCount, studentsCount, pendingSubmissionsCount, 
      legalisirCount, legalisirPending, legalisirReady,
      recentLetters, chartData, 
      topCategories, pieData 
    };
  });

  const getNextSequenceNumber = (type: 'inbox' | 'outbox') => {
    if (!stats) return '001';
    const currentYear = new Date().getFullYear().toString();
    const count = (type === 'inbox' ? stats.inboxCount : stats.outboxCount) + 1;
    return String(count).padStart(3, '0');
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-slate-800/40 animate-pulse border border-slate-700/50"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-80 rounded-xl bg-slate-800/40 animate-pulse border border-slate-700/50"></div>
          <div className="lg:col-span-4 h-80 rounded-xl bg-slate-800/40 animate-pulse border border-slate-700/50"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'SURAT MASUK', 
      value: stats.inboxCount, 
      icon: ArrowDownRight, 
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      tagline: `${stats.inboxCount} Naskah Terdaftar`,
      badge: 'AGENDA MASUK',
      onClick: () => navigate('/letters?type=inbox')
    },
    { 
      label: 'SURAT KELUAR', 
      value: stats.outboxCount, 
      icon: ArrowUpRight, 
      color: 'text-indigo-400',
      bgGlow: 'from-indigo-500/10 to-transparent',
      borderColor: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/15 text-indigo-400',
      tagline: `${stats.outboxCount} Naskah Terbit`,
      badge: 'AGENDA KELUAR',
      onClick: () => navigate('/letters?type=outbox')
    },
    { 
      label: 'ARSIP DOKUMEN', 
      value: stats.archivesCount, 
      icon: Archive, 
      color: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-400',
      tagline: 'Berkas Fisik & Digital',
      badge: 'TERKLASIFIKASI',
      onClick: () => navigate('/archives')
    },
    { 
      label: 'LEGALISIR IJAZAH', 
      value: stats.legalisirCount, 
      icon: Award, 
      color: 'text-rose-400',
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-400',
      tagline: stats.legalisirPending > 0 ? `${stats.legalisirPending} Berkas Menunggu` : `${stats.legalisirCount} Berkas Terdaftar`,
      badge: stats.legalisirPending > 0 ? 'PERLU PROSES' : 'LOKET TU',
      onClick: () => navigate('/admin/legalisir')
    },
    { 
      label: 'SIVITAS SEKOLAH', 
      value: (stats.teachersCount + stats.studentsCount), 
      icon: Users, 
      color: 'text-sky-400',
      bgGlow: 'from-sky-500/10 to-transparent',
      borderColor: 'border-sky-500/30',
      iconBg: 'bg-sky-500/15 text-sky-400',
      tagline: `${stats.teachersCount} Guru • ${stats.studentsCount} Siswa`,
      badge: 'TERVERIFIKASI',
      onClick: () => navigate('/teachers')
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. EXECUTIVE HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/25 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ONLINE • ENGINE PERSURATAN AKTIF
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
                TA 2025/2026 • SMPN 3 KRAS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-white">{adminName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selamat datang di Sistem Administrasi Persuratan & Kearsipan Digital {schoolName}. Kelola buku agenda otomatis, kartu kendali, lembar disposisi, dan pembuatan draf naskah resmi dalam satu pintu.
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-900/40 border border-indigo-400/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Template Wizard (20 Naskah)
            </button>

            <button 
              onClick={() => navigate('/letters')} 
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Registrasi Surat
            </button>

            <button 
              onClick={() => navigate('/admin/legalisir')} 
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/80 to-rose-600/80 hover:from-amber-500 hover:to-rose-500 border border-amber-400/40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Award className="w-4 h-4 text-amber-200" />
              Loket Legalisir
            </button>

            <button 
              onClick={() => navigate('/reports')} 
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Buku Agenda
            </button>
          </div>
        </div>
      </div>

      {/* ALERT BANNER: PENDING LEGALISIR REQUESTS */}
      {stats.legalisirPending > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{stats.legalisirPending} Permohonan Legalisir Ijazah & Dokumen Menunggu Proses</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  Loket Legalisir
                </span>
              </h3>
              <p className="text-xs text-slate-300">Terdapat berkas pengesahan ijazah / dokumen alumni & siswa yang siap diverifikasi, ditandatangani, dan dicap pengesahan.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin/legalisir')}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-950/50 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Buka Loket Legalisir</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ALERT BANNER: PENDING GURU & WALI SUBMISSIONS */}
      {stats.pendingSubmissionsCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{stats.pendingSubmissionsCount} Pengajuan Draf Surat dari Guru / Wali Murid Menunggu Verifikasi TU</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  Perlu Verifikasi
                </span>
              </h3>
              <p className="text-xs text-slate-300">Draf surat telah dibuat oleh guru/wali secara mandiri dan siap diperiksa serta diberi nomor registrasi resmi.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/letters')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Periksa di Data Surat</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 2. STATISTIC METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -2 }}
              onClick={stat.onClick}
              className={`bg-gradient-to-b ${stat.bgGlow} bg-[#1E293B] border ${stat.borderColor} p-4 rounded-xl shadow-md cursor-pointer flex flex-col justify-between transition-all duration-200 hover:border-indigo-400/50`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</span>
                <span className="text-[10px] bg-slate-900/80 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700/60">
                  {stat.badge}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{stat.tagline}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. CHARTS & ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Chart Column: 6-Month In/Out Flow */}
        <div className="lg:col-span-8 bg-[#1E293B] border border-slate-700/70 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Statistik Arus Persuratan (6 Bulan Terakhir)</h3>
                  <p className="text-[11px] text-slate-400">Volume surat masuk dan surat keluar SMPN 3 Kras</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Masuk
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span> Keluar
                </span>
              </div>
            </div>
            
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #334155', 
                      borderRadius: '8px', 
                      color: '#E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#E2E8F0' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Surat Masuk" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Surat Keluar" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Hub Grid */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pintasan Tata Usaha & Kearsipan</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button 
                onClick={() => navigate('/letters')} 
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:bg-slate-700/70 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-300">Surat Masuk</span>
                <span className="text-[10px] text-slate-400 font-mono block">Agenda masuk & disposisi</span>
              </button>

              <button 
                onClick={() => setIsWizardOpen(true)} 
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:bg-slate-700/70 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-indigo-300">Draf Wizard</span>
                <span className="text-[10px] text-slate-400 font-mono block">20 Template surat otomatis</span>
              </button>

              <button 
                onClick={() => navigate('/archives')} 
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:bg-slate-700/70 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Archive className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-amber-300">Arsip Digital</span>
                <span className="text-[10px] text-slate-400 font-mono block">Klasifikasi & kartu arsip</span>
              </button>

              <button 
                onClick={() => navigate('/reports')} 
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:bg-slate-700/70 hover:border-sky-500/40 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-sky-300">Buku Agenda</span>
                <span className="text-[10px] text-slate-400 font-mono block">Cetak & ekspor Excel/PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Civitas & Categories */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Civitas Ratio Card */}
          <div className="bg-[#1E293B] border border-slate-700/70 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Sivitas Sekolah Terdata
              </h3>
              <span className="text-[10px] text-indigo-400 font-mono">DEXIE DB</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[11px] text-indigo-400 font-semibold uppercase block">Dewan Guru</span>
                <span className="text-2xl font-bold text-white block mt-0.5">{stats.teachersCount}</span>
                <span className="text-[10px] text-slate-500 block">Pendidik & GTK</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[11px] text-emerald-400 font-semibold uppercase block">Peserta Didik</span>
                <span className="text-2xl font-bold text-white block mt-0.5">{stats.studentsCount}</span>
                <span className="text-[10px] text-slate-500 block">Kelas VII - IX</span>
              </div>
            </div>

            <div className="h-28 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={48}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #334155', 
                      borderRadius: '6px', 
                      color: '#E2E8F0',
                      fontSize: '11px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-xs font-bold text-slate-300">{stats.teachersCount + stats.studentsCount}</span>
                <span className="text-[9px] text-slate-500 block">Total</span>
              </div>
            </div>
          </div>

          {/* Top Categories Card */}
          <div className="bg-[#1E293B] border border-slate-700/70 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Distribusi Kategori Dokumen
              </h3>
            </div>

            <div className="space-y-2.5">
              {stats.topCategories.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada kategori data.</p>
              ) : (
                stats.topCategories.map((cat, i) => {
                  const percentage = Math.round((cat.count / stats.lettersCount) * 100) || 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[180px]">{cat.name}</span>
                        <span className="text-slate-400 font-mono">{cat.count} surat ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full" 
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. RECENT LETTER STREAM & STATUS */}
      <div className="bg-[#1E293B] border border-slate-700/70 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Registrasi Dokumen Terbaru</h3>
              <p className="text-[11px] text-slate-400">Daftar naskah dinas masuk dan keluar terakhir yang diproses</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/letters')} 
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-indigo-300 font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            Lihat Semua Register
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentLetters.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada dokumen surat yang terdaftar.</p>
            <button 
              onClick={() => navigate('/letters')} 
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
            >
              Registrasi Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">TIPE</th>
                  <th className="py-2.5 px-3">NOMOR SURAT</th>
                  <th className="py-2.5 px-3">PERIHAL / JUDUL</th>
                  <th className="py-2.5 px-3">DARI / KEPADA</th>
                  <th className="py-2.5 px-3">TANGGAL</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {stats.recentLetters.map((letter) => (
                  <tr 
                    key={letter.id}
                    onClick={() => navigate('/letters')}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        letter.type === 'inbox' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {letter.type === 'inbox' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {letter.type === 'inbox' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 font-medium group-hover:text-indigo-300">
                      {letter.referenceNumber}
                    </td>
                    <td className="py-3 px-3 text-white font-medium max-w-xs truncate">
                      {letter.title}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {letter.senderOrRecipient}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {format(new Date(letter.date), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        letter.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {letter.status === 'active' ? 'Aktif' : 'Arsip'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LETTER TEMPLATE WIZARD MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
          <LetterTemplateWizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onDraftCreated={() => {
              toast.success('Draf naskah resmi berhasil dibuat!');
            }}
            getNextSequenceNumber={getNextSequenceNumber}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
