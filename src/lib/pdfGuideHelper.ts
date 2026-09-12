import { jsPDF } from 'jspdf';
import { getSchoolConfig, drawPdfKopHeader } from './printHelper';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function generateFullUserManualPdf(): void {
  try {
    toast.loading('Menyusun Dokumen Panduan PDF Lengkap...', { id: 'pdf-manual' });
    const config = getSchoolConfig();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    const primaryColor = [30, 41, 59]; // Slate 800
    const accentColor = [79, 70, 229]; // Indigo 600
    const secondaryColor = [13, 148, 136]; // Teal 600
    const lightBg = [248, 250, 252]; // Slate 50

    const drawHeaderFooter = (pageNumber: number, totalPages: number, chapterTitle?: string) => {
      // Small running top header (skip on cover)
      if (pageNumber > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('SPEGA MAIL • Buku Panduan Lengkap Penggunaan Aplikasi', margin, 12);
        if (chapterTitle) {
          doc.text(chapterTitle, pageWidth - margin, 12, { align: 'right' });
        }
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, 14, pageWidth - margin, 14);

        // Running Footer
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('SMP Negeri 3 Kras - Kediri, Jawa Timur', margin, pageHeight - 10);
        doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }
    };

    // ==========================================
    // HALAMAN 1: COVER RESMI
    // ==========================================
    // Decorative Top Accent Bar
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 8, 'F');

    // School Kop Header (portrait = false)
    drawPdfKopHeader(doc, config, false);

    // Decorative divider box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, 60, contentWidth, 80, 4, 4, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, 60, contentWidth, 80, 4, 4, 'S');

    // Title inside box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text('PETUNJUK TEKNIS & STANDAR OPERASIONAL PROSEDUR', pageWidth / 2, 75, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('BUKU PANDUAN PENGGUNAAN', pageWidth / 2, 88, { align: 'center' });
    doc.text('APLIKASI SPEGA MAIL', pageWidth / 2, 97, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Sistem Informasi Persuratan, Penomoran Agenda Otomatis & Arsip Digital', pageWidth / 2, 108, { align: 'center' });
    doc.text('Dilengkapi Portal Mandiri Guru/Wali & Sistem Keamanan PIN Admin', pageWidth / 2, 114, { align: 'center' });

    // Features Badge Pills
    doc.setFillColor(224, 231, 255);
    doc.roundedRect((pageWidth / 2) - 60, 122, 120, 9, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202);
    doc.text('EDISI RESMI TAHUN 2025/2026 • VERSI SISTEM 3.0', pageWidth / 2, 127.5, { align: 'center' });

    // Meta Info Block
    let yCover = 155;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('INFORMASI DOKUMEN & LINGKUP PENGGUNA:', margin, yCover);
    
    yCover += 7;
    const coverDetails = [
      ['Instansi Penerbit', `: ${config.schoolName || 'SMP Negeri 3 Kras'}`],
      ['Penanggung Jawab', `: Kepala Sekolah & Koordinator Tata Usaha`],
      ['Sasaran Pengguna', `: 1. Petugas Tata Usaha & Kearsipan (Admin)`],
      ['', `  2. Bapak / Ibu Guru & Tenaga Kependidikan (Tendik)`],
      ['', `  3. Orang Tua / Wali Murid SMP Negeri 3 Kras`],
      ['Basis Teknologi', `: Web App PWA, IndexedDB Offline-First, Google Drive Sync`],
      ['Tanggal Terbit', `: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`]
    ];

    doc.setFontSize(9.5);
    coverDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(label, margin + 4, yCover);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(value, margin + 48, yCover);
      yCover += 6;
    });

    // Sign off box at bottom of cover
    const bottomCoverY = pageHeight - 38;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, bottomCoverY, pageWidth - margin, bottomCoverY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumen ini merupakan panduan resmi pengoperasian persuratan digital di lingkungan SMPN 3 Kras.', margin, bottomCoverY + 6);
    doc.text('Dilarang menggandakan untuk kepentingan komersial tanpa izin pihak sekolah.', margin, bottomCoverY + 11);

    // ==========================================
    // HALAMAN 2: DAFTAR ISI & ARSITEKTUR SISTEM
    // ==========================================
    doc.addPage();
    drawHeaderFooter(2, 6, 'Daftar Isi & Ikhtisar Sistem');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('DAFTAR ISI PANDUAN PENGGUNA', margin, 26);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, 29, margin + 50, 29);

    const toc = [
      { num: 'BAB I', title: 'GAMBARAN UMUM & ARSITEKTUR APLIKASI SPEGA MAIL', page: 'Halaman 2' },
      { num: 'BAB II', title: 'SISTEM KEAMANAN & PENGATURAN PIN ADMIN', page: 'Halaman 3' },
      { num: 'BAB III', title: 'PANDUAN OPERASIONAL PORTAL GURU & WALI MURID', page: 'Halaman 4' },
      { num: 'BAB IV', title: 'PANDUAN ADMIN TATA USAHA: REGISTER & AGENDA OTOMATIS', page: 'Halaman 5' },
      { num: 'BAB V', title: 'INTEGRASI CLOUD GOOGLE DRIVE, POSTER CANVA & FAQ', page: 'Halaman 6' }
    ];

    let yToc = 38;
    toc.forEach((item) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yToc, contentWidth, 12, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, yToc, contentWidth, 12, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text(item.num, margin + 4, yToc + 7.5);

      doc.setTextColor(30, 41, 59);
      doc.text(item.title, margin + 22, yToc + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(item.page, pageWidth - margin - 4, yToc + 7.5, { align: 'right' });

      yToc += 15;
    });

    // Section: BAB I
    let yBab1 = yToc + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('BAB I. GAMBARAN UMUM & ARSITEKTUR APLIKASI', margin, yBab1);

    yBab1 += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const bab1Text = [
      'Aplikasi SPEGA MAIL dirancang khusus sebagai solusi otomasi persuratan dan kearsipan terpadu untuk SMP Negeri 3 Kras. Aplikasi ini memiliki arsitektur ganda yang memisahkan antara Ruang Kerja Admin Tata Usaha dan Portal Layanan Mandiri Publik Guru/Wali Murid:',
      '',
      '1. Portal Mandiri Guru & Wali Murid (Layanan Cepat Tanpa Antre):',
      '   Guru dan wali murid dapat mengajukan draf surat tugas, cuti, surat keterangan siswa aktif, izin sakit, mutasi siswa, hingga dispensasi langsung dari ponsel atau komputer mereka. Pemohon memperoleh Bukti Surat Permohonan instan dalam format PDF resmi ber-KOP.',
      '',
      '2. Ruang Kerja Admin Tata Usaha & Kepala Sekolah:',
      '   Pusat kendali persuratan untuk menerbitkan Nomor Register Surat Dinas Resmi, verifikasi dan approval draf dari guru/wali murid, pembuatan disposisi pimpinan, pencetakan Buku Agenda Surat Masuk/Keluar, dan pengarsipan digital.',
      '',
      '3. Teknologi Offline-First & Keamanan Data:',
      '   Data tersimpan secara lokal dan aman di peramban menggunakan IndexedDB berkecepatan tinggi, sehingga aplikasi tetap dapat digunakan secara penuh bahkan saat internet sekolah sedang terputus.'
    ];

    bab1Text.forEach((p) => {
      if (p === '') {
        yBab1 += 3;
      } else {
        const splitText = doc.splitTextToSize(p, contentWidth);
        doc.text(splitText, margin, yBab1);
        yBab1 += (splitText.length * 4.6);
      }
    });

    // ==========================================
    // HALAMAN 3: SISTEM KEAMANAN & PIN ADMIN
    // ==========================================
    doc.addPage();
    drawHeaderFooter(3, 6, 'Bab II: Sistem Keamanan & PIN Admin');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('BAB II. SISTEM KEAMANAN & PENGATURAN PIN ADMIN', margin, 26);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, 29, margin + 60, 29);

    let yPin = 36;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const pinIntro = 'Untuk mempermudah dan mempercepat akses petugas Tata Usaha sekaligus melindungi data dinas dari pihak yang tidak berhak, aplikasi dilengkapi dengan fitur Kunci Akses PIN Admin khusus (4 - 6 digit angka).';
    const splitIntro = doc.splitTextToSize(pinIntro, contentWidth);
    doc.text(splitIntro, margin, yPin);
    yPin += (splitIntro.length * 5) + 3;

    // Highlight Box: Standar Bawaan
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, yPin, contentWidth, 20, 3, 3, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, yPin, contentWidth, 20, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(67, 56, 202);
    doc.text('INFORMASI PENTING - PIN BAWAAN PABRIK (DEFAULT):', margin + 5, yPin + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('• Nomor PIN Bawaan Sistem: 1234 (dapat diganti kapan saja oleh Admin)', margin + 5, yPin + 11);
    doc.text('• Username / Sandi Alternatif: admin / 123456', margin + 5, yPin + 16);
    yPin += 26;

    // Step by step guide to configure PIN in Settings
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('A. Cara Mengatur & Mengubah PIN di Pengaturan Admin:', margin, yPin);
    yPin += 6;

    const stepsSetting = [
      '1. Masuk ke Dasbor Admin menggunakan akun TU.',
      '2. Pada menu bilah samping (sidebar), klik "Konfigurasi Sistem" (ikon Gerigi).',
      '3. Pilih tab "Keamanan & PIN Admin" (ikon Perisai).',
      '4. Pada kartu "PIN Akses Khusus Portal Admin", pastikan tombol sakelar (toggle) dalam posisi AKTIF (berwarna biru).',
      '5. Ketikkan 4 sampai 6 digit angka baru pada kolom input PIN (misal: 7890).',
      '   • Anda juga dapat menekan tombol "Acak 4 Digit" untuk membuat PIN otomatis.',
      '   • Tekan ikon Mata untuk melihat atau menyembunyikan angka PIN yang dimasukkan.',
      '6. Klik tombol "Simpan Pengaturan PIN & Keamanan" di bagian bawah.',
      '7. Setelah disimpan, Anda dapat menguji kebenaran PIN dengan menekan tombol "Uji Coba PIN Sekarang".'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    stepsSetting.forEach(st => {
      const sp = doc.splitTextToSize(st, contentWidth);
      doc.text(sp, margin + 2, yPin);
      yPin += (sp.length * 4.8);
    });

    yPin += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('B. Dua Cara Menggunakan PIN untuk Masuk ke Dasbor Admin:', margin, yPin);
    yPin += 6;

    const accessWays = [
      '1. Langsung dari Portal Pengajuan Surat Guru & Wali:',
      '   Saat Anda sedang berada di halaman Portal Guru/Wali, cukup klik tombol "Portal Admin TU" berikon gembok emas di pojok kanan atas. Masukkan PIN Anda pada jendela pop-up keypad yang muncul, lalu tekan Enter atau tombol Masuk Dasbor.',
      '',
      '2. Dari Halaman Login Utama (/login):',
      '   Pilih tab "Petugas Tata Usaha", lalu pilih mode "PIN Cepat". Ketikkan 4-6 digit PIN Anda dan tekan Masuk. Anda tidak perlu lagi mengetik username dan kata sandi panjang.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    accessWays.forEach(aw => {
      if (aw === '') {
        yPin += 2;
      } else {
        const sp = doc.splitTextToSize(aw, contentWidth);
        doc.text(sp, margin + 2, yPin);
        yPin += (sp.length * 4.8);
      }
    });

    // ==========================================
    // HALAMAN 4: PANDUAN PORTAL GURU & WALI MURID
    // ==========================================
    doc.addPage();
    drawHeaderFooter(4, 6, 'Bab III: Panduan Portal Guru & Wali');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('BAB III. PANDUAN OPERASIONAL PORTAL GURU & WALI MURID', margin, 26);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, 29, margin + 65, 29);

    let yGuru = 36;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const guruIntro = 'Portal Guru & Wali Murid didesain dengan antarmuka yang modern, mudah dipahami, dan responsif di layar ponsel (HP). Pengguna tidak diwajibkan mendaftar akun rumit—cukup memasukkan Nama dan Nomor WhatsApp aktif.';
    const spGuruIntro = doc.splitTextToSize(guruIntro, contentWidth);
    doc.text(spGuruIntro, margin, yGuru);
    yGuru += (spGuruIntro.length * 5) + 3;

    // Table of Template Types
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('A. Pilihan Jenis Surat yang Tersedia di Portal:', margin, yGuru);
    yGuru += 6;

    // 2 Column boxes for Guru vs Wali
    const colW = (contentWidth - 6) / 2;

    // Guru Box
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(margin, yGuru, colW, 70, 3, 3, 'F');
    doc.setDrawColor(221, 214, 254);
    doc.roundedRect(margin, yGuru, colW, 70, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(109, 40, 217);
    doc.text('KATEGORI SURAT GURU / TENDIK:', margin + 4, yGuru + 7);

    const guruItems = [
      '• Surat Tugas Dinas / Pelatihan MGMP',
      '• Permohonan Izin Berhalangan Mengajar',
      '• Permohonan Cuti (Tahunan / Bersalin / Sakit)',
      '• Surat Tugas Pembina Lomba (OSN, O2SN, FLS2N)',
      '• Surat Pengantar Kunjungan / Field Trip',
      '• Draf Surat Permohonan Kustom / Fasilitas'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    let ygItem = yGuru + 14;
    guruItems.forEach(item => {
      doc.text(item, margin + 4, ygItem);
      ygItem += 8.5;
    });

    // Wali Box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin + colW + 6, yGuru, colW, 70, 3, 3, 'F');
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin + colW + 6, yGuru, colW, 70, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('KATEGORI SURAT WALI MURID:', margin + colW + 10, yGuru + 7);

    const waliItems = [
      '• Surat Keterangan Siswa Aktif Belajar',
      '  (Untuk BPJS, Tunjangan Gaji, PIP, Visa)',
      '• Surat Izin Sakit / Keperluan Keluarga',
      '• Permohonan Surat Pindah / Mutasi Keluar',
      '• Surat Keterangan Berkelakuan Baik',
      '• Permohonan Dispensasi Mengikuti Lomba',
      '• Surat Permohonan Orang Tua Kustom'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    let ywItem = yGuru + 14;
    waliItems.forEach(item => {
      doc.text(item, margin + colW + 10, ywItem);
      ywItem += 8.5;
    });

    yGuru += 78;

    // Steps to submit
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('B. Alur 3 Langkah Mengajukan Surat & Mendapatkan Hasil:', margin, yGuru);
    yGuru += 6;

    const submissionSteps = [
      'Langkah 1 - Pilih Jenis Surat: Klik salah satu kartu jenis surat yang sesuai dengan kebutuhan Anda.',
      'Langkah 2 - Lengkapi Rincian: Pilih nama guru atau ketikkan nama siswa/kelas. Sistem otomatis mengisi nomor agenda keluar baru secara berurutan agar siap dibukukan.',
      'Langkah 3 - Simpan & Unduh Dokumen: Tekan "Kirim Pengajuan & Cetak Bukti Permohonan". File PDF bukti pengajuan resmi ber-KOP dan bernomor registrasi langsung terunduh seketika.',
      'Langkah 4 - Pantau Status di Tab Riwayat: Di tab "Riwayat Draf Surat Saya", pemohon dapat memantau apakah draf berstatus "Menunggu Verifikasi TU" atau "Disetujui / Terbit Resmi".'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    submissionSteps.forEach(st => {
      const sp = doc.splitTextToSize(st, contentWidth);
      doc.text(sp, margin + 2, yGuru);
      yGuru += (sp.length * 4.8);
    });

    // ==========================================
    // HALAMAN 5: PANDUAN ADMIN TU & AGENDA OTOMATIS
    // ==========================================
    doc.addPage();
    drawHeaderFooter(5, 6, 'Bab IV: Panduan Admin TU & Agenda');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('BAB IV. PANDUAN ADMIN TU: REGISTER & BUKU AGENDA', margin, 26);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, 29, margin + 65, 29);

    let yAdmin = 36;

    const adminSections = [
      {
        title: 'A. Memproses & Menyetujui Draf dari Guru / Wali Murid',
        desc: [
          '1. Masuk ke Dasbor Admin menggunakan PIN atau Username.',
          '2. Klik menu "Register Surat" pada bilah navigasi.',
          '3. Surat yang diajukan dari portal mandiri ditandai dengan badge khusus berlabel "Draf Guru" atau "Draf Wali" berwarna kuning keemasan.',
          '4. Klik aksi "Verifikasi & Setujui": Admin dapat menyesuaikan format nomor resmi, memeriksa kelengkapan data, lalu mengklik "Sahkan Surat Dinas".',
          '5. Setelah disahkan, naskah resmi sekolah ber-QR Code validasi dapat dicetak langsung atau diunduh sebagai PDF / Dokumen Word (.doc).'
        ]
      },
      {
        title: 'B. Penomoran Agenda Otomatis & Klasifikasi Kode Kearsipan',
        desc: [
          'Sistem secara cerdas menghitung nomor agenda berurutan (misal: Agenda #001, #002, dst) dan menggabungkannya dengan kode klasifikasi standar dinas pendidikan.',
          '• Kode 421.2 : Kesiswaan (Siswa Aktif, Mutasi, Izin Siswa)',
          '• Kode 800 : Kepegawaian & Ketenagaan (Tugas Guru, Cuti, Izin Mengajar)',
          '• Kode 005 : Undangan Resmi / Rapat Komite Sekolah',
          '• Kode 045.2 : Kearsipan Umum & Tata Usaha',
          'Struktur format nomor resmi: 421.2 / [No_Agenda] / 101.6.21.23 / [Tahun]'
        ]
      },
      {
        title: 'C. Pencetakan Buku Agenda Surat Masuk & Keluar',
        desc: [
          '1. Masuk ke tab "Registrasi Agenda Surat" di Portal atau menu "Rekapitulasi & Agenda".',
          '2. Filter periode tahun registrasi yang diinginkan.',
          '3. Klik tombol "Cetak Buku Agenda Resmi": Sistem menghasilkan rekapitulasi tabel lengkap seluruh surat keluar/masuk ber-KOP dinas dan siap ditandatangani oleh Kepala Tata Usaha.'
        ]
      }
    ];

    adminSections.forEach(sec => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sec.title, margin, yAdmin);
      yAdmin += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      sec.desc.forEach(line => {
        const sp = doc.splitTextToSize(line, contentWidth);
        doc.text(sp, margin + 2, yAdmin);
        yAdmin += (sp.length * 4.6);
      });
      yAdmin += 4;
    });

    // ==========================================
    // HALAMAN 6: INTEGRASI DRIVE, CANVA & FAQ
    // ==========================================
    doc.addPage();
    drawHeaderFooter(6, 6, 'Bab V: Integrasi Cloud, Canva & FAQ');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('BAB V. INTEGRASI GOOGLE DRIVE, POSTER CANVA & FAQ', margin, 26);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, 29, margin + 65, 29);

    let yCloud = 36;

    const cloudSections = [
      {
        title: 'A. Sinkronisasi Berkas ke Google Drive Sekolah',
        desc: [
          '• Seluruh berkas PDF surat dinas yang telah disahkan dapat diarsipkan secara otomatis ke folder Google Drive resmi sekolah.',
          '• Buka menu "Konfigurasi Sistem" > tab "Google Drive".',
          '• Masukkan Link / ID Folder Google Drive arsip sekolah yang dituju.',
          '• Klik "Sinkronkan Dokumen": Berkas PDF akan terunggah secara otomatis ke cloud sebagai cadangan data jangka panjang.'
        ]
      },
      {
        title: 'B. Desain Poster Canva & Sosialisasi ke Guru / Wali',
        desc: [
          '• Agar dewan guru dan wali murid mengetahui adanya layanan pengajuan mandiri ini, sekolah dapat mencetak poster informasi ber-QR Code.',
          '• Klik tombol "Poster Canva" pada navigasi atas.',
          '• Salin teks panduan atau buka tautan template Canva yang disediakan untuk mendesain banner X-Banner, poster mading, maupun infografis WhatsApp sekolah.'
        ]
      },
      {
        title: 'C. Tanya Jawab (FAQ) & Solusi Kendala Teknis',
        desc: [
          'T: Apakah aplikasi membutuhkan koneksi internet untuk mengetik surat?',
          'J: Tidak. Sistem bekerja dengan prinsip Offline-First. Dokumen tetap dapat dibuat, dicetak, dan disimpan dalam keadaan tanpa internet.',
          '',
          'T: Bagaimana jika lupa PIN Admin?',
          'J: Anda tetap dapat masuk menggunakan Username dan Kata Sandi Akun Utama (bawaan: admin / 123456). Setelah masuk, ubah PIN di menu Konfigurasi Sistem > Keamanan & PIN Admin.',
          '',
          'T: Bagaimana cara mencadangkan (backup) seluruh data persuratan?',
          'J: Buka menu "Konfigurasi Sistem" > tab "Manajemen Data" > klik "Ekspor Cadangan Lengkap (.json)". Simpan file cadangan tersebut di komputer atau flashdisk.'
        ]
      }
    ];

    cloudSections.forEach(sec => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sec.title, margin, yCloud);
      yCloud += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      sec.desc.forEach(line => {
        if (line === '') {
          yCloud += 2;
        } else {
          const sp = doc.splitTextToSize(line, contentWidth);
          doc.text(sp, margin + 2, yCloud);
          yCloud += (sp.length * 4.6);
        }
      });
      yCloud += 3.5;
    });

    // Signature Block at Bottom
    const ySign = pageHeight - 38;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, ySign - 4, pageWidth - margin, ySign - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Kediri, ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, pageWidth - margin, ySign, { align: 'right' });
    doc.text('Ditetapkan oleh Pengelola Aplikasi Persuratan,', pageWidth - margin, ySign + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(config.adminName || 'Sekhudin, S.Pd.', pageWidth - margin, ySign + 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${config.adminNip || '197505122008011012'}`, pageWidth - margin, ySign + 23, { align: 'right' });

    // Download PDF file
    doc.save(`PANDUAN_LENGKAP_SPEGA_MAIL_SMPN3_KRAS.pdf`);
    toast.dismiss('pdf-manual');
    toast.success('Buku Panduan Lengkap SPEGA MAIL (PDF) berhasil diunduh!');
  } catch (error) {
    console.error(error);
    toast.dismiss('pdf-manual');
    toast.error('Gagal membuat buku panduan PDF');
  }
}
