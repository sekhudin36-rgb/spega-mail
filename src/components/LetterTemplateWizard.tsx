import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Letter, type Student, type Teacher } from '../lib/db';
import { 
  X, FileText, Search, User, GraduationCap, Calendar, Clock, MapPin, Check, 
  Plus, Sparkles, FileDown, ArrowRightLeft, Award, Users, BookOpen,
  Briefcase, Send, Megaphone, Mail, ClipboardCheck, Scale, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { drawPdfKopHeader, getSchoolConfig } from '../lib/printHelper';

interface LetterTemplateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftCreated: () => void;
  getNextSequenceNumber: (type: 'inbox' | 'outbox') => string;
}

type TemplateType = 
  | 'aktif-belajar' 
  | 'surat-tugas' 
  | 'undangan-wali' 
  | 'kelakuan-baik'
  | 'pindah-sekolah'
  | 'rekomendasi-beasiswa'
  | 'rapat-guru'
  | 'dispensasi-siswa'
  | 'ket-siswa'
  | 'skmt'
  | 'surat-pengantar'
  | 'pemberitahuan'
  | 'panggilan-ortu'
  | 'sppd'
  | 'sk-kepsek'
  | 'sptjm'
  | 'ket-kelulusan'
  | 'undangan-komite'
  | 'rekomendasi-pindah'
  | 'pernyataan-patuh';

const requiresStudent: TemplateType[] = [
  'aktif-belajar', 'kelakuan-baik', 'pindah-sekolah', 'rekomendasi-beasiswa', 
  'dispensasi-siswa', 'ket-siswa', 'panggilan-ortu', 'ket-kelulusan', 
  'rekomendasi-pindah', 'pernyataan-patuh'
];
const requiresTeacher: TemplateType[] = ['surat-tugas', 'skmt', 'sppd'];

export default function LetterTemplateWizard({ isOpen, onClose, onDraftCreated, getNextSequenceNumber }: LetterTemplateWizardProps) {
  const [template, setTemplate] = useState<TemplateType>('aktif-belajar');
  
  // Search & Autocomplete States
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // Common Fields
  const [customRefNum, setCustomRefNum] = useState('');
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Template Specific Fields
  // 1. Surat Keterangan Aktif Belajar
  const [activePurpose, setActivePurpose] = useState('Persyaratan Administrasi Orang Tua');
  
  // 2. Surat Tugas Guru
  const [taskName, setTaskName] = useState('Mengikuti Workshop Peningkatan Kompetensi Guru');
  const [taskLocation, setTaskLocation] = useState('Aula Dinas Pendidikan Kabupaten Kediri');
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskRole, setTaskRole] = useState('Peserta');

  // 3. Surat Undangan Wali Murid
  const [invitationTarget, setInvitationTarget] = useState('Wali Murid Kelas IX-A s/d IX-H');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('08:00 WIB s.d Selesai');
  const [meetingPlace, setMeetingPlace] = useState('Aula Serbaguna Sekolah');
  const [meetingAgenda, setMeetingAgenda] = useState('Rapat Pleno Kelulusan & Persiapan Ujian Akhir');

  // 4. Surat Keterangan Kelakuan Baik
  const [goodConductPurpose, setGoodConductPurpose] = useState('Melanjutkan Sekolah Menengah Atas (SMA/SMK)');

  // 5. Surat Keterangan Pindah Sekolah
  const [targetSchool, setTargetSchool] = useState('SMP Negeri 1 Kras');
  const [pindahReason, setPindahReason] = useState('Mengikuti Perpindahan Tugas / Domisili Orang Tua');

  // 6. Surat Rekomendasi Beasiswa
  const [scholarshipName, setScholarshipName] = useState('Program Indonesia Pintar (PIP) Tahun Pelajaran Baru');
  const [rekomendasiNote, setRekomendasiNote] = useState('Memiliki prestasi akademik yang konsisten dan layak didukung finansial');

  // 7. Surat Undangan Rapat Guru/Staf
  const [staffMeetingAgenda, setStaffMeetingAgenda] = useState('Rapat Pleno Kelulusan & Persiapan Ujian Akhir');
  const [staffMeetingDate, setStaffMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [staffMeetingTime, setStaffMeetingTime] = useState('10:00 WIB s.d Selesai');
  const [staffMeetingPlace, setStaffMeetingPlace] = useState('Ruang Guru / Aula Rapat Utama');

  // 8. Surat Dispensasi Siswa
  const [dispensationEvent, setDispensationEvent] = useState('Lomba Olahraga Siswa Nasional (O2SN) Tingkat Kabupaten');
  const [dispensationStartDate, setDispensationStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dispensationEndDate, setDispensationEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dispensationLocation, setDispensationLocation] = useState('Stadion Candra Bhirawa Pare');

  // 9. Surat Keterangan Siswa (Generic)
  const [ketSiswaContent, setKetSiswaContent] = useState('bahwa siswa tersebut di atas adalah benar-benar tercatat sebagai peserta didik di SMP Negeri 3 Kras dan yang bersangkutan memiliki catatan kehadiran yang baik selama semester berjalan.');

  // 10. SKMT (Guru)
  const [skmtHours, setSkmtHours] = useState('24 Jam');
  const [skmtSchoolYear, setSkmtSchoolYear] = useState('2026/2027');

  // 11. Surat Pengantar
  const [pengantarRecipient, setPengantarRecipient] = useState('Kepala Dinas Pendidikan Kabupaten Kediri');
  const [pengantarItems, setPengantarItems] = useState([
    { name: 'Laporan Pertanggungjawaban BOS Tahap I', qty: '1 Bundel', note: 'Asli untuk Verifikasi' },
    { name: 'Surat Pengantar Pencairan Dana', qty: '2 Lembar', note: 'Arsip Dinas & Sekolah' },
    { name: 'Data Dukung Siswa Penerima PIP', qty: '1 Berkas', note: 'Fotokopi Terlegalisir' }
  ]);

  // 12. Surat Pemberitahuan
  const [pemberitahuanTarget, setPemberitahuanTarget] = useState('Seluruh Orang Tua / Wali Siswa');
  const [pemberitahuanTitle, setPemberitahuanTitle] = useState('Pemberitahuan Pelaksanaan Ujian Akhir Semester Genap');
  const [pemberitahuanContent, setPemberitahuanContent] = useState('Sehubungan dengan kalender akademik sekolah, kami beritahukan bahwa pelaksanaan Asesmen Akhir Semester akan dilaksanakan mulai tanggal 8 Juni s.d 15 Juni 2026. Mohon bimbingan Bapak/Ibu orang tua agar putra-putrinya dapat mempersiapkan diri dengan baik di rumah.');

  // 13. Surat Panggilan Orang Tua
  const [panggilanDate, setPanggilanDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [panggilanTime, setPanggilanTime] = useState('09:00 WIB s.d Selesai');
  const [panggilanPlace, setPanggilanPlace] = useState('Ruang Bimbingan Konseling (BK)');
  const [panggilanAgenda, setPanggilanAgenda] = useState('Koordinasi Perkembangan Kedisiplinan & Belajar Siswa');

  // 14. SPPD
  const [sppdPurpose, setSppdPurpose] = useState('Koordinasi Sinkronisasi Data Dapodik & Kepegawaian');
  const [sppdDestination, setSppdDestination] = useState('Kantor Dinas Pendidikan Kabupaten Kediri');
  const [sppdTransport, setSppdTransport] = useState('Kendaraan Dinas / Umum');
  const [sppdBudget, setSppdBudget] = useState('Dana BOS Sekolah');
  const [sppdOrigin, setSppdOrigin] = useState('SMP Negeri 3 Kras');
  const [sppdDeparture, setSppdDeparture] = useState(() => new Date().toISOString().split('T')[0]);
  const [sppdReturn, setSppdReturn] = useState(() => new Date().toISOString().split('T')[0]);

  // 15. Surat Keputusan (SK Kepsek)
  const [skSubject, setSkSubject] = useState('Penetapan Panitia Ujian Akhir Sekolah Tahun Pelajaran Baru');
  const [skConsider, setSkConsider] = useState('a. Bahwa demi kelancaran pelaksanaan Ujian Akhir Sekolah, perlu ditunjuk panitia pelaksana.\nb. Bahwa yang namanya tercantum dalam lampiran keputusan ini dinilai mampu mengemban tugas tersebut.');
  const [skRemember, setSkRemember] = useState('1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.\n2. Peraturan Menteri Pendidikan dan Kebudayaan Republik Indonesia.');
  const [skDecide, setSkDecide] = useState('Menetapkan Susunan Panitia Ujian Akhir Sekolah sebagaimana terlampir.');

  // 16. SPTJM
  const [sptjmProgram, setSptjmProgram] = useState('Penggunaan Dana Bantuan Operasional Sekolah (BOS) Tahap I');
  const [sptjmContent, setSptjmContent] = useState('1. Bertanggung jawab penuh atas penggunaan dana sesuai petunjuk teknis.\n2. Siap menerima sanksi hukum apabila ditemukan ketidaksesuaian laporan.');

  // 17. Surat Keterangan Kelulusan (SKL)
  const [sklSchoolYear, setSklSchoolYear] = useState('2025/2026');
  const [sklStatus, setSklStatus] = useState('LULUS');
  const [sklExamNum, setSklExamNum] = useState('U-SMP-03-010-025-8');
  const [sklAverageGrade, setSklAverageGrade] = useState('85.45');

  // 18. Surat Undangan Rapat Komite
  const [komiteMeetingDate, setKomiteMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [komiteMeetingTime, setKomiteMeetingTime] = useState('09:00 WIB s.d Selesai');
  const [komiteMeetingPlace, setKomiteMeetingPlace] = useState('Ruang Keterampilan / Aula Sekolah');
  const [komiteMeetingAgenda, setKomiteMeetingAgenda] = useState('Pembahasan Program Kerja Komite & Rencana Kegiatan Anggaran Sekolah (RKAS)');

  // 19. Surat Rekomendasi Pindah
  const [rekomendasiPindahType, setRekomendasiPindahType] = useState('Pindah Masuk');
  const [rekomendasiPindahSchool, setRekomendasiPindahSchool] = useState('SMP Negeri 1 Kras');
  const [rekomendasiPindahReason, setRekomendasiPindahReason] = useState('Mengikuti Orang Tua Pindah Domisili');

  // 20. Surat Pernyataan Patuh Tata Tertib
  const [patuhParentName, setPatuhParentName] = useState('Ahmad Subarjo');
  const [patuhParentJob, setPatuhParentJob] = useState('Karyawan Swasta');
  const [patuhPoints, setPatuhPoints] = useState('1. Belajar dengan tekun dan disiplin tinggi.\n2. Tidak melakukan pelanggaran tata tertib sekolah.\n3. Siap menerima sanksi akademis apabila melanggar.');

  // Load Database Resources
  const studentsList = useLiveQuery(() => db.students.toArray()) || [];
  const teachersList = useLiveQuery(() => db.teachers.toArray()) || [];

  // Filter Autocompletes
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.nisn.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 5);

  const filteredTeachers = teachersList.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
    t.nip.toLowerCase().includes(teacherSearch.toLowerCase())
  ).slice(0, 5);

  // Auto-generate reference number based on template
  useEffect(() => {
    const seq = getNextSequenceNumber('outbox');
    const currentYear = new Date().getFullYear();
    const codes: Record<TemplateType, string> = {
      'aktif-belajar': '421.3',
      'surat-tugas': '090',
      'undangan-wali': '005',
      'kelakuan-baik': '421.4',
      'pindah-sekolah': '421.5',
      'rekomendasi-beasiswa': '422.5',
      'rapat-guru': '005.1',
      'dispensasi-siswa': '421.7',
      'ket-siswa': '421.3',
      'skmt': '421.8',
      'surat-pengantar': '094',
      'pemberitahuan': '420',
      'panggilan-ortu': '421.9',
      'sppd': '094.1',
      'sk-kepsek': '800',
      'sptjm': '421.1',
      'ket-kelulusan': '421.3',
      'undangan-komite': '005.2',
      'rekomendasi-pindah': '421.5',
      'pernyataan-patuh': '421.4'
    };
    
    setCustomRefNum(`${codes[template]}/${seq}/SMP.03/${currentYear}`);
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleCreateDraftAndPrint = async () => {
    // 1. Validation checks
    const reqStudentList: TemplateType[] = [
      'aktif-belajar', 'kelakuan-baik', 'pindah-sekolah', 'rekomendasi-beasiswa', 
      'dispensasi-siswa', 'ket-siswa', 'panggilan-ortu', 'ket-kelulusan', 
      'rekomendasi-pindah', 'pernyataan-patuh'
    ];
    const reqTeacherList: TemplateType[] = ['surat-tugas', 'skmt', 'sppd'];

    if (reqStudentList.includes(template) && !selectedStudent) {
      alert('Silakan pilih Siswa dari Data Akademik terlebih dahulu.');
      return;
    }
    if (reqTeacherList.includes(template) && !selectedTeacher) {
      alert('Silakan pilih Guru/Pegawai dari Data Kepegawaian terlebih dahulu.');
      return;
    }

    // Retrieve settings
    const config = getSchoolConfig();
    const schoolName = config.schoolName;
    const schoolKop = config.schoolKop;
    const schoolAddress = config.address;
    const headmaster = localStorage.getItem('headmaster') || 'Dr. Budi Santoso, M.Pd';
    const headmasterNip = localStorage.getItem('headmasterNip') || '19800101 200501 1 001';
    const adminName = localStorage.getItem('adminName') || 'Rahmawati, S.Kom';

    // 2. Generate PDF
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      // DRAW SHARED KOP HEADER WITH DUAL LOGOS
      drawPdfKopHeader(doc, config, false);

      const formattedDocDate = format(new Date(documentDate), 'dd MMMM yyyy', { locale: id });

      let letterTitle = '';
      let recipientOrRecipientText = '';
      let letterDescription = '';
      let letterCategory = 'Lainnya';
      let signatureY = 160;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // TEMPLATE CONTENT GENERATORS
      if (template === 'aktif-belajar' && selectedStudent) {
        letterTitle = `Surat Keterangan Aktif Belajar - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat keterangan aktif belajar siswa atas nama ${selectedStudent.name} (Kelas ${selectedStudent.grade}) untuk keperluan: ${activePurpose}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN AKTIF BELAJAR', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini menerangkan dengan sesungguhnya bahwa:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);
        
        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);

        const statementText = `Adalah benar-benar siswa aktif belajar di ${schoolName} pada Tahun Ajaran saat ini dan yang bersangkutan berkelakuan baik dalam kegiatan akademik maupun non-akademik sekolah.`;
        const purposeText = `Surat keterangan ini dibuat dengan iktikad baik untuk dipergunakan sebagai: "${activePurpose}".`;

        doc.text(doc.splitTextToSize(statementText, 180), 15, 120);
        doc.text(doc.splitTextToSize(purposeText, 180), 15, 134);
        doc.text('Demikian surat keterangan ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', 15, 148);
        signatureY = 160;

      } else if (template === 'surat-tugas' && selectedTeacher) {
        letterTitle = `Surat Tugas Guru - ${selectedTeacher.name}`;
        recipientOrRecipientText = selectedTeacher.name;
        letterDescription = `Surat tugas dinas guru atas nama ${selectedTeacher.name} untuk melaksanakan tugas: ${taskName} di ${taskLocation}.`;
        letterCategory = 'Kepegawaian';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT TUGAS', 105, 45, { align: 'center' });
        doc.line(80, 46.5, 130, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini MENUGASKAN kepada pegawai / pendidik di bawah ini:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Pendidik', 25, 91);
        doc.text('NIP', 25, 97);
        doc.text('Pangkat / Golongan', 25, 103);
        doc.text('Mata Pelajaran', 25, 109);
        doc.text('Jabatan Sekolah', 25, 115);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedTeacher.name}`, 55, 91);
        doc.text(`:  ${selectedTeacher.nip || '-'}`, 55, 97);
        doc.text(`:  ${selectedTeacher.rank || '-'} (${selectedTeacher.rankCategory || '-'})`, 55, 103);
        doc.text(`:  ${selectedTeacher.subject || '-'}`, 55, 109);
        doc.text(`:  ${selectedTeacher.position || 'Guru Utama'}`, 55, 115);

        doc.setFont('helvetica', 'bold');
        doc.text('Untuk melaksanakan tugas sebagai berikut:', 15, 126);
        doc.setFont('helvetica', 'normal');

        doc.text('1.  Tugas / Kegiatan', 25, 133);
        doc.text('2.  Hari / Tanggal', 25, 139);
        doc.text('3.  Tempat Pelaksanaan', 25, 145);
        doc.text('4.  Peran / Jabatan Tugas', 25, 151);

        doc.text(doc.splitTextToSize(`:  ${taskName}`, 135), 60, 133);
        const tDate = format(new Date(taskDate), 'EEEE, dd MMMM yyyy', { locale: id });
        doc.text(`:  ${tDate}`, 60, 139);
        doc.text(doc.splitTextToSize(`:  ${taskLocation}`, 135), 60, 145);
        doc.text(`:  ${taskRole}`, 60, 151);

        const endText = `Demikian surat tugas ini diberikan kepada yang bersangkutan untuk dapat dilaksanakan dengan penuh tanggung jawab, serta segera melaporkan hasilnya setelah pelaksanaan kegiatan selesai.`;
        doc.text(doc.splitTextToSize(endText, 180), 15, 161);
        signatureY = 180;

      } else if (template === 'undangan-wali') {
        letterTitle = `Surat Undangan Pertemuan Wali Murid - ${invitationTarget}`;
        recipientOrRecipientText = invitationTarget;
        letterDescription = `Surat undangan resmi pertemuan/rapat wali murid mengenai agenda: ${meetingAgenda}.`;
        letterCategory = 'Kurikulum';

        doc.text('Nomor', 15, 45);
        doc.text('Lampiran', 15, 50);
        doc.text('Sifat', 15, 55);
        doc.text('Perihal', 15, 60);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  1 (satu) Berkas Lampiran', 35, 50);
        doc.text(':  Penting / Undangan', 35, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(':  Undangan Rapat Wali Murid Resmi', 35, 60);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bapak / Ibu Orang Tua / Wali Murid`, 15, 77);
        doc.text(invitationTarget, 15, 82);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 87);

        doc.text('Dengan hormat,', 15, 98);
        const introText = `Sehubungan dengan dilaksanakannya agenda pendidikan sekolah dan dalam rangka menyelaraskan program bimbingan siswa di rumah, kami mengharapkan kehadiran Bapak/Ibu Wali Murid pada pertemuan rapat yang akan diselenggarakan pada:`;
        doc.text(doc.splitTextToSize(introText, 180), 15, 103);

        doc.setFont('helvetica', 'bold');
        doc.text('Hari / Tanggal', 25, 118);
        doc.text('Waktu', 25, 124);
        doc.text('Tempat', 25, 130);
        doc.text('Agenda Utama', 25, 136);

        doc.setFont('helvetica', 'normal');
        const mDate = format(new Date(meetingDate), 'EEEE, dd MMMM yyyy', { locale: id });
        doc.text(`:  ${mDate}`, 60, 118);
        doc.text(`:  ${meetingTime}`, 60, 124);
        doc.text(`:  ${meetingPlace}`, 60, 130);
        doc.text(doc.splitTextToSize(`:  ${meetingAgenda}`, 135), 60, 136);

        const closingText = `Mengingat sangat pentingnya agenda pembahasan rapat ini, kehadiran Bapak/Ibu Wali Murid sangat kami harapkan tepat pada waktunya. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.`;
        doc.text(doc.splitTextToSize(closingText, 180), 15, 148);
        signatureY = 168;

      } else if (template === 'kelakuan-baik' && selectedStudent) {
        letterTitle = `Surat Keterangan Kelakuan Baik - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat keterangan kelakuan baik siswa atas nama ${selectedStudent.name} (Kelas ${selectedStudent.grade}) untuk keperluan: ${goodConductPurpose}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN KELAKUAN BAIK', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini menerangkan dengan sesungguhnya bahwa:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);
        
        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);

        const statementText = `Adalah benar-benar siswa yang pernah / sedang belajar di ${schoolName} dan sepanjang pengetahuan kami yang bersangkutan selama di sekolah memiliki kelakuan yang baik, sopan, disiplin, tidak pernah terlibat narkoba, perkelahian, maupun tindakan kriminal lainnya.`;
        const purposeText = `Surat keterangan ini diberikan agar dapat dipergunakan sebagai: "${goodConductPurpose}".`;

        doc.text(doc.splitTextToSize(statementText, 180), 15, 120);
        doc.text(doc.splitTextToSize(purposeText, 180), 15, 134);
        doc.text('Demikian surat keterangan kelakuan baik ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', 15, 148);
        signatureY = 160;

      } else if (template === 'pindah-sekolah' && selectedStudent) {
        letterTitle = `Surat Keterangan Pindah Sekolah - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat keterangan pindah sekolah siswa atas nama ${selectedStudent.name} (Kelas ${selectedStudent.grade}) ke ${targetSchool} karena: ${pindahReason}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN PINDAH SEKOLAH', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini menerangkan bahwa siswa di bawah ini:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);
        
        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);

        const statementText = `Telah mengajukan permohonan pindah sekolah secara resmi dari ${schoolName} ke sekolah tujuan: "${targetSchool}".`;
        const reasonText = `Adapun alasan kepindahan siswa tersebut adalah: "${pindahReason}". Semua dokumen pendukung dan rapot hasil belajar siswa telah diserahterimakan kepada orang tua/wali siswa secara resmi.`;

        doc.text(doc.splitTextToSize(statementText, 180), 15, 120);
        doc.text(doc.splitTextToSize(reasonText, 180), 15, 134);
        doc.text('Demikian surat keterangan pindah sekolah ini dibuat untuk dapat digunakan sebagaimana mestinya.', 15, 150);
        signatureY = 160;

      } else if (template === 'rekomendasi-beasiswa' && selectedStudent) {
        letterTitle = `Surat Rekomendasi Beasiswa - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat rekomendasi beasiswa ${scholarshipName} untuk siswa ${selectedStudent.name} (Kelas ${selectedStudent.grade}). Catatan: ${rekomendasiNote}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT REKOMENDASI BEASISWA', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini memberikan rekomendasi penuh kepada siswa:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);
        
        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);

        const statementText = `Untuk dicalonkan sebagai penerima program beasiswa: "${scholarshipName}". Berdasarkan rekam jejak akademik, kedisiplinan, dan kondisi sosial ekonomi, siswa tersebut sangat layak dipertimbangkan untuk mendapatkan bantuan program tersebut.`;
        const noteText = `Catatan khusus sekolah: "${rekomendasiNote}".`;

        doc.text(doc.splitTextToSize(statementText, 180), 15, 120);
        doc.text(doc.splitTextToSize(noteText, 180), 15, 136);
        doc.text('Demikian surat rekomendasi beasiswa ini dibuat dengan sebenarnya untuk dipergunakan seperlunya.', 15, 152);
        signatureY = 162;

      } else if (template === 'rapat-guru') {
        letterTitle = `Surat Undangan Rapat Guru - ${staffMeetingAgenda}`;
        recipientOrRecipientText = 'Seluruh Pendidik & Tenaga Kependidikan';
        letterDescription = `Surat undangan rapat dinas internal guru dan staf mengenai agenda: ${staffMeetingAgenda}.`;
        letterCategory = 'Kepegawaian';

        doc.text('Nomor', 15, 45);
        doc.text('Lampiran', 15, 50);
        doc.text('Sifat', 15, 55);
        doc.text('Perihal', 15, 60);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  -', 35, 50);
        doc.text(':  Penting / Dinas', 35, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(':  Undangan Rapat Dinas Guru & Staf', 35, 60);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bapak / Ibu Dewan Guru dan Staf TU`, 15, 77);
        doc.text(`${schoolName}`, 15, 82);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 87);

        doc.text('Dengan hormat,', 15, 98);
        const introText = `Dengan ini kami mengundang seluruh Bapak/Ibu Pendidik dan Tenaga Kependidikan (Tenaga Administrasi/TU) untuk menghadiri rapat dinas internal guna membicarakan dan mengevaluasi agenda sekolah sebagai berikut:`;
        doc.text(doc.splitTextToSize(introText, 180), 15, 103);

        doc.setFont('helvetica', 'bold');
        doc.text('Hari / Tanggal', 25, 118);
        doc.text('Waktu', 25, 124);
        doc.text('Tempat', 25, 130);
        doc.text('Agenda Rapat', 25, 136);

        doc.setFont('helvetica', 'normal');
        const rDate = format(new Date(staffMeetingDate), 'EEEE, dd MMMM yyyy', { locale: id });
        doc.text(`:  ${rDate}`, 60, 118);
        doc.text(`:  ${staffMeetingTime}`, 60, 124);
        doc.text(`:  ${staffMeetingPlace}`, 60, 130);
        doc.text(doc.splitTextToSize(`:  ${staffMeetingAgenda}`, 135), 60, 136);

        const closingText = `Mengingat pentingnya agenda rapat dinas ini, kehadiran seluruh guru dan pegawai sangat kami harapkan demi kelancaran program sekolah kita. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.`;
        doc.text(doc.splitTextToSize(closingText, 180), 15, 148);
        signatureY = 168;

      } else if (template === 'dispensasi-siswa' && selectedStudent) {
        letterTitle = `Surat Dispensasi Siswa - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat dispensasi izin meninggalkan KBM untuk siswa ${selectedStudent.name} (Kelas ${selectedStudent.grade}) mengikuti: ${dispensationEvent} di ${dispensationLocation}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT IZIN / DISPENSASI SISWA', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini memberikan izin / dispensasi meninggalkan Kegiatan Belajar Mengajar (KBM) kepada:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);

        doc.text('Untuk berpartisipasi dan mewakili sekolah dalam kegiatan:', 15, 114);

        doc.setFont('helvetica', 'bold');
        doc.text('Kegiatan/Lomba', 25, 121);
        doc.text('Mulai Tanggal', 25, 127);
        doc.text('Selesai Tanggal', 25, 133);
        doc.text('Tempat Kegiatan', 25, 139);

        doc.setFont('helvetica', 'normal');
        const startD = format(new Date(dispensationStartDate), 'dd MMMM yyyy', { locale: id });
        const endD = format(new Date(dispensationEndDate), 'dd MMMM yyyy', { locale: id });
        
        doc.text(doc.splitTextToSize(`:  ${dispensationEvent}`, 135), 60, 121);
        doc.text(`:  ${startD}`, 60, 127);
        doc.text(`:  ${endD}`, 60, 133);
        doc.text(`:  ${dispensationLocation}`, 60, 139);

        const statementText = `Sekolah mengharapkan agar guru mata pelajaran yang bersangkutan dapat memaklumi izin ini dan memberikan dispensasi serta bantuan akademis yang diperlukan agar siswa tidak tertinggal materi pelajaran.`;
        doc.text(doc.splitTextToSize(statementText, 180), 15, 149);
        doc.text('Demikian surat dispensasi ini dibuat untuk dapat dipergunakan dan dilaksanakan sebagaimana mestinya.', 15, 161);
        signatureY = 180;

      } else if (template === 'ket-siswa' && selectedStudent) {
        // NEW: 9. Surat Keterangan Siswa (Generic)
        letterTitle = `Surat Keterangan Siswa - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat Keterangan Siswa atas nama ${selectedStudent.name} (Kelas ${selectedStudent.grade}). Keterangan: ${ketSiswaContent.substring(0, 50)}...`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN SISWA', 105, 45, { align: 'center' });
        doc.line(45, 46.5, 165, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini menerangkan dengan sesungguhnya bahwa:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);

        const paragraphText = `Adalah benar-benar siswa di ${schoolName} yang berkelakuan baik dan ${ketSiswaContent}`;
        doc.text(doc.splitTextToSize(paragraphText, 180), 15, 114);

        doc.text('Demikian surat keterangan ini kami buat dengan sebenarnya untuk dipergunakan seperlunya.', 15, 142);
        signatureY = 160;

      } else if (template === 'skmt' && selectedTeacher) {
        // NEW: 10. SKMT (Guru)
        letterTitle = `SKMT - ${selectedTeacher.name}`;
        recipientOrRecipientText = selectedTeacher.name;
        letterDescription = `Surat Keterangan Melaksanakan Tugas (SKMT) guru ${selectedTeacher.name} tahun pelajaran ${skmtSchoolYear} mengajar ${skmtHours}.`;
        letterCategory = 'Kepegawaian';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN MELAKSANAKAN TUGAS', 105, 45, { align: 'center' });
        doc.text('(SKMT)', 105, 50, { align: 'center' });
        doc.line(35, 51.5, 175, 51.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 56, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 66);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 73);
        doc.text('Jabatan', 25, 79);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 73);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 79);

        doc.text('Menerangkan dengan sesungguhnya bahwa pendidik / guru di bawah ini:', 15, 88);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Guru', 25, 95);
        doc.text('NIP', 25, 101);
        doc.text('Mata Pelajaran', 25, 107);
        doc.text('Jabatan / Tugas', 25, 113);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedTeacher.name}`, 55, 95);
        doc.text(`:  ${selectedTeacher.nip || '-'}`, 55, 101);
        doc.text(`:  ${selectedTeacher.subject || '-'}`, 55, 107);
        doc.text(`:  Guru Mata Pelajaran`, 55, 113);

        const skmtText = `Telah secara aktif dan nyata melaksanakan tugas proses belajar mengajar secara kontinu di ${schoolName} dengan beban mengajar sebanyak ${skmtHours} tatap muka per minggu pada Tahun Pelajaran ${skmtSchoolYear}. Beliau melaksanakan tugas dengan dedikasi tinggi, integritas profesional, dan tertib administratif.`;
        doc.text(doc.splitTextToSize(skmtText, 180), 15, 122);

        doc.text('Demikian Surat Keterangan Melaksanakan Tugas (SKMT) ini dibuat untuk dipergunakan sebagaimana mestinya.', 15, 150);
        signatureY = 168;

      } else if (template === 'surat-pengantar') {
        // NEW: 11. Surat Pengantar (Cover Letter)
        letterTitle = `Surat Pengantar Berkas - Yth. ${pengantarRecipient}`;
        recipientOrRecipientText = pengantarRecipient;
        letterDescription = `Surat pengantar resmi pengiriman berkas/dokumen administrasi ditujukan kepada ${pengantarRecipient}.`;
        letterCategory = 'Umum';

        doc.text('Nomor', 15, 45);
        doc.text('Sifat', 15, 50);
        doc.text('Lampiran', 15, 55);
        doc.text('Perihal', 15, 60);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  Penting', 35, 50);
        doc.text(':  Terlampir', 35, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(':  SURAT PENGANTAR RESMI', 35, 60);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(pengantarRecipient, 15, 77);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 82);

        doc.text('Dengan hormat,', 15, 92);
        doc.text('Bersama ini kami kirimkan dokumen/berkas penting sekolah dengan rincian tabel di bawah ini:', 15, 97);

        // Simple item list table
        doc.setLineWidth(0.3);
        doc.line(15, 103, 195, 103); // table header top
        doc.setFont('helvetica', 'bold');
        doc.text('No', 18, 108);
        doc.text('Jenis Berkas / Dokumen yang Dikirim', 32, 108);
        doc.text('Banyaknya', 130, 108);
        doc.text('Keterangan', 160, 108);
        doc.line(15, 111, 195, 111); // table header bottom
        doc.setFont('helvetica', 'normal');

        let yPos = 117;
        pengantarItems.forEach((item, index) => {
          doc.text(`${index + 1}.`, 18, yPos);
          doc.text(doc.splitTextToSize(item.name, 90), 32, yPos);
          doc.text(item.qty, 130, yPos);
          doc.text(doc.splitTextToSize(item.note, 35), 160, yPos);
          doc.line(15, yPos + 6, 195, yPos + 6);
          yPos += 12;
        });

        doc.text('Demikian surat pengantar ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.', 15, yPos + 4);
        signatureY = yPos + 12;

      } else if (template === 'pemberitahuan') {
        // NEW: 12. Surat Pemberitahuan
        letterTitle = `Surat Pemberitahuan - ${pemberitahuanTitle}`;
        recipientOrRecipientText = pemberitahuanTarget;
        letterDescription = `Surat pemberitahuan resmi mengenai ${pemberitahuanTitle} untuk ${pemberitahuanTarget}.`;
        letterCategory = 'Humas';

        doc.text('Nomor', 15, 45);
        doc.text('Lampiran', 15, 50);
        doc.text('Perihal', 15, 55);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  -', 35, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(`:  ${pemberitahuanTitle}`, 35, 55);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 68);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bapak / Ibu Orang Tua / Wali Murid`, 15, 73);
        doc.text(pemberitahuanTarget, 15, 78);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 83);

        doc.text('Dengan hormat,', 15, 94);
        doc.text(doc.splitTextToSize(pemberitahuanContent, 180), 15, 99);

        doc.text('Demikian pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi aktif Bapak/Ibu sekalian, kami sampaikan terima kasih.', 15, 142);
        signatureY = 158;

      } else if (template === 'panggilan-ortu' && selectedStudent) {
        // NEW: 13. Surat Panggilan Orang Tua
        letterTitle = `Surat Panggilan Orang Tua - ${selectedStudent.name}`;
        recipientOrRecipientText = `Wali Murid ${selectedStudent.name}`;
        letterDescription = `Surat panggilan dinas bimbingan konseling untuk orang tua ${selectedStudent.name} (Kelas ${selectedStudent.grade}) agenda: ${panggilanAgenda}.`;
        letterCategory = 'Kesiswaan';

        doc.text('Nomor', 15, 45);
        doc.text('Lampiran', 15, 50);
        doc.text('Sifat', 15, 55);
        doc.text('Perihal', 15, 60);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  Penting / Rahasia', 35, 50);
        doc.text(':  Mendesak', 35, 55);
        doc.setFont('helvetica', 'bold');
        doc.text(':  Panggilan Orang Tua Siswa / Wali', 35, 60);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bapak / Ibu Orang Tua / Wali Siswa dari:`, 15, 77);
        doc.text(`${selectedStudent.name} (Kelas ${selectedStudent.grade})`, 15, 82);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 87);

        doc.text('Dengan hormat,', 15, 97);
        const panggilanIntro = `Untuk meningkatkan sinergi pembinaan akademis dan kedisiplinan siswa, kami mengharapkan kehadiran Bapak/Ibu selaku orang tua/wali siswa ke sekolah guna berkoordinasi langsung dengan Wali Kelas dan Tim BK pada:`;
        doc.text(doc.splitTextToSize(panggilanIntro, 180), 15, 102);

        doc.setFont('helvetica', 'bold');
        doc.text('Hari / Tanggal', 25, 118);
        doc.text('Waktu', 25, 124);
        doc.text('Tempat / Ruang', 25, 130);
        doc.text('Agenda / Maksud', 25, 136);

        doc.setFont('helvetica', 'normal');
        const pDate = format(new Date(panggilanDate), 'EEEE, dd MMMM yyyy', { locale: id });
        doc.text(`:  ${pDate}`, 60, 118);
        doc.text(`:  ${panggilanTime}`, 60, 124);
        doc.text(`:  ${panggilanPlace}`, 60, 130);
        doc.text(doc.splitTextToSize(`:  ${panggilanAgenda}`, 135), 60, 136);

        const panggilanClosing = `Mengingat pentingnya agenda koordinasi masa depan studi putra-putri Bapak/Ibu sekalian, kehadiran langsung (tanpa diwakilkan) sangat kami harapkan. Atas bantuan dan kerja samanya, kami ucapkan terima kasih.`;
        doc.text(doc.splitTextToSize(panggilanClosing, 180), 15, 148);
        signatureY = 168;

      } else if (template === 'sppd' && selectedTeacher) {
        // NEW: 14. SPPD (Surat Perjalanan Dinas)
        letterTitle = `SPPD - ${selectedTeacher.name}`;
        recipientOrRecipientText = selectedTeacher.name;
        letterDescription = `Surat Perjalanan Dinas (SPPD) untuk ${selectedTeacher.name} menuju ${sppdDestination}.`;
        letterCategory = 'Keuangan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT PERJALANAN DINAS', 105, 43, { align: 'center' });
        doc.text('(SPPD)', 105, 48, { align: 'center' });
        doc.line(65, 49.5, 145, 49.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 54, { align: 'center' });

        // Left SPPD Table
        doc.text('1.  Pejabat Pemberi Mandat', 15, 65);
        doc.text('2.  Nama Pegawai yang Ditugaskan', 15, 71);
        doc.text('3.  NIP / Golongan Pegawai', 15, 77);
        doc.text('4.  Maksud Perjalanan Dinas', 15, 83);
        doc.text('5.  Alat Transportasi Digunakan', 15, 89);
        doc.text('6.  Tempat Berangkat / Asal', 15, 95);
        doc.text('7.  Tempat Tujuan Dinas', 15, 101);
        doc.text('8.  Lama Perjalanan Dinas', 15, 107);
        doc.text('9.  Mata Anggaran / Sumber Dana', 15, 113);

        doc.text(`:  Kepala Sekolah ${schoolName}`, 75, 65);
        doc.setFont('helvetica', 'bold');
        doc.text(`:  ${selectedTeacher.name}`, 75, 71);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedTeacher.nip || '-'} / ${selectedTeacher.rankCategory || '-'}`, 75, 77);
        doc.text(doc.splitTextToSize(`:  ${sppdPurpose}`, 115), 75, 83);
        doc.text(`:  ${sppdTransport}`, 75, 89);
        doc.text(`:  ${sppdOrigin || schoolName}`, 75, 95);
        doc.text(doc.splitTextToSize(`:  ${sppdDestination}`, 115), 75, 101);

        const depDate = format(new Date(sppdDeparture), 'dd MMM yyyy', { locale: id });
        const retDate = format(new Date(sppdReturn), 'dd MMM yyyy', { locale: id });
        doc.text(`:  Dari ${depDate} s.d ${retDate}`, 75, 107);
        doc.text(`:  ${sppdBudget}`, 75, 113);

        // Simple table grid box around it for official appearance
        doc.rect(13, 59, 184, 60);
        doc.line(73, 59, 73, 119);

        const sppdFooter = 'Diharapkan kepada instansi atau pejabat di tempat tujuan dinas untuk memberikan bantuan kelancaran tugas serta menandatangani lembar konfirmasi kehadiran.';
        doc.text(doc.splitTextToSize(sppdFooter, 180), 15, 126);
        signatureY = 145;

      } else if (template === 'sk-kepsek') {
        // NEW: 15. SK Kepala Sekolah
        letterTitle = `SK Kepala Sekolah - ${skSubject.substring(0, 40)}`;
        recipientOrRecipientText = 'Keluarga Besar Sekolah';
        letterDescription = `Surat Keputusan (SK) Kepala Sekolah tentang ${skSubject}.`;
        letterCategory = 'Kepegawaian';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('KEPUTUSAN KEPALA SEKOLAH MENENGAH PERTAMA', 105, 43, { align: 'center' });
        doc.setFontSize(13);
        doc.text(schoolName.toUpperCase(), 105, 49, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`NOMOR: ${customRefNum}`, 105, 54, { align: 'center' });

        doc.text(`TENTANG:`, 105, 62, { align: 'center' });
        doc.text(skSubject.toUpperCase(), 105, 67, { align: 'center' });

        doc.text('MEMUTUSKAN:', 15, 78);

        doc.text('MENIMBANG', 15, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(`: ${skConsider}`, 145), 45, 85);

        doc.setFont('helvetica', 'bold');
        doc.text('MENGINGAT', 15, 108);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(`: ${skRemember}`, 145), 45, 108);

        doc.setFont('helvetica', 'bold');
        doc.text('MENETAPKAN', 15, 130);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(`: ${skDecide}`, 145), 45, 130);

        doc.text('Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan di kemudian hari akan diperbaiki sebagaimana mestinya.', 15, 150);
        signatureY = 162;

      } else if (template === 'sptjm') {
        // NEW: 16. SPTJM
        letterTitle = `SPTJM - ${sptjmProgram.substring(0, 40)}`;
        recipientOrRecipientText = 'Kepala Dinas / Pengelola Program';
        letterDescription = `Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) terkait ${sptjmProgram}.`;
        letterCategory = 'Umum';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK', 105, 45, { align: 'center' });
        doc.text('(SPTJM)', 105, 50, { align: 'center' });
        doc.line(30, 51.5, 180, 51.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 56, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini:', 15, 66);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 73);
        doc.text('Jabatan', 25, 79);
        doc.text('Instansi', 25, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 73);
        doc.text(`:  Kepala Sekolah`, 55, 79);
        doc.text(`:  ${schoolName}`, 55, 85);

        const sptjmIntro = `Dengan ini menyatakan dengan penuh tanggung jawab serta kesadaran hukum yang mutlak terkait program: "${sptjmProgram}" bahwa:`;
        doc.text(doc.splitTextToSize(sptjmIntro, 180), 15, 94);

        doc.text(doc.splitTextToSize(sptjmContent, 180), 15, 106);

        const sptjmOutro = `Demikian Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) ini dibuat dengan sebenarnya dan apabila di kemudian hari ditemukan kesalahan yang merugikan keuangan negara, kami bersedia dituntut sesuai undang-undang berlaku.`;
        doc.text(doc.splitTextToSize(sptjmOutro, 180), 15, 136);
        signatureY = 162;
      } else if (template === 'ket-kelulusan' && selectedStudent) {
        // NEW: 17. Surat Keterangan Kelulusan (SKL)
        letterTitle = `Surat Keterangan Lulus (SKL) - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat Keterangan Lulus (SKL) siswa atas nama ${selectedStudent.name} (Kelas ${selectedStudent.grade}) Tahun Pelajaran ${sklSchoolYear}. Status: ${sklStatus}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT KETERANGAN LULUS', 105, 45, { align: 'center' });
        doc.text(`TAHUN PELAJARAN ${sklSchoolYear}`, 105, 50, { align: 'center' });
        doc.line(45, 51.5, 165, 51.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 57, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 68);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 75);
        doc.text('Jabatan', 25, 81);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 75);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 81);

        doc.text('Dengan ini menerangkan dengan sesungguhnya bahwa:', 15, 90);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 97);
        doc.text('NIS / NISN', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.text('Nomor Ujian', 25, 115);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 97);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 103);

        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);
        doc.text(`:  ${sklExamNum}`, 55, 115);

        doc.text('Berdasarkan hasil rapat pleno kelulusan Dewan Guru pada tanggal kelulusan resmi, yang bersangkutan dinyatakan:', 15, 124);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(sklStatus.toUpperCase(), 105, 134, { align: 'center' });
        doc.rect(70, 128, 70, 9); // Box for status
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        doc.text(`Dengan nilai rata-rata asesmen sekolah / ujian sekolah: ${sklAverageGrade}`, 15, 144);
        doc.text('Demikian surat keterangan ini kami buat agar dapat dipergunakan seperlunya sebagai dokumen sementara sebelum ijazah asli diterbitkan.', 15, 150);
        signatureY = 162;

      } else if (template === 'undangan-komite') {
        // NEW: 18. Surat Undangan Rapat Komite
        letterTitle = `Surat Undangan Rapat Komite - ${komiteMeetingAgenda.substring(0, 40)}`;
        recipientOrRecipientText = 'Pengurus Komite & Perwakilan Wali Murid';
        letterDescription = `Surat undangan rapat komite sekolah mengenai agenda: ${komiteMeetingAgenda}.`;
        letterCategory = 'Humas';

        doc.text('Nomor', 15, 45);
        doc.text('Lampiran', 15, 50);
        doc.text('Perihal', 15, 55);

        doc.text(`:  ${customRefNum}`, 35, 45);
        doc.text(':  -', 35, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(':  Undangan Rapat Komite Sekolah', 35, 55);
        doc.setFont('helvetica', 'normal');

        doc.text(`Kediri, ${formattedDocDate}`, 150, 45);

        doc.text('Kepada Yth.', 15, 68);
        doc.setFont('helvetica', 'bold');
        doc.text('Bapak/Ibu Pengurus Komite Sekolah', 15, 73);
        doc.text('dan Tokoh Masyarakat Peduli Pendidikan', 15, 78);
        doc.setFont('helvetica', 'normal');
        doc.text('di - Tempat', 15, 83);

        doc.text('Dengan hormat,', 15, 94);
        const introText = `Dalam rangka meningkatkan mutu pelayanan pendidikan, sarana prasarana sekolah, serta menyusun Rencana Kegiatan dan Anggaran Sekolah (RKAS), kami mengharapkan kehadiran Bapak/Ibu pengurus Komite dan perwakilan pada pertemuan rapat yang akan diselenggarakan pada:`;
        doc.text(doc.splitTextToSize(introText, 180), 15, 99);

        doc.setFont('helvetica', 'bold');
        doc.text('Hari / Tanggal', 25, 114);
        doc.text('Waktu', 25, 120);
        doc.text('Tempat', 25, 126);
        doc.text('Agenda Utama', 25, 132);

        doc.setFont('helvetica', 'normal');
        const kDate = format(new Date(komiteMeetingDate), 'EEEE, dd MMMM yyyy', { locale: id });
        doc.text(`:  ${kDate}`, 60, 114);
        doc.text(`:  ${komiteMeetingTime}`, 60, 120);
        doc.text(`:  ${komiteMeetingPlace}`, 60, 126);
        doc.text(doc.splitTextToSize(`:  ${komiteMeetingAgenda}`, 135), 60, 132);

        const closingText = `Mengingat sangat pentingnya koordinasi sinergis antara pihak sekolah dan komite sekolah demi kemajuan belajar putra-putri kita, kehadiran Bapak/Ibu sangat kami harapkan. Atas perhatian dan dukungannya, kami ucapkan terima kasih.`;
        doc.text(doc.splitTextToSize(closingText, 180), 15, 144);
        signatureY = 164;

      } else if (template === 'rekomendasi-pindah' && selectedStudent) {
        // NEW: 19. Surat Rekomendasi Pindah
        letterTitle = `Surat Rekomendasi ${rekomendasiPindahType} - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat rekomendasi ${rekomendasiPindahType} siswa atas nama ${selectedStudent.name} ke/dari ${rekomendasiPindahSchool} karena: ${rekomendasiPindahReason}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`SURAT REKOMENDASI ${rekomendasiPindahType.toUpperCase()}`, 105, 45, { align: 'center' });
        doc.line(40, 46.5, 170, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini Kepala Sekolah Menengah Pertama:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama', 25, 69);
        doc.text('Jabatan', 25, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${headmaster}`, 55, 69);
        doc.text(`:  Kepala Sekolah ${schoolName}`, 55, 75);

        doc.text('Dengan ini memberikan rekomendasi persetujuan kepada siswa:', 15, 84);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 91);
        doc.text('NIS / NISN', 25, 97);
        doc.text('Kelas', 25, 103);
        doc.text('Tempat, Tgl Lahir', 25, 109);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 91);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 97);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 103);
        
        const bPlace = selectedStudent.birthPlace || '-';
        const bDate = selectedStudent.birthDate ? format(new Date(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: id }) : '-';
        doc.text(`:  ${bPlace}, ${bDate}`, 55, 109);

        const recommendationText = `Untuk melakukan proses ${rekomendasiPindahType} dengan sekolah tujuan / asal yaitu "${rekomendasiPindahSchool}". Pihak sekolah tidak keberatan sepanjang berkas administrasi pendukung terpenuhi dan sekolah yang dituju menyatakan siap menerima siswa tersebut.`;
        const reasonText = `Alasan mutasi kepindahan: "${rekomendasiPindahReason}".`;

        doc.text(doc.splitTextToSize(recommendationText, 180), 15, 120);
        doc.text(doc.splitTextToSize(reasonText, 180), 15, 134);
        doc.text('Demikian surat rekomendasi ini kami berikan dengan sebenarnya untuk dapat dipergunakan secara semestinya.', 15, 146);
        signatureY = 160;

      } else if (template === 'pernyataan-patuh' && selectedStudent) {
        // NEW: 20. Surat Pernyataan Patuh Tata Tertib
        letterTitle = `Surat Pernyataan Patuh Siswa - ${selectedStudent.name}`;
        recipientOrRecipientText = selectedStudent.name;
        letterDescription = `Surat pernyataan kesanggupan mematuhi tata tertib sekolah siswa ${selectedStudent.name} didampingi orang tua/wali ${patuhParentName}.`;
        letterCategory = 'Kesiswaan';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SURAT PERNYATAAN PATUH TATA TERTIB SISWA', 105, 45, { align: 'center' });
        doc.line(30, 46.5, 180, 46.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nomor: ${customRefNum}`, 105, 51, { align: 'center' });

        doc.text('Yang bertanda tangan di bawah ini:', 15, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nama Siswa', 25, 69);
        doc.text('Kelas', 25, 75);
        doc.text('NIS / NISN', 25, 81);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${selectedStudent.name}`, 55, 69);
        doc.text(`:  Kelas ${selectedStudent.grade}`, 55, 75);
        doc.text(`:  ${selectedStudent.nis || '-'} / ${selectedStudent.nisn || '-'}`, 55, 81);

        doc.text('Didampingi oleh Orang Tua / Wali murid:', 15, 90);

        doc.setFont('helvetica', 'bold');
        doc.text('Nama Orang Tua', 25, 97);
        doc.text('Pekerjaan', 25, 103);
        doc.setFont('helvetica', 'normal');
        doc.text(`:  ${patuhParentName}`, 55, 97);
        doc.text(`:  ${patuhParentJob}`, 55, 103);

        const statementIntro = `Dengan kesadaran penuh tanpa paksaan, kami menyatakan bersedia mematuhi seluruh tata tertib sekolah ${schoolName} demi kenyamanan dan ketertiban bersama, yang meliputi poin-poin sebagai berikut:`;
        doc.text(doc.splitTextToSize(statementIntro, 180), 15, 112);

        doc.text(doc.splitTextToSize(patuhPoints, 180), 15, 124);

        doc.text('Demikian surat pernyataan ini dibuat untuk dipegang teguh dan dilaksanakan dengan penuh rasa tanggung jawab.', 15, 148);
        signatureY = 160;
      }

      // DRAW SHARED FOOTER SIGNATURE
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Kediri, ${formattedDocDate}`, 140, signatureY);
      doc.text(`Kepala ${schoolName},`, 140, signatureY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text(headmaster, 140, signatureY + 24);
      doc.setFont('helvetica', 'normal');
      if (headmasterNip) {
        doc.text(`NIP. ${headmasterNip}`, 140, signatureY + 28);
      }

      // SAVE PDF
      doc.save(`Surat_Resmi_${customRefNum.replace(/\//g, '_')}.pdf`);

      // 3. Register draft in database
      const dataToSave: Letter = {
        type: 'outbox',
        category: letterCategory,
        referenceNumber: customRefNum,
        title: letterTitle,
        senderOrRecipient: recipientOrRecipientText,
        date: documentDate,
        description: letterDescription,
        indexData: letterCategory,
        sequenceNumber: getNextSequenceNumber('outbox'),
        code: customRefNum.split('/')[0],
        attachment: '-',
        documentDate: documentDate,
        urgency: 'Biasa',
        securityStyle: 'Biasa',
        processingUnit: 'Tata Usaha (TU)',
        receivedBy: adminName,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await db.letters.add(dataToSave);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      toast.success(`Draft surat "${letterTitle}" berhasil dibuat & diunduh!`);
      onDraftCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghasilkan dokumen draf surat');
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-5xl p-0 overflow-hidden relative border-sky-500/20 max-h-[92vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20 shrink-0">
          <h3 className="text-xl font-medium text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" /> Draf & Pembuat Surat Resmi Otomatis (20 Template Lengkap)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* STEP 1: PILIH TEMPLATE */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pilih Template Surat Resmi</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {[
                { id: 'aktif-belajar', label: 'Aktif Belajar', desc: 'Siswa aktif sekolah', icon: GraduationCap },
                { id: 'surat-tugas', label: 'Surat Tugas', desc: 'Dinas pendidik/pegawai', icon: FileText },
                { id: 'undangan-wali', label: 'Undangan Wali', desc: 'Rapat wali murid siswa', icon: Calendar },
                { id: 'kelakuan-baik', label: 'Kelakuan Baik', desc: 'Surat ket. berkelakuan baik', icon: Check },
                { id: 'pindah-sekolah', label: 'Pindah Sekolah', desc: 'Keterangan mutasi keluar', icon: ArrowRightLeft },
                { id: 'rekomendasi-beasiswa', label: 'Rekomendasi PIP', desc: 'Usulan program bantuan', icon: Award },
                { id: 'rapat-guru', label: 'Undangan Guru', desc: 'Pertemuan rapat dinas TU', icon: Users },
                { id: 'dispensasi-siswa', label: 'Dispensasi Siswa', desc: 'Izin lomba & delegasi', icon: BookOpen },
                { id: 'ket-siswa', label: 'Ket. Siswa (Generic)', desc: 'Surat Keterangan Siswa', icon: FileCheck },
                { id: 'skmt', label: 'SKMT Guru', desc: 'Surat Keterangan Mengajar', icon: ClipboardCheck },
                { id: 'surat-pengantar', label: 'Surat Pengantar', desc: 'Pengantar berkas/dokumen', icon: Send },
                { id: 'pemberitahuan', label: 'Pemberitahuan', desc: 'Pengumuman resmi wali', icon: Megaphone },
                { id: 'panggilan-ortu', label: 'Panggilan Ortu', desc: 'Undangan bimbingan BK', icon: Mail },
                { id: 'sppd', label: 'SPPD', desc: 'Perjalanan Dinas Pegawai', icon: Briefcase },
                { id: 'sk-kepsek', label: 'SK Kepsek', desc: 'Surat Keputusan Resmi', icon: Scale },
                { id: 'sptjm', label: 'SPTJM', desc: 'Pertanggungjawaban Mutlak', icon: FileText },
                { id: 'ket-kelulusan', label: 'SK Kelulusan', desc: 'Keterangan Lulus (SKL)', icon: GraduationCap },
                { id: 'undangan-komite', label: 'Undangan Komite', desc: 'Pertemuan komite sekolah', icon: Users },
                { id: 'rekomendasi-pindah', label: 'Rekomendasi Pindah', desc: 'Surat rekomendasi mutasi', icon: ArrowRightLeft },
                { id: 'pernyataan-patuh', label: 'Pernyataan Patuh', desc: 'Tata tertib & kesanggupan', icon: Scale }
              ].map(tpl => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplate(tpl.id as TemplateType);
                      setSelectedStudent(null);
                      setStudentSearch('');
                      setSelectedTeacher(null);
                      setTeacherSearch('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      template === tpl.id
                        ? 'bg-sky-500/10 border-sky-500/50 text-sky-300'
                        : 'bg-slate-950/20 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${template === tpl.id ? 'text-sky-400' : 'text-slate-500'}`} />
                    <div className="font-medium text-xs">{tpl.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tpl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COLUMN 1: INTEGRASI DATA BASE (SISWA / GURU) */}
            <div className="space-y-4 bg-slate-800/20 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-slate-700/50 pb-2 flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Integrasi Sumber Data
              </h4>

              {/* STUDENT AUTOCOMPLETE SELECTOR */}
              {requiresStudent.includes(template) && (
                <div className="space-y-1 relative">
                  <label className="text-xs font-medium text-slate-400">CARI SISWA DARI DATA AKADEMIK</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama siswa atau NISN..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setShowStudentDropdown(true);
                        if (selectedStudent && e.target.value !== selectedStudent.name) {
                          setSelectedStudent(null);
                        }
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="glass-input w-full"
                    />
                    <GraduationCap className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>

                  {showStudentDropdown && studentSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">Siswa tidak ditemukan</div>
                      ) : (
                        filteredStudents.map(student => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelectStudent(student)}
                            className="w-full text-left p-2.5 hover:bg-white/5 border-b border-white/5 text-xs text-white flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold">{student.name}</div>
                              <div className="text-[10px] text-slate-400">NISN: {student.nisn} | Kelas {student.grade}</div>
                            </div>
                            <Check className="w-3 h-3 text-emerald-400 opacity-0 hover:opacity-100" />
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-2 text-xs flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-emerald-300">{selectedStudent.name}</div>
                        <div className="text-slate-400">NIS: {selectedStudent.nis || '-'} | NISN: {selectedStudent.nisn} | Kelas {selectedStudent.grade}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TEACHER AUTOCOMPLETE SELECTOR */}
              {requiresTeacher.includes(template) && (
                <div className="space-y-1 relative">
                  <label className="text-xs font-medium text-slate-400">CARI GURU DARI DATA KEPEGAWAIAN</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama guru atau NIP..."
                      value={teacherSearch}
                      onChange={(e) => {
                        setTeacherSearch(e.target.value);
                        setShowTeacherDropdown(true);
                        if (selectedTeacher && e.target.value !== selectedTeacher.name) {
                          setSelectedTeacher(null);
                        }
                      }}
                      onFocus={() => setShowTeacherDropdown(true)}
                      className="glass-input w-full"
                    />
                    <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>

                  {showTeacherDropdown && teacherSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredTeachers.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">Guru tidak ditemukan</div>
                      ) : (
                        filteredTeachers.map(teacher => (
                          <button
                            key={teacher.id}
                            type="button"
                            onClick={() => handleSelectTeacher(teacher)}
                            className="w-full text-left p-2.5 hover:bg-white/5 border-b border-white/5 text-xs text-white flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold">{teacher.name}</div>
                              <div className="text-[10px] text-slate-400">NIP: {teacher.nip} | {teacher.subject}</div>
                            </div>
                            <Check className="w-3 h-3 text-emerald-400 opacity-0 hover:opacity-100" />
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedTeacher && (
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 mt-2 text-xs flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold shrink-0">
                        {selectedTeacher.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sky-300">{selectedTeacher.name}</div>
                        <div className="text-slate-400">NIP: {selectedTeacher.nip || '-'} | Jabatan: {selectedTeacher.position || '-'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UNDANGAN WALI COMMON ARGS */}
              {template === 'undangan-wali' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SASARAN UNDANGAN (KEPADA)</label>
                    <input 
                      type="text" 
                      value={invitationTarget}
                      onChange={(e) => setInvitationTarget(e.target.value)}
                      placeholder="Contoh: Wali Murid Kelas IX-A s/d IX-H"
                      className="glass-input w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">AGENDA UTAMA PERTEMUAN</label>
                    <input 
                      type="text" 
                      value={meetingAgenda}
                      onChange={(e) => setMeetingAgenda(e.target.value)}
                      placeholder="Contoh: Pembahasan Persiapan Kelulusan Siswa"
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* RAPAT GURU COMMON ARGS */}
              {template === 'rapat-guru' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">AGENDA UTAMA RAPAT GURU</label>
                    <input 
                      type="text" 
                      value={staffMeetingAgenda}
                      onChange={(e) => setStaffMeetingAgenda(e.target.value)}
                      placeholder="Contoh: Rapat Evaluasi Belajar Semester Genap"
                      className="glass-input w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT / RUANG RAPAT</label>
                    <input 
                      type="text" 
                      value={staffMeetingPlace}
                      onChange={(e) => setStaffMeetingPlace(e.target.value)}
                      placeholder="Contoh: Ruang Guru Utama"
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* SURAT PENGANTAR RECIPIENT */}
              {template === 'surat-pengantar' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">INSTANSI / PEJABAT PENERIMA PENGANTAR</label>
                    <input 
                      type="text" 
                      value={pengantarRecipient}
                      onChange={(e) => setPengantarRecipient(e.target.value)}
                      placeholder="Contoh: Kepala Dinas Pendidikan Kabupaten Kediri"
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* PEMBERITAHUAN TARGET */}
              {template === 'pemberitahuan' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SASARAN PEMBERITAHUAN (KEPADA)</label>
                    <input 
                      type="text" 
                      value={pemberitahuanTarget}
                      onChange={(e) => setPemberitahuanTarget(e.target.value)}
                      placeholder="Contoh: Seluruh Wali Siswa Kelas IX"
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400">TANGGAL DOKUMEN</label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="glass-input w-full py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400">NOMOR REFERENSI SURAT</label>
                  <input
                    type="text"
                    value={customRefNum}
                    onChange={(e) => setCustomRefNum(e.target.value)}
                    placeholder="Auto-generated"
                    className="glass-input w-full py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: INFORMASI DETAIL DINAMIS TEMPLATE */}
            <div className="space-y-4 bg-slate-800/20 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-700/50 pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Isi & Keterangan Surat
              </h4>

              {/* 1. AKTIF BELAJAR */}
              {template === 'aktif-belajar' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">MAKSUD & KEPERLUAN SURAT KETERANGAN</label>
                    <textarea 
                      rows={4}
                      value={activePurpose}
                      onChange={(e) => setActivePurpose(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 2. SURAT TUGAS */}
              {template === 'surat-tugas' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">NAMA KEGIATAN / TUGAS DINAS</label>
                    <input 
                      type="text" 
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT PELAKSANAAN KEGIATAN</label>
                    <input 
                      type="text" 
                      value={taskLocation}
                      onChange={(e) => setTaskLocation(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TANGGAL PELAKSANAAN</label>
                      <input 
                        type="date" 
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">PERAN / JABATAN TUGAS</label>
                      <input 
                        type="text" 
                        value={taskRole}
                        onChange={(e) => setTaskRole(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. UNDANGAN WALI */}
              {template === 'undangan-wali' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">HARI & TANGGAL RAPAT</label>
                      <input 
                        type="date" 
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">WAKTU PERTEMUAN</label>
                      <input 
                        type="text" 
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT / VENUE RAPAT</label>
                    <input 
                      type="text" 
                      value={meetingPlace}
                      onChange={(e) => setMeetingPlace(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 4. KELAKUAN BAIK */}
              {template === 'kelakuan-baik' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">MAKSUD & KEPERLUAN SURAT KELAKUAN BAIK</label>
                    <textarea 
                      rows={4}
                      value={goodConductPurpose}
                      onChange={(e) => setGoodConductPurpose(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 5. PINDAH SEKOLAH */}
              {template === 'pindah-sekolah' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SEKOLAH TUJUAN MUTASI / KEPINDAHAN</label>
                    <input 
                      type="text" 
                      value={targetSchool}
                      onChange={(e) => setTargetSchool(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ALASAN KEPINDAHAN</label>
                    <textarea 
                      rows={3}
                      value={pindahReason}
                      onChange={(e) => setPindahReason(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 6. REKOMENDASI BEASISWA */}
              {template === 'rekomendasi-beasiswa' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">NAMA PROGRAM BEASISWA</label>
                    <input 
                      type="text" 
                      value={scholarshipName}
                      onChange={(e) => setScholarshipName(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">CATATAN REKOMENDASI KHUSUS SEKOLAH</label>
                    <textarea 
                      rows={3}
                      value={rekomendasiNote}
                      onChange={(e) => setRekomendasiNote(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 7. UNDANGAN GURU RAPAT */}
              {template === 'rapat-guru' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">HARI & TANGGAL RAPAT</label>
                      <input 
                        type="date" 
                        value={staffMeetingDate}
                        onChange={(e) => setStaffMeetingDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">WAKTU PERTEMUAN RAPAT</label>
                      <input 
                        type="text" 
                        value={staffMeetingTime}
                        onChange={(e) => setStaffMeetingTime(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 8. DISPENSASI SISWA */}
              {template === 'dispensasi-siswa' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">NAMA KEGIATAN / LOMBA / DELEGASI</label>
                    <input 
                      type="text" 
                      value={dispensationEvent}
                      onChange={(e) => setDispensationEvent(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT / VENUE KEGIATAN</label>
                    <input 
                      type="text" 
                      value={dispensationLocation}
                      onChange={(e) => setDispensationLocation(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">MULAI TANGGAL</label>
                      <input 
                        type="date" 
                        value={dispensationStartDate}
                        onChange={(e) => setDispensationStartDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">SELESAI TANGGAL</label>
                      <input 
                        type="date" 
                        value={dispensationEndDate}
                        onChange={(e) => setDispensationEndDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 9. KET SISWA (GENERIC) */}
              {template === 'ket-siswa' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ISYARAT / PERNYATAAN KETERANGAN KHUSUS</label>
                    <textarea 
                      rows={5}
                      value={ketSiswaContent}
                      onChange={(e) => setKetSiswaContent(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 10. SKMT (GURU) */}
              {template === 'skmt' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">BEBAN MENGAJAR PER MINGGU</label>
                      <input 
                        type="text" 
                        value={skmtHours}
                        onChange={(e) => setSkmtHours(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TAHUN PELAJARAN</label>
                      <input 
                        type="text" 
                        value={skmtSchoolYear}
                        onChange={(e) => setSkmtSchoolYear(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 11. SURAT PENGANTAR (COVER LETTER) */}
              {template === 'surat-pengantar' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400">DAFTAR BERKAS / ISI PENGANTAR (3 BARIS)</label>
                  {pengantarItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/40 p-2 rounded-lg border border-white/5 space-y-1.5 text-xs">
                      <div className="font-semibold text-sky-400 text-[10px]">BERKAS {idx + 1}</div>
                      <input 
                        type="text"
                        placeholder="Nama Berkas"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...pengantarItems];
                          updated[idx].name = e.target.value;
                          setPengantarItems(updated);
                        }}
                        className="glass-input w-full text-xs py-1"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text"
                          placeholder="Jumlah"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...pengantarItems];
                            updated[idx].qty = e.target.value;
                            setPengantarItems(updated);
                          }}
                          className="glass-input w-full text-[11px] py-1"
                        />
                        <input 
                          type="text"
                          placeholder="Keterangan"
                          value={item.note}
                          onChange={(e) => {
                            const updated = [...pengantarItems];
                            updated[idx].note = e.target.value;
                            setPengantarItems(updated);
                          }}
                          className="glass-input w-full text-[11px] py-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 12. PEMBERITAHUAN */}
              {template === 'pemberitahuan' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">JUDUL / PERIHAL PEMBERITAHUAN</label>
                    <input 
                      type="text" 
                      value={pemberitahuanTitle}
                      onChange={(e) => setPemberitahuanTitle(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ISI PENGUMUMAN / BERITA ACARA</label>
                    <textarea 
                      rows={4}
                      value={pemberitahuanContent}
                      onChange={(e) => setPemberitahuanContent(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 13. PANGGILAN ORANG TUA */}
              {template === 'panggilan-ortu' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TANGGAL KEHADIRAN</label>
                      <input 
                        type="date" 
                        value={panggilanDate}
                        onChange={(e) => setPanggilanDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">WAKTU KEHADIRAN</label>
                      <input 
                        type="text" 
                        value={panggilanTime}
                        onChange={(e) => setPanggilanTime(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT / RUANG PERTEMUAN</label>
                    <input 
                      type="text" 
                      value={panggilanPlace}
                      onChange={(e) => setPanggilanPlace(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">AGENDA / KASUS KOORDINASI</label>
                    <input 
                      type="text" 
                      value={panggilanAgenda}
                      onChange={(e) => setPanggilanAgenda(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 14. SPPD */}
              {template === 'sppd' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">MAKSUD PERJALANAN DINAS</label>
                    <input 
                      type="text" 
                      value={sppdPurpose}
                      onChange={(e) => setSppdPurpose(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TUJUAN PERJALANAN (INSTANSI)</label>
                    <input 
                      type="text" 
                      value={sppdDestination}
                      onChange={(e) => setSppdDestination(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">ALAT TRANSPORTASI</label>
                      <input 
                        type="text" 
                        value={sppdTransport}
                        onChange={(e) => setSppdTransport(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">SUMBER ANGGARAN</label>
                      <input 
                        type="text" 
                        value={sppdBudget}
                        onChange={(e) => setSppdBudget(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TANGGAL BERANGKAT</label>
                      <input 
                        type="date" 
                        value={sppdDeparture}
                        onChange={(e) => setSppdDeparture(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TANGGAL KEMBALI</label>
                      <input 
                        type="date" 
                        value={sppdReturn}
                        onChange={(e) => setSppdReturn(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 15. SK KEPSEK */}
              {template === 'sk-kepsek' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">PERIHAL / TENTANG (SK SUBJECT)</label>
                    <input 
                      type="text" 
                      value={skSubject}
                      onChange={(e) => setSkSubject(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400">MENIMBANG (CONSIDERATIONS)</label>
                    <textarea 
                      rows={2}
                      value={skConsider}
                      onChange={(e) => setSkConsider(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400">MENGINGAT (REGULATIONS)</label>
                    <textarea 
                      rows={2}
                      value={skRemember}
                      onChange={(e) => setSkRemember(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400">MENETAPKAN (DECISIONS)</label>
                    <textarea 
                      rows={2}
                      value={skDecide}
                      onChange={(e) => setSkDecide(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 16. SPTJM */}
              {template === 'sptjm' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">NAMA PROGRAM / SUMBER PERTANGGUNGJAWABAN</label>
                    <input 
                      type="text" 
                      value={sptjmProgram}
                      onChange={(e) => setSptjmProgram(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">BUTIR PERNYATAAN / TANGGUNG JAWAB</label>
                    <textarea 
                      rows={5}
                      value={sptjmContent}
                      onChange={(e) => setSptjmContent(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 17. SKL (KELULUSAN) */}
              {template === 'ket-kelulusan' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TAHUN PELAJARAN</label>
                      <input 
                        type="text" 
                        value={sklSchoolYear}
                        onChange={(e) => setSklSchoolYear(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">STATUS KELULUSAN</label>
                      <select 
                        value={sklStatus}
                        onChange={(e) => setSklStatus(e.target.value)}
                        className="glass-input w-full text-xs py-1 bg-slate-900"
                      >
                        <option value="LULUS">LULUS</option>
                        <option value="TIDAK LULUS">TIDAK LULUS</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">NOMOR UJIAN</label>
                      <input 
                        type="text" 
                        value={sklExamNum}
                        onChange={(e) => setSklExamNum(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">NILAI RATA-RATA</label>
                      <input 
                        type="text" 
                        value={sklAverageGrade}
                        onChange={(e) => setSklAverageGrade(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 18. UNDANGAN KOMITE */}
              {template === 'undangan-komite' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">TANGGAL RAPAT KOMITE</label>
                      <input 
                        type="date" 
                        value={komiteMeetingDate}
                        onChange={(e) => setKomiteMeetingDate(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">WAKTU PERTEMUAN</label>
                      <input 
                        type="text" 
                        value={komiteMeetingTime}
                        onChange={(e) => setKomiteMeetingTime(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">TEMPAT PERTEMUAN</label>
                    <input 
                      type="text" 
                      value={komiteMeetingPlace}
                      onChange={(e) => setKomiteMeetingPlace(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">AGENDA UTAMA KOORDINASI KOMITE</label>
                    <textarea 
                      rows={3}
                      value={komiteMeetingAgenda}
                      onChange={(e) => setKomiteMeetingAgenda(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 19. REKOMENDASI PINDAH */}
              {template === 'rekomendasi-pindah' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">JENIS REKOMENDASI</label>
                      <select 
                        value={rekomendasiPindahType}
                        onChange={(e) => setRekomendasiPindahType(e.target.value)}
                        className="glass-input w-full text-xs py-1 bg-slate-900"
                      >
                        <option value="Pindah Masuk">Pindah Masuk</option>
                        <option value="Pindah Keluar">Pindah Keluar</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 font-semibold text-sky-400">SEKOLAH TUJUAN / ASAL</label>
                      <input 
                        type="text" 
                        value={rekomendasiPindahSchool}
                        onChange={(e) => setRekomendasiPindahSchool(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ALASAN MUTASI / REKOMENDASI</label>
                    <textarea 
                      rows={3}
                      value={rekomendasiPindahReason}
                      onChange={(e) => setRekomendasiPindahReason(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 20. PERNYATAAN PATUH */}
              {template === 'pernyataan-patuh' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">NAMA ORANG TUA / WALI</label>
                      <input 
                        type="text" 
                        value={patuhParentName}
                        onChange={(e) => setPatuhParentName(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400">PEKERJAAN ORANG TUA</label>
                      <input 
                        type="text" 
                        value={patuhParentJob}
                        onChange={(e) => setPatuhParentJob(e.target.value)}
                        className="glass-input w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">BUTIR-BUTIR PERNYATAAN KESANGGUPAN</label>
                    <textarea 
                      rows={4}
                      value={patuhPoints}
                      onChange={(e) => setPatuhPoints(e.target.value)}
                      className="glass-input w-full text-xs resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AKSI TOMBOL */}
        <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors text-sm">
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleCreateDraftAndPrint}
            className="px-5 py-2 rounded-lg text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-md flex items-center gap-2 text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            Cetak & Register Surat Keluar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
