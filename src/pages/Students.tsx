import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Student } from '../lib/db';
import { Search, Plus, X, GraduationCap, Trash2, FileUp, FileDown, Edit, Trash, Eye, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useConfirm } from '../components/ConfirmProvider';

export default function Students() {
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();

  const rawStudents = useLiveQuery(() => db.students.toArray()) || [];
  
  const availableGrades = Array.from(new Set(rawStudents.map(s => s.grade))).sort((a,b)=>a.localeCompare(b));

  const students = rawStudents
    .filter(s => {
      const lowerSearch = search.toLowerCase();
      const matchSearch = search ? (
        s.name.toLowerCase().includes(lowerSearch) || 
        s.nisn.toLowerCase().includes(lowerSearch) ||
        s.grade.toLowerCase().includes(lowerSearch)
      ) : true;
      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
      return matchSearch && matchGrade;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'date-asc') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return 0;
    });

  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      nisn: formData.get('nisn') as string,
      grade: formData.get('grade') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      nis: formData.get('nis') as string || '',
      birthPlace: formData.get('birthPlace') as string || '',
      birthDate: formData.get('birthDate') as string || '',
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString()
    };

    if (editingStudent && editingStudent.id) {
      await db.students.update(editingStudent.id, data);
      toast.success('Data siswa berhasil diperbarui');
    } else {
      await db.students.add(data);
      toast.success('Data siswa baru berhasil ditambahkan');
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const isConfirmed = await confirm({
      title: 'Hapus Data Siswa',
      message: 'Apakah Anda yakin ingin menghapus data siswa ini? Data yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      variant: 'danger'
    });
    
    if (isConfirmed) {
      await db.students.delete(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('Data siswa berhasil dihapus');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const isConfirmed = await confirm({
      title: 'Hapus Siswa Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data siswa yang dipilih secara permanen?`,
      confirmLabel: 'Hapus Semua',
      variant: 'danger'
    });
    
    if (isConfirmed) {
      await db.students.bulkDelete(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} data siswa berhasil dihapus`);
    }
  };

  const toggleSelectAll = () => {
    if (students && selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students?.map(s => s.id as number) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const allStudents = await db.students.toArray();
      const formattedData = allStudents.map(s => ({
        'Nama Lengkap': s.name,
        'NIS': s.nis || '-',
        'NISN': s.nisn,
        'Kelas': s.grade,
        'Tempat Lahir': s.birthPlace || '-',
        'Tanggal Lahir': s.birthDate ? new Date(s.birthDate).toLocaleDateString('id-ID') : '-',
        'No. HP': s.phone,
        'Email': s.email
      }));
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
      XLSX.writeFile(workbook, `Data_Siswa_SPEGAMAIL_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data siswa berhasil diekspor ke Excel');
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengekspor data siswa');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const studentsToAdd = json.map((row: any) => ({
          name: row['Nama Lengkap'] || row['Nama'] || row['name'] || '',
          nisn: String(row['NISN'] || row['nisn'] || ''),
          grade: row['Kelas'] || row['kelas'] || row['grade'] || '',
          phone: String(row['No. HP'] || row['No HP'] || row['Telepon'] || row['phone'] || ''),
          email: row['Email'] || row['email'] || '',
          nis: String(row['NIS'] || row['nis'] || ''),
          birthPlace: row['Tempat Lahir'] || row['tempat lahir'] || '',
          birthDate: row['Tanggal Lahir'] || row['tanggal lahir'] ? new Date(row['Tanggal Lahir'] || row['tanggal lahir']).toISOString() : '',
          createdAt: new Date().toISOString()
        })).filter(s => s.name && s.nisn); 

        if (studentsToAdd.length > 0) {
          await db.students.bulkAdd(studentsToAdd);
          confetti({ particleCount: 50, spread: 60 });
          toast.success(`Berhasil mengimpor ${studentsToAdd.length} data siswa!`);
        } else {
          toast.error('Tidak ada data siswa yang valid ditemukan dalam file');
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengimpor file. Pastikan formatnya adalah Excel (.xlsx/.xls)');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Data Siswa</h2>
          <p className="text-slate-400">Kelola informasi peserta didik.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="glass-button flex items-center justify-center gap-2 flex-1 sm:flex-none !bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20" title="Hapus Terpilih">
              <Trash className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus Terpilih ({selectedIds.length})</span>
            </button>
          )}
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport}
          />
          <button onClick={() => fileInputRef.current?.click()} className="glass-button flex items-center justify-center gap-2 flex-1 sm:flex-none !bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20" title="Impor Data Excel">
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Impor Excel</span>
            <span className="sm:hidden">Impor</span>
          </button>
          <button onClick={handleExport} className="glass-button flex items-center justify-center gap-2 flex-1 sm:flex-none !bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20" title="Ekspor Data ke Excel">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor Excel</span>
            <span className="sm:hidden">Ekspor</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="glass-button flex items-center justify-center gap-2 flex-1 sm:flex-none w-full sm:w-auto mt-2 sm:mt-0">
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama, NISN, atau kelas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10"
            />
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`glass-panel px-4 py-2 flex items-center gap-2 transition-colors w-full sm:w-auto ${isFiltersOpen ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`}
          >
            <Filter className="w-5 h-5" />
            Filter { (selectedGrade !== 'all' || sortBy !== 'name-asc') && <span className="w-2 h-2 rounded-full bg-sky-400"></span> }
          </button>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Kelas</label>
                  <select 
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua Kelas</option>
                    {availableGrades.map((grade) => (
                      <option key={grade} value={grade} className="text-black">{grade}</option>
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
                    <option value="name-asc" className="text-black">Nama (A-Z)</option>
                    <option value="name-desc" className="text-black">Nama (Z-A)</option>
                    <option value="date-desc" className="text-black">Data Terbaru</option>
                    <option value="date-asc" className="text-black">Data Terlama</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-sky-500/50"
                    checked={students?.length ? selectedIds.length === students.length : false}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Nama Lengkap</th>
                <th>NISN</th>
                <th>Kelas</th>
                <th>No. HP</th>
                <th>Email</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Belum ada data siswa.
                  </td>
                </tr>
              ) : (
                students?.map(student => (
                  <tr key={student.id} className={selectedIds.includes(student.id as number) ? "bg-sky-500/5" : ""}>
                    <td className="text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-sky-500/50"
                        checked={selectedIds.includes(student.id as number)}
                        onChange={() => toggleSelect(student.id as number)}
                      />
                    </td>
                    <td className="font-medium">{student.name}</td>
                    <td className="font-mono text-sm text-sky-300">{student.nisn}</td>
                    <td>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-medium">
                        {student.grade}
                      </span>
                    </td>
                    <td className="text-slate-300">{student.phone}</td>
                    <td className="text-slate-400">{student.email}</td>
                    <td className="text-right flex justify-end gap-1">
                      <button 
                        onClick={() => setViewingStudent(student)}
                        className="p-2 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(student)}
                        className="p-2 rounded-lg hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Siswa */}
      <AnimatePresence>
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-2xl p-0 overflow-hidden relative border-emerald-500/20 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20 shrink-0">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" /> Detail Siswa
                </h3>
                <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Nama Lengkap</div>
                      <div className="text-lg text-white font-medium">{viewingStudent.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">NIS</div>
                      <div className="text-white font-mono">{viewingStudent.nis || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">NISN</div>
                      <div className="text-white font-mono">{viewingStudent.nisn}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-2 mb-2">Informasi Akademik & Profil</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">Kelas</div>
                        <div className="text-sky-300">{viewingStudent.grade}</div>
                      </div>
                      <div className="col-span-2 mt-2">
                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">Tempat, Tanggal Lahir</div>
                        <div className="text-white">
                          {viewingStudent.birthPlace || '-'}, {viewingStudent.birthDate ? new Date(viewingStudent.birthDate).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-1">No. Handphone</div>
                    <div className="text-slate-300">{viewingStudent.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-1">Email</div>
                    <div className="text-slate-300">{viewingStudent.email || '-'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="text-xs text-slate-500">Ditambahkan pada: {new Date(viewingStudent.createdAt).toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 flex justify-end shrink-0">
                <button onClick={() => setViewingStudent(null)} className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl p-0 overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                <h3 className="text-xl font-medium text-white">{editingStudent ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="studentForm" onSubmit={handleSaveStudent} className="space-y-6">
                  
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-sky-400 border-b border-white/5 pb-2">Informasi Akademik</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Nama Lengkap</label>
                        <input type="text" name="name" required defaultValue={editingStudent?.name} placeholder="Andi Saputra" className="glass-input w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Kelas</label>
                        <input type="text" name="grade" required defaultValue={editingStudent?.grade} placeholder="X IPA 1" className="glass-input w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">NISN</label>
                        <input type="text" name="nisn" required defaultValue={editingStudent?.nisn} placeholder="001234..." className="glass-input w-full font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">NIS (Nomor Induk Siswa)</label>
                        <input type="text" name="nis" defaultValue={editingStudent?.nis} placeholder="2023..." className="glass-input w-full font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-sky-400 border-b border-white/5 pb-2">Data Pribadi & Kontak</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Tempat Lahir</label>
                        <input type="text" name="birthPlace" defaultValue={editingStudent?.birthPlace} placeholder="Jakarta" className="glass-input w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Tanggal Lahir</label>
                        <input type="date" name="birthDate" defaultValue={editingStudent?.birthDate ? editingStudent.birthDate.split('T')[0] : ''} className="glass-input w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">No. HP</label>
                        <input type="tel" name="phone" defaultValue={editingStudent?.phone} placeholder="0812..." className="glass-input w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Email</label>
                        <input type="email" name="email" defaultValue={editingStudent?.email} placeholder="andi@siswa.id" className="glass-input w-full" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-slate-800/30">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                  Batal
                </button>
                <button type="submit" form="studentForm" className="glass-button">
                  Simpan Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
