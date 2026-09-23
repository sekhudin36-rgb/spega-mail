import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Letter, type Student, type Teacher } from '../lib/db';
import { 
  User, 
  Phone, 
  GraduationCap, 
  Users, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Download, 
  Eye, 
  Printer, 
  FilePlus, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  Layers,
  FileCheck,
  Search,
  MessageCircle,
  HelpCircle,
  Briefcase,
  Hash,
  RotateCcw,
  Settings2,
  BookOpen,
  ArrowRight,
  Filter,
  Tag,
  Zap,
  Palette,
  Lock,
  KeyRound,
  FileDown,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import QuickAgendaModal from '../components/QuickAgendaModal';
import CanvaPosterModal from '../components/CanvaPosterModal';
import AdminPinModal from '../components/AdminPinModal';
import AppLogo from '../components/AppLogo';
import SecretAdminMarker, { useSecretAdminShortcut } from '../components/SecretAdminTrigger';
import ThemeToggleButton from '../components/ThemeToggleButton';
import PortalBottomNav from '../components/PortalBottomNav';
import { MobilePWAFloatingPrompt, MobilePWAHeaderButton } from '../components/MobilePWAInstall';
import { triggerBackgroundDriveDatabaseSync } from '../lib/googleDriveDatabase';
import { generateFullUserManualPdf } from '../lib/pdfGuideHelper';
import { 
  getSchoolConfig, 
  drawPdfKopHeader, 
  renderOfficialKopHTML, 
  generateLetterQRCode,
  downloadLetterDocument,
  generateOfficialLetterHTML,
  generateSuratPermohonanHTML,
  generateSuratDinasResmiHTML,
  generateCombinedDraftHTML,
  generateSuratPermohonanPDF,
  generateSuratDinasResmiPDF,
  generateCombinedDraftPDF
} from '../lib/printHelper';
import { 
  getLatestAgendaInfo, 
  getTemplateClassification, 
  buildOfficialLetterNumber,
  getOutboxAgendaList,
  type AgendaItem 
} from '../lib/agendaHelper';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { cn } from '../lib/utils';

interface ApplicantSession {
  name: string;
  phone: string;
  role: 'guru' | 'wali';
  extraInfo?: string;
}

export default function PortalGuruWali() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ApplicantSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('applicantSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginRole, setLoginRole] = useState<'guru' | 'wali'>('guru');
  const [loginExtra, setLoginExtra] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'buat_draf' | 'riwayat' | 'registrasi_agenda'
  const [activeTab, setActiveTab] = useState<'buat_draf' | 'riwayat' | 'registrasi_agenda'>('buat_draf');

  // State untuk Tab Registrasi Agenda Surat Otomatis
  const [agendaSearchQuery, setAgendaSearchQuery] = useState('');
  const [agendaYearFilter, setAgendaYearFilter] = useState<number>(new Date().getFullYear());
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Wizard state for Draft creation
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [letterTitle, setLetterTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [urgency, setUrgency] = useState('Biasa');
  const [documentDate, setDocumentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Target Person Selection
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customTargetName, setCustomTargetName] = useState('');
  const [customTargetNipNisn, setCustomTargetNipNisn] = useState('');
  const [customClassOrRole, setCustomClassOrRole] = useState('');

  // Additional detail fields
  const [taskDasar, setTaskDasar] = useState('Perintah Kepala Sekolah');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventEndDate, setEventEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [destinationSchool, setDestinationSchool] = useState('');
  const [scholarshipOrAgency, setScholarshipOrAgency] = useState('');
  const [parentJobOrIncome, setParentJobOrIncome] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [customContent, setCustomContent] = useState('');

  // Preview & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    htmlContent: string;
    onDownloadPdf?: () => void;
    onDownloadWord?: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    htmlContent: ''
  });

  // Fetch teachers & students from database
  const teachers = useLiveQuery(() => db.teachers.toArray()) || [];
  const students = useLiveQuery(() => db.students.toArray()) || [];
  const allLetters = useLiveQuery(() => db.letters.toArray()) || [];

  // Hitung nomor agenda surat keluar terakhir & berikutnya secara otomatis
  const outboxAgenda = getLatestAgendaInfo(allLetters, 'outbox');

  // State Registrasi Nomor Agenda Surat Otomatis
  const [useAutoAgenda, setUseAutoAgenda] = useState(true);
  const [manualAgendaSeq, setManualAgendaSeq] = useState('');
  const [customClassificationCode, setCustomClassificationCode] = useState('');
  const [showAgendaSettings, setShowAgendaSettings] = useState(false);
  const [isQuickAgendaModalOpen, setIsQuickAgendaModalOpen] = useState(false);
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  // Secret admin shortcut listener (Ctrl+Shift+A or Alt+A)
  useSecretAdminShortcut(() => setIsAdminPinModalOpen(true));

  // Sync kode klasifikasi ketika template kategori berubah
  useEffect(() => {
    if (selectedCategory) {
      const cls = getTemplateClassification(selectedCategory);
      setCustomClassificationCode(cls.code);
    }
  }, [selectedCategory]);

  // Fetch letters submitted by this user (or all drafts if in guest mode)
  const myLetters = useLiveQuery(async () => {
    if (!session) return [];
    const all = await db.letters.toArray();
    return all.filter(l => 
      l.applicantPhone === session.phone || 
      (l.applicantName && l.applicantName.toLowerCase() === session.name.toLowerCase()) ||
      (l.source === 'portal_guru_wali' && l.applicantRole === session.role)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [session]) || [];

  // Pre-fill target name when login session changes or role changes
  useEffect(() => {
    if (session) {
      if (session.role === 'guru') {
        const matched = teachers.find(t => t.name.toLowerCase().includes(session.name.toLowerCase()) || session.name.toLowerCase().includes(t.name.toLowerCase()));
        if (matched && matched.id) {
          setSelectedTeacherId(matched.id.toString());
        }
      }
    }
  }, [session, teachers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) {
      setLoginError('Silakan masukkan nama lengkap Anda.');
      return;
    }
    if (!loginPhone.trim() || loginPhone.trim().length < 9) {
      setLoginError('Silakan masukkan nomor HP/WhatsApp yang valid (minimal 10 digit).');
      return;
    }

    const newSession: ApplicantSession = {
      name: loginName.trim(),
      phone: loginPhone.trim(),
      role: loginRole,
      extraInfo: loginExtra.trim()
    };

    sessionStorage.setItem('applicantSession', JSON.stringify(newSession));
    sessionStorage.setItem('userRole', 'guru_wali');
    sessionStorage.setItem('isGuestAuthenticated', 'true');
    setSession(newSession);
    setLoginError('');
    toast.success(`Selamat datang, ${newSession.name}! Silakan buat permohonan surat.`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('applicantSession');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('isGuestAuthenticated');
    setSession(null);
    toast.success('Anda telah keluar dari Portal Guru & Wali');
  };

  // Pre-defined templates for Guru and Wali
  const guruTemplates = [
    {
      id: 'guru_tugas',
      title: 'Permohonan Surat Tugas / Perjalanan Dinas',
      category: 'Kepegawaian',
      icon: Briefcase,
      desc: 'Pengajuan surat tugas pelatihan, bimtek, workshop, MGMP, atau dinas luar sekolah.',
      defaultPurpose: 'Mengikuti Kegiatan Musyawarah Guru Mata Pelajaran (MGMP) / Pelatihan Peningkatan Kompetensi Guru'
    },
    {
      id: 'guru_izin',
      title: 'Surat Permohonan Izin Tidak Hadir / Mengajar',
      category: 'Kepegawaian',
      icon: Clock,
      desc: 'Pengajuan izin berhalangan hadir karena sakit, urusan keluarga, atau dinas mendesak.',
      defaultPurpose: 'Izin tidak dapat melaksanakan tugas mengajar dikarenakan pemeriksaan kesehatan / urusan keluarga mendesak'
    },
    {
      id: 'guru_cuti',
      title: 'Permohonan Cuti Guru / Tenaga Pendidik',
      category: 'Kepegawaian',
      icon: Calendar,
      desc: 'Permohonan hak cuti tahunan, cuti bersalin, cuti alasan penting, atau cuti sakit.',
      defaultPurpose: 'Pengajuan Cuti Alasan Penting / Cuti Sakit'
    },
    {
      id: 'guru_rekomendasi_lomba',
      title: 'Surat Tugas Pendampingan Lomba / Siswa',
      category: 'Kesiswaan',
      icon: Sparkles,
      desc: 'Pengajuan surat tugas pembina / guru pembimbing pendamping peserta didik lomba OSN/O2SN/FLS2N.',
      defaultPurpose: 'Mendampingi Peserta Didik SMPN 3 Kras dalam Kegiatan Lomba Tingkat Kabupaten / Provinsi'
    },
    {
      id: 'guru_pengantar',
      title: 'Surat Pengantar Kegiatan Kelas / Ekskul',
      category: 'Kurikulum',
      icon: FileText,
      desc: 'Surat pengantar dinas untuk kegiatan field trip, studi lingkungan, atau kegiatan ekstrakurikuler.',
      defaultPurpose: 'Penyelenggaraan Kegiatan Pembelajaran Luar Kelas (Outdoor Learning) & Ekstrakurikuler'
    },
    {
      id: 'guru_custom',
      title: 'Draf Surat Permohonan Guru (Kustom)',
      category: 'Umum / TU',
      icon: FilePlus,
      desc: 'Tuliskan naskah permohonan dinas kustom dengan isi dan tujuan sesuai kebutuhan Anda.',
      defaultPurpose: 'Permohonan Kebutuhan Pembelajaran & Fasilitas Sekolah'
    }
  ];

  const waliTemplates = [
    {
      id: 'wali_aktif',
      title: 'Surat Keterangan Siswa Aktif Belajar',
      category: 'Kesiswaan',
      icon: GraduationCap,
      desc: 'Keterangan resmi status siswa aktif untuk pengurusan BPJS, Tunjangan Gaji Ortu, PIP, Beasiswa, Visa, dll.',
      defaultPurpose: 'Persyaratan Kelengkapan Berkas Tunjangan Anak / BPJS Kesehatan / Pengajuan Beasiswa'
    },
    {
      id: 'wali_izin_sakit',
      title: 'Surat Pemberitahuan / Izin Siswa Tidak Masuk',
      category: 'Kesiswaan',
      icon: Clock,
      desc: 'Pemberitahuan resmi dari orang tua bahwa siswa berhalangan hadir karena sakit atau acara keluarga.',
      defaultPurpose: 'Pemberitahuan Izin Siswa Sakit dan Tidak Dapat Mengikuti Kegiatan KBM Sekolah'
    },
    {
      id: 'wali_pindah',
      title: 'Permohonan Surat Keterangan Pindah Sekolah',
      category: 'Kesiswaan',
      icon: Building2,
      desc: 'Permohonan berkas mutasi keluar / pindah sekolah karena domisili pindah tugas orang tua.',
      defaultPurpose: 'Permohonan Mutasi / Pindah Sekolah Mengikuti Domisili Orang Tua'
    },
    {
      id: 'wali_kelakuan_baik',
      title: 'Surat Keterangan Berkelakuan Baik',
      category: 'Kesiswaan',
      icon: CheckCircle2,
      desc: 'Keterangan akhlak & perilaku baik siswa untuk persyaratan pendaftaran jenjang lanjutan / beasiswa.',
      defaultPurpose: 'Persyaratan Pendaftaran Masuk Sekolah Lanjutan / Lembaga Pendidikan / Beasiswa Prestasi'
    },
    {
      id: 'wali_dispensasi',
      title: 'Permohonan Dispensasi Izin Siswa',
      category: 'Kesiswaan',
      icon: Sparkles,
      desc: 'Dispensasi izin tidak mengikuti jam pelajaran tertentu karena mewakili kegiatan olahraga/seni luar.',
      defaultPurpose: 'Dispensasi Izin Mengikuti Pemusatan Latihan / Kejuaraan Tingkat Daerah'
    },
    {
      id: 'wali_custom',
      title: 'Surat Permohonan Orang Tua / Wali (Kustom)',
      category: 'Umum / TU',
      icon: FilePlus,
      desc: 'Tuliskan permohonan resmi wali murid dengan uraian khusus sesuai keperluan siswa.',
      defaultPurpose: 'Permohonan Khusus Wali Murid ke Pihak Sekolah'
    }
  ];

  const currentTemplates = session?.role === 'wali' ? waliTemplates : guruTemplates;

  const handleSelectTemplate = (template: typeof currentTemplates[0]) => {
    setSelectedCategory(template.id);
    setLetterTitle(template.title);
    setPurpose(template.defaultPurpose);
    
    // Auto populate student if parent provided child name
    if (session?.role === 'wali' && !selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id?.toString() || '');
    }
  };

  // Compile dynamic letter body tailored to selected template
  const constructLetterBody = () => {
    const config = getSchoolConfig();
    const isTeacher = session?.role === 'guru';
    
    const teacherObj = teachers.find(t => t.id?.toString() === selectedTeacherId);
    const studentObj = students.find(s => s.id?.toString() === selectedStudentId);

    const personName = isTeacher 
      ? (teacherObj ? teacherObj.name : (customTargetName || session?.name || ''))
      : (studentObj ? studentObj.name : (customTargetName || 'Peserta Didik'));

    const personId = isTeacher
      ? (teacherObj?.nip || customTargetNipNisn || '-')
      : (studentObj?.nisn || customTargetNipNisn || '-');

    const personClassOrRole = isTeacher
      ? (teacherObj?.subject || customClassOrRole || 'Guru / Tenaga Pendidik')
      : (studentObj?.grade ? `Kelas ${studentObj.grade}` : (customClassOrRole || 'Kelas VII/VIII/IX'));

    const formattedEventStart = eventStartDate ? format(new Date(eventStartDate), 'dd MMMM yyyy', { locale: id }) : '-';
    const formattedEventEnd = eventEndDate ? format(new Date(eventEndDate), 'dd MMMM yyyy', { locale: id }) : '-';

    // 1. Template: Surat Tugas Guru
    if (selectedCategory === 'guru_tugas') {
      const docDateObj = eventStartDate ? new Date(eventStartDate) : new Date();
      const dayName = format(docDateObj, 'EEEE', { locale: id });
      const finalDasar = taskDasar?.trim() || 'Perintah Kepala Sekolah';
      return `Dasar : ${finalDasar}

Kepada Saudara. :
• Nama : ${personName}
• NIP : ${personId}
• Pangkat/Gol.Ruang : ${teacherObj?.rankCategory || teacherObj?.rank || 'Penata Muda / III/a'}
• Jabatan : ${personClassOrRole}

Untuk :
${purpose || 'Melaksanakan tugas kedinasan / pendampingan kegiatan sekolah'}

Hari : ${dayName}
Tanggal : ${formattedEventStart}${formattedEventEnd && formattedEventEnd !== formattedEventStart ? ` s.d. ${formattedEventEnd}` : ''}
Pukul : 08.00 WIB s.d Selesai
Tempat : ${eventLocation || 'SMP Negeri 3 Kras / Lokasi Kegiatan'}

Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.`;
    }

    // 2. Template: Surat Keterangan Siswa Aktif Belajar
    if (selectedCategory === 'wali_aktif') {
      return `Kepala ${config.schoolName}, Kecamatan Kras, Kabupaten Kediri dengan ini menerangkan dengan sesungguhnya bahwa:

• Nama Peserta Didik : ${personName}
• NISN / No. Induk   : ${personId}
• Kelas / Tingkat    : ${personClassOrRole}
• Nama Orang Tua/Wali: ${session?.name} (No. HP/WA: ${session?.phone})

Adalah benar-benar peserta didik yang saat ini tercatat masih aktif mengikuti kegiatan proses belajar mengajar (KBM) pada semester berjalan Tahun Ajaran ${new Date().getFullYear()}/${new Date().getFullYear() + 1} di ${config.schoolName}.

Surat keterangan ini diberikan atas permohonan orang tua/wali murid bersangkutan untuk keperluan:
"${purpose || 'Kelengkapan Administrasi Tunjangan Anak / BPJS Kesehatan / Pengajuan Beasiswa'}"${scholarshipOrAgency ? ` pada lembaga ${scholarshipOrAgency}` : ''}.
${customContent ? `\nCatatan Tambahan:\n${customContent}\n` : ''}
Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.`;
    }

    // 3. Template: Surat Permohonan Cuti / Izin Guru
    if (selectedCategory === 'guru_izin' || selectedCategory === 'guru_cuti') {
      return `Kepala ${config.schoolName}, Kabupaten Kediri dengan ini menerangkan bahwa:

• Nama Lengkap : ${personName}
• NIP / NUPTK  : ${personId}
• Jabatan/Unit : ${personClassOrRole}

Diberikan izin / cuti dinas sementara terhitung mulai tanggal ${formattedEventStart} s.d. ${formattedEventEnd} sehubungan dengan:
"${leaveReason || purpose || 'Keperluan Urusan Keluarga / Izin Resmi'}"
${customContent ? `\nCatatan:\n${customContent}\n` : ''}
Selama menjalankan izin tersebut, tugas dan kewajiban mengajar telah dikoordinasikan dengan guru piket / kurikulum sekolah. Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.`;
    }

    // 4. Template: Surat Keterangan Pindah Sekolah / Mutasi
    if (selectedCategory === 'wali_pindah') {
      return `Kepala ${config.schoolName}, Kabupaten Kediri menerangkan bahwa peserta didik:

• Nama Peserta Didik : ${personName}
• NISN / No. Induk   : ${personId}
• Kelas Terakhir     : ${personClassOrRole}
• Nama Orang Tua/Wali: ${session?.name} (No. HP/WA: ${session?.phone})

Telah disetujui untuk mutasi / pindah sekolah ke:
"${destinationSchool || 'Sekolah Tujuan yang Dimaksud'}"
Atas permohonan tertulis dari orang tua/wali murid dengan alasan: ${leaveReason || purpose || 'Mengikuti domisili / kepindahan tugas orang tua'}.
${customContent ? `\nCatatan Tambahan:\n${customContent}\n` : ''}
Segala kelengkapan berkas administrasi dan buku rapor siswa bersangkutan telah diserahterimakan sesuai prosedur kedinasan. Demikian surat keterangan pindah ini kami buat untuk dapat dipergunakan sebagaimana mestinya.`;
    }

    // 5. Template: Surat Keterangan Berkelakuan Baik
    if (selectedCategory === 'wali_kelakuan_baik') {
      return `Kepala ${config.schoolName}, Kabupaten Kediri menerangkan dengan sesungguhnya bahwa peserta didik:

• Nama Peserta Didik : ${personName}
• NISN / No. Induk   : ${personId}
• Kelas              : ${personClassOrRole}
• Nama Orang Tua/Wali: ${session?.name} (No. HP/WA: ${session?.phone})

Berdasarkan catatan tata tertib dan bimbingan konseling di sekolah kami, peserta didik tersebut di atas selama menempuh pendidikan di ${config.schoolName} memiliki kelakuan, kepribadian, dan budi pekerti yang BAIK, serta tidak pernah terlibat tindakan kriminalitas, narkoba, miras, maupun perkelahian pelajar.

Surat keterangan ini diberikan atas permohonan orang tua/wali untuk keperluan:
"${purpose || 'Persyaratan Pendaftaran Masuk Jenjang Pendidikan Lanjutan / Beasiswa Prestasi'}"${scholarshipOrAgency ? ` pada ${scholarshipOrAgency}` : ''}.
${customContent ? `\nCatatan Tambahan:\n${customContent}\n` : ''}
Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.`;
    }

    // 6. Template: Surat Rekomendasi / Lomba / Dispensasi
    if (selectedCategory === 'guru_rekomendasi_lomba' || selectedCategory === 'wali_dispensasi') {
      return `Kepala ${config.schoolName}, Kabupaten Kediri dengan ini memberikan rekomendasi / dispensasi kepada:

• Nama Lengkap       : ${personName}
• ${isTeacher ? 'NIP / Jabatan' : 'NISN / Kelas'} : ${personId} / ${personClassOrRole}
• Nama Pemohon / Wali: ${session?.name} (No. HP/WA: ${session?.phone})

Untuk mengikuti kegiatan:
"${purpose || 'Kegiatan Kejuaraan / Pembinaan Prestasi Akademik & Non-Akademik'}"

Pelaksanaan kegiatan:
• Tempat / Lokasi : ${eventLocation || 'Sesuai Jadwal Panitia'}
• Waktu Pelaksanaan: ${formattedEventStart} s.d. ${formattedEventEnd}
${scholarshipOrAgency ? `• Instansi Penyelenggara : ${scholarshipOrAgency}\n` : ''}
${customContent ? `\nCatatan Tambahan:\n${customContent}\n` : ''}
Demikian surat rekomendasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya dan memberikan kelancaran bagi yang bersangkutan.`;
    }

    // 7. Fallback / Custom Format
    let body = `Yang bertanda tangan di bawah ini Kepala ${config.schoolName}, dengan ini menerangkan permohonan naskah surat dinas kepada:\n\n`;
    body += `• Nama : ${personName}\n`;
    body += `• ${isTeacher ? 'NIP / Jabatan' : 'NISN / Kelas'} : ${personId} / ${personClassOrRole}\n`;
    body += `• Pemohon / Kontak : ${session?.name} (No. HP/WA: ${session?.phone})\n\n`;
    body += `Terkait perihal: "${purpose || letterTitle}"\n`;
    if (eventLocation) body += `• Lokasi : ${eventLocation}\n`;
    if (eventStartDate) body += `• Waktu : ${formattedEventStart} s.d. ${formattedEventEnd}\n`;
    if (destinationSchool) body += `• Sekolah Tujuan : ${destinationSchool}\n`;
    if (scholarshipOrAgency) body += `• Lembaga Tujuan : ${scholarshipOrAgency}\n`;
    if (leaveReason) body += `• Keterangan : ${leaveReason}\n`;
    if (customContent) body += `\nCatatan Tambahan:\n${customContent}\n`;
    body += `\nDemikian naskah surat ini dibuat untuk dapat diproses dan dipergunakan sebagaimana mestinya.`;
    return body;
  };

  const handleGenerateAndSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!letterTitle.trim()) {
      toast.error('Silakan tentukan judul / perihal surat.');
      return;
    }

    setIsSubmitting(true);
    try {
      const config = getSchoolConfig();
      const currentYear = new Date().getFullYear();
      const templateConfig = getTemplateClassification(selectedCategory);
      
      // Hitung nomor urut agenda berikutnya secara otomatis meneruskan agenda sebelumnya
      const effectiveSeq = useAutoAgenda 
        ? outboxAgenda.formattedNext 
        : (manualAgendaSeq.trim() || outboxAgenda.formattedNext);
      const effectiveCode = customClassificationCode || templateConfig.code;
      const refNumber = buildOfficialLetterNumber(
        effectiveCode,
        effectiveSeq,
        templateConfig.instansiCode,
        currentYear
      );
      const fullBody = constructLetterBody();

      const newLetter: Letter = {
        type: 'outbox',
        category: templateConfig.category,
        referenceNumber: refNumber,
        sequenceNumber: effectiveSeq,
        code: effectiveCode,
        title: letterTitle,
        senderOrRecipient: scholarshipOrAgency || (session.role === 'guru' ? 'Kepala Sekolah / Dinas Pendidikan' : 'Orang Tua / Siswa Bersangkutan'),
        date: documentDate,
        documentDate: documentDate,
        description: fullBody,
        status: 'active',
        urgency: urgency,
        securityStyle: 'Biasa',
        processingUnit: templateConfig.unit,
        receivedBy: `${session.name} (${session.phone})`,
        isDraft: true,
        templateType: selectedCategory,
        // Applicant specific metadata (visible to admin)
        applicantName: session.name,
        applicantPhone: session.phone,
        applicantRole: session.role,
        source: 'portal_guru_wali',
        submissionStatus: 'pending_approval',
        createdAt: new Date().toISOString()
      };

      const letterId = await db.letters.add(newLetter);
      newLetter.id = letterId as number;

      // Log ke Riwayat Sistem
      await db.systemLogs.add({
        timestamp: new Date().toISOString(),
        action: 'Registrasi Agenda Pengajuan',
        category: 'Persuratan',
        level: 'info',
        user: `${session.name} (${session.role})`,
        details: `Permohonan surat '${letterTitle}' didaftarkan dengan Nomor Agenda #${effectiveSeq} (${refNumber}), meneruskan agenda nomor sebelumnya (#${outboxAgenda.formattedLast}).`
      });

      // Sinkronisasi otomatis ke Database Google Drive
      triggerBackgroundDriveDatabaseSync();

      // Generate ONLY Surat Permohonan as submission proof for Applicant (Official letter requires admin approval)
      generateSuratPermohonanPDF(newLetter, config);

      confetti({ particleCount: 90, spread: 90, origin: { y: 0.6 } });
      toast.success(`Draf permohonan berhasil dikirim dengan Nomor Agenda #${effectiveSeq} (${refNumber}), meneruskan nomor agenda keluar sebelumnya (#${outboxAgenda.formattedLast})! Naskah resmi dapat dicetak setelah diverifikasi & disetujui Admin TU.`, { duration: 7000 });
      
      // Reset form & go to history tab
      setSelectedCategory('');
      setPurpose('');
      setCustomContent('');
      setManualAgendaSeq('');
      setActiveTab('riwayat');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat draf surat');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview helper with multi-doc options & admin approval check
  const handlePreviewCurrentLetter = async (letterItem: Letter, defaultDocType: 'permohonan' | 'resmi' | 'combined' = 'permohonan') => {
    try {
      const config = getSchoolConfig();
      const isApproved = letterItem.submissionStatus === 'approved';

      // Restrict Official Letter and Combined package until Admin approval is granted
      if ((defaultDocType === 'resmi' || defaultDocType === 'combined') && !isApproved) {
        toast.error('Surat Dinas Resmi Sekolah belum dapat dicetak karena masih menunggu verifikasi & persetujuan Petugas Tata Usaha. Anda dapat mencetak Surat Permohonan terlebih dahulu.', { duration: 5000 });
        return;
      }

      let htmlContent = '';
      let title = '';

      if (defaultDocType === 'permohonan') {
        htmlContent = generateSuratPermohonanHTML(letterItem, config);
        title = `Pratinjau Surat Permohonan - ${letterItem.title}`;
      } else if (defaultDocType === 'resmi') {
        htmlContent = await generateSuratDinasResmiHTML(letterItem, config, teachers);
        title = `Pratinjau Surat Resmi Sekolah (Tervalidasi) - ${letterItem.title}`;
      } else {
        htmlContent = await generateCombinedDraftHTML(letterItem, config, teachers);
        title = `Paket Lengkap Draf (Surat Permohonan & Surat Resmi) - ${letterItem.title}`;
      }

      setPrintModalState({
        isOpen: true,
        title,
        subtitle: `Pemohon: ${letterItem.applicantName || session?.name} (${letterItem.applicantPhone || session?.phone}) • ${letterItem.referenceNumber}`,
        htmlContent,
        onDownloadPdf: async () => {
          if (defaultDocType === 'permohonan') {
            generateSuratPermohonanPDF(letterItem, config);
            toast.success('Surat Permohonan (PDF) berhasil diunduh');
          } else if (defaultDocType === 'resmi') {
            await generateSuratDinasResmiPDF(letterItem, config, true, teachers);
            toast.success('Surat Resmi Sekolah (PDF) berhasil diunduh');
          } else {
            await generateCombinedDraftPDF(letterItem, config, teachers);
            toast.success('Paket Lengkap 2 Dokumen (PDF) berhasil diunduh');
          }
        },
        onDownloadWord: () => {
          const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Naskah_${defaultDocType}_${(letterItem.title || 'Draf').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Naskah berhasil diekspor ke Word');
        }
      });
    } catch (e) {
      toast.error('Gagal memuat pratinjau dokumen');
    }
  };

  // Konfigurasi nomor agenda surat keluar dinamis untuk preview dan formulir
  const currentTemplateClassification = getTemplateClassification(selectedCategory);
  const effectiveClassificationCode = customClassificationCode || currentTemplateClassification.code;
  const effectiveSeq = useAutoAgenda 
    ? outboxAgenda.formattedNext 
    : (manualAgendaSeq.trim() || outboxAgenda.formattedNext);
  const currentYear = new Date().getFullYear();
  const previewOfficialRef = buildOfficialLetterNumber(
    effectiveClassificationCode,
    effectiveSeq,
    currentTemplateClassification.instansiCode,
    currentYear
  );

  // Daftar surat keluar untuk Buku Register Agenda Surat Keluar
  const outboxAgendaList = getOutboxAgendaList(allLetters, agendaYearFilter);
  const filteredAgendaList = outboxAgendaList.filter(item => {
    if (agendaStatusFilter === 'approved' && item.submissionStatus !== 'approved') return false;
    if (agendaStatusFilter === 'pending' && item.submissionStatus === 'approved') return false;
    if (!agendaSearchQuery.trim()) return true;
    const q = agendaSearchQuery.toLowerCase();
    return (
      item.formattedSeq.includes(q) ||
      item.referenceNumber.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.senderOrRecipient.toLowerCase().includes(q) ||
      (item.applicantName && item.applicantName.toLowerCase().includes(q))
    );
  });

  const handleStartDraftWithAgenda = (presetCode?: string) => {
    setUseAutoAgenda(true);
    if (presetCode) {
      setCustomClassificationCode(presetCode);
    }
    setActiveTab('buat_draf');
    toast.success(`Nomor Agenda #${outboxAgenda.formattedNext} siap digunakan untuk draf surat keluar baru!`, { icon: '📝' });
  };

  const handlePrintBukuAgenda = () => {
    const config = getSchoolConfig();
    const kopHtml = renderOfficialKopHTML(config);
    const rows = filteredAgendaList.map((item) => `
      <tr>
        <td style="border: 1px solid #334155; padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold; font-size: 11px;">#${item.formattedSeq}</td>
        <td style="border: 1px solid #334155; padding: 6px 8px; font-family: monospace; font-size: 10px;">${item.referenceNumber}</td>
        <td style="border: 1px solid #334155; padding: 6px 8px; text-align: center; font-size: 10px;">${item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}</td>
        <td style="border: 1px solid #334155; padding: 6px 8px; font-size: 11px;"><b>${item.title}</b></td>
        <td style="border: 1px solid #334155; padding: 6px 8px; font-size: 10px;">${item.senderOrRecipient}</td>
        <td style="border: 1px solid #334155; padding: 6px 8px; font-size: 10px;">${item.applicantName || 'Tata Usaha'} ${item.applicantRole ? `(${item.applicantRole === 'guru' ? 'Guru' : 'Wali'})` : ''}</td>
        <td style="border: 1px solid #334155; padding: 6px 8px; text-align: center; font-size: 10px;">${item.submissionStatus === 'approved' ? '<span style="color: #047857; font-weight: bold;">Disetujui / Resmi</span>' : (item.isDraft ? '<span style="color: #b45309;">Draf Menunggu</span>' : '<span style="color: #0284c7;">Aktif</span>')}</td>
      </tr>
    `).join('');

    const fullHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; color: #0f172a; padding: 20px;">
        ${kopHtml}
        <div style="text-align: center; margin: 16px 0 12px 0;">
          <h3 style="margin: 0; font-size: 13pt; text-decoration: underline; text-transform: uppercase; font-weight: bold;">BUKU REGISTER NOMOR AGENDA SURAT KELUAR</h3>
          <p style="margin: 3px 0 0 0; font-size: 10.5pt;">Tahun Periode Registrasi: ${agendaYearFilter} • SMP Negeri 3 Kras Kediri</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #334155; padding: 6px; width: 65px; font-size: 10px;">AGENDA</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 140px; font-size: 10px;">NOMOR SURAT RESMI</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 80px; font-size: 10px;">TANGGAL</th>
              <th style="border: 1px solid #334155; padding: 6px; font-size: 10px;">PERIHAL / ISI SURAT</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 120px; font-size: 10px;">TUJUAN</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 110px; font-size: 10px;">PEMOHON / PENGUSUL</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 85px; font-size: 10px;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : `<tr><td colspan="7" style="border: 1px solid #334155; padding: 16px; text-align: center; color: #64748b;">Belum ada data surat keluar pada periode tahun ${agendaYearFilter}.</td></tr>`}
          </tbody>
        </table>
        <div style="margin-top: 25px; float: right; text-align: center; width: 220px; font-size: 10.5pt;">
          <div>Kediri, ${format(new Date(), 'dd MMMM yyyy', { locale: id })}</div>
          <div style="margin-top: 4px;">Kepala Tata Usaha / Petugas Agenda,</div>
          <div style="height: 55px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${config.adminName || 'Sekhudin, S.Pd.'}</div>
          <div>NIP. ${config.adminNip || '197505122008011012'}</div>
        </div>
      </div>
    `;

    setPrintModalState({
      isOpen: true,
      title: `Buku Agenda Surat Keluar - Periode ${agendaYearFilter}`,
      subtitle: `Menampilkan ${filteredAgendaList.length} nomor agenda surat keluar resmi`,
      htmlContent: fullHtml
    });
  };

  // If not logged in, show dedicated Portal Login
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
        {/* Background glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 blur-[130px]" />
          <div className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/15 blur-[130px]" />
          <div className="absolute -bottom-[20%] left-[25%] w-[40vw] h-[40vw] rounded-full bg-sky-600/20 blur-[120px]" />
        </div>

        {/* Top Quick Navigation Bar */}
        <div className="relative z-10 w-full max-w-4xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-emerald-400 font-mono">PORTAL 1</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 font-mono truncate">LAYANAN DRAF GURU & WALI</span>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
            <ThemeToggleButton variant="pill" />
            <MobilePWAHeaderButton variant="pill" />
            <Link
              to="/legalisir"
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              title="Portal 2: Layanan Pengesahan & Legalisir Ijazah SMPN 3 Kras"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Portal 2: Legalisir</span>
            </Link>
            <button
              type="button"
              onClick={generateFullUserManualPdf}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              title="Unduh Buku Panduan Lengkap PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Panduan PDF</span>
            </button>
            {/* Tanda Rahasia Admin TU: Status Siaga (Hanya Admin yang Tahu) */}
            <SecretAdminMarker
              variant="dot"
              onTrigger={() => setIsAdminPinModalOpen(true)}
              className="ml-1 shrink-0"
            />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row items-stretch gap-5 sm:gap-8">
          {/* Left panel: Info & Explanation */}
          <div className="lg:w-1/2 bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700/70 rounded-2xl p-5 sm:p-7 lg:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
            <div>
              {/* Official School Emblem Badge & Secret triple-click trigger */}
              <SecretAdminMarker 
                variant="logo-wrapper" 
                onTrigger={() => setIsAdminPinModalOpen(true)}
                className="inline-block"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6 cursor-pointer group">
                  <AppLogo size="lg" withGlow className="group-hover:scale-105 transition-transform" />
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="font-bold">PORTAL 1</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">SMP NEGERI 3 KRAS</div>
                    <div className="text-[10px] text-slate-400">Persuratan & Dokumen Mandiri</div>
                  </div>
                </div>
              </SecretAdminMarker>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-2 sm:mb-3">
                Layanan Draf Surat <br/>
                <span className="text-indigo-400">Guru & Wali Murid</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mb-5 sm:mb-6 leading-relaxed">
                Akses mandiri pembuatan permohonan surat tugas, perizinan, keterangan siswa aktif, mutasi, dan rekomendasi sekolah tanpa perlu menunggu antrean manual.
              </p>

              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex items-start gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Khusus Guru & Tendik</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Pengajuan surat tugas MGMP/dinas, surat izin mengajar, cuti, dan pengantar kegiatan kelas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Khusus Orang Tua / Wali</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Permohonan surat keterangan aktif (BPJS/tunjangan), surat izin siswa, mutasi sekolah, & dispensasi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Terhubung Langsung ke Admin TU</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Draf yang Anda buat otomatis masuk ke akun Tata Usaha untuk diterbitkan nomor surat resmi.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 sm:pt-8 border-t border-slate-700/50 mt-5 sm:mt-6 flex items-center justify-between gap-2 text-xs text-slate-400">
              <span>SMP Negeri 3 Kras, Kediri</span>
              {/* Discreet Secret Admin Trigger (Hanya Admin yang Tahu) */}
              <SecretAdminMarker
                variant="version"
                onTrigger={() => setIsAdminPinModalOpen(true)}
              />
            </div>
          </div>

          {/* Right panel: Login form */}
          <div className="lg:w-1/2 bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-2xl flex flex-col justify-center relative">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight mb-1">Masuk Portal Pemohon</h2>
              <p className="text-xs text-slate-400">Masukkan Nama Lengkap dan Nomor HP/WhatsApp aktif Anda</p>
            </div>

            {/* Role selector tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/80 border border-slate-700 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setLoginRole('guru')}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                  loginRole === 'guru'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Guru / Tendik</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('wali')}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                  loginRole === 'wali'
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Wali Murid</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Nama Lengkap Anda <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Sesuai KTP / SK</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                    placeholder={loginRole === 'guru' ? "Contoh: Siti Aminah, S.Pd." : "Contoh: Budi Haryono (Wali dari Faiz 9A)"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Nomor HP / WhatsApp Aktif <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Untuk konfirmasi surat</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input 
                    type="tel" 
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none font-mono" 
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {loginRole === 'guru' ? "Mata Pelajaran / Unit Tugas (Opsional)" : "Nama Siswa & Kelas (Opsional)"}
                </label>
                <input 
                  type="text" 
                  value={loginExtra}
                  onChange={(e) => setLoginExtra(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                  placeholder={loginRole === 'guru' ? "Contoh: Bahasa Indonesia / Kelas 9" : "Contoh: Ahmad Faiz Al-Ghifari (Kelas 9A)"}
                />
              </div>

              {loginError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{loginError}</p>
                </div>
              )}

              <button 
                type="submit" 
                className={cn(
                  "w-full font-bold text-xs py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4 text-white",
                  loginRole === 'guru'
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                )}
              >
                <span>Masuk & Mulai Buat Draf Surat</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick autofill sample for testing */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Uji Coba Cepat:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginName('Siti Aminah, S.Pd., M.Si.');
                    setLoginPhone('081398765432');
                    setLoginRole('guru');
                    setLoginExtra('Bahasa Indonesia / Waka Kurikulum');
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                >
                  Akun Guru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginName('H. Supriyanto, S.E.');
                    setLoginPhone('081298765432');
                    setLoginRole('wali');
                    setLoginExtra('Wali dari Faiz (Kelas 9A)');
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
                >
                  Akun Wali Murid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin PIN Quick Login Modal */}
        <AdminPinModal
          isOpen={isAdminPinModalOpen}
          onClose={() => setIsAdminPinModalOpen(false)}
          onSuccess={() => {
            setIsAdminPinModalOpen(false);
            navigate('/admin');
          }}
        />

        {/* Mobile PWA Floating Install Prompt */}
        <MobilePWAFloatingPrompt bottomOffset="bottom-3" />
      </div>
    );
  }

  // Logged-in Portal Interface
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand header with secret triple-tap/click marker for admin */}
          <SecretAdminMarker
            variant="logo-wrapper"
            onTrigger={() => setIsAdminPinModalOpen(true)}
            className="flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <div className="relative shrink-0">
              <AppLogo size="sm" withGlow className="w-8 h-8 sm:w-9 sm:h-9" />
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F172A]",
                session.role === 'guru' ? "bg-indigo-500" : "bg-emerald-500"
              )}></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  PORTAL 1
                </span>
                <h1 className="text-xs sm:text-base font-bold text-white tracking-tight truncate">
                  <span className="hidden sm:inline">Layanan Draf Surat </span>
                  <span>{session.role === 'guru' ? 'Guru & Tendik' : 'Wali Murid'}</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">SMP Negeri 3 Kras • Draf diverifikasi & diregister oleh Petugas Admin TU</p>
            </div>
          </SecretAdminMarker>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggleButton variant="compact" />
            <MobilePWAHeaderButton variant="pill" />

            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-200">{session.name}</div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 justify-end">
                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                <span>{session.phone}</span>
              </div>
            </div>

            <Link
              to="/legalisir"
              className="p-2 sm:px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Buka Portal 2: Layanan Pengesahan & Legalisir Ijazah"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Portal 2: Legalisir</span>
            </Link>

            <button
              type="button"
              onClick={generateFullUserManualPdf}
              className="p-2 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Unduh Buku Panduan Lengkap PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Panduan PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCanvaModalOpen(true)}
              className="p-2 sm:px-3 rounded-xl bg-gradient-to-r from-sky-600/90 to-indigo-600/90 hover:from-sky-500 hover:to-indigo-500 text-white border border-sky-400/40 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shadow-sky-900/30"
              title="Buka Desain Poster & Panduan Canva"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Poster & Canva</span>
            </button>

            {/* Secret Admin Marker (Tanda Titik Siaga - Hanya Admin yang Tahu) */}
            <SecretAdminMarker
              variant="dot"
              onTrigger={() => setIsAdminPinModalOpen(true)}
            />

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Keluar dari Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28 md:pb-8">
        {/* Banner with Navigation Tabs */}
        <div className="bg-gradient-to-r from-slate-900 via-[#131C31] to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Selamat Datang, {session.name}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Pilih jenis surat yang dibutuhkan, lengkapi data permohonan, dan unduh naskah resmi draf PDF seketika.
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs - Swipeable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('buat_draf')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                activeTab === 'buat_draf'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Buat Draf</span>
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap relative",
                activeTab === 'riwayat'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pengajuan Saya</span>
              {myLetters.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                  {myLetters.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('registrasi_agenda')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap relative",
                activeTab === 'registrasi_agenda'
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Hash className="w-3.5 h-3.5 text-sky-400" />
              <span>Buku Agenda</span>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-400/20 text-[10px] font-mono font-bold text-sky-300 border border-sky-400/30">
                #{outboxAgenda.formattedNext}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuickAgendaModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
              title="Untuk guru yang hanya meminta nomor agenda saja tanpa membuat draf di sistem"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Minta No. Saja</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCanvaModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
              title="Lihat desain poster panduan infografis siap cetak dan template Canva"
            >
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              <span>Poster Panduan</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: BUAT DRAF SURAT */}
        {activeTab === 'buat_draf' && (
          <div className="space-y-6">
            {/* Fast Booking Info Box for Teachers who only need agenda number */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-200">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Hanya Membutuhkan Nomor Agenda Surat Saja?</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Next: #{outboxAgenda.formattedNext}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Bagi bapak/ibu guru yang menyusun naskah mandiri di Word/Docs dan hanya butuh nomor agenda keluar resmi sekolah.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAgendaModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Ambil Nomor Agenda Saja</span>
              </button>
            </div>

            {/* Step 1: Template Selection Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>1. Pilih Kategori & Jenis Surat Permohonan</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {currentTemplates.length} Template Standar SMPN 3 Kras
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentTemplates.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedCategory === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTemplate(item)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                        isSelected 
                          ? "bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500" 
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className={cn("font-medium", isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")}>
                          {isSelected ? "✓ Template Dipilih" : "Pilih Template"}
                        </span>
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isSelected ? "text-indigo-400 translate-x-1" : "text-slate-600 group-hover:translate-x-1")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Form Detail Permohonan Surat */}
            {selectedCategory && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#131C31] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">2. Lengkapi Rincian Permohonan: {letterTitle}</h3>
                      <p className="text-xs text-slate-400">Pastikan data yang diisikan akurat untuk pencetakan dokumen resmi berkop dinas</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                    Sifat: {urgency}
                  </span>
                </div>

                <form onSubmit={handleGenerateAndSubmitDraft} className="space-y-5">
                  {/* MENU REGISTRASI NOMOR AGENDA SURAT OTOMATIS */}
                  <div className="p-4.5 rounded-xl bg-gradient-to-br from-[#0C152B] via-[#0F1B36] to-[#0A1224] border border-sky-500/40 shadow-xl space-y-3.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white tracking-wide">Menu Registrasi Nomor Agenda Surat Otomatis</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aktif Meneruskan Agenda
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Sistem secara otomatis menetapkan nomor urut agenda keluar meneruskan nomor agenda surat sebelumnya
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setIsQuickAgendaModalOpen(true)}
                          className="text-xs text-amber-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all shadow-sm font-bold"
                          title="Hanya perlu nomor agenda keluar saja tanpa membuat draf dokumen di sistem"
                        >
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Minta Nomor Saja</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('registrasi_agenda')}
                          className="text-xs text-sky-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 transition-all shadow-sm font-medium"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                          <span>Buka Buku Agenda</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAgendaSettings(!showAgendaSettings)}
                          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all shadow-sm"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>{showAgendaSettings ? 'Tutup' : 'Sesuaikan'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Comparison: Agenda Sebelumnya -> Agenda Baru */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Kartu 1: Agenda Sebelumnya */}
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center gap-3 shadow-sm">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-mono uppercase text-amber-400/90 font-bold">Terakhir</span>
                          <span className="text-sm font-mono font-bold leading-none">#{outboxAgenda.formattedLast}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nomor Agenda Surat Sebelumnya</div>
                          <div className="text-xs font-mono font-bold text-slate-200 truncate mt-0.5">
                            {outboxAgenda.lastLetter?.referenceNumber || 'Belum ada surat keluar terdaftar'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {outboxAgenda.lastLetter?.title || 'Register awal buku agenda surat keluar'}
                          </div>
                        </div>
                      </div>

                      {/* Kartu 2: Agenda Baru Otomatis */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/50 flex items-center gap-3 shadow-md shadow-sky-950/30">
                        <div className="w-11 h-11 rounded-xl bg-sky-500/25 text-sky-300 border border-sky-500/50 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-mono uppercase text-sky-400 font-bold">Baru</span>
                          <span className="text-sm font-mono font-bold leading-none">#{effectiveSeq}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-sky-400 uppercase font-bold flex items-center gap-1.5 tracking-wider">
                            <span>Nomor Agenda Otomatis Berikutnya</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <div className="text-xs font-mono font-bold text-sky-200 truncate mt-0.5">
                            {previewOfficialRef}
                          </div>
                          <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                            <span>✓ Meneruskan otomatis dari agenda #{outboxAgenda.formattedLast}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Format Kode Klasifikasi Cepat */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-sky-500/20 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mr-1">
                        <span>Pilihan Format Otomatis:</span>
                      </span>
                      {[
                        { label: 'Surat Tugas (420.3)', code: '420.3' },
                        { label: 'Keterangan Siswa (421)', code: '421' },
                        { label: 'Legalisir Dokumen (421.7)', code: '421.7' },
                        { label: 'Pindah Sekolah (421.5)', code: '421.5' },
                        { label: 'Rekomendasi (422.5)', code: '422.5' },
                        { label: 'Izin Pegawai (800)', code: '800' },
                      ].map((preset) => (
                        <button
                          key={preset.code}
                          type="button"
                          onClick={() => {
                            setCustomClassificationCode(preset.code);
                            toast.success(`Format klasifikasi ${preset.code} diterapkan ke nomor surat.`);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border",
                            effectiveClassificationCode === preset.code
                              ? "bg-sky-500/25 text-sky-200 border-sky-400 font-bold shadow-sm"
                              : "bg-slate-900/60 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:border-slate-600"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Form Penyesuaian Agenda & Kode Klasifikasi (Opsional) */}
                    {showAgendaSettings && (
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-3 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-200 flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={useAutoAgenda}
                              onChange={(e) => setUseAutoAgenda(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500"
                            />
                            <span>Gunakan Penomoran Otomatis Berurutan (Direkomendasikan)</span>
                          </label>
                          {!useAutoAgenda && (
                            <button
                              type="button"
                              onClick={() => {
                                setUseAutoAgenda(true);
                                setManualAgendaSeq('');
                              }}
                              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset ke Otomatis
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Nomor Urut Agenda (3 Digit)</label>
                            <input
                              type="text"
                              disabled={useAutoAgenda}
                              value={useAutoAgenda ? outboxAgenda.formattedNext : manualAgendaSeq}
                              onChange={(e) => setManualAgendaSeq(e.target.value)}
                              placeholder={outboxAgenda.formattedNext}
                              className="w-full bg-[#0B1120] border border-slate-700 focus:border-sky-500 disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              {useAutoAgenda ? `Otomatis bernomor #${outboxAgenda.formattedNext}` : 'Masukkan nomor urut agenda khusus manual'}
                            </p>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Kode Klasifikasi Surat</label>
                            <input
                              type="text"
                              value={effectiveClassificationCode}
                              onChange={(e) => setCustomClassificationCode(e.target.value)}
                              placeholder={currentTemplateClassification.code}
                              className="w-full bg-[#0B1120] border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              Standar template: {currentTemplateClassification.code} ({currentTemplateClassification.unit})
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Judul / Perihal */}
                    <div className="space-y-1.5 lg:col-span-2">
                      <label className="text-xs font-medium text-slate-300">Perihal / Judul Surat <span className="text-rose-400">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={letterTitle} 
                        onChange={(e) => setLetterTitle(e.target.value)} 
                        className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                        placeholder="Contoh: Permohonan Surat Keterangan Siswa Aktif" 
                      />
                    </div>

                    {/* Tanggal Surat */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Tanggal Pengajuan <span className="text-rose-400">*</span></label>
                      <input 
                        type="date" 
                        required
                        value={documentDate} 
                        onChange={(e) => setDocumentDate(e.target.value)} 
                        className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                      />
                    </div>

                    {/* Keperluan Utama */}
                    <div className="space-y-1.5 lg:col-span-3">
                      <label className="text-xs font-medium text-slate-300">Keperluan Utama / Alasan Permohonan <span className="text-rose-400">*</span></label>
                      <textarea 
                        required
                        rows={2}
                        value={purpose} 
                        onChange={(e) => setPurpose(e.target.value)} 
                        className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg p-3 text-xs text-slate-200 outline-none" 
                        placeholder="Uraikan tujuan permohonan surat secara jelas dan terperinci..." 
                      />
                    </div>

                    {/* Target Selection: Guru / Siswa */}
                    {session.role === 'guru' ? (
                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-xs font-medium text-slate-300">Pilih Guru / Tenaga Pendidik Yang Ditugaskan / Mengajukan</label>
                        <select
                          value={selectedTeacherId}
                          onChange={(e) => {
                            setSelectedTeacherId(e.target.value);
                            const t = teachers.find(x => x.id?.toString() === e.target.value);
                            if (t) {
                              setCustomTargetName(t.name);
                              setCustomTargetNipNisn(t.nip || '');
                              setCustomClassOrRole(t.subject || '');
                            }
                          }}
                          className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                        >
                          <option value="">-- Pilih dari database GTK SMPN 3 Kras --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} (NIP: {t.nip || '-'}) - {t.subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-xs font-medium text-slate-300">Pilih Data Peserta Didik (Siswa Bersangkutan)</label>
                        <select
                          value={selectedStudentId}
                          onChange={(e) => {
                            setSelectedStudentId(e.target.value);
                            const s = students.find(x => x.id?.toString() === e.target.value);
                            if (s) {
                              setCustomTargetName(s.name);
                              setCustomTargetNipNisn(s.nisn || '');
                              setCustomClassOrRole(`Kelas ${s.grade}`);
                            }
                          }}
                          className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                        >
                          <option value="">-- Pilih dari database Siswa SMPN 3 Kras --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Kelas {s.grade} / NISN: {s.nisn})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Tingkat Urgensi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Kecepatan Pelayanan</label>
                      <select 
                        value={urgency} 
                        onChange={(e) => setUrgency(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="Biasa">Biasa (1-2 Hari Kerja)</option>
                        <option value="Penting">Penting (Hari Ini)</option>
                        <option value="Segera / Kilat">Segera / Kilat (Mendesak)</option>
                      </select>
                    </div>

                    {/* Specific Dynamic Fields depending on template */}
                    {selectedCategory === 'guru_tugas' && (
                      <div className="space-y-2 lg:col-span-3 bg-slate-900/60 p-4 rounded-xl border border-indigo-500/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            Dasar Penugasan
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Default: <strong className="text-indigo-300">"Perintah Kepala Sekolah"</strong> (dapat diedit / ditambah manual)
                          </span>
                        </div>
                        <input 
                          type="text" 
                          value={taskDasar} 
                          onChange={(e) => setTaskDasar(e.target.value)} 
                          className="w-full bg-[#0B1120] border border-indigo-500/40 focus:border-indigo-400 rounded-lg px-3.5 py-2.5 text-xs text-indigo-100 outline-none font-medium placeholder:text-slate-500" 
                          placeholder="Perintah Kepala Sekolah" 
                        />
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                          <button
                            type="button"
                            onClick={() => setTaskDasar('Perintah Kepala Sekolah')}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                          >
                            Default: Perintah Kepala Sekolah
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskDasar('Perintah Kepala Sekolah dan Surat Undangan Terlampir')}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            + Undangan Terlampir
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskDasar('Program Kerja Sekolah dan Perintah Kepala Sekolah')}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            + Program Kerja
                          </button>
                        </div>
                      </div>
                    )}

                    {(selectedCategory === 'guru_tugas' || selectedCategory === 'guru_rekomendasi_lomba' || selectedCategory === 'wali_dispensasi') && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Tempat / Lokasi Pelaksanaan</label>
                          <input 
                            type="text" 
                            value={eventLocation} 
                            onChange={(e) => setEventLocation(e.target.value)} 
                            className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                            placeholder="Contoh: Gedung Guru Kab. Kediri / Hotel Grand Surya" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Mulai Tanggal</label>
                          <input 
                            type="date" 
                            value={eventStartDate} 
                            onChange={(e) => setEventStartDate(e.target.value)} 
                            className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Sampai Tanggal</label>
                          <input 
                            type="date" 
                            value={eventEndDate} 
                            onChange={(e) => setEventEndDate(e.target.value)} 
                            className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'wali_pindah' && (
                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-xs font-medium text-slate-300">Nama Sekolah & Kota Tujuan Pindah</label>
                        <input 
                          type="text" 
                          value={destinationSchool} 
                          onChange={(e) => setDestinationSchool(e.target.value)} 
                          className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                          placeholder="Contoh: SMP Negeri 1 Surabaya, Jawa Timur" 
                        />
                      </div>
                    )}

                    {(selectedCategory === 'wali_aktif' || selectedCategory === 'wali_kelakuan_baik') && (
                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-xs font-medium text-slate-300">Ditujukan Kepada Instansi / Lembaga</label>
                        <input 
                          type="text" 
                          value={scholarshipOrAgency} 
                          onChange={(e) => setScholarshipOrAgency(e.target.value)} 
                          className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                          placeholder="Contoh: BPJS Kesehatan Cab. Kediri / PT. Telkom Indonesia / Panitia Beasiswa" 
                        />
                      </div>
                    )}

                    {(selectedCategory === 'guru_izin' || selectedCategory === 'guru_cuti' || selectedCategory === 'wali_izin_sakit') && (
                      <div className="space-y-1.5 lg:col-span-3">
                        <label className="text-xs font-medium text-slate-300">Keterangan / Alasan Tambahan</label>
                        <input 
                          type="text" 
                          value={leaveReason} 
                          onChange={(e) => setLeaveReason(e.target.value)} 
                          className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none" 
                          placeholder="Contoh: Sakit demam berdarah (surat dokter terlampir) / Menghadiri pernikahan keluarga di luar kota" 
                        />
                      </div>
                    )}

                    {/* Uraian Kustom */}
                    <div className="space-y-1.5 lg:col-span-3">
                      <label className="text-xs font-medium text-slate-300">Catatan Khusus / Naskah Tambahan (Opsional)</label>
                      <textarea 
                        rows={3}
                        value={customContent} 
                        onChange={(e) => setCustomContent(e.target.value)} 
                        className="w-full bg-[#0B1120] border border-slate-700 focus:border-indigo-500 rounded-lg p-3 text-xs text-slate-200 outline-none" 
                        placeholder="Tuliskan catatan khusus atau perincian lainnya yang perlu dicantumkan pada naskah surat..." 
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Draf otomatis diregistrasi dengan <strong className="text-sky-300 font-mono">No. Agenda #{effectiveSeq}</strong> (meneruskan #{outboxAgenda.formattedLast}) dan diverifikasi Admin TU.
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('')}
                        className="px-4 py-2.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors w-full sm:w-auto"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          "px-6 py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all w-full sm:w-auto",
                          session.role === 'guru'
                            ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                            : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30",
                          isSubmitting && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {isSubmitting ? 'Mendaftarkan Agenda...' : `Kirim Permohonan (Agenda #${effectiveSeq})`}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}

        {/* VIEW 2: RIWAYAT PENGAJUAN SAYA */}
        {activeTab === 'riwayat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Riwayat Pengajuan Draf Surat Anda</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Daftar naskah surat yang pernah Anda ajukan melalui nomor WhatsApp <span className="font-mono text-emerald-400 font-bold">{session.phone}</span>.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('buat_draf')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Buat Pengajuan Baru</span>
              </button>
            </div>

            {myLetters.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">Belum Ada Pengajuan Surat</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda belum membuat draf permohonan surat. Klik tombol di bawah untuk mulai membuat naskah surat pertama Anda.
                </p>
                <button
                  onClick={() => setActiveTab('buat_draf')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Mulai Buat Draf Surat</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLetters.map((letter) => {
                  const isApproved = letter.submissionStatus === 'approved';
                  return (
                    <div 
                      key={letter.id}
                      className="bg-[#131C31] border border-slate-700/70 hover:border-slate-600 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={cn(
                            "text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5",
                            isApproved
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          )}>
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Disetujui Admin • Surat Resmi Siap Cetak</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span>Menunggu Persetujuan Admin TU</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {format(new Date(letter.createdAt || letter.date), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-2">
                          {letter.title}
                        </h4>

                        <div className="text-xs text-slate-400 space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Nomor:</span>
                            <span className="font-mono text-sky-400">{letter.referenceNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Tujuan:</span>
                            <span className="text-slate-300">{letter.senderOrRecipient}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/60 rounded-lg text-xs text-slate-400 line-clamp-3 mb-3 border border-slate-800">
                          {letter.description}
                        </div>

                        {/* Status Alert Banner inside card */}
                        {!isApproved ? (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-1.5 mb-3">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>Surat Dinas Resmi Sekolah sedang diverifikasi Admin TU. Anda dapat mencetak <strong>Surat Permohonan</strong> sebagai bukti pengajuan.</span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-1.5 mb-3">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Surat Resmi telah disetujui & diverifikasi oleh Admin TU. Naskah resmi dapat dicetak atau diunduh sekarang.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Sifat: <strong className="text-slate-200">{letter.urgency || 'Biasa'}</strong></span>
                          <span className={isApproved ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                            {isApproved ? '✓ 2 Format Siap Cetak' : '⏳ Surat Resmi Terkunci'}
                          </span>
                        </div>

                        {/* Action buttons grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {/* 1. Cetak Surat Permohonan (Selalu Tersedia) */}
                          <button
                            type="button"
                            onClick={() => handlePreviewCurrentLetter(letter, 'permohonan')}
                            className="px-2 py-2 rounded-lg bg-sky-900/30 hover:bg-sky-800/50 text-sky-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 border border-sky-500/30 transition-all shadow-sm"
                            title="Pratinjau & Cetak Surat Permohonan Pemohon"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span>Permohonan</span>
                          </button>

                          {/* 2. Cetak Surat Resmi (Hanya setelah disetujui Admin) */}
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handlePreviewCurrentLetter(letter, 'resmi')}
                              className="px-2 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 border border-emerald-500/40 transition-all shadow-sm"
                              title="Pratinjau & Cetak Surat Resmi Sekolah (Telah Disetujui Admin)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Surat Resmi</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                toast.error('Surat Dinas Resmi Sekolah baru dapat dicetak setelah diverifikasi & disetujui oleh Petugas Tata Usaha.', { duration: 5000 });
                              }}
                              className="px-2 py-2 rounded-lg bg-slate-800/40 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-700/50 cursor-not-allowed transition-all"
                              title="Terkunci: Menunggu persetujuan Admin TU"
                            >
                              <span className="text-[12px]">🔒</span>
                              <span>Menunggu ACC</span>
                            </button>
                          )}

                          {/* 3. Paket Lengkap 2-in-1 */}
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handlePreviewCurrentLetter(letter, 'combined')}
                              className="px-2 py-2 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 border border-purple-500/30 transition-all"
                              title="Pratinjau Paket Lengkap (Permohonan + Surat Resmi)"
                            >
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              <span>Paket 2-in-1</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePreviewCurrentLetter(letter, 'permohonan')}
                              className="px-2 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-700/50 transition-all"
                              title="Hanya Naskah Permohonan yang dapat dicetak saat status masih menunggu"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-400" />
                              <span>Cetak Bukti</span>
                            </button>
                          )}

                          {/* 4. Unduh PDF */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const config = getSchoolConfig();
                                if (isApproved) {
                                  toast.loading('Mengunduh paket PDF Surat Resmi...', { id: 'dl-pkg' });
                                  await generateCombinedDraftPDF(letter, config, teachers);
                                  toast.success('Paket Lengkap (PDF) berhasil diunduh!', { id: 'dl-pkg' });
                                } else {
                                  toast.loading('Mengunduh Bukti Surat Permohonan (PDF)...', { id: 'dl-pkg' });
                                  generateSuratPermohonanPDF(letter, config);
                                  toast.success('Surat Permohonan (PDF) berhasil diunduh. Surat Resmi akan tersedia setelah disetujui Admin TU.', { id: 'dl-pkg', duration: 5000 });
                                }
                              } catch (e) {
                                toast.error('Gagal mengunduh dokumen', { id: 'dl-pkg' });
                              }
                            }}
                            className={cn(
                              "px-2.5 py-2 rounded-lg text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-md transition-all",
                              isApproved 
                                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                                : "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20"
                            )}
                            title={isApproved ? "Unduh PDF Paket Lengkap Resmi" : "Unduh PDF Surat Permohonan"}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isApproved ? 'Unduh Lengkap' : 'Unduh Bukti'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: BUKU REGISTER & REGISTRASI NOMOR AGENDA SURAT KELUAR OTOMATIS */}
        {activeTab === 'registrasi_agenda' && (
          <div className="space-y-6">
            {/* Header section with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-sky-400" />
                  <span>Buku Register & Penomoran Agenda Surat Keluar Otomatis</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Memonitor urutan nomor agenda surat keluar sekolah secara berkesinambungan. Sistem otomatis meneruskan nomor agenda surat sebelumnya untuk setiap pengajuan surat resmi baru.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickAgendaModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                  title="Ambil nomor agenda saja untuk keperluan persuratan mandiri"
                >
                  <Tag className="w-4 h-4 text-slate-950" />
                  <span>Minta Nomor Agenda Saja</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintBukuAgenda}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>Cetak Buku Agenda</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartDraftWithAgenda()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Buat Pengajuan (Agenda #{outboxAgenda.formattedNext})</span>
                </button>
              </div>
            </div>

            {/* Visual Continuity Chain: Agenda Terakhir -> Meneruskan Otomatis -> Agenda Baru */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Agenda Surat Sebelumnya Terakhir Digunakan */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                      Agenda Terakhir Digunakan
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                      #{outboxAgenda.formattedLast}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-200 break-all">
                      {outboxAgenda.lastLetter?.referenceNumber || 'Belum ada surat keluar terdaftar'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {outboxAgenda.lastLetter?.title || 'Register awal buku agenda surat keluar'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tanggal:</span>
                  <span className="text-slate-300 font-medium">
                    {outboxAgenda.lastLetter?.date ? format(new Date(outboxAgenda.lastLetter.date), 'dd MMMM yyyy', { locale: id }) : '-'}
                  </span>
                </div>
              </div>

              {/* Card 2: Agenda Otomatis Berikutnya (Aktif / Meneruskan) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-950/70 via-indigo-950/40 to-slate-950/90 border-2 border-sky-500/60 shadow-xl shadow-sky-950/40 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Agenda Otomatis Berikutnya</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 font-mono font-extrabold text-sm border border-sky-400/50 shadow-sm">
                      #{outboxAgenda.formattedNext}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-sky-200 break-all">
                      {buildOfficialLetterNumber('420.3', outboxAgenda.formattedNext, '418.20.2.62.03', agendaYearFilter)}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Meneruskan berurutan (+1) dari #{outboxAgenda.formattedLast}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-sky-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAgendaModalOpen(true)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                    title="Hanya butuh nomor agenda saja untuk naskah mandiri"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Ambil No. Saja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartDraftWithAgenda()}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-sky-500/20"
                  >
                    <span>Buat Draf</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Statistik Buku Agenda */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                    Rekap Agenda Periode {agendaYearFilter}
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {outboxAgendaList.length} <span className="text-xs font-normal text-slate-400 font-sans">Surat Keluar</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Total surat resmi dan pengajuan tercatat di buku register agenda keluar tahun ini.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-medium">
                    ✓ {outboxAgendaList.filter(x => x.submissionStatus === 'approved').length} Disetujui/Resmi
                  </span>
                  <span className="text-amber-400 font-medium">
                    ⏳ {outboxAgendaList.filter(x => x.submissionStatus !== 'approved').length} Draf Pengajuan
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={agendaSearchQuery}
                  onChange={(e) => setAgendaSearchQuery(e.target.value)}
                  placeholder="Cari perihal, nomor surat, nomor agenda (#024), pemohon, atau penerima..."
                  className="w-full bg-[#0B1120] border border-slate-700/80 focus:border-sky-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 outline-none transition-colors"
                />
                {agendaSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAgendaSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status and Year Filter */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Status Pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAgendaStatusFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      agendaStatusFilter === 'all'
                        ? "bg-sky-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Semua ({outboxAgendaList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaStatusFilter('approved')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      agendaStatusFilter === 'approved'
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Resmi ({outboxAgendaList.filter(x => x.submissionStatus === 'approved').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaStatusFilter('pending')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      agendaStatusFilter === 'pending'
                        ? "bg-amber-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Draf ({outboxAgendaList.filter(x => x.submissionStatus !== 'approved').length})
                  </button>
                </div>

                {/* Year Select */}
                <select
                  value={agendaYearFilter}
                  onChange={(e) => setAgendaYearFilter(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none font-mono focus:border-sky-500"
                >
                  <option value={new Date().getFullYear()}>Tahun {new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>Tahun {new Date().getFullYear() - 1}</option>
                  <option value={new Date().getFullYear() - 2}>Tahun {new Date().getFullYear() - 2}</option>
                </select>
              </div>
            </div>

            {/* Interactive Data Table of Registered Outbox Agenda */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Mobile Card List View (Visible on small screens) */}
              <div className="block md:hidden divide-y divide-slate-800/80">
                {filteredAgendaList.length === 0 ? (
                  <div className="py-10 px-4 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-400">Tidak ada nomor agenda keluar yang cocok</p>
                    <p className="text-xs text-slate-500 mt-0.5">Coba ubah kata kunci pencarian atau filter status dokumen.</p>
                  </div>
                ) : (
                  filteredAgendaList.map((item) => {
                    const isApproved = item.submissionStatus === 'approved';
                    const isLatest = item.formattedSeq === outboxAgenda.formattedLast;
                    return (
                      <div key={item.id} className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "font-mono font-bold px-2 py-0.5 rounded-md text-xs border",
                              isLatest
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                                : "bg-slate-800/80 text-slate-200 border-slate-700"
                            )}>
                              #{item.formattedSeq}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Terakhir
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.date ? format(new Date(item.date), 'dd MMM yyyy', { locale: id }) : '-'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-[11px] font-mono text-sky-400 font-semibold mt-1">
                            {item.referenceNumber}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                          <span className="truncate max-w-[180px]">
                            Kepada: <strong className="text-slate-300">{item.senderOrRecipient || '-'}</strong>
                          </span>
                          <span className="text-slate-400 truncate">
                            {item.applicantName || 'Tata Usaha'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Resmi / Disetujui</span>
                            </span>
                          ) : item.isDraft ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Draf Menunggu ACC</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              <span>Aktif</span>
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewCurrentLetter(item.letter, 'permohonan')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1"
                              title="Lihat Permohonan"
                            >
                              <Eye className="w-3 h-3 text-sky-400" />
                              <span>Bukti</span>
                            </button>
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handlePreviewCurrentLetter(item.letter, 'resmi')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1"
                                title="Lihat Surat Resmi"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span>Resmi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (Hidden on small screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 w-24">No. Agenda</th>
                      <th className="py-3.5 px-4 w-52">Nomor Surat Resmi</th>
                      <th className="py-3.5 px-4 w-28">Tanggal</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Perihal / Judul Surat</th>
                      <th className="py-3.5 px-4 w-44">Tujuan / Instansi</th>
                      <th className="py-3.5 px-4 w-36">Pemohon / Pengusul</th>
                      <th className="py-3.5 px-4 w-32">Status Dokumen</th>
                      <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAgendaList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 px-4 text-center text-slate-500">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="font-semibold text-slate-400">Tidak ada nomor agenda surat keluar yang cocok</p>
                          <p className="text-xs text-slate-500 mt-0.5">Coba ubah kata kunci pencarian atau filter status dokumen.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAgendaList.map((item) => {
                        const isApproved = item.submissionStatus === 'approved';
                        const isLatest = item.formattedSeq === outboxAgenda.formattedLast;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* No. Agenda */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "font-mono font-bold px-2 py-0.5 rounded-md text-xs border",
                                  isLatest
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                                    : "bg-slate-800/80 text-slate-200 border-slate-700"
                                )}>
                                  #{item.formattedSeq}
                                </span>
                                {isLatest && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Agenda Terakhir Terdaftar" />
                                )}
                              </div>
                            </td>

                            {/* Nomor Surat Resmi */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-medium text-slate-200 block truncate max-w-[200px]" title={item.referenceNumber}>
                                {item.referenceNumber}
                              </span>
                            </td>

                            {/* Tanggal */}
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                            </td>

                            {/* Perihal / Judul Surat */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-white line-clamp-2" title={item.title}>
                                {item.title}
                              </div>
                            </td>

                            {/* Tujuan */}
                            <td className="py-3.5 px-4 text-slate-300">
                              <span className="block truncate max-w-[160px]" title={item.senderOrRecipient}>
                                {item.senderOrRecipient || '-'}
                              </span>
                            </td>

                            {/* Pemohon */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-300 font-medium truncate max-w-[130px]" title={item.applicantName || 'Tata Usaha'}>
                                {item.applicantName || 'Tata Usaha'}
                              </div>
                              {item.applicantRole && (
                                <span className="text-[10px] text-slate-500 capitalize">
                                  {item.applicantRole === 'guru' ? 'Tenaga Guru' : 'Wali Murid'}
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Resmi / Disetujui</span>
                                </span>
                              ) : item.isDraft ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Draf Menunggu</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                  <span>Aktif</span>
                                </span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewCurrentLetter(item.letter, 'permohonan')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                                  title="Pratinjau Surat Permohonan"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                                </button>
                                {isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewCurrentLetter(item.letter, 'resmi')}
                                    className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-500/40 transition-all"
                                    title="Pratinjau Surat Resmi Sekolah"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0B1120] py-4 px-4 text-center text-xs text-slate-500 pb-24 md:pb-4">
        <p>
          Layanan Tata Usaha Mandiri • SMP Negeri 3 Kras, Kab. Kediri &copy; {new Date().getFullYear()} • Hasil draf disimpan dan dikelola terpusat oleh Petugas Tata Usaha.
        </p>
      </footer>

      {/* Futuristic Mobile Bottom Navigation */}
      <PortalBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myLettersCount={myLetters.length}
        nextAgendaNumber={outboxAgenda?.formattedNext || ''}
        onOpenQuickAgenda={() => setIsQuickAgendaModalOpen(true)}
        onOpenCanvaModal={() => setIsCanvaModalOpen(true)}
        onOpenAdminPin={() => setIsAdminPinModalOpen(true)}
        onDownloadPdfGuide={generateFullUserManualPdf}
        userName={session.name}
        userRole={session.role}
        onLogout={handleLogout}
      />

      {/* Quick Agenda Only Modal */}
      <QuickAgendaModal
        isOpen={isQuickAgendaModalOpen}
        onClose={() => setIsQuickAgendaModalOpen(false)}
        defaultApplicantName={session?.name || ''}
        defaultApplicantPhone={session?.phone || ''}
        defaultApplicantRole={session?.role || 'guru'}
        userRole={session?.role || 'guru'}
        onSuccess={() => {
          // Toast or any other feedback handled inside modal
        }}
      />

      {/* Canva Poster & Guide Modal */}
      <CanvaPosterModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
      />

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState({ ...printModalState, isOpen: false })}
        title={printModalState.title}
        subtitle={printModalState.subtitle}
        htmlContent={printModalState.htmlContent}
        onDownloadPdf={printModalState.onDownloadPdf}
        onDownloadWord={printModalState.onDownloadWord}
      />

      {/* Admin PIN Quick Login Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          navigate('/admin');
        }}
      />

      {/* Mobile PWA Floating Install Prompt */}
      <MobilePWAFloatingPrompt bottomOffset="bottom-20" />
    </div>
  );
}
