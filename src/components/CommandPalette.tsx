import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Mail, 
  Users, 
  GraduationCap, 
  Archive, 
  PieChart, 
  Settings, 
  PlusCircle, 
  Printer, 
  Download, 
  X, 
  CornerDownLeft,
  FileText,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Search results from IndexedDB
  const letters = useLiveQuery(async () => {
    if (!query.trim()) return [];
    return db.letters
      .filter(l => 
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.referenceNumber.toLowerCase().includes(query.toLowerCase()) ||
        l.senderOrRecipient.toLowerCase().includes(query.toLowerCase())
      )
      .limit(5)
      .toArray();
  }, [query]);

  const teachers = useLiveQuery(async () => {
    if (!query.trim()) return [];
    return db.teachers
      .filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.nip.includes(query) ||
        t.subject.toLowerCase().includes(query.toLowerCase())
      )
      .limit(4)
      .toArray();
  }, [query]);

  const students = useLiveQuery(async () => {
    if (!query.trim()) return [];
    return db.students
      .filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.nisn.includes(query) ||
        s.grade.toLowerCase().includes(query.toLowerCase())
      )
      .limit(4)
      .toArray();
  }, [query]);

  const archives = useLiveQuery(async () => {
    if (!query.trim()) return [];
    return db.archives
      .filter(a => 
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.classificationCode && a.classificationCode.toLowerCase().includes(query.toLowerCase())) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
      .limit(4)
      .toArray();
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
        >
          {/* Top Search Bar */}
          <div className="flex items-center px-4 border-b border-slate-700 bg-slate-900/80">
            <Search className="w-5 h-5 text-indigo-400 shrink-0" />
            <input 
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari surat, arsip, guru, siswa, atau ketik perintah..."
              className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">ESC</kbd>
              <button 
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar flex-1">
            {/* Quick Actions (Always Available) */}
            {!query && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">Aksi Cepat & Navigasi</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleNavigate('/letters?action=new-inbox')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs bg-slate-800/40 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-slate-200 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Catat Surat Masuk Baru</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/letters?action=wizard')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs bg-slate-800/40 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-slate-200 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Buat Draf Surat Resmi (Wizard)</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/archives?action=new')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs bg-slate-800/40 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-slate-200 transition-colors"
                  >
                    <Archive className="w-4 h-4 text-amber-400" />
                    <span>Arsipkan Dokumen Baru</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/reports')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs bg-slate-800/40 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-slate-200 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-sky-400" />
                    <span>Cetak Rekapitulasi & Agenda</span>
                  </button>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mt-4 mb-2">Halaman Utama & Audit</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleNavigate('/')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dashboard Utama</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/teachers')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Data Guru (GTK)</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/students')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Data Siswa</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/logs')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Log Sistem & Audit</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/reports')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Rekapitulasi</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/settings')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pengaturan & Akun</span>
                  </button>
                </div>
              </div>
            )}

            {/* Letters Search Results */}
            {letters && letters.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">Surat Masuk & Keluar</p>
                <div className="space-y-1">
                  {letters.map(letter => (
                    <button
                      key={letter.id}
                      onClick={() => handleNavigate(`/letters?search=${encodeURIComponent(letter.referenceNumber)}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-left transition-colors group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300">{letter.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {letter.referenceNumber} • {letter.senderOrRecipient} • {letter.date}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono shrink-0 ml-2">
                        {letter.type === 'inbox' ? 'Masuk' : 'Keluar'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Teachers Search Results */}
            {teachers && teachers.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">Data Guru & Tenaga Kependidikan</p>
                <div className="space-y-1">
                  {teachers.map(teacher => (
                    <button
                      key={teacher.id}
                      onClick={() => handleNavigate(`/teachers?search=${encodeURIComponent(teacher.name)}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{teacher.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            NIP: {teacher.nip || '-'} • {teacher.subject}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Students Search Results */}
            {students && students.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">Buku Induk Siswa</p>
                <div className="space-y-1">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => handleNavigate(`/students?search=${encodeURIComponent(student.name)}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            NISN: {student.nisn || '-'} • Kelas {student.grade}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Archives Search Results */}
            {archives && archives.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">Arsip Digital</p>
                <div className="space-y-1">
                  {archives.map(archive => (
                    <button
                      key={archive.id}
                      onClick={() => handleNavigate(`/archives?search=${encodeURIComponent(archive.title)}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{archive.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {archive.category} • {archive.storageLocation || 'Rak Utama'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results state */}
            {query && (!letters?.length && !teachers?.length && !students?.length && !archives?.length) && (
              <div className="py-8 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-300">Tidak ada data ditemukan untuk "{query}"</p>
                <p className="text-[11px] text-slate-500 mt-1">Coba gunakan kata kunci nomor surat, nama guru, atau NISN siswa.</p>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[9px]">↵</kbd> Buka
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[9px]">ESC</kbd> Tutup
              </span>
            </div>
            <span className="font-mono text-[10px] text-indigo-400">SPEGA SPOTLIGHT v3.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
