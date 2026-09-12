import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Letter } from '../lib/db';
import { 
  X, Hash, CheckCircle2, Copy, Send, Printer, Sparkles, 
  BookOpen, Clock, AlertCircle, ArrowRight, UserCheck, 
  FileText, Share2, Tag, RefreshCw, Check, Search,
  SlidersHorizontal, Briefcase, GraduationCap, Mail, FileCheck,
  Layers, Calendar, ChevronRight, Bookmark
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  getLatestAgendaInfo, 
  buildOfficialLetterNumber 
} from '../lib/agendaHelper';
import { 
  getSchoolConfig, 
  generateAgendaSlipHTML 
} from '../lib/printHelper';

interface QuickAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApplicantName?: string;
  defaultApplicantPhone?: string;
  defaultApplicantRole?: 'guru' | 'wali' | 'siswa' | 'umum';
  userRole?: 'admin' | 'guru' | 'wali';
  onSuccess?: (newLetter: Letter, seq: string) => void;
}

export type PresetCategoryType = 'all' | 'gtk' | 'kesiswaan' | 'undangan' | 'tu_dinas';

export interface PresetFormat {
  id: string;
  category: 'gtk' | 'kesiswaan' | 'undangan' | 'tu_dinas';
  label: string;
  code: string;
  instansi: string;
  desc: string;
  defaultPerihal: string;
  popular?: boolean;
  defaultStyle?: 'kedinasan' | 'sekolah' | 'romawi' | 'sk' | 'sppd' | 'ba' | 'custom';
}

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const PRESET_CATEGORIES: PresetFormat[] = [
  // ==================== 1. TUGAS & GTK (GURU & PEGAWAI) ====================
  {
    id: 'spt',
    category: 'gtk',
    label: 'Surat Tugas (SPT)',
    code: '420.3',
    instansi: '418.20.2.62.03',
    desc: 'Surat Perintah Tugas mengikuti MGMP, pelatihan, workshop, atau bimtek kedinasan luar',
    defaultPerihal: 'Surat Perintah Tugas (SPT) Mengikuti Kegiatan MGMP / Pelatihan',
    popular: true,
    defaultStyle: 'kedinasan'
  },
  {
    id: 'sppd',
    category: 'gtk',
    label: 'SPPD (Perjalanan Dinas)',
    code: '094.1',
    instansi: '418.20.2.62.03',
    desc: 'Surat Perintah Perjalanan Dinas luar kecamatan/kabupaten untuk tugas dinas resmi',
    defaultPerihal: 'Surat Perintah Perjalanan Dinas (SPPD) Pelaksanaan Kegiatan Dinas Luar',
    popular: true,
    defaultStyle: 'sppd'
  },
  {
    id: 'skmt',
    category: 'gtk',
    label: 'SKMT (Keterangan Tugas Mengajar)',
    code: '421.8',
    instansi: 'SMP.03',
    desc: 'Syarat wajib pencairan TPG / Tunjangan Profesi Guru, Sertifikasi & Beban Jam Mengajar',
    defaultPerihal: 'Surat Keterangan Melaksanakan Tugas Mengajar (SKMT) Beban Kerja Guru',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'keterangan_guru',
    category: 'gtk',
    label: 'Keterangan Aktif Mengajar Guru',
    code: '421',
    instansi: 'SMP.03',
    desc: 'Keterangan aktif bertugas untuk keperluan perbankan, KPR, pengajuan beasiswa, dsb.',
    defaultPerihal: 'Surat Keterangan Aktif Melaksanakan Tugas Pendidik & Tenaga Kependidikan',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'izin_cuti',
    category: 'gtk',
    label: 'Permohonan Cuti Guru/Pegawai',
    code: '850',
    instansi: '418.20.2.62.03',
    desc: 'Surat permohonan cuti tahunan, cuti melahirkan, cuti alasan penting, umroh/haji',
    defaultPerihal: 'Surat Permohonan Cuti Guru / Tenaga Kependidikan ke Dinas Pendidikan',
    popular: false,
    defaultStyle: 'kedinasan'
  },
  {
    id: 'izin_dinas',
    category: 'gtk',
    label: 'Izin Belajar / Kuliah / PPG',
    code: '890',
    instansi: '418.20.2.62.03',
    desc: 'Izin belajar jenjang S2, PPG Dalam Jabatan, Uji Kompetensi Kenaikan Jenjang Jabatan',
    defaultPerihal: 'Surat Keterangan Izin Belajar / Mengikuti Program PPG Dalam Jabatan',
    popular: false,
    defaultStyle: 'kedinasan'
  },
  {
    id: 'skp_pangkat',
    category: 'gtk',
    label: 'Usulan Kenaikan Pangkat (KGB/PAK)',
    code: '823',
    instansi: '418.20.2.62.03',
    desc: 'Pengantar berkas penetapan angka kredit (PAK), kenaikan pangkat, kenaikan gaji berkala',
    defaultPerihal: 'Surat Pengantar Usulan Kenaikan Pangkat / Gaji Berkala (KGB) GTK',
    popular: false,
    defaultStyle: 'kedinasan'
  },
  {
    id: 'sk_kepsek',
    category: 'gtk',
    label: 'SK Kepala Sekolah (Penetapan)',
    code: '800',
    instansi: 'SK-SMP.03',
    desc: 'SK Pembagian Tugas GTK, SK Panitia Asesmen/Ujian, SK Tim Pengembang Kurikulum',
    defaultPerihal: 'Surat Keputusan (SK) Kepala Sekolah tentang Penetapan Tugas Guru & Staf',
    popular: true,
    defaultStyle: 'sk'
  },
  {
    id: 'rekomendasi_guru',
    category: 'gtk',
    label: 'Rekomendasi Prestasi GTK',
    code: '421.3',
    instansi: 'SMP.03',
    desc: 'Rekomendasi seleksi Guru Penggerak, apresiasi GTK berprestasi, beasiswa pascasarjana',
    defaultPerihal: 'Surat Rekomendasi Keikutsertaan Seleksi Guru Penggerak / GTK Inovatif',
    popular: false,
    defaultStyle: 'sekolah'
  },

  // ==================== 2. KESISWAAN & SISWA ====================
  {
    id: 'keterangan_siswa',
    category: 'kesiswaan',
    label: 'Keterangan Siswa Aktif (Umum/PIP)',
    code: '421',
    instansi: 'SMP.03',
    desc: 'Syarat pencairan PIP Kemdikbud, KIP, BPJS Kesehatan, tunjangan anak gaji orang tua',
    defaultPerihal: 'Surat Keterangan Siswa Aktif Belajar (Pencairan PIP / Tunjangan Keluarga)',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'rekomendasi_lomba',
    category: 'kesiswaan',
    label: 'Rekomendasi Lomba Siswa',
    code: '421.2',
    instansi: 'SMP.03',
    desc: 'Delegasi peserta ajang talenta OSN, O2SN, FLS2N, Gala Siswa, Pramuka, dsb.',
    defaultPerihal: 'Surat Rekomendasi Delegasi Siswa Mengikuti Lomba / Festival Tingkat Kabupaten',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'ket_kelakuan_baik',
    category: 'kesiswaan',
    label: 'Keterangan Berkelakuan Baik (SKKB)',
    code: '421.4',
    instansi: 'SMP.03',
    desc: 'Syarat pendaftaran PPDB SMA/SMK Negeri, pendaftaran beasiswa, pindah domisili',
    defaultPerihal: 'Surat Keterangan Berkelakuan Baik (SKKB) Peserta Didik',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'rekom_pindah',
    category: 'kesiswaan',
    label: 'Keterangan Pindah / Mutasi Siswa',
    code: '421.5',
    instansi: 'SMP.03',
    desc: 'Surat mutasi keluar atau surat kesiapan menerima mutasi masuk peserta didik',
    defaultPerihal: 'Surat Keterangan Pindah / Mutasi Sekolah Peserta Didik',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'dispensasi_siswa',
    category: 'kesiswaan',
    label: 'Dispensasi Siswa (Lomba/TC Atlet)',
    code: '421.7',
    instansi: 'SMP.03',
    desc: 'Izin dispensasi meninggalkan KBM karena pemusatan latihan atlet / perlombaan daerah',
    defaultPerihal: 'Surat Dispensasi Mengikuti Pemusatan Latihan / Pertandingan Resmi',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'skl_lulus',
    category: 'kesiswaan',
    label: 'Keterangan Lulus (SKL Sementara)',
    code: '421.2',
    instansi: 'SMP.03',
    desc: 'Surat Keterangan Kelulusan sementara sebelum blangko ijazah resmi diterbitkan',
    defaultPerihal: 'Surat Keterangan Kelulusan (SKL) Peserta Didik Kelas IX',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'legalisir_ijazah',
    category: 'kesiswaan',
    label: 'Pengantar Legalisir Ijazah/Rapor',
    code: '421.7',
    instansi: 'SMP.03',
    desc: 'Verifikasi & pengesahan legalisir salinan fotokopi ijazah alumni atau rapor',
    defaultPerihal: 'Surat Keterangan Verifikasi & Pengesahan Legalisir Ijazah Alumni',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'panggilan_bk',
    category: 'kesiswaan',
    label: 'Panggilan Orang Tua Siswa (BK)',
    code: '421.9',
    instansi: 'SMP.03',
    desc: 'Konseling terpadu guru BK & wali kelas, konfirmasi kehadiran, pembinaan siswa',
    defaultPerihal: 'Surat Panggilan Orang Tua / Wali Murid Konseling BK & Wali Kelas',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'pembinaan_siswa',
    category: 'kesiswaan',
    label: 'Pernyataan Pembinaan Disiplin',
    code: '421.4',
    instansi: 'SMP.03',
    desc: 'Surat perjanjian kepatuhan tata tertib sekolah dan komitmen belajar siswa',
    defaultPerihal: 'Surat Pernyataan Perjanjian Pembinaan Tata Tertib Peserta Didik',
    popular: false,
    defaultStyle: 'sekolah'
  },

  // ==================== 3. UNDANGAN RESMI ====================
  {
    id: 'undangan_dinas',
    category: 'undangan',
    label: 'Undangan Rapat Dinas GTK',
    code: '005.1',
    instansi: 'SMP.03',
    desc: 'Rapat dinas bulanan, rapat pembagian tugas mengajar, rapat koordinasi semester',
    defaultPerihal: 'Undangan Rapat Dinas Rutin Dewan Guru & Tenaga Kependidikan',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'undangan_wali',
    category: 'undangan',
    label: 'Undangan Pertemuan Wali Murid',
    code: '005',
    instansi: 'SMP.03',
    desc: 'Sosialisasi program sekolah, parenting, pembagian laporan hasil belajar / rapor',
    defaultPerihal: 'Undangan Pertemuan Sosialisasi Program Sekolah Bersama Wali Murid',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'undangan_komite',
    category: 'undangan',
    label: 'Undangan Rapat Komite Sekolah',
    code: '005.2',
    instansi: 'SMP.03',
    desc: 'Musyawarah pleno pengurus komite, pembahasan RKAS, program kerja tahunan',
    defaultPerihal: 'Undangan Rapat Koordinasi Pleno Pengurus Komite Sekolah',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'undangan_eksternal',
    category: 'undangan',
    label: 'Undangan Pemateri / Tamu Dinas',
    code: '005',
    instansi: 'SMP.03',
    desc: 'Undangan narasumber workshop IKM, pembina upacara, puskesmas, kepolisian',
    defaultPerihal: 'Undangan Menjadi Narasumber / Pemateri Kegiatan Pembelajaran',
    popular: false,
    defaultStyle: 'sekolah'
  },

  // ==================== 4. TATA USAHA, BERKAS & DINAS ====================
  {
    id: 'pengantar_dinas',
    category: 'tu_dinas',
    label: 'Pengantar Berkas ke Disdik',
    code: '094',
    instansi: '418.20.2.62.03',
    desc: 'Pengiriman LPJ BOS, usulan sertifikasi, DNP ANBK ke Dinas Pendidikan Kab. Kediri',
    defaultPerihal: 'Surat Pengantar Pengiriman Berkas & Laporan Pertanggungjawaban ke Dinas',
    popular: true,
    defaultStyle: 'kedinasan'
  },
  {
    id: 'sptjm',
    category: 'tu_dinas',
    label: 'SPTJM (Tanggung Jawab Mutlak)',
    code: '421.1',
    instansi: 'SMP.03',
    desc: 'Surat Pertanggungjawaban Mutlak data Dapodik, Asesmen Nasional, BOSP sekolah',
    defaultPerihal: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Satuan Pendidikan',
    popular: true,
    defaultStyle: 'sekolah'
  },
  {
    id: 'berita_acara',
    category: 'tu_dinas',
    label: 'Berita Acara (BA) Serah Terima',
    code: '005.3',
    instansi: 'BA-SMP.03',
    desc: 'Berita acara serah terima aset chromebook, sarpras laboratorium, berkas ujian',
    defaultPerihal: 'Berita Acara Serah Terima Sarana Pembelajaran & Peralatan TIK',
    popular: false,
    defaultStyle: 'ba'
  },
  {
    id: 'mou_kemitraan',
    category: 'tu_dinas',
    label: 'Perjanjian Kerjasama (MoU)',
    code: '421.7',
    instansi: 'MoU-SMP.03',
    desc: 'MoU skrining kesehatan UPTD Puskesmas, pembinaan Polsek Kras, Koramil, DU/DI',
    defaultPerihal: 'Naskah Perjanjian Kerjasama (MoU) Kemitraan Program Sekolah',
    popular: false,
    defaultStyle: 'custom'
  },
  {
    id: 'pemberitahuan_umum',
    category: 'tu_dinas',
    label: 'Pemberitahuan Kegiatan/Libur',
    code: '421.2',
    instansi: 'SMP.03',
    desc: 'Surat edaran pelaksanaan libur hari raya, pondok ramadhan, jeda tengah semester',
    defaultPerihal: 'Surat Pemberitahuan Jadwal Kegiatan & Pelaksanaan Kalender Pendidikan',
    popular: false,
    defaultStyle: 'sekolah'
  },
  {
    id: 'permohonan_bantuan',
    category: 'tu_dinas',
    label: 'Permohonan Kunjungan / Sarana',
    code: '420',
    instansi: 'SMP.03',
    desc: 'Permohonan izin studi tiru / kunjungan edukasi / pinjam pakai fasilitas luar',
    defaultPerihal: 'Surat Permohonan Izin Kunjungan Edukasi Lapangan Peserta Didik',
    popular: false,
    defaultStyle: 'sekolah'
  }
];

export default function QuickAgendaModal({
  isOpen,
  onClose,
  defaultApplicantName = '',
  defaultApplicantPhone = '',
  defaultApplicantRole = 'guru',
  userRole = 'guru',
  onSuccess
}: QuickAgendaModalProps) {
  // Live queries
  const rawLetters = useLiveQuery(() => db.letters.toArray()) || [];
  const teachers = useLiveQuery(() => db.teachers.toArray()) || [];

  // Outbox agenda calculation
  const outboxAgenda = getLatestAgendaInfo(rawLetters, 'outbox');

  // Form states
  const [selectedPresetId, setSelectedPresetId] = useState<string>('spt');
  const [classificationCode, setClassificationCode] = useState<string>('420.3');
  const [instansiCode, setInstansiCode] = useState<string>('418.20.2.62.03');
  const [applicantName, setApplicantName] = useState<string>(defaultApplicantName);
  const [applicantNip, setApplicantNip] = useState<string>('');
  const [applicantPhone, setApplicantPhone] = useState<string>(defaultApplicantPhone);
  const [title, setTitle] = useState<string>('Surat Perintah Tugas (SPT) Mengikuti Kegiatan MGMP / Pelatihan');
  const [addressedTo, setAddressedTo] = useState<string>('Yang Bersangkutan / Instansi Terkait');
  const [docDate, setDocDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Naskah fisik/digital dibuat secara mandiri oleh guru pemohon');
  
  // Preset Search & Filter States
  const [activeCategory, setActiveCategory] = useState<PresetCategoryType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyPopular, setOnlyPopular] = useState<boolean>(false);

  // Numbering Style: 'kedinasan' | 'sekolah' | 'romawi' | 'sk' | 'sppd' | 'ba' | 'custom'
  const [numberStyle, setNumberStyle] = useState<'kedinasan' | 'sekolah' | 'romawi' | 'sk' | 'sppd' | 'ba' | 'custom'>('kedinasan');
  const [showStyleSettings, setShowStyleSettings] = useState<boolean>(false);

  // Custom sequence override if needed
  const [useCustomSeq, setUseCustomSeq] = useState<boolean>(false);
  const [customSeq, setCustomSeq] = useState<string>('');

  // View state: 'form' | 'success'
  const [viewState, setViewState] = useState<'form' | 'success'>('form');
  const [createdLetter, setCreatedLetter] = useState<Letter | null>(null);
  const [createdSeq, setCreatedSeq] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Sync default name when opened or props changed
  useEffect(() => {
    if (isOpen) {
      if (defaultApplicantName && !applicantName) {
        setApplicantName(defaultApplicantName);
      }
      if (defaultApplicantPhone && !applicantPhone) {
        setApplicantPhone(defaultApplicantPhone);
      }
      // If defaultApplicantName matches any teacher, autofill NIP
      if (defaultApplicantName && teachers.length > 0) {
        const found = teachers.find(t => t.name.toLowerCase().includes(defaultApplicantName.toLowerCase()));
        if (found && found.nip) {
          setApplicantNip(found.nip);
        }
      }
    }
  }, [isOpen, defaultApplicantName, defaultApplicantPhone, teachers]);

  // Compute live next sequence number
  const effectiveSeq = useCustomSeq && customSeq.trim() 
    ? customSeq.trim().padStart(3, '0') 
    : outboxAgenda.formattedNext;

  const currentYear = new Date(docDate || new Date()).getFullYear();
  const currentMonthIdx = new Date(docDate || new Date()).getMonth();
  const romanMonth = ROMAN_MONTHS[currentMonthIdx] || 'I';

  // Dynamic calculation based on selected numbering style
  const calculatedReferenceNumber = useMemo(() => {
    switch (numberStyle) {
      case 'romawi':
        return `${classificationCode}/${effectiveSeq}/${instansiCode}/${romanMonth}/${currentYear}`;
      case 'sk':
        return `${classificationCode}/${effectiveSeq}/SK-${instansiCode.replace(/^SK-/, '')}/${currentYear}`;
      case 'sppd':
        return `${classificationCode}/${effectiveSeq}/SPPD/${instansiCode}/${currentYear}`;
      case 'ba':
        return `${classificationCode}/${effectiveSeq}/BA-${instansiCode.replace(/^BA-/, '')}/${currentYear}`;
      case 'sekolah':
      case 'kedinasan':
      case 'custom':
      default:
        return buildOfficialLetterNumber(classificationCode, effectiveSeq, instansiCode, currentYear);
    }
  }, [numberStyle, classificationCode, effectiveSeq, instansiCode, romanMonth, currentYear]);

  // Filter presets based on category, search, and popularity
  const filteredPresets = useMemo(() => {
    return PRESET_CATEGORIES.filter((preset) => {
      if (activeCategory !== 'all' && preset.category !== activeCategory) {
        return false;
      }
      if (onlyPopular && !preset.popular) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          preset.label.toLowerCase().includes(q) ||
          preset.code.toLowerCase().includes(q) ||
          preset.desc.toLowerCase().includes(q) ||
          preset.defaultPerihal.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, onlyPopular, searchQuery]);

  // When preset button clicked
  const handleSelectPreset = (preset: PresetFormat) => {
    setSelectedPresetId(preset.id);
    setClassificationCode(preset.code);
    setInstansiCode(preset.instansi);
    if (preset.defaultStyle) {
      setNumberStyle(preset.defaultStyle);
    }
    if (!title || PRESET_CATEGORIES.some(p => p.defaultPerihal === title)) {
      setTitle(preset.defaultPerihal);
    }
  };

  if (!isOpen) return null;

  // When teacher selected from dropdown (especially useful for Admin TU)
  const handleSelectTeacher = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherName = e.target.value;
    if (!teacherName) return;
    setApplicantName(teacherName);
    const found = teachers.find(t => t.name === teacherName);
    if (found) {
      if (found.nip) setApplicantNip(found.nip);
      if (found.phone) setApplicantPhone(found.phone);
    }
  };

  // Submit action: directly register into db.letters
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Mohon isi perihal / keperluan surat.');
      return;
    }

    if (!applicantName.trim()) {
      toast.error('Mohon isi nama guru / pemohon nomor agenda.');
      return;
    }

    try {
      const newLetterData: Letter = {
        type: 'outbox',
        referenceNumber: calculatedReferenceNumber,
        title: title.trim(),
        senderOrRecipient: addressedTo.trim() || 'Internal / Guru SMPN 3 Kras',
        addressedTo: addressedTo.trim() || 'Yang Bersangkutan',
        date: docDate || new Date().toISOString().split('T')[0],
        documentDate: docDate || new Date().toISOString().split('T')[0],
        description: `Permohonan nomor agenda keluar saja oleh ${applicantName.trim()}.${applicantNip ? ` NIP: ${applicantNip}.` : ''} Keperluan: ${title.trim()}${notes ? `. Catatan: ${notes.trim()}` : ''}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        sequenceNumber: effectiveSeq,
        code: classificationCode,
        processingUnit: 'Tata Usaha & Kepegawaian',
        category: 'Persuratan (SK/Tugas)',
        applicantName: applicantName.trim(),
        applicantPhone: applicantPhone.trim(),
        applicantRole: 'guru',
        source: userRole === 'admin' ? 'admin' : 'portal_guru_wali',
        submissionStatus: 'approved', // Langsung resmi/aktif karena hanya ambil nomor agenda
        isDraft: false,
        isAgendaOnly: true,
        adminNotes: userRole === 'admin' 
          ? 'Nomor agenda dikeluarkan langsung oleh Admin Tata Usaha' 
          : 'Nomor agenda diregistrasi mandiri oleh guru via Portal'
      };

      const newId = await db.letters.add(newLetterData);
      const savedLetter = { ...newLetterData, id: Number(newId) };

      // Log system
      await db.systemLogs.add({
        timestamp: new Date().toISOString(),
        level: 'success',
        action: 'AMBIL_NOMOR_AGENDA_GURU',
        category: 'Persuratan',
        user: applicantName.trim() || 'Guru SMPN 3 Kras',
        details: `Nomor agenda #${effectiveSeq} (${calculatedReferenceNumber}) berhasil diambil oleh guru: ${applicantName.trim()} untuk: ${title.trim()}`
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setCreatedLetter(savedLetter);
      setCreatedSeq(effectiveSeq);
      setViewState('success');

      if (onSuccess) {
        onSuccess(savedLetter, effectiveSeq);
      }

      toast.success(`Nomor Agenda #${effectiveSeq} berhasil diregistrasi!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal meregistrasi nomor agenda. Silakan coba lagi.');
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('Disalin ke papan klip!');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Generate complete text format for WhatsApp or Word
  const generateFullFormattedText = () => {
    if (!createdLetter) return '';
    const formattedDate = format(new Date(createdLetter.documentDate || createdLetter.date), 'dd MMMM yyyy', { locale: id });
    return `Nomor       : ${createdLetter.referenceNumber}
Lampiran    : -
Perihal     : ${createdLetter.title}
Tanggal     : ${formattedDate}
Ditujukan   : ${createdLetter.addressedTo || createdLetter.senderOrRecipient}
Pemohon     : ${createdLetter.applicantName || 'Guru SMPN 3 Kras'}
No. Agenda  : #${createdSeq}`;
  };

  // Open WhatsApp with pre-filled message
  const handleShareWhatsApp = () => {
    if (!createdLetter) return;
    const formattedDate = format(new Date(createdLetter.documentDate || createdLetter.date), 'dd MMMM yyyy', { locale: id });
    const waText = encodeURIComponent(
`*SMP NEGERI 3 KRAS KEDIRI*
*KONFIRMASI NOMOR AGENDA SURAT KELUAR*
==================================
No. Agenda : *#${createdSeq}*
No. Surat  : *${createdLetter.referenceNumber}*
Perihal    : ${createdLetter.title}
Tanggal    : ${formattedDate}
Pemohon    : ${createdLetter.applicantName}
Tujuan     : ${createdLetter.addressedTo || '-'}
==================================
Nomor ini telah resmi teregistrasi pada Buku Agenda Surat Keluar Tata Usaha SMPN 3 Kras. Silakan cantumkan nomor resmi tersebut pada naskah surat dinas Anda. Terima kasih.`
    );
    window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
  };

  // Print official slip / receipt
  const handlePrintSlip = () => {
    if (!createdLetter) return;
    const slipHtml = generateAgendaSlipHTML(createdLetter, applicantNip);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bukti Registrasi Nomor Agenda - ${createdLetter.referenceNumber}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; }
              @media print {
                body { padding: 0; }
                @page { margin: 1.5cm; }
              }
            </style>
          </head>
          <body>
            ${slipHtml}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  // Reset to form for another agenda
  const handleResetForAnother = () => {
    setViewState('form');
    setCreatedLetter(null);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border-b border-sky-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-sm">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Minta / Booking Nomor Agenda Saja</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                  Cepat & Praktis
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {userRole === 'admin' 
                  ? 'Beri nomor agenda resmi langsung ke guru/staf tanpa perlu membuat draf dokumen di sistem.' 
                  : 'Untuk guru yang menyusun naskah surat/tugas mandiri dan hanya memerlukan nomor agenda resmi sekolah.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT VIEW: FORM vs SUCCESS */}
        {viewState === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
            {/* Live Visual Number Preview Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/70 via-slate-950 to-indigo-950/70 border border-sky-500/50 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400">
                      Nomor Agenda Keluar Berikutnya
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Meneruskan #{outboxAgenda.formattedLast})
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-0.5 flex items-center gap-2">
                    <span className="text-sky-400">#{effectiveSeq}</span>
                    <span className="text-slate-600 font-normal">|</span>
                    <span className="text-xs sm:text-sm text-sky-200 font-semibold break-all">
                      {calculatedReferenceNumber}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStyleSettings(!showStyleSettings)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 underline flex items-center gap-1 font-medium"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showStyleSettings ? 'Tutup Format Nomor' : 'Pilih Gaya Penomoran'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseCustomSeq(!useCustomSeq)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline flex items-center gap-1"
                  >
                    <span>{useCustomSeq ? 'Gunakan Nomor Otomatis' : 'Ubah No. Agenda Manual'}</span>
                  </button>
                </div>
              </div>

              {/* Numbering Style Settings Selector if toggled */}
              {showStyleSettings && (
                <div className="mt-3 pt-3 border-t border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Format / Gaya Susunan Nomor Surat:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {numberStyle.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'kedinasan', label: 'Kedinasan Pemkab', sample: `${classificationCode}/${effectiveSeq}/418.20.2.62.03/${currentYear}` },
                      { id: 'sekolah', label: 'Satuan Pendidikan', sample: `${classificationCode}/${effectiveSeq}/SMP.03/${currentYear}` },
                      { id: 'romawi', label: 'Bulan Romawi', sample: `${classificationCode}/${effectiveSeq}/SMP.03/${romanMonth}/${currentYear}` },
                      { id: 'sk', label: 'Surat Keputusan (SK)', sample: `800/${effectiveSeq}/SK-SMP.03/${currentYear}` },
                      { id: 'sppd', label: 'SPPD Khusus', sample: `094.1/${effectiveSeq}/SPPD/418.20.../${currentYear}` },
                      { id: 'ba', label: 'Berita Acara (BA)', sample: `005.3/${effectiveSeq}/BA-SMP.03/${currentYear}` },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setNumberStyle(style.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-[10px] border transition-all ${
                          numberStyle === style.id
                            ? 'bg-sky-500/30 border-sky-400 text-white font-bold ring-1 ring-sky-400/50'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-slate-200">{style.label}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{style.sample}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Kode Klasifikasi Surat:</span>
                      <input
                        type="text"
                        value={classificationCode}
                        onChange={(e) => setClassificationCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-sky-400"
                        placeholder="Contoh: 420.3"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Kode Instansi / Unit:</span>
                      <input
                        type="text"
                        value={instansiCode}
                        onChange={(e) => setInstansiCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-sky-400"
                        placeholder="Contoh: 418.20.2.62.03 atau SMP.03"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Sequence Input if toggled */}
              {useCustomSeq && (
                <div className="mt-3 pt-3 border-t border-sky-500/20 flex items-center gap-2">
                  <span className="text-[11px] text-amber-300 font-medium shrink-0">Nomor Agenda Sisipan / Manual:</span>
                  <input
                    type="text"
                    value={customSeq}
                    onChange={(e) => setCustomSeq(e.target.value.replace(/\D/g, ''))}
                    placeholder={`Contoh: ${outboxAgenda.formattedNext}`}
                    className="w-24 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-white font-mono text-center outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">Masukkan angka saja (contoh: 24)</span>
                </div>
              )}
            </div>

            {/* Pilihan Cepat Kategori & Pencarian Format Nomor Surat */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] font-bold text-slate-200">
                    Pilih Format Nomor Surat ({PRESET_CATEGORIES.length} Pilihan):
                  </span>
                  <span className="text-[10px] text-sky-400/90 font-medium px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/60">
                    {filteredPresets.length} ditemukan
                  </span>
                </div>

                {/* Quick Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari format, kode, SPT, cuti, PIP..."
                    className="w-full bg-[#0B1120] border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10.5px]">
                {[
                  { id: 'all', label: 'Semua', count: PRESET_CATEGORIES.length },
                  { id: 'gtk', label: 'Tugas & GTK', count: PRESET_CATEGORIES.filter(p => p.category === 'gtk').length },
                  { id: 'kesiswaan', label: 'Kesiswaan', count: PRESET_CATEGORIES.filter(p => p.category === 'kesiswaan').length },
                  { id: 'undangan', label: 'Undangan', count: PRESET_CATEGORIES.filter(p => p.category === 'undangan').length },
                  { id: 'tu_dinas', label: 'TU & Kedinasan', count: PRESET_CATEGORIES.filter(p => p.category === 'tu_dinas').length },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as PresetCategoryType)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 border ${
                      activeCategory === cat.id
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm font-semibold'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`ml-1 px-1 py-0.2 rounded-full text-[9px] ${
                      activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOnlyPopular(!onlyPopular)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all whitespace-nowrap shrink-0 border flex items-center gap-1 ${
                    onlyPopular
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-semibold'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-amber-500/30'
                  }`}
                >
                  <span>⭐ Sering Digunakan</span>
                </button>
              </div>

              {/* Grid of Preset Format Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? 'bg-sky-500/25 border-sky-400 text-white shadow-sm ring-1 ring-sky-400/40'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {preset.popular && (
                        <div className="absolute top-1 right-1">
                          <span className="text-[8.5px] text-amber-400 font-bold">★</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-sky-300 font-bold">
                            {preset.code}
                          </span>
                          <span className="text-[8.5px] uppercase font-bold text-slate-500 tracking-wider">
                            {preset.category === 'gtk' ? 'GTK' : preset.category === 'kesiswaan' ? 'Siswa' : preset.category === 'undangan' ? 'Undangan' : 'TU'}
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] text-slate-200 group-hover:text-white leading-tight">
                          {preset.label}
                        </div>
                      </div>

                      <div className="text-[9.5px] text-slate-400 line-clamp-2 mt-1 opacity-80 leading-snug">
                        {preset.desc}
                      </div>

                      {isSelected && (
                        <div className="mt-1.5 pt-1 border-t border-sky-500/30 flex items-center justify-between text-[9px] text-sky-300">
                          <span className="flex items-center gap-0.5 font-bold">
                            <Check className="w-2.5 h-2.5" /> Terpilih
                          </span>
                          <span className="font-mono text-[8.5px] opacity-75">{preset.instansi}</span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {filteredPresets.length === 0 && (
                  <div className="col-span-2 sm:col-span-3 py-6 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs">Tidak ditemukan format surat dengan kata kunci "{searchQuery}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                        setOnlyPopular(false);
                      }}
                      className="text-xs text-sky-400 hover:underline font-semibold"
                    >
                      Reset Filter & Tampilkan Semua (28 Format)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Identitas Guru / Pemohon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nama Guru / Pemohon <span className="text-rose-400">*</span>
                </label>
                {/* If there are teachers in database, allow selecting or typing */}
                {teachers.length > 0 && userRole === 'admin' ? (
                  <div className="space-y-1">
                    <select
                      onChange={handleSelectTeacher}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                    >
                      <option value="">-- Pilih dari Daftar Guru --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} {t.nip ? `(${t.nip})` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Atau ketik nama lengkap & gelar..."
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500 mt-1"
                      required
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Nama lengkap guru pemohon..."
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    NIP / NUPTK (Opsional)
                  </label>
                  <input
                    type="text"
                    value={applicantNip}
                    onChange={(e) => setApplicantNip(e.target.value)}
                    placeholder="Contoh: 1980..."
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    No. HP / WA (Opsional)
                  </label>
                  <input
                    type="text"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Perihal / Keperluan Surat */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Perihal / Keperluan Surat <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Surat Perintah Tugas (SPT) Mengikuti MGMP IPA Semester Genap..."
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500 font-medium"
                required
              />
            </div>

            {/* Tujuan & Tanggal Surat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ditujukan Kepada / Instansi Tujuan
                </label>
                <input
                  type="text"
                  value={addressedTo}
                  onChange={(e) => setAddressedTo(e.target.value)}
                  placeholder="Contoh: Kepala Dinas Pendidikan Kab. Kediri / Ketua MGMP..."
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Catatan / Keterangan Tambahan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Naskah dibuat di Word, berkas asli sudah ditandatangani kepsek..."
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Otomatis tercatat di Buku Agenda Keluar</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Ambil & Registrasi Agenda (#{effectiveSeq})</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* SUCCESS VIEW: TIKET / STRUK BUKTI PENGAMBILAN NOMOR AGENDA */
          <div className="p-6 space-y-5 text-xs">
            {/* Header Success Badge */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">
                Nomor Agenda Berhasil Diregistrasi!
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Nomor resmi telah dialokasikan dan tercatat secara sah di Buku Register Surat Keluar Tata Usaha SMP Negeri 3 Kras.
              </p>
            </div>

            {/* Big Ticket Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/80 via-slate-950 to-indigo-950/80 border-2 border-sky-500/60 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 font-mono font-extrabold text-sm border border-sky-400/40">
                    AGENDA #{createdSeq}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                    ✓ Sah & Terdaftar
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {createdLetter?.date ? format(new Date(createdLetter.date), 'dd MMMM yyyy', { locale: id }) : '-'}
                </span>
              </div>

              {/* Big Reference Number */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Nomor Surat Keluar Resmi:
                </span>
                <div className="text-base sm:text-lg font-mono font-extrabold text-white mt-0.5 break-all select-all">
                  {createdLetter?.referenceNumber}
                </div>
              </div>

              {/* Letter Summary Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Perihal:</span>
                  <span className="font-semibold text-slate-200">{createdLetter?.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pemohon / Guru:</span>
                  <span className="font-semibold text-slate-200">{createdLetter?.applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tujuan:</span>
                  <span className="text-slate-300">{createdLetter?.addressedTo || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Unit Pengelola:</span>
                  <span className="text-slate-300">{createdLetter?.processingUnit || 'Tata Usaha'}</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons: Salin, WhatsApp, Cetak Slip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Button 1: Copy Number Only */}
              <button
                type="button"
                onClick={() => createdLetter && handleCopy(createdLetter.referenceNumber, 'number')}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-between border border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {copiedType === 'number' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-sky-400" />
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold">Salin Nomor Surat</div>
                    <div className="text-[10px] text-slate-400 font-normal">Hanya salin teks nomor surat</div>
                  </div>
                </div>
                <span className="text-[10px] text-sky-300 font-mono">
                  {copiedType === 'number' ? 'Tersalin!' : 'Copy'}
                </span>
              </button>

              {/* Button 2: Copy Full Block for Word / Docs */}
              <button
                type="button"
                onClick={() => handleCopy(generateFullFormattedText(), 'full')}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-between border border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {copiedType === 'full' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400" />
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold">Salin Format Kop Lengkap</div>
                    <div className="text-[10px] text-slate-400 font-normal">Nomor, Lampiran, Perihal, Tanggal</div>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-300 font-mono">
                  {copiedType === 'full' ? 'Tersalin!' : 'Copy'}
                </span>
              </button>

              {/* Button 3: Send via WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 font-semibold flex items-center justify-between border border-emerald-500/40 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-emerald-300">Bagikan via WhatsApp</div>
                    <div className="text-[10px] text-emerald-400/80 font-normal">Kirim konfirmasi agenda ke guru / grup</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Button 4: Print Official Agenda Slip */}
              <button
                type="button"
                onClick={handlePrintSlip}
                className="p-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 text-sky-200 font-semibold flex items-center justify-between border border-sky-500/40 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-sky-300">Cetak Slip Tanda Terima</div>
                    <div className="text-[10px] text-sky-400/80 font-normal">Lembar bukti fisik bertanda tangan TU</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-400" />
              </button>
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Minta Nomor Agenda Lain Lagi</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors shadow-sm"
              >
                Tutup Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
