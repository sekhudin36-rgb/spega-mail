import Dexie, { type EntityTable } from 'dexie';

export interface Teacher {
  id?: number;
  name: string;
  nip: string;
  subject: string;
  phone: string;
  email: string;
  createdAt: string;
  position?: string;
  birthPlace?: string;
  birthDate?: string;
  rankCategory?: string;
  rank?: string;
  functionalPosition?: string;
}

export interface Student {
  id?: number;
  name: string;
  nisn: string;
  grade: string;
  phone: string;
  email: string;
  createdAt: string;
  nis?: string;
  birthPlace?: string;
  birthDate?: string;
}

export interface Letter {
  id?: number;
  type: 'inbox' | 'outbox';
  referenceNumber: string;
  title: string;
  senderOrRecipient: string;
  date: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: string;
  indexData?: string;
  sequenceNumber?: string;
  code?: string;
  attachment?: string;
  documentDate?: string;
  addressedTo?: string;
  disposition?: string;
  category?: string;
  urgency?: string;
  securityStyle?: string;
  processingUnit?: string;
  receivedBy?: string;
  fileUrl?: string; // Base64 data URI or attachment URL
  fileName?: string;
  fileType?: string;
  isDraft?: boolean;
  templateType?: string;
  templatePayload?: string;
  // Google Drive Integration & Legalisir Ijazah Fields
  driveFileUrl?: string;
  driveFileId?: string;
  ijazahNumber?: string;
  graduationYear?: string;
  graduationDate?: string;
  birthPlaceDate?: string;
  parentName?: string;
  sheetCount?: number | string;
  // Fields for Teacher/Parent (Guru / Wali) submissions
  applicantName?: string;
  applicantPhone?: string;
  applicantRole?: 'guru' | 'wali' | 'siswa' | 'umum';
  source?: 'admin' | 'portal_guru_wali';
  submissionStatus?: 'pending_approval' | 'approved' | 'rejected';
  adminNotes?: string;
  isAgendaOnly?: boolean;
}

export interface Archive {
  id?: number;
  title: string;
  classificationCode?: string;
  category: string;
  referenceNumber?: string;
  date: string;
  developmentLevel?: string;
  amount?: string;
  condition?: string;
  storageLocation?: string;
  status?: string;
  description: string;
  fileData?: string; // base64
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

export interface SystemLog {
  id?: number;
  timestamp: string; // ISO string
  action: string;
  category: 'Persuratan' | 'Arsip' | 'Kepegawaian' | 'Kesiswaan' | 'Keamanan' | 'Sistem' | 'Laporan';
  level: 'info' | 'success' | 'warning' | 'error';
  user: string;
  details: string;
  ipAddress?: string;
  metadata?: string; // JSON string or text summary
}

const db = new Dexie('SekolahPersuratanDB') as Dexie & {
  teachers: EntityTable<Teacher, 'id'>;
  students: EntityTable<Student, 'id'>;
  letters: EntityTable<Letter, 'id'>;
  archives: EntityTable<Archive, 'id'>;
  systemLogs: EntityTable<SystemLog, 'id'>;
};

db.version(1).stores({
  teachers: '++id, name, nip, subject',
  students: '++id, name, nisn, grade',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status'
});

db.version(2).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt'
});

db.version(3).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt, indexData, sequenceNumber, code'
});

db.version(4).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt, indexData, sequenceNumber, code'
});

db.version(5).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt, indexData, sequenceNumber, code',
  archives: '++id, title, category, referenceNumber, date, createdAt'
});

db.version(6).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt, indexData, sequenceNumber, code',
  archives: '++id, title, classificationCode, category, referenceNumber, date, status, storageLocation, createdAt'
});

db.version(7).stores({
  teachers: '++id, name, nip, subject, createdAt',
  students: '++id, name, nisn, grade, createdAt',
  letters: '++id, type, referenceNumber, title, senderOrRecipient, date, status, createdAt, indexData, sequenceNumber, code',
  archives: '++id, title, classificationCode, category, referenceNumber, date, status, storageLocation, createdAt',
  systemLogs: '++id, timestamp, action, category, level, user'
});

db.on('populate', async () => {
  // Seed initial realistic SMP Negeri 3 Kras dataset
  await db.teachers.bulkAdd([
    {
      name: 'Drs. H. Ahmad Santoso, M.Pd.',
      nip: '196805141994031004',
      subject: 'Kepala Sekolah / Manajerial',
      position: 'Kepala Sekolah',
      rankCategory: 'Pembina Utama Muda, IV/c',
      rank: 'IV/c',
      functionalPosition: 'Guru Ahli Utama',
      phone: '081234567890',
      email: 'kasek.spega@gmail.com',
      createdAt: new Date().toISOString()
    },
    {
      name: 'Siti Aminah, S.Pd., M.Si.',
      nip: '197508212002122003',
      subject: 'Bahasa Indonesia / Waka Kurikulum',
      position: 'Waka Kurikulum',
      rankCategory: 'Pembina, IV/a',
      rank: 'IV/a',
      functionalPosition: 'Guru Ahli Madya',
      phone: '081398765432',
      email: 'siti.aminah@guru.smp.belajar.id',
      createdAt: new Date().toISOString()
    },
    {
      name: 'Khabibu Rohman, S.Kom.',
      nip: '198903122019031008',
      subject: 'Informatika / Admin Tata Usaha',
      position: 'Kepala Urusan Tata Usaha',
      rankCategory: 'Penata Muda Tk.I, III/b',
      rank: 'III/b',
      functionalPosition: 'Pranata Komputer / Tata Usaha',
      phone: '085712345678',
      email: 'sekhudin36@guru.smp.belajar.id',
      createdAt: new Date().toISOString()
    },
    {
      name: 'Budi Utomo, S.Pd.',
      nip: '198204192008011012',
      subject: 'Matematika / Pembina OSIS',
      position: 'Waka Kesiswaan',
      rankCategory: 'Penata Tk.I, III/d',
      rank: 'III/d',
      functionalPosition: 'Guru Ahli Muda',
      phone: '081287654321',
      email: 'budi.utomo@guru.smp.belajar.id',
      createdAt: new Date().toISOString()
    }
  ]);

  await db.students.bulkAdd([
    {
      name: 'Ahmad Faiz Al-Ghifari',
      nisn: '0089123456',
      nis: '4210',
      grade: '9A',
      phone: '082134567891',
      email: 'faiz.ghifari@siswa.smp.belajar.id',
      birthPlace: 'Kediri',
      birthDate: '2009-04-12',
      createdAt: new Date().toISOString()
    },
    {
      name: 'Zahra Putri Ramadhani',
      nisn: '0098765432',
      nis: '4211',
      grade: '9B',
      phone: '082245678902',
      email: 'zahra.ramadhani@siswa.smp.belajar.id',
      birthPlace: 'Kediri',
      birthDate: '2009-09-24',
      createdAt: new Date().toISOString()
    },
    {
      name: 'Rizky Pratama Wijaya',
      nisn: '0103456789',
      nis: '4450',
      grade: '8A',
      phone: '082356789013',
      email: 'rizky.pratama@siswa.smp.belajar.id',
      birthPlace: 'Kediri',
      birthDate: '2010-06-18',
      createdAt: new Date().toISOString()
    }
  ]);

  await db.letters.bulkAdd(INITIAL_LETTERS_DATA);
  await db.archives.bulkAdd(INITIAL_ARCHIVES_DATA);
  await db.systemLogs.bulkAdd(INITIAL_SYSTEM_LOGS_DATA);
});

export const COMMON_LETTER_CODES = [
  { code: '421.1', category: 'Kurikulum', name: 'Kurikulum, Pembelajaran & Asesmen (ANBK, KOSP)', unit: 'Kurikulum & Proktor' },
  { code: '421.2', category: 'Kesiswaan', name: 'Kesiswaan, Ekstrakurikuler, OSN & PPDB', unit: 'Kesiswaan & OSIS' },
  { code: '421.3', category: 'Sarana Prasarana', name: 'Sarana Prasarana & Laboratorium TIK', unit: 'Sarana Prasarana' },
  { code: '094', category: 'Persuratan (SK/Tugas)', name: 'Surat Tugas & Surat Perintah Tugas (SPT)', unit: 'Tata Usaha / GTK' },
  { code: '800', category: 'Kepegawaian', name: 'Kepegawaian, Mutasi, Kenaikan Pangkat & SKP', unit: 'Kepegawaian TU' },
  { code: '900', category: 'Keuangan', name: 'Keuangan Sekolah, Dana BOS & RKAS', unit: 'Bendahara BOS' },
  { code: '005', category: 'Undangan Resmi', name: 'Undangan Dinas, Rakor MKKS & Rapat', unit: 'Tata Usaha & Humas' },
  { code: '422', category: 'Persuratan (SK/Tugas)', name: 'Surat Keterangan & Rekomendasi Siswa', unit: 'Tata Usaha (TU)' },
  { code: '421.7', category: 'Lainnya', name: 'Kerjasama Lembaga, Kemitraan & MoU', unit: 'Humas & Kemitraan' },
  { code: '420', category: 'Laporan & Jurnal', name: 'Pendidikan & Kebudayaan Umum', unit: 'Tata Usaha (TU)' }
];

export const INITIAL_LETTERS_DATA: Omit<Letter, 'id'>[] = [
  {
    type: 'inbox',
    referenceNumber: '421.3/1208/418.20/2026',
    title: 'Undangan Koordinasi Asesmen Nasional Berbasis Komputer (ANBK) SMP TA 2026/2027',
    senderOrRecipient: 'Dinas Pendidikan Kabupaten Kediri',
    date: '2026-08-10',
    documentDate: '2026-08-08',
    description: 'Menghadiri rapat persiapan teknis, verifikasi kesiapan server, dan sinkronisasi data simulasi ANBK SMP se-Kabupaten Kediri.',
    status: 'active',
    indexData: '01/IN/VIII/2026',
    sequenceNumber: '001',
    code: '421.3',
    category: 'Kurikulum',
    urgency: 'Segera',
    securityStyle: 'Biasa',
    processingUnit: 'Kurikulum & Proktor',
    receivedBy: 'Khabibu Rohman, S.Kom',
    addressedTo: 'Waka Kurikulum & Tim Proktor TIK',
    disposition: 'Tugaskan proktor dan teknisi untuk hadir serta lakukan pengecekan 35 unit chromebook di laboratorium komputer.',
    attachment: '1 Berkas Jadwal & Juknis',
    createdAt: '2026-08-10T08:30:00.000Z'
  },
  {
    type: 'inbox',
    referenceNumber: '800/1542/418.20/2026',
    title: 'Surat Edaran Penyesuaian Pengisian Sasaran Kinerja Pegawai (E-Kinerja BKN) Triwulan III',
    senderOrRecipient: 'Bidang Ketenagaan Dinas Pendidikan Kab. Kediri',
    date: '2026-08-12',
    documentDate: '2026-08-11',
    description: 'Instruksi pengunggahan bukti dukung RHK dan penilaian berkala periode Triwulan III bagi seluruh ASN PNS dan PPPK.',
    status: 'active',
    indexData: '02/IN/VIII/2026',
    sequenceNumber: '002',
    code: '800',
    category: 'Kepegawaian',
    urgency: 'Biasa',
    securityStyle: 'Biasa',
    processingUnit: 'Kepegawaian TU',
    receivedBy: 'Rahmawati, S.Kom',
    addressedTo: 'Seluruh Pendidik dan Tenaga Kependidikan',
    disposition: 'Sosialisasikan pada rapat dinas bulanan dan dampingi pengisian bukti dukung bagi bapak/ibu guru.',
    attachment: '1 Berkas Panduan Penilaian',
    createdAt: '2026-08-12T09:15:00.000Z'
  },
  {
    type: 'inbox',
    referenceNumber: '440/320/Pusk.Kras/VIII/2026',
    title: 'Pemberitahuan Pelaksanaan Skrining Kesehatan Berkala & Imunisasi HPV/Td Siswa',
    senderOrRecipient: 'UPTD Puskesmas Kras Kabupaten Kediri',
    date: '2026-08-14',
    documentDate: '2026-08-13',
    description: 'Jadwal kunjungan tim medis Puskesmas Kras untuk pemeriksaan kesehatan mata, gigi, telinga, dan pemberian imunisasi bagi peserta didik kelas 7 & 8.',
    status: 'active',
    indexData: '03/IN/VIII/2026',
    sequenceNumber: '003',
    code: '421.2',
    category: 'Kesiswaan',
    urgency: 'Biasa',
    securityStyle: 'Biasa',
    processingUnit: 'UKS & Kesiswaan',
    receivedBy: 'Khabibu Rohman, S.Kom',
    addressedTo: 'Pembina UKS & Waka Kesiswaan',
    disposition: 'Siapkan ruang UKS dan atur jadwal giliran per kelas agar KBM tetap berlangsung kondusif.',
    attachment: '1 Lembar Surat Izin Ortu',
    createdAt: '2026-08-14T10:00:00.000Z'
  },
  {
    type: 'inbox',
    referenceNumber: '005/214/MKKS.SMP/VIII/2026',
    title: 'Undangan Rapat Koordinasi MKKS SMP Negeri Se-Wilayah Selatan Kabupaten Kediri',
    senderOrRecipient: 'Musyawarah Kerja Kepala Sekolah (MKKS) SMP Kediri',
    date: '2026-08-16',
    documentDate: '2026-08-15',
    description: 'Pembahasan sinkronisasi program Kurikulum Merdeka, evaluasi Rapor Pendidikan, dan persiapan asesmen sumatif tengah semester.',
    status: 'active',
    indexData: '04/IN/VIII/2026',
    sequenceNumber: '004',
    code: '005',
    category: 'Undangan Resmi',
    urgency: 'Penting',
    securityStyle: 'Biasa',
    processingUnit: 'Kepala Sekolah & TU',
    receivedBy: 'Rahmawati, S.Kom',
    addressedTo: 'Kepala SMPN 3 Kras',
    disposition: 'Diagendakan untuk hadir dan siapkan berkas laporan evaluasi mutu sekolah.',
    attachment: '1 Lembar Susunan Acara',
    createdAt: '2026-08-16T11:00:00.000Z'
  },
  {
    type: 'inbox',
    referenceNumber: '421.2/098/Kec.Kras/2026',
    title: 'Permohonan Partisipasi Petugas Paskibra & Aubade Peringatan HUT Proklamasi Kemerdekaan RI Ke-81',
    senderOrRecipient: 'Panitia Peringatan Hari Besar Nasional (PHBN) Kecamatan Kras',
    date: '2026-08-16',
    documentDate: '2026-08-14',
    description: 'Permohonan pengiriman 1 peleton paduan suara (aubade) dan 10 orang petugas pengibar bendera pada upacara detik-detik proklamasi di Lapangan Kecamatan Kras.',
    status: 'active',
    indexData: '05/IN/VIII/2026',
    sequenceNumber: '005',
    code: '421.2',
    category: 'Kesiswaan',
    urgency: 'Sangat Segera',
    securityStyle: 'Biasa',
    processingUnit: 'Pembina OSIS & Kesiswaan',
    receivedBy: 'Khabibu Rohman, S.Kom',
    addressedTo: 'Waka Kesiswaan & Pembina Seni Musik',
    disposition: 'Segera lakukan seleksi siswa aubade dan koordinasikan latihan intensif bersama instruktur kecamatan.',
    attachment: '1 Berkas Ketentuan Busana & Rundown',
    createdAt: '2026-08-16T13:30:00.000Z'
  },
  {
    type: 'inbox',
    referenceNumber: '070/445/Bakesbangpol/2026',
    title: 'Surat Rekomendasi Izin Penelitian Skripsi Mahasiswa Universitas Negeri Malang',
    senderOrRecipient: 'Badan Kesatuan Bangsa dan Politik Kabupaten Kediri',
    date: '2026-08-18',
    documentDate: '2026-08-16',
    description: 'Rekomendasi izin penelitian bidang pendidikan IPA berjudul "Implementasi Model Pembelajaran Berbasis Proyek (PjBL) terhadap Literasi Sains Peserta Didik".',
    status: 'active',
    indexData: '06/IN/VIII/2026',
    sequenceNumber: '006',
    code: '422',
    category: 'Kurikulum',
    urgency: 'Biasa',
    securityStyle: 'Biasa',
    processingUnit: 'Waka Kurikulum & Guru IPA',
    receivedBy: 'Rahmawati, S.Kom',
    addressedTo: 'Waka Kurikulum & MGMP IPA Sekolah',
    disposition: 'Fasilitasi mahasiswa bersangkutan untuk observasi dan wawancara tanpa mengganggu efektivitas jam belajar utama.',
    attachment: '1 Berkas Proposal & Surat Pengantar Kampus',
    createdAt: '2026-08-18T08:00:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '421.2/085/SMPN3/VIII/2026',
    title: 'Undangan Rapat Pleno Komite & Sosialisasi Program Sekolah TP 2026/2027',
    senderOrRecipient: 'Seluruh Wali Murid Kelas 7, 8, dan 9 SMPN 3 Kras',
    date: '2026-08-15',
    documentDate: '2026-08-15',
    description: 'Penyampaian rencana program kerja sekolah, pembinaan karakter profil pelajar Pancasila, dan sosialisasi kalender pendidikan semester ganjil.',
    status: 'active',
    indexData: '01/OUT/VIII/2026',
    sequenceNumber: '001',
    code: '421.2',
    category: 'Undangan Resmi',
    urgency: 'Penting',
    securityStyle: 'Biasa',
    processingUnit: 'Tata Usaha & Humas',
    receivedBy: 'Pengurus Komite & Wali Murid',
    addressedTo: 'Orang Tua / Wali Murid',
    attachment: '1 Lembar Rincian Agenda',
    createdAt: '2026-08-15T08:30:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '094/086/SMPN3/VIII/2026',
    title: 'Surat Perintah Tugas (SPT) Pembina Olimpiade Sains Nasional (OSN) Tingkat Kabupaten',
    senderOrRecipient: 'Budi Utomo, S.Pd. & Tim Pembimbing OSN',
    date: '2026-08-17',
    documentDate: '2026-08-17',
    description: 'Menugaskan guru pembimbing untuk mendampingi kontingen siswa SMPN 3 Kras dalam ajang OSN bidang Matematika, IPA, dan IPS tingkat Kabupaten Kediri.',
    status: 'active',
    indexData: '02/OUT/VIII/2026',
    sequenceNumber: '002',
    code: '094',
    category: 'Persuratan (SK/Tugas)',
    urgency: 'Segera',
    securityStyle: 'Biasa',
    processingUnit: 'Kesiswaan',
    receivedBy: 'Budi Utomo, S.Pd.',
    addressedTo: 'Guru Pembina Terlampir',
    attachment: '1 Lembar Daftar Siswa Peserta',
    createdAt: '2026-08-17T09:00:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '421.1/087/SMPN3/VIII/2026',
    title: 'Laporan Kesiapan Infrastruktur ANBK & Data Nominasi Peserta (DNP) SMPN 3 Kras',
    senderOrRecipient: 'Kepala Bidang Pembinaan SMP Dinas Pendidikan Kabupaten Kediri',
    date: '2026-08-18',
    documentDate: '2026-08-18',
    description: 'Penyampaian berita acara verifikasi jaringan internet 100 Mbps, 35 unit chromebook klien, 2 server cadangan, dan daftar 45 peserta utama serta 5 peserta cadangan.',
    status: 'active',
    indexData: '03/OUT/VIII/2026',
    sequenceNumber: '003',
    code: '421.1',
    category: 'Kurikulum',
    urgency: 'Segera',
    securityStyle: 'Biasa',
    processingUnit: 'Kurikulum & Proktor',
    receivedBy: 'Petugas Subbag Perencanaan Disdik',
    addressedTo: 'Kadisdik Kab. Kediri',
    attachment: '1 Berkas Berita Acara & SPT',
    createdAt: '2026-08-18T10:30:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '422.1/088/SMPN3/VIII/2026',
    title: 'Surat Keterangan Aktif Sekolah atas nama Zahra Putri Ramadhani (NISN: 0098765432)',
    senderOrRecipient: 'Orang Tua Peserta Didik / Bank Penyalur PIP',
    date: '2026-08-19',
    documentDate: '2026-08-19',
    description: 'Keterangan resmi bahwa siswa bersangkutan tercatat aktif pada Kelas 9B Semester Ganjil TP 2026/2027 untuk keperluan pencairan Program Indonesia Pintar (PIP).',
    status: 'active',
    indexData: '04/OUT/VIII/2026',
    sequenceNumber: '004',
    code: '422',
    category: 'Persuratan (SK/Tugas)',
    urgency: 'Biasa',
    securityStyle: 'Biasa',
    processingUnit: 'Tata Usaha (TU)',
    receivedBy: 'Zahra Putri Ramadhani',
    addressedTo: 'Kepala Unit BRI Cabang Kras',
    attachment: '1 Lembar Kartu Pelajar',
    createdAt: '2026-08-19T11:00:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '800/089/SMPN3/VIII/2026',
    title: 'Usulan Kenaikan Pangkat Pilihan Periode Oktober 2026 Tenaga Pendidik SMPN 3 Kras',
    senderOrRecipient: 'Kepala Dinas Pendidikan Kabupaten Kediri',
    date: '2026-08-19',
    documentDate: '2026-08-19',
    description: 'Penyampaian berkas usulan kenaikan pangkat PNS atas nama Siti Aminah, S.Pd., M.Si. dari Pembina IV/a ke Pembina Tk.I IV/b lengkap dengan SKP dan PAK Integrasi.',
    status: 'active',
    indexData: '05/OUT/VIII/2026',
    sequenceNumber: '005',
    code: '800',
    category: 'Kepegawaian',
    urgency: 'Biasa',
    securityStyle: 'Terbatas',
    processingUnit: 'Kepegawaian TU',
    receivedBy: 'Subbag Ketenagaan Disdik',
    addressedTo: 'Kepala BKD & Disdik Kab. Kediri',
    attachment: '1 Bundel Dokumen Portofolio GTK',
    createdAt: '2026-08-19T14:00:00.000Z'
  },
  {
    type: 'outbox',
    referenceNumber: '900/092/SMPN3/VIII/2026',
    title: 'Surat Penyampaian Laporan Realisasi Penggunaan Dana BOS Reguler Tahap 1 Tahun 2026',
    senderOrRecipient: 'Tim Manajemen BOS Dinas Pendidikan Kabupaten Kediri',
    date: '2026-08-19',
    documentDate: '2026-08-19',
    description: 'Laporan pertanggungjawaban realisasi penyerapan anggaran belanja BOS sebesar Rp 184.200.000 melalui aplikasi ARKAS terintegrasi.',
    status: 'active',
    indexData: '06/OUT/VIII/2026',
    sequenceNumber: '006',
    code: '900',
    category: 'Keuangan',
    urgency: 'Biasa',
    securityStyle: 'Biasa',
    processingUnit: 'Bendahara BOS & TU',
    receivedBy: 'Tim Verifikator BOS Disdik',
    addressedTo: 'Tim Manajemen BOS Disdik',
    attachment: '1 Bundel SPJ & Rekonsiliasi Bank',
    createdAt: '2026-08-19T15:30:00.000Z'
  }
];

export const INITIAL_ARCHIVES_DATA: Omit<Archive, 'id'>[] = [
  {
    title: 'Surat Keputusan (SK) Pembagian Tugas Mengajar, Bimbingan & Tugas Tambahan GTK TP 2026/2027',
    classificationCode: '800/SK-01/SMPN3/2026',
    category: 'SK Kepala Sekolah',
    referenceNumber: '800/012/SMPN3/2026',
    date: '2026-07-15',
    developmentLevel: 'Asli',
    amount: '1 Berkas (16 Halaman)',
    condition: 'Sangat Baik',
    storageLocation: 'Lemari Arsip TU - Rak 01 / Box SK-2026',
    status: 'Aktif',
    description: 'Dokumen legal penetapan beban jam mengajar mingguan guru, penetapan wali kelas 7A-9D, pembina ekstrakurikuler, koordinator P5, dan pengelola laboratorium.',
    createdAt: '2026-07-15T08:00:00.000Z'
  },
  {
    title: 'Laporan Pertanggungjawaban (LPJ) Bantuan Operasional Sekolah (BOS) Tahap 1 TA 2026',
    classificationCode: '900/BOS-01/SMPN3/2026',
    category: 'Laporan Keuangan',
    referenceNumber: '900/045/BOS/2026',
    date: '2026-06-30',
    developmentLevel: 'Salinan / Tervalidasi',
    amount: '1 Bundel (85 Halaman)',
    condition: 'Sangat Baik',
    storageLocation: 'Brankas Dokumen Keuangan / Box BOS-2026',
    status: 'Aktif',
    description: 'Rekapitulasi SPJ belanja modal chromebook, pemeliharaan sanitasi dan gedung, langganan daya & jasa, serta operasional pembelajaran semester genap.',
    createdAt: '2026-06-30T10:00:00.000Z'
  },
  {
    title: 'Dokumen Kurikulum Operasional Satuan Pendidikan (KOSP) Merdeka TP 2026/2027',
    classificationCode: '421.1/KOSP/SMPN3/2026',
    category: 'Kurikulum',
    referenceNumber: '421.1/005/KOSP/2026',
    date: '2026-07-10',
    developmentLevel: 'Asli Disahkan',
    amount: '1 Jilid Buku (142 Halaman)',
    condition: 'Sangat Baik',
    storageLocation: 'Ruang Kurikulum / Lemari KOSP Rak A-02',
    status: 'Aktif',
    description: 'Pedoman kurikulum merdeka SMPN 3 Kras yang disahkan oleh Kepala Dinas Pendidikan Kab. Kediri, memuat visi misi, pengorganisasian pembelajaran, dan modul P5.',
    createdAt: '2026-07-10T09:00:00.000Z'
  },
  {
    title: 'Buku Induk Register Pokok Peserta Didik (BIPPD) Angkatan Tahun Ajaran 2024-2026',
    classificationCode: '421.2/BI-09/SMPN3/2026',
    category: 'Kesiswaan',
    referenceNumber: '421.2/BI/SMPN3/2026',
    date: '2026-07-01',
    developmentLevel: 'Asli Register Tulisan & Cetak',
    amount: '2 Jilid Buku Tebal',
    condition: 'Baik & Terawat',
    storageLocation: 'Lemari Kesiswaan - Rak 03 / Box Induk-IX',
    status: 'Permanen',
    description: 'Data riwayat lengkap biodata siswa, orang tua, riwayat kesehatan, mutasi, dan pencapaian akademik angkatan kelas IX lengkap dengan pas foto.',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    title: 'Kartu Inventaris Barang (KIB B) Peralatan dan Mesin / Sarana TIK Laboratorium Komputer',
    classificationCode: '028/KIB-B/SMPN3/2026',
    category: 'Aset & Inventaris',
    referenceNumber: '028/018/ASET/2026',
    date: '2026-05-20',
    developmentLevel: 'Asli',
    amount: '1 Berkas (24 Lembar)',
    condition: 'Sangat Baik',
    storageLocation: 'Ruang Pengelola Aset / Rak Sarpras B-01',
    status: 'Aktif',
    description: 'Catatan register barcode BMN/BMD untuk 40 unit laptop Chromebook, 4 unit router mikrotik, 2 proyektor LCD, dan AC split laboratorium TIK.',
    createdAt: '2026-05-20T11:00:00.000Z'
  },
  {
    title: 'Naskah Perjanjian Kerjasama (MoU) Program UKS & Kesehatan Remaja dengan UPTD Puskesmas Kras',
    classificationCode: '421.7/MOU-01/SMPN3/2026',
    category: 'Persuratan (SK/Tugas)',
    referenceNumber: '421.7/003/MOU/2026',
    date: '2026-01-12',
    developmentLevel: 'Asli Bermaterai',
    amount: '1 Berkas (8 Halaman)',
    condition: 'Sangat Baik',
    storageLocation: 'Lemari Arsip Kerjasama / Box MoU-2026',
    status: 'Aktif',
    description: 'Perjanjian kemitraan resmi mengenai pelayanan posyandu remaja sekolah, penyuluhan gizi seimbang, pemberian tablet tambah darah (TTD), dan pembinaan dokter kecil.',
    createdAt: '2026-01-12T10:00:00.000Z'
  },
  {
    title: 'Berkas Laporan Penilaian Kinerja Guru (PKG) & Sasaran Kinerja Pegawai (SKP) GTK Tahun 2025',
    classificationCode: '800/PKG-2025/SMPN3',
    category: 'Kepegawaian',
    referenceNumber: '800/104/PKG/2025',
    date: '2025-12-30',
    developmentLevel: 'Salinan Legalisir',
    amount: '1 Bundel (38 Berkas GTK)',
    condition: 'Baik',
    storageLocation: 'Lemari Kepegawaian - Rak 02 / Box PKG-2025',
    status: 'Inaktif',
    description: 'Instrumen evaluasi kinerja tahunan seluruh guru mapel, guru BK, dan tenaga administrasi sekolah beserta rekomendasi pengembangan keprofesian berkelanjutan (PKB).',
    createdAt: '2025-12-30T14:00:00.000Z'
  },
  {
    title: 'Berita Acara Serah Terima & Register Pengambilan Ijazah / SKHUN Lulusan TP 2024/2025',
    classificationCode: '421.2/IJZ-2025/SMPN3',
    category: 'Kesiswaan',
    referenceNumber: '421.2/077/BA-IJZ/2025',
    date: '2025-07-28',
    developmentLevel: 'Asli Bertandatangan & Cap 3 Jari',
    amount: '1 Berkas (36 Lembar)',
    condition: 'Sangat Baik',
    storageLocation: 'Brankas Dokumen Kelulusan TU',
    status: 'Permanen',
    description: 'Daftar penyerahan blangko ijazah asli SMP tahun 2025 yang telah ditandatangani siswa dan wali murid sebagai dokumen pertanggungjawaban dinas.',
    createdAt: '2025-07-28T09:00:00.000Z'
  },
  {
    title: 'Sertifikat Akreditasi Sekolah Nilai A (Unggul) dari Badan Akreditasi Nasional (BAN-PDM)',
    classificationCode: '421.9/AKRED/SMPN3',
    category: 'Sertifikat / Piagam',
    referenceNumber: '145/BAN-PDM/SK/2024',
    date: '2024-11-15',
    developmentLevel: 'Asli Bersegel',
    amount: '1 Piagam Pigura & 1 Dokumen Rekomendasi',
    condition: 'Sangat Baik',
    storageLocation: 'Lemari Kaca Ruang Kepala Sekolah',
    status: 'Permanen',
    description: 'Sertifikat pengakuan mutu kelayakan satuan pendidikan jenjang SMP dari BAN-PDM dengan perolehan skor 94 (Predikat A Unggul) masa berlaku 5 tahun.',
    createdAt: '2024-11-15T10:00:00.000Z'
  },
  {
    title: 'Laporan Rekapitulasi Rapor Pendidikan dan Perencanaan Berbasis Data (PBD) Tahun 2026',
    classificationCode: '421.1/EVAL-01/SMPN3/2026',
    category: 'Laporan & Jurnal',
    referenceNumber: '421.1/044/PBD/2026',
    date: '2026-03-25',
    developmentLevel: 'Asli',
    amount: '1 Berkas (48 Halaman)',
    condition: 'Sangat Baik',
    storageLocation: 'Lemari Penjaminan Mutu Sekolah - Rak 01',
    status: 'Aktif',
    description: 'Analisis capaian literasi, numerasi, iklim keamanan sekolah, dan iklim kebinekaan bersumber dari Asesmen Nasional sebagai dasar penyusunan RKT/RKAS.',
    createdAt: '2026-03-25T11:30:00.000Z'
  },
  {
    title: 'Kumpulan Sertifikat & Piagam Penghargaan Prestasi OSN & FLS2N Siswa SMPN 3 Kras',
    classificationCode: '421.2/PREST-2026/SMPN3',
    category: 'Sertifikat / Piagam',
    referenceNumber: '421.2/021/PIAGAM/2026',
    date: '2026-08-05',
    developmentLevel: 'Asli & Portofolio Siswa',
    amount: '1 Album Portofolio Prestasi',
    condition: 'Sangat Baik',
    storageLocation: 'Lemari Display Prestasi Siswa TU',
    status: 'Aktif',
    description: 'Koleksi sertifikat kejuaraan Juara 1 Olimpiade Matematika dan Juara 2 Tari Kreasi Tradisional tingkat Kabupaten Kediri yang diraih kontingen SMPN 3 Kras.',
    createdAt: '2026-08-05T09:00:00.000Z'
  }
];

export const INITIAL_SYSTEM_LOGS_DATA: Omit<SystemLog, 'id'>[] = [
  {
    timestamp: '2026-08-31T08:00:15.000Z',
    action: 'INIT_SYSTEM',
    category: 'Sistem',
    level: 'info',
    user: 'Sistem Otomatis',
    details: 'Inisialisasi engine basis data lokal Dexie IndexedDB (SekolahPersuratanDB v3.0) berhasil dijalankan.',
    ipAddress: '127.0.0.1 (Localhost)',
    metadata: JSON.stringify({ version: '3.0.0', db: 'Dexie IndexedDB', status: 'Ready' })
  },
  {
    timestamp: '2026-08-31T08:02:40.000Z',
    action: 'LOGIN_ADMIN',
    category: 'Keamanan',
    level: 'success',
    user: 'Admin TU (Khabibu Rohman, S.Kom.)',
    details: 'Autentikasi admin Tata Usaha berhasil. Sesi kerja lokal dimulai.',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ role: 'admin', client: 'Desktop Chrome / PWA' })
  },
  {
    timestamp: '2026-08-31T08:15:22.000Z',
    action: 'REGISTER_SURAT_MASUK',
    category: 'Persuratan',
    level: 'success',
    user: 'Admin TU',
    details: 'Mencatat Surat Masuk dari Dinas Pendidikan Kab. Kediri: "Undangan Koordinasi ANBK SMP TA 2026/2027" (No: 421.3/1208/418.20/2026).',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ refNum: '421.3/1208/418.20/2026', type: 'inbox', code: '421.3' })
  },
  {
    timestamp: '2026-08-31T08:45:10.000Z',
    action: 'DISPOSISI_SURAT',
    category: 'Persuratan',
    level: 'info',
    user: 'Drs. H. Ahmad Santoso, M.Pd.',
    details: 'Menambahkan instruksi disposisi Kepala Sekolah kepada Waka Kurikulum & Tim Proktor TIK.',
    ipAddress: '192.168.1.12 (Kepala Sekolah Device)',
    metadata: JSON.stringify({ letterId: 1, addressedTo: 'Waka Kurikulum & Tim Proktor TIK' })
  },
  {
    timestamp: '2026-08-31T09:10:05.000Z',
    action: 'BUAT_DRAF_SURAT_TUGAS',
    category: 'Persuratan',
    level: 'success',
    user: 'Admin TU',
    details: 'Menghasilkan draf Surat Perintah Tugas untuk Budi Utomo, S.Pd. (Pendampingan Olimpiade Sains Nasional).',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ template: 'guru_tugas', recipient: 'Budi Utomo, S.Pd.' })
  },
  {
    timestamp: '2026-08-31T09:30:18.000Z',
    action: 'CETAK_DOKUMEN_RESMI',
    category: 'Laporan',
    level: 'info',
    user: 'Admin TU',
    details: 'Mencetak Naskah Dinas Surat Perintah Tugas lengkap dengan QR Code Verifikasi Keaslian.',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ format: 'PDF / Cetak Langsung', qrVerification: true })
  },
  {
    timestamp: '2026-08-31T10:05:00.000Z',
    action: 'ARSIP_DIGITAL',
    category: 'Arsip',
    level: 'success',
    user: 'Admin TU',
    details: 'Menyimpan berkas arsip SK Pembagian Tugas GTK TP 2026/2027 ke Lemari Arsip TU (Rak 01 / Box SK-2026).',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ archiveCode: '800/SK-01/SMPN3/2026', status: 'Aktif' })
  },
  {
    timestamp: '2026-08-31T10:40:12.000Z',
    action: 'PORTAL_PERMOHONAN',
    category: 'Persuratan',
    level: 'info',
    user: 'Wali Murid (Zahra Putri)',
    details: 'Permohonan Surat Keterangan Siswa Aktif diajukan melalui Portal Guru & Wali Mandiri.',
    ipAddress: '180.252.88.14 (Mobile Client)',
    metadata: JSON.stringify({ applicant: 'Zahra Putri Ramadhani', purpose: 'Pencairan PIP' })
  },
  {
    timestamp: '2026-08-31T11:00:30.000Z',
    action: 'VERIFIKASI_PERMOHONAN',
    category: 'Persuratan',
    level: 'success',
    user: 'Admin TU',
    details: 'Menyetujui dan menerbitkan Surat Keterangan Siswa Aktif No: 422.1/088/SMPN3/VIII/2026.',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ status: 'approved', refNum: '422.1/088/SMPN3/VIII/2026' })
  },
  {
    timestamp: '2026-08-31T11:45:50.000Z',
    action: 'CADANGAN_BASISDATA',
    category: 'Sistem',
    level: 'success',
    user: 'Admin TU',
    details: 'Ekspor cadangan basis data lokal (Backup JSON) berhasil diunduh.',
    ipAddress: '192.168.1.45 (Workstation TU)',
    metadata: JSON.stringify({ recordsCount: 42, integrityCheck: 'Passed' })
  }
];

/**
 * Add a new activity log entry to Dexie systemLogs
 */
export async function addSystemLog(log: {
  action: string;
  category: 'Persuratan' | 'Arsip' | 'Kepegawaian' | 'Kesiswaan' | 'Keamanan' | 'Sistem' | 'Laporan';
  level?: 'info' | 'success' | 'warning' | 'error';
  user?: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any> | string;
  timestamp?: string;
}): Promise<number | undefined> {
  try {
    const defaultUser = localStorage.getItem('adminName') || 'Admin TU';
    const metadataStr = typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : log.metadata;

    const id = await db.systemLogs.add({
      timestamp: log.timestamp || new Date().toISOString(),
      action: log.action,
      category: log.category,
      level: log.level || 'info',
      user: log.user || defaultUser,
      details: log.details,
      ipAddress: log.ipAddress || '192.168.1.45 (Klien Lokal)',
      metadata: metadataStr
    });
    return id;
  } catch (e) {
    console.warn('Gagal mencatat log sistem:', e);
    return undefined;
  }
}

/**
 * Seeds or enriches the database with the complete authentic school datasets.
 * If overwrite is false, only adds records whose reference numbers don't exist yet.
 */
export async function seedCompleteSchoolData(overwrite = false): Promise<{ lettersCount: number; archivesCount: number; logsCount: number }> {
  let lettersToAdd = INITIAL_LETTERS_DATA;
  let archivesToAdd = INITIAL_ARCHIVES_DATA;

  if (overwrite) {
    await db.letters.clear();
    await db.archives.clear();
    await db.systemLogs.clear();
    await db.letters.bulkAdd(INITIAL_LETTERS_DATA);
    await db.archives.bulkAdd(INITIAL_ARCHIVES_DATA);
    await db.systemLogs.bulkAdd(INITIAL_SYSTEM_LOGS_DATA);
    return { 
      lettersCount: INITIAL_LETTERS_DATA.length, 
      archivesCount: INITIAL_ARCHIVES_DATA.length,
      logsCount: INITIAL_SYSTEM_LOGS_DATA.length 
    };
  }

  const existingLetters = await db.letters.toArray();
  const existingLetterRefs = new Set(existingLetters.map(l => l.referenceNumber));
  lettersToAdd = INITIAL_LETTERS_DATA.filter(l => !existingLetterRefs.has(l.referenceNumber));

  if (lettersToAdd.length > 0) {
    await db.letters.bulkAdd(lettersToAdd);
  }

  const existingArchives = await db.archives.toArray();
  const existingArchiveTitles = new Set(existingArchives.map(a => a.title));
  archivesToAdd = INITIAL_ARCHIVES_DATA.filter(a => !existingArchiveTitles.has(a.title));

  if (archivesToAdd.length > 0) {
    await db.archives.bulkAdd(archivesToAdd);
  }

  const existingLogs = await db.systemLogs.count();
  if (existingLogs === 0) {
    await db.systemLogs.bulkAdd(INITIAL_SYSTEM_LOGS_DATA);
  }

  return { 
    lettersCount: lettersToAdd.length, 
    archivesCount: archivesToAdd.length,
    logsCount: await db.systemLogs.count() 
  };
}

export { db };
