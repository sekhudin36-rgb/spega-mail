import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Letter, Archive, Teacher } from './db';
import QRCode from 'qrcode';

/**
 * Built-in high-fidelity SVG Preset Logos
 * Left Logo: Lambang Resmi Pemerintah Kabupaten Kediri
 * Right Logo: Lambang Tut Wuri Handayani / Dinas Pendidikan
 */
export const DEFAULT_LEFT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115" width="100" height="115">
  <defs>
    <linearGradient id="shield_sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="mountain_grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#14532d" />
    </linearGradient>
    <linearGradient id="red_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
  </defs>

  <!-- Outer Shield Outline -->
  <path d="M50,4 C84,4 94,18 94,54 C94,82 72,102 50,111 C28,102 6,82 6,54 C6,18 16,4 50,4 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
  
  <!-- Golden Border Layer -->
  <path d="M50,7 C81,7 90,19 90,53 C90,79 70,98 50,107 C30,98 10,79 10,53 C10,19 19,7 50,7 Z" fill="url(#gold_grad)" stroke="#ca8a04" stroke-width="1.2" />

  <!-- Inner Blue Shield (Sky) -->
  <path d="M50,11 C77,11 85,21 85,52 C85,76 67,94 50,102 C33,94 15,76 15,52 C15,21 23,11 50,11 Z" fill="url(#shield_sky)" stroke="#0369a1" stroke-width="0.8" />

  <!-- Bintang Segi Lima Emas (Five-Pointed Star) -->
  <polygon points="50,14 53,22 62,22 55,27 58,36 50,31 42,36 45,27 38,22 47,22" fill="url(#gold_grad)" stroke="#854d0e" stroke-width="0.7" />

  <!-- Gunung Kelud (Green Mountain Peaks) -->
  <path d="M22,65 Q36,38 50,42 Q64,38 78,65 Q50,70 22,65 Z" fill="url(#mountain_grad)" stroke="#166534" stroke-width="1" />
  <path d="M35,62 Q43,46 50,47 Q57,46 65,62 Q50,66 35,62 Z" fill="#22c55e" opacity="0.4" />

  <!-- Monumen Simpang Lima Gumul / Keris Candi Silhouette -->
  <path d="M44,72 L47,56 L53,56 L56,72 Z" fill="url(#gold_grad)" stroke="#854d0e" stroke-width="0.8" />
  <rect x="42" y="70" width="16" height="4" fill="#ca8a04" stroke="#854d0e" stroke-width="0.6" rx="1" />

  <!-- Padi (Kiri - Yellow) -->
  <path d="M22,74 C18,60 22,44 32,32" fill="none" stroke="#eab308" stroke-width="3" stroke-linecap="round" stroke-dasharray="2,2.5" />
  <path d="M24,73 C20,60 24,46 33,35" fill="none" stroke="#ca8a04" stroke-width="1.2" />

  <!-- Kapas (Kanan - White) -->
  <path d="M78,74 C82,60 78,44 68,32" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="3,3" />
  <path d="M76,73 C80,60 76,46 67,35" fill="none" stroke="#15803d" stroke-width="1.2" />

  <!-- Lower Red & White Base Shield -->
  <path d="M24,78 Q50,72 76,78 C73,88 62,96 50,100 C38,96 27,88 24,78 Z" fill="url(#red_grad)" stroke="#991b1b" stroke-width="1" />
  <path d="M29,80 Q50,75 71,80 C69,87 60,93 50,96 C40,93 31,87 29,80 Z" fill="#ffffff" opacity="0.9" />

  <!-- Pita Kuning Semboyan / Bawah -->
  <path d="M20,86 Q50,81 80,86 L76,93 Q50,88 24,93 Z" fill="url(#gold_grad)" stroke="#a16207" stroke-width="0.8" />
  <text x="50" y="91" font-family="'Times New Roman', serif" font-size="4.2" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="0.4">KEDIRI</text>
</svg>
`)}`;

export const DEFAULT_RIGHT_LOGO = '';

export interface SchoolConfig {
  schoolName: string;
  schoolKop: string;
  address: string;
  phone?: string;
  email?: string;
  headmaster: string;
  headmasterNip: string;
  adminName: string;
  adminNip: string;
  leftLogo?: string;   // Logo Pemerintah Kabupaten Kediri (Kiri)
  rightLogo?: string;  // Logo Tambahan (Opsional)
  showKopLogos?: boolean;
}

export function getSchoolConfig(): SchoolConfig {
  const savedAdmin = localStorage.getItem('adminName');
  const normalizedAdmin = (!savedAdmin || savedAdmin.toLowerCase().includes('sekhudin')) ? 'Admin TU' : savedAdmin;

  // Retrieve logos with fallback to official default preset (Lambang Kabupaten Kediri)
  const leftLogo = localStorage.getItem('leftLogo') || localStorage.getItem('schoolLogoLeft') || localStorage.getItem('schoolLogo') || DEFAULT_LEFT_LOGO;
  const rightLogo = localStorage.getItem('rightLogo') || localStorage.getItem('schoolLogoRight') || '';
  const showKopLogos = localStorage.getItem('showKopLogos') !== 'false';

  return {
    schoolName: localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS',
    schoolKop: localStorage.getItem('schoolKop') || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN',
    address: localStorage.getItem('address') || localStorage.getItem('schoolAddress') || 'Jalan Doko, Desa Mojosari, Kecamatan Kras, Kabupaten Kediri 64172',
    phone: localStorage.getItem('phone') || '085100004614',
    email: localStorage.getItem('email') || 'smpn3kras@gmail.com',
    headmaster: localStorage.getItem('headmaster') || 'FARIDA, S.Pd.',
    headmasterNip: localStorage.getItem('headmasterNip') || '19720325 199703 2 002',
    adminName: normalizedAdmin,
    adminNip: localStorage.getItem('adminNip') || '19900202 201502 2 002',
    leftLogo,
    rightLogo,
    showKopLogos
  };
}

export interface HeadmasterInfo {
  name: string;
  nip: string;
  rank: string;
  title: string;
  position: string;
}

/**
 * Retrieve Headmaster details dynamically from Data Dewan Guru (db.teachers)
 */
export function getHeadmasterDetails(teachersList?: Teacher[] | any[], cfg?: SchoolConfig): HeadmasterInfo {
  const config = cfg || getSchoolConfig();
  
  if (teachersList && teachersList.length > 0) {
    const found = teachersList.find((t: any) => {
      const pos = (t.position || '').toLowerCase();
      const subj = (t.subject || '').toLowerCase();
      return pos.includes('kepala sekolah') || pos.includes('plt') || subj.includes('kepala sekolah');
    });

    if (found) {
      const isPlt = (found.position || '').toLowerCase().includes('plt');
      return {
        name: found.name || config.headmaster,
        nip: found.nip || config.headmasterNip || '',
        rank: found.rankCategory || found.rank || 'Pembina Utama Muda',
        title: isPlt ? 'Plt. Kepala SMP Negeri 3 Kras,' : 'Kepala SMP Negeri 3 Kras,',
        position: found.position || (isPlt ? 'Plt. Kepala Sekolah' : 'Kepala Sekolah')
      };
    }
  }

  // Fallback to config
  return {
    name: config.headmaster || 'FARIDA, S.Pd.',
    nip: config.headmasterNip || '19720325 199703 2 002',
    rank: 'Pembina Utama Muda',
    title: 'Plt. Kepala SMP Negeri 3 Kras,',
    position: 'Plt. Kepala Sekolah'
  };
}

/**
 * Render official Indonesian School Letterhead / Kop Dinas matching official SMP Negeri 3 Kras Kediri template
 */
export function renderOfficialKopHTML(config: SchoolConfig, isLandscape = true): string {
  const leftLogo = config.leftLogo || DEFAULT_LEFT_LOGO;
  const logoH = isLandscape ? '68px' : '64px';
  const logoW = isLandscape ? '65px' : '60px';

  return `
    <div class="kop-container" style="border-bottom: 3.5px double #000000; padding-bottom: 6px; margin-bottom: 14px; position: relative; width: 100%;">
      <table style="width: 100%; border: none !important; border-collapse: collapse; margin: 0; background: transparent;">
        <tr style="border: none !important; background: transparent;">
          <td style="width: 75px; text-align: center; vertical-align: middle; border: none !important; padding: 0 8px 0 0;">
            <img src="${leftLogo}" alt="Logo Pemerintah Kabupaten Kediri" style="max-height: ${logoH}; max-width: ${logoW}; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto;" />
          </td>
          
          <td style="text-align: center; vertical-align: middle; border: none !important; padding: 0 4px;">
            <div style="font-family: 'Times New Roman', Times, serif; color: #000000;">
              <div style="font-size: ${isLandscape ? '11.5pt' : '11pt'}; font-weight: bold; line-height: 1.2; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">PEMERINTAH KABUPATEN KEDIRI</div>
              <div style="font-size: ${isLandscape ? '12pt' : '11.5pt'}; font-weight: bold; line-height: 1.2; letter-spacing: 0.5px; text-transform: uppercase; margin: 1px 0 0 0;">DINAS PENDIDIKAN</div>
              <div style="font-size: ${isLandscape ? '14.5pt' : '13.5pt'}; font-weight: bold; letter-spacing: 0.8px; text-transform: uppercase; margin: 2px 0 3px 0; line-height: 1.15;">SMP NEGERI 3 KRAS</div>
              <div style="font-size: 8.5pt; font-weight: normal; line-height: 1.25; color: #000000;">
                Jalan Doko, Desa Mojosari, Kecamatan Kras, Kabupaten Kediri 64172
              </div>
              <div style="font-size: 8.5pt; font-weight: normal; line-height: 1.25; color: #000000;">
                Telepon 085100004614 Pos-el <span style="text-decoration: underline; color: #0000ee;">smpn3kras@gmail.com</span>
              </div>
              <div style="font-size: 8.5pt; font-weight: normal; line-height: 1.25; color: #000000;">
                Laman: smpntigakras.blogspot.co.id
              </div>
            </div>
          </td>
          <td style="width: 10px; border: none !important; padding: 0;"></td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Render official dual signatures: Mengetahui Kepala Sekolah (Left) & Petugas Persuratan (Right)
 */
export function renderOfficialSignaturesHTML(
  config: SchoolConfig,
  todayStr: string,
  leftRole = 'Kepala Sekolah',
  rightRole = 'Petugas Persuratan',
  teachersList?: Teacher[]
): string {
  const headmaster = getHeadmasterDetails(teachersList, config);
  return `
    <table style="width: 100%; border: none !important; margin-top: 30px; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; page-break-inside: avoid; border-collapse: collapse;">
      <tr style="border: none !important;">
        <td style="width: 45%; text-align: center; border: none !important; vertical-align: top; padding: 0;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold; margin-top: 2px;">${headmaster.title.replace(/,$/, '') || leftRole}</div>
          <div style="height: 55px;"></div>
          <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">${headmaster.name}</div>
          <div style="font-size: 8.5pt; color: #333;">${headmaster.rank}</div>
          <div style="font-size: 9pt; color: #111;">NIP. ${headmaster.nip}</div>
        </td>
        <td style="width: 10%; border: none !important; padding: 0;"></td>
        <td style="width: 45%; text-align: center; border: none !important; vertical-align: top; padding: 0;">
          <div>Kediri, ${todayStr}</div>
          <div style="font-weight: bold; margin-top: 2px;">${rightRole}</div>
          <div style="height: 55px;"></div>
          <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">${config.adminName}</div>
          <div style="font-size: 9pt; color: #111;">NIP. ${config.adminNip}</div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Robust print helper utilizing a hidden iframe to prevent popup blocks and 
 * avoid printing dark-theme app containers or UI sidebars.
 */
export function printHTMLContent(
  htmlContent: string, 
  documentTitle = 'Dokumen Cetak',
  orientation: 'landscape' | 'portrait' | 'auto' = 'landscape'
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Remove any existing print iframe
      const oldFrame = document.getElementById('spegamail-print-frame');
      if (oldFrame) {
        oldFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'spegamail-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        throw new Error('Tidak dapat mengakses frame cetak');
      }

      const pageSizeRule = orientation === 'portrait'
        ? 'size: A4 portrait; margin: 12mm 15mm;'
        : 'size: A4 landscape; margin: 10mm 12mm;';

      const fullHTML = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${documentTitle}</title>
          <style>
            @page {
              ${pageSizeRule}
            }
            @media print {
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; break-after: page; }
              .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            }
            body {
              background: #ffffff;
              color: #000000;
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              font-size: 9.5pt;
              line-height: 1.35;
              margin: 0;
              padding: 10px;
            }
            * { box-sizing: border-box; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000000; padding: 4px 6px; }
            .kop-container { text-align: center; border-bottom: 3.5px double #000000; padding-bottom: 8px; margin-bottom: 12px; }
            .kop-instansi { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .kop-sekolah { font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; letter-spacing: 0.5px; }
            .kop-alamat { font-size: 8.5pt; margin: 0; font-weight: normal; }
            .doc-title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 8px 0 2px 0; }
            .doc-subtitle { text-align: center; font-size: 9pt; margin: 0 0 10px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: "Courier New", Courier, monospace; }
            .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; text-align: center; line-height: 10px; font-size: 9px; font-weight: bold; margin-right: 4px; vertical-align: middle; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      frameDoc.open();
      frameDoc.write(fullHTML);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (printErr) {
          console.warn('Iframe print failed, attempting popup window fallback', printErr);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(fullHTML);
            win.document.close();
            setTimeout(() => {
              win.focus();
              win.print();
              resolve(true);
            }, 300);
          } else {
            resolve(false);
          }
        }
      }, 400);
    } catch (e) {
      console.error('Error saat mencetak:', e);
      resolve(false);
    }
  });
}

/**
 * Generates HTML string for official Lembar Disposisi (Full A4 or 2-up per A4)
 */
export function generateDisposisiHTML(letter: Letter, cfg?: SchoolConfig): string {
  const config = cfg || getSchoolConfig();
  const kopLines = config.schoolKop.toUpperCase().split('\n').filter(Boolean);
  const docDateStr = letter.documentDate ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) : '-';
  const recvDateStr = format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });

  const addressed = (letter.addressedTo || '').toLowerCase();
  const dispositionText = (letter.disposition || '').toLowerCase();

  const officers = [
    { name: 'Kepala Tata Usaha (Kaur TU)', matches: ['tu', 'tata usaha', 'kepala tu', 'kaur tu'] },
    { name: 'Waka Urusan Kurikulum', matches: ['kurikulum', 'waka kurikulum'] },
    { name: 'Waka Urusan Kesiswaan', matches: ['kesiswaan', 'waka kesiswaan'] },
    { name: 'Waka Urusan Sarana & Prasarana', matches: ['sarpras', 'waka sarpras', 'sarana'] },
    { name: 'Waka Urusan Humas', matches: ['humas', 'waka humas'] },
    { name: 'Bendahara Sekolah', matches: ['bendahara', 'keuangan'] },
    { name: 'Guru BK / Pembina OSIS', matches: ['bk', 'bimbingan konseling', 'osis', 'pembina'] }
  ];

  const workflows = [
    { name: 'Tanggapan & Saran / Pertimbangan', matches: ['tanggapan', 'saran', 'pendapat'] },
    { name: 'Proses Lebih Lanjut / Selesaikan Sesuai Ketentuan', matches: ['laksana', 'jalankan', 'proses', 'tindak', 'selesaikan'] },
    { name: 'Koordinasikan / Rapatkan Bersama', matches: ['koordinasi', 'rapat', 'bicarakan'] },
    { name: 'Hadiri / Wakili / Jadwalkan Kegiatan', matches: ['hadir', 'wakili', 'jadwal', 'ikuti'] },
    { name: 'Siapkan Bahan / Buat Konsep Jawaban (Balasan)', matches: ['jawab', 'balas', 'surati', 'konsep', 'bahan'] },
    { name: 'Simpan / Arsipkan (File TU)', matches: ['arsip', 'simpan', 'file'] }
  ];

  const renderSingleDisposisi = (copyLabel: string, showDottedBorder = true) => `
    <div style="padding: 4px 0; ${showDottedBorder ? 'border-bottom: 2px dashed #888; margin-bottom: 12px; padding-bottom: 12px;' : ''}" class="avoid-break">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #444; margin-bottom: 4px; font-weight: 500;">
        <span>SISTEM INFORMASI PERSURATAN RESMI</span>
        <span style="border: 1px solid #777; padding: 1px 6px; border-radius: 2px; font-weight: bold; background: #fafafa;">${copyLabel}</span>
      </div>

      <!-- KOP RESMI DUAL LOGO SEKOLAH & DINAS -->
      ${renderOfficialKopHTML(config, false)}

      <!-- JUDUL LEMBAR DISPOSISI -->
      <div style="text-align: center; margin: 4px 0 10px 0;">
        <div style="font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif;">
          LEMBAR DISPOSISI
        </div>
        <div style="font-size: 8pt; color: #333; margin-top: 1px; font-style: italic;">
          Buku Agenda Registrasi Surat Masuk & Lembar Instruksi Pimpinan
        </div>
      </div>

      <!-- TABEL IDENTITAS SURAT -->
      <table style="font-size: 8.5pt; width: 100%; border: 1.5px solid #000; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
          <td style="width: 52%; vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">SURAT DARI / ASAL SURAT:</div>
            <div style="font-weight: bold; font-size: 9.5pt; color: #000; margin-top: 2px;">${letter.senderOrRecipient || '-'}</div>
          </td>
          <td style="width: 24%; vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">NO. AGENDA / URUT:</div>
            <div style="font-family: monospace; font-weight: bold; font-size: 10pt; color: #000; margin-top: 2px;">${letter.sequenceNumber || '-'}</div>
          </td>
          <td style="width: 24%; vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">TANGGAL TERIMA:</div>
            <div style="font-size: 9pt; font-weight: bold; color: #000; margin-top: 2px;">${recvDateStr}</div>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">NOMOR SURAT:</div>
            <div style="font-family: monospace; font-weight: bold; font-size: 9pt; color: #000; margin-top: 2px;">${letter.referenceNumber || '-'}</div>
          </td>
          <td style="vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">TANGGAL SURAT:</div>
            <div style="font-size: 8.5pt; color: #000; margin-top: 2px;">${docDateStr}</div>
          </td>
          <td style="vertical-align: top; border: 1px solid #000; padding: 4px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">KODE KLASIFIKASI:</div>
            <div style="font-family: monospace; font-weight: bold; font-size: 9pt; color: #000; margin-top: 2px;">${letter.code || letter.indexData || '421.3'}</div>
          </td>
        </tr>

        <tr>
          <td colspan="3" style="vertical-align: top; background-color: #fcfcfc; border: 1px solid #000; padding: 5px 6px;">
            <div style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">PERIHAL / ISI RINGKAS SURAT:</div>
            <div style="font-weight: bold; font-size: 9.5pt; color: #000; margin-top: 2px; line-height: 1.35;">${letter.title || '-'}</div>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: middle; border: 1px solid #000; padding: 4px 6px;">
            <span style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">SIFAT SURAT:</span>
            <span style="margin-left: 6px; font-size: 8pt;">
              <span class="checkbox-box">${(letter.securityStyle || 'Biasa') === 'Biasa' ? '✓' : ''}</span> Biasa &nbsp;
              <span class="checkbox-box">${letter.securityStyle === 'Terbatas' || letter.securityStyle === 'Penting' ? '✓' : ''}</span> Terbatas / Penting &nbsp;
              <span class="checkbox-box">${letter.securityStyle === 'Rahasia' ? '✓' : ''}</span> Rahasia
            </span>
          </td>
          <td colspan="2" style="vertical-align: middle; border: 1px solid #000; padding: 4px 6px;">
            <span style="font-size: 7pt; font-weight: bold; color: #333; text-transform: uppercase;">KECEPATAN / LAMPIRAN:</span>
            <span style="margin-left: 6px; font-size: 8pt;">
              <span class="checkbox-box">${(letter.urgency || 'Biasa') === 'Biasa' ? '✓' : ''}</span> Biasa &nbsp;
              <span class="checkbox-box">${letter.urgency === 'Segera' ? '✓' : ''}</span> Segera &nbsp;
              <span class="checkbox-box">${(letter.urgency === 'Sangat Segera' || letter.urgency === 'Sgt Segera' || letter.urgency === 'Kilat') ? '✓' : ''}</span> Sangat Segera
            </span>
          </td>
        </tr>

        <!-- DISPOSISI & INSTRUKSI DUA KOLOM -->
        <tr>
          <td style="width: 50%; vertical-align: top; border: 1px solid #000; padding: 6px;">
            <div style="font-weight: bold; font-size: 8pt; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 5px; text-transform: uppercase;">
              DITERUSKAN KEPADA SDR:
            </div>
            <div style="display: flex; flex-direction: column; gap: 3.5px; font-size: 8pt;">
              ${officers.map(off => `
                <div style="display: flex; align-items: center; gap: 5px;">
                  <span class="checkbox-box">${off.matches.some(m => addressed.includes(m)) ? '✓' : ''}</span>
                  <span>${off.name}</span>
                </div>
              `).join('')}
              <div style="margin-top: 4px; font-size: 7.5pt; font-style: italic; border-top: 1px dotted #ccc; padding-top: 3px;">
                Lainnya: ${letter.addressedTo && !officers.some(o => o.matches.some(m => addressed.includes(m))) 
                  ? `<b style="font-style: normal;">${letter.addressedTo}</b>` 
                  : '..................................................................'}
              </div>
            </div>
          </td>

          <td colspan="2" style="width: 50%; vertical-align: top; border: 1px solid #000; padding: 6px;">
            <div style="font-weight: bold; font-size: 8pt; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 5px; text-transform: uppercase;">
              PETUNJUK / DISPOSISI KEPALA SEKOLAH:
            </div>
            <div style="display: flex; flex-direction: column; gap: 3.5px; font-size: 8pt;">
              ${workflows.map(wf => `
                <div style="display: flex; align-items: center; gap: 5px;">
                  <span class="checkbox-box">${wf.matches.some(m => dispositionText.includes(m)) ? '✓' : ''}</span>
                  <span>${wf.name}</span>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 6px; border: 1px dashed #666; padding: 5px; font-size: 7.5pt; background: #fafafa; border-radius: 2px;">
              <span style="font-weight: bold; text-transform: uppercase; color: #333;">Catatan / Instruksi Khusus:</span>
              <div style="min-height: 28px; font-size: 8.5pt; color: #000; margin-top: 2px; line-height: 1.35;">
                ${letter.disposition ? `<b>${letter.disposition}</b>` : '<span style="color: #666;">........................................................................................................<br/>........................................................................................................</span>'}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- TANDA TANGAN / PENGESAHAN DUA BELAH PIHAK -->
      <table style="width: 100%; border: none !important; margin-top: 8px; font-size: 8.5pt; font-family: Arial, sans-serif; page-break-inside: avoid; border-collapse: collapse;">
        <tr style="border: none !important;">
          <td style="width: 50%; text-align: center; border: none !important; vertical-align: top; padding: 0 8px;">
            <div>Mengetahui,</div>
            <div style="font-weight: bold; margin-top: 1px;">Kepala Sekolah</div>
            <div style="height: 42px;"></div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 9pt;">${config.headmaster}</div>
            <div style="font-size: 8pt; color: #222;">NIP. ${config.headmasterNip}</div>
          </td>
          <td style="width: 50%; text-align: center; border: none !important; vertical-align: top; padding: 0 8px;">
            <div>Kediri, ${todayStr}</div>
            <div style="font-weight: bold; margin-top: 1px;">Pengelola Administrasi / Persuratan</div>
            <div style="height: 42px;"></div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 9pt;">${config.adminName}</div>
            <div style="font-size: 8pt; color: #222;">NIP. ${config.adminNip}</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  return `
    <div style="width: 100%; background: #ffffff; color: #000000;">
      ${renderSingleDisposisi('Lembar 1 (Untuk Unit Pengolah / Pelaksana)', true)}
      ${renderSingleDisposisi('Lembar 2 (Untuk Penata Arsip Dinamis / Tata Usaha)', false)}
    </div>
  `;
}

/**
 * Generates HTML string for official Kartu Kendali 3-ply
 */
export function generateKartuKendaliHTML(letter: Letter, cfg?: SchoolConfig): string {
  const config = cfg || getSchoolConfig();
  const kopLines = config.schoolKop.toUpperCase().split('\n').filter(Boolean);
  const docDateStr = letter.documentDate ? format(new Date(letter.documentDate), 'dd MMM yyyy', { locale: id }) : '-';
  const actionDateStr = format(new Date(letter.date), 'dd MMM yyyy', { locale: id });

  const copies = [
    { label: 'Lembar 1 (Putih) - Untuk Unit Pengolah', colorBg: '#ffffff', tag: 'UNIT PENGOLAH' },
    { label: 'Lembar 2 (Kuning) - Untuk Penata Arsip / TU', colorBg: '#ffffff', tag: 'PENATA ARSIP TU' },
    { label: 'Lembar 3 (Merah Muda) - Untuk Unit Pengirim / Ekspedisi', colorBg: '#ffffff', tag: 'EKSPEDISI PENCATAT' }
  ];

  return `
    <div style="width: 100%; background: #ffffff; color: #000000;">
      ${copies.map((copy, idx) => `
        <div style="padding: 4px 0; ${idx < 2 ? 'border-bottom: 2px dashed #888; margin-bottom: 14px; padding-bottom: 12px;' : ''}" class="avoid-break">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #444; margin-bottom: 2px;">
            <span style="font-weight: 500;">POLA KEARSIPAN DINAMIS INDONESIA</span>
            <span style="border: 1px solid #777; padding: 1px 6px; font-weight: bold; background: #fafafa; border-radius: 2px;">${copy.label}</span>
          </div>
          
          <!-- KOP SURAT RESMI DUAL LOGO -->
          ${renderOfficialKopHTML(config, false)}

          <div style="text-align: center; margin: 2px 0 6px 0;">
            <span style="font-size: 10pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; font-family: 'Times New Roman', Times, serif;">
              KARTU KENDALI SURAT ${letter.type === 'inbox' ? 'MASUK' : 'KELUAR'}
            </span>
          </div>

          <table style="font-size: 8pt; width: 100%; border: 1.5px solid #000; border-collapse: collapse;">
            <tr>
              <td style="width: 36%; vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">INDEKS / POKOK MASALAH:</div>
                <div style="font-weight: bold; font-size: 8.5pt; color: #000;">${letter.indexData || letter.category || 'Persuratan Dinas'}</div>
              </td>
              <td style="width: 34%; vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">KODE KLASIFIKASI:</div>
                <div style="font-family: monospace; font-weight: bold; font-size: 9pt; color: #000;">${letter.code || '421.3'}</div>
              </td>
              <td style="width: 30%; vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">NO. URUT / AGENDA:</div>
                <div style="font-family: monospace; font-weight: bold; font-size: 9pt; color: #000;">${letter.sequenceNumber || '-'}</div>
              </td>
            </tr>

            <tr>
              <td colspan="3" style="vertical-align: top; background-color: #fafafa; border: 1px solid #000; padding: 4px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">ISI RINGKAS / PERIHAL:</div>
                <div style="font-weight: bold; font-size: 8.5pt; color: #000; line-height: 1.3;">${letter.title || '-'}</div>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">
                  ${letter.type === 'inbox' ? 'SURAT DARI (PENGIRIM):' : 'KEPADA YTH. (TUJUAN SURAT):'}
                </div>
                <div style="font-weight: bold; font-size: 8.5pt; color: #000;">${letter.senderOrRecipient || '-'}</div>
              </td>
              <td style="vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">NOMOR & TGL SURAT:</div>
                <div style="font-size: 8pt; color: #000;"><b>${letter.referenceNumber || '-'}</b><br/>Tgl: ${docDateStr}</div>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: middle; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">SIFAT KEAMANAN:</div>
                <div style="margin-top: 1px;">
                  <span class="checkbox-box">${(letter.securityStyle || 'Biasa') === 'Biasa' ? '✓' : ''}</span> Biasa &nbsp;
                  <span class="checkbox-box">${letter.securityStyle === 'Terbatas' || letter.securityStyle === 'Penting' ? '✓' : ''}</span> Terbatas &nbsp;
                  <span class="checkbox-box">${letter.securityStyle === 'Rahasia' ? '✓' : ''}</span> Rahasia
                </div>
              </td>
              <td colspan="2" style="vertical-align: middle; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">TINGKAT KECEPATAN / LAMPIRAN:</div>
                <div style="margin-top: 1px;">
                  <span class="checkbox-box">${(letter.urgency || 'Biasa') === 'Biasa' ? '✓' : ''}</span> Biasa &nbsp;
                  <span class="checkbox-box">${letter.urgency === 'Segera' ? '✓' : ''}</span> Segera &nbsp;
                  <span class="checkbox-box">${(letter.urgency === 'Sangat Segera' || letter.urgency === 'Sgt Segera' || letter.urgency === 'Kilat') ? '✓' : ''}</span> Sangat Segera
                  &nbsp;•&nbsp; <b>Lamp:</b> ${letter.attachment || '-'}
                </div>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">UNIT PENGOLAH:</div>
                <div style="font-size: 8pt; font-weight: bold;">${letter.processingUnit || letter.addressedTo || 'Tata Usaha (TU)'}</div>
              </td>
              <td colspan="2" style="vertical-align: top; border: 1px solid #000; padding: 3px 5px;">
                <div style="font-size: 6.5pt; font-weight: bold; color: #444; text-transform: uppercase;">
                  ${letter.type === 'inbox' ? 'TGL DITERUSKAN / PENERIMA:' : 'TGL PENCATATAN / PENGELOLA:'}
                </div>
                <div style="font-size: 8pt;">${actionDateStr} &nbsp;•&nbsp; Penerima: <b>${letter.receivedBy || config.adminName}</b></div>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border: none !important; margin-top: 5px; font-size: 7.5pt; border-collapse: collapse;">
            <tr style="border: none !important;">
              <td style="width: 50%; text-align: center; border: none !important; vertical-align: top;">
                <div>Penerima / Unit Pengolah,</div>
                <div style="height: 26px;"></div>
                <div>( .................................................... )</div>
              </td>
              <td style="width: 50%; text-align: center; border: none !important; vertical-align: top;">
                <div>Penata Arsip / Pengelola Persuratan,</div>
                <div style="height: 26px;"></div>
                <div style="font-weight: bold; text-decoration: underline;">${config.adminName}</div>
                <div>NIP. ${config.adminNip}</div>
              </td>
            </tr>
          </table>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Generates HTML string for official Agenda Book / Report (Latest Standard)
 */
export function generateAgendaReportHTML(
  reportType: 'inbox' | 'outbox',
  letters: Letter[],
  startDate: string,
  endDate: string,
  cfg?: SchoolConfig
): string {
  const config = cfg || getSchoolConfig();
  const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n');
  const startStr = format(new Date(startDate), 'dd MMMM yyyy', { locale: id });
  const endStr = format(new Date(endDate), 'dd MMMM yyyy', { locale: id });
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });

  const isInbox = reportType === 'inbox';

  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 8.5pt; color: #000; background: #fff; width: 100%; padding: 0 5px;">
      <!-- Kop Surat Resmi Dual Logo -->
      ${renderOfficialKopHTML(config, true)}

      <!-- Judul Dokumen Laporan -->
      <div style="text-align: center; margin: 12px 0 14px 0;">
        <h2 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          BUKU AGENDA ${isInbox ? 'SURAT MASUK' : 'SURAT KELUAR'}
        </h2>
        <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 3px; font-weight: bold; color: #1e293b;">
          Periode Rekapitulasi: ${startStr} s.d. ${endStr}
        </div>
        <div style="font-size: 8pt; font-family: Arial, sans-serif; color: #64748b; margin-top: 1px;">
          Satuan Kerja: ${config.schoolName} • Total: ${letters.length} Berkas Surat
        </div>
      </div>

      <!-- Tabel Agenda Standar Tata Naskah Kearsipan -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8pt; font-family: Arial, sans-serif;" border="1">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold; color: #0f172a;">
            <th style="padding: 5px 3px; width: 28px;">No.</th>
            <th style="padding: 5px 4px; width: 70px;">${isInbox ? 'Tgl. Terima' : 'Tgl. Keluar'}</th>
            <th style="padding: 5px 6px; text-align: left; width: 140px;">${isInbox ? 'Alamat Pengirim / Asal Surat' : 'Tujuan / Kepada Yth.'}</th>
            <th style="padding: 5px 4px; width: 68px;">Tgl. Surat</th>
            <th style="padding: 5px 5px; text-align: left; width: 110px;">Nomor Surat</th>
            <th style="padding: 5px 6px; text-align: left;">Isi Ringkas / Hal</th>
            <th style="padding: 5px 4px; width: 55px;">Lampiran</th>
            <th style="padding: 5px 5px; text-align: left; width: 125px;">${isInbox ? 'Diteruskan / Disposisi' : 'Unit Pengolah'}</th>
            <th style="padding: 5px 4px; width: 80px;">${isInbox ? 'Paraf / Ket.' : 'Ket. / Ekspedisi'}</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 6.8pt; font-style: italic; text-align: center; color: #64748b;">
            <th style="padding: 2px;">(1)</th>
            <th style="padding: 2px;">(2)</th>
            <th style="padding: 2px;">(3)</th>
            <th style="padding: 2px;">(4)</th>
            <th style="padding: 2px;">(5)</th>
            <th style="padding: 2px;">(6)</th>
            <th style="padding: 2px;">(7)</th>
            <th style="padding: 2px;">(8)</th>
            <th style="padding: 2px;">(9)</th>
          </tr>
        </thead>
        <tbody>
          ${letters.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align: center; padding: 24px; color: #64748b; font-style: italic;">
                Tidak ada catatan surat ${isInbox ? 'masuk' : 'keluar'} pada kurun waktu ${startStr} s.d. ${endStr}.
              </td>
            </tr>
          ` : letters.map((l, idx) => {
            const rowNumber = l.sequenceNumber || (idx + 1).toString();
            const actionDate = format(new Date(l.date), 'dd/MM/yyyy');
            const docDate = l.documentDate ? format(new Date(l.documentDate), 'dd/MM/yyyy') : '-';
            const lampiran = l.attachment || '-';
            const unitAtauDisposisi = isInbox
              ? (l.addressedTo ? `<b>${l.addressedTo}</b>${l.disposition ? `<div style="font-size: 7pt; color: #334155; margin-top: 1px;">Petunjuk: ${l.disposition}</div>` : ''}` : (l.disposition || '-'))
              : (l.processingUnit || l.addressedTo || 'Tata Usaha');
            const keterangan = isInbox 
              ? (l.description || l.receivedBy ? `Penerima: ${l.receivedBy || '-'}` : '-')
              : (l.description || '-');

            return `
              <tr>
                <td style="text-align: center; vertical-align: top; padding: 4px 2px; font-weight: bold;">${rowNumber}</td>
                <td style="text-align: center; vertical-align: top; padding: 4px 3px; white-space: nowrap;">${actionDate}</td>
                <td style="vertical-align: top; padding: 4px 5px; font-weight: 600; color: #0f172a;">${l.senderOrRecipient || '-'}</td>
                <td style="text-align: center; vertical-align: top; padding: 4px 3px; white-space: nowrap;">${docDate}</td>
                <td style="vertical-align: top; padding: 4px 5px; font-family: monospace; font-size: 7.5pt; word-break: break-all;">${l.referenceNumber || '-'}</td>
                <td style="vertical-align: top; padding: 4px 6px;">
                  <div style="font-weight: 500;">${l.title || '-'}</div>
                  ${l.code ? `<div style="font-size: 6.8pt; color: #64748b; margin-top: 1px;">Kode: ${l.code}</div>` : ''}
                </td>
                <td style="text-align: center; vertical-align: top; padding: 4px 2px; font-size: 7.2pt;">${lampiran}</td>
                <td style="vertical-align: top; padding: 4px 5px; font-size: 7.5pt;">${unitAtauDisposisi}</td>
                <td style="vertical-align: top; padding: 4px 4px; font-size: 7.2pt; text-align: center;">${keterangan}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Titi Mangsa & Lembar Tanda Tangan -->
      <table style="width: 100%; border: none; margin-top: 25px; font-size: 9pt; font-family: Arial, sans-serif; page-break-inside: avoid;" class="avoid-break">
        <tr style="border: none;">
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Mengetahui,</div>
            <div style="font-weight: bold; margin-top: 2px;">Kepala ${config.schoolName}</div>
            <div style="height: 48px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.headmaster || 'Kepala Sekolah'}</div>
            <div>NIP. ${config.headmasterNip || '-'}</div>
          </td>
          <td style="width: 10%; border: none;"></td>
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Kediri, ${todayStr}</div>
            <div style="font-weight: bold; margin-top: 2px;">Pengelola Administrasi Persuratan</div>
            <div style="height: 48px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.adminName || 'Pengelola Persuratan'}</div>
            <div>NIP. ${config.adminNip || '-'}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generates HTML string for Archive Card / Label
 */
export function generateArchiveCardHTML(archive: Archive, cfg?: SchoolConfig): string {
  const config = cfg || getSchoolConfig();
  const kopLines = config.schoolKop.toUpperCase().split('\n');
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const archiveDateStr = format(new Date(archive.date), 'dd MMMM yyyy', { locale: id });

  return `
    <div style="max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 15px; background: #fff;" class="avoid-break">
      <!-- Kop Kartu Arsip Dual Logo -->
      ${renderOfficialKopHTML(config, false)}

      <div class="doc-title" style="font-size: 12pt; margin: 6px 0 2px 0;">KARTU KENDALI ARSIP DOKUMEN</div>
      <div class="doc-subtitle">Unit Kearsipan & Dokumentasi Sekolah</div>

      <table style="font-size: 9pt; width: 100%; border: 1.5px solid #000; margin-top: 8px;">
        <tr>
          <td style="width: 30%; font-weight: bold; background: #f8f8f8;">KODE KLASIFIKASI</td>
          <td style="font-family: monospace; font-weight: bold; font-size: 10pt;">${archive.classificationCode || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">INDEKS / JUDUL DOKUMEN</td>
          <td style="font-weight: bold; font-size: 10.5pt; color: #111;">${archive.title}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">KATEGORI ARSIP</td>
          <td>${archive.category}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">NOMOR REFERENSI / BERKAS</td>
          <td style="font-family: monospace;">${archive.referenceNumber || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">TANGGAL DOKUMEN / ARSIP</td>
          <td>${archiveDateStr}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">TINGKAT PERKEMBANGAN</td>
          <td>${archive.developmentLevel || 'Asli'} (Jumlah: ${archive.amount || '1 Berkas'})</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">KONDISI FISIK</td>
          <td>${archive.condition || 'Baik'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">LOKASI PENYIMPANAN FISIK</td>
          <td style="font-weight: bold;">${archive.storageLocation || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8;">STATUS KEARSIPAN</td>
          <td><b>${archive.status || 'Aktif'}</b></td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f8f8f8; vertical-align: top;">RINGKASAN / KETERANGAN</td>
          <td style="font-size: 8.5pt; line-height: 1.4;">${archive.description || 'Tidak ada deskripsi tambahan.'}</td>
        </tr>
      </table>

      <table style="width: 100%; border: none; margin-top: 20px; font-size: 8.5pt;">
        <tr style="border: none;">
          <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
            <div>Mengetahui,</div>
            <div style="font-weight: bold;">Kepala Tata Usaha / Arsip</div>
            <div style="height: 35px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.adminName}</div>
            <div>NIP. ${config.adminNip}</div>
          </td>
          <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
            <div>Kediri, ${todayStr}</div>
            <div style="font-weight: bold;">Penata Arsip Dokumen</div>
            <div style="height: 35px;"></div>
            <div>( .................................................... )</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Helper to draw official letterhead (Kop) in jsPDF with Left & Right logos
 */
export function drawPdfKopHeader(doc: jsPDF, config: SchoolConfig, isLandscape = true): number {
  const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n').filter(Boolean);
  const leftLogo = config.leftLogo || DEFAULT_LEFT_LOGO;
  const rightLogo = config.rightLogo || DEFAULT_RIGHT_LOGO;
  const showLogos = config.showKopLogos !== false;

  const pageWidth = isLandscape ? 297 : 210;
  const centerX = pageWidth / 2;
  const marginL = 14;
  const marginR = pageWidth - 14;

  const logoSize = isLandscape ? 17 : 15;
  const logoY = 7.5;
  const leftLogoX = marginL + 1;
  const rightLogoX = marginR - logoSize - 1;

  if (showLogos && leftLogo) {
    try {
      const isPng = leftLogo.includes('image/png');
      const isJpeg = leftLogo.includes('image/jpeg') || leftLogo.includes('image/jpg');
      if (isPng || isJpeg) {
        doc.addImage(leftLogo, isPng ? 'PNG' : 'JPEG', leftLogoX, logoY, logoSize, logoSize);
      }
    } catch (e) {
      console.warn('PDF Left Logo error:', e);
    }
  }

  if (showLogos && rightLogo) {
    try {
      const isPng = rightLogo.includes('image/png');
      const isJpeg = rightLogo.includes('image/jpeg') || rightLogo.includes('image/jpg');
      if (isPng || isJpeg) {
        doc.addImage(rightLogo, isPng ? 'PNG' : 'JPEG', rightLogoX, logoY, logoSize, logoSize);
      }
    } catch (e) {
      console.warn('PDF Right Logo error:', e);
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 9.5 : 9);
  doc.text(kopLines[0] || 'PEMERINTAH KABUPATEN KEDIRI', centerX, 11, { align: 'center' });
  if (kopLines[1]) {
    doc.text(kopLines[1], centerX, 15.5, { align: 'center' });
  }
  doc.setFontSize(isLandscape ? 13.5 : 12.5);
  doc.text((config.schoolName || 'SMP NEGERI 3 KRAS').toUpperCase(), centerX, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isLandscape ? 8 : 7.5);
  doc.text(`${config.address} • Telp: ${config.phone || '-'} • Email: ${config.email || '-'}`, centerX, 26, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(marginL, 29, marginR, 29);
  doc.setLineWidth(0.2);
  doc.line(marginL, 29.8, marginR, 29.8);

  return 33;
}

/**
 * Generates and downloads PDF for Agenda Book using jsPDF + autoTable (Standard 9-column Landscape)
 */
export function exportAgendaReportPDF(
  reportType: 'inbox' | 'outbox',
  letters: Letter[],
  startDate: string,
  endDate: string,
  cfg?: SchoolConfig
): void {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

  const startStr = format(new Date(startDate), 'dd MMMM yyyy', { locale: id });
  const endStr = format(new Date(endDate), 'dd MMMM yyyy', { locale: id });
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const isInbox = reportType === 'inbox';

  // Draw Kop with Dual Logos
  drawPdfKopHeader(doc, config, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(`BUKU AGENDA ${isInbox ? 'SURAT MASUK' : 'SURAT KELUAR'}`, 148.5, 35.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Periode Rekapitulasi: ${startStr} s.d. ${endStr} (Total: ${letters.length} Berkas)`, 148.5, 40, { align: 'center' });

  const tableColumn = [
    'No.',
    isInbox ? 'Tgl. Terima' : 'Tgl. Keluar',
    isInbox ? 'Alamat Pengirim / Asal Surat' : 'Tujuan / Kepada Yth.',
    'Tgl. Surat',
    'Nomor Surat',
    'Isi Ringkas / Hal',
    'Lamp.',
    isInbox ? 'Diteruskan / Disposisi' : 'Unit Pengolah',
    isInbox ? 'Paraf / Ket.' : 'Ket. / Ekspedisi'
  ];

  const tableRows = letters.map((l, idx) => {
    const rowNumber = l.sequenceNumber || (idx + 1).toString();
    const actionDate = format(new Date(l.date), 'dd/MM/yyyy');
    const docDate = l.documentDate ? format(new Date(l.documentDate), 'dd/MM/yyyy') : '-';
    const lamp = l.attachment || '-';
    const unitDisp = isInbox
      ? (l.addressedTo ? `${l.addressedTo}${l.disposition ? `\nPetunjuk: ${l.disposition}` : ''}` : (l.disposition || '-'))
      : (l.processingUnit || l.addressedTo || 'Tata Usaha');
    const ket = isInbox
      ? (l.description || (l.receivedBy ? `Penerima: ${l.receivedBy}` : '-'))
      : (l.description || '-');

    return [
      rowNumber,
      actionDate,
      l.senderOrRecipient || '-',
      docDate,
      l.referenceNumber || '-',
      `${l.title || '-'}${l.code ? `\n(Kode: ${l.code})` : ''}`,
      lamp,
      unitDisp,
      ket
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 34 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 34 },
      8: { cellWidth: 24, halign: 'center' }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${doc.getNumberOfPages()} • Buku Agenda ${isInbox ? 'Surat Masuk' : 'Surat Keluar'} - ${config.schoolName}`, 283, 202, { align: 'right' });
    }
  });

  // Signature block
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const sigY = finalY > 165 ? 165 : finalY;

  if (finalY > 170) {
    doc.addPage();
  }

  const curPageY = finalY > 170 ? 22 : sigY;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 55, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Kepala ${config.schoolName}`, 55, curPageY + 4.5, { align: 'center' });
  doc.text(config.headmaster || 'Kepala Sekolah', 55, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${config.headmasterNip || '-'}`, 55, curPageY + 25.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text(`Kediri, ${todayStr}`, 240, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Pengelola Administrasi Persuratan', 240, curPageY + 4.5, { align: 'center' });
  doc.text(config.adminName || 'Pengelola Persuratan', 240, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${config.adminNip || '-'}`, 240, curPageY + 25.5, { align: 'center' });

  doc.save(`Buku_Agenda_${isInbox ? 'Masuk' : 'Keluar'}_${startDate}_sd_${endDate}.pdf`);
}

/**
 * Generates official HTML for Daftar Pertelaan / Laporan Arsip Dokumen (ANRI standard format)
 */
export function generateArchiveReportHTML(
  archives: Archive[],
  categoryFilter?: string,
  statusFilter?: string,
  startDate?: string,
  endDate?: string,
  cfg?: SchoolConfig
): string {
  const config = cfg || getSchoolConfig();
  const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n');
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const periodStr = startDate && endDate
    ? `${format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} s.d. ${format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}`
    : 'Semua Kurun Waktu';

  const categoryLabel = categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'Semua' ? categoryFilter : 'Semua Kategori';
  const statusLabel = statusFilter && statusFilter !== 'all' && statusFilter !== 'Semua' ? statusFilter : 'Semua Status Retensi';

  const rowsHtml = archives.length === 0
    ? `<tr><td colspan="11" style="text-align: center; padding: 24px; color: #64748b; font-style: italic;">Tidak ada data arsip dokumen pada filter/periode ini.</td></tr>`
    : archives.map((a, idx) => `
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 2px; font-weight: bold;">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; vertical-align: top; padding: 4px 3px; color: #0f766e;">${a.classificationCode || '-'}</td>
        <td style="vertical-align: top; font-size: 7.5pt; padding: 4px 4px; font-family: monospace;">${a.referenceNumber || '-'}</td>
        <td style="vertical-align: top; padding: 4px 6px;">
          <div style="font-weight: bold; color: #0f172a;">${a.title}</div>
          <div style="font-size: 7.2pt; color: #475569; margin-top: 1px;">${a.description ? a.description : '-'}</div>
        </td>
        <td style="text-align: center; vertical-align: top; white-space: nowrap; padding: 4px 3px;">${format(new Date(a.date), 'dd/MM/yyyy')}</td>
        <td style="text-align: center; vertical-align: top; padding: 4px 2px; font-size: 7.5pt;">${a.developmentLevel || 'Asli'}</td>
        <td style="text-align: center; vertical-align: top; white-space: nowrap; padding: 4px 3px; font-size: 7.5pt;">${a.amount || '1 Berkas'}</td>
        <td style="text-align: center; vertical-align: top; padding: 4px 2px;">
          <span style="font-size: 7.5pt; font-weight: bold; ${a.condition === 'Baik' ? 'color: #047857;' : 'color: #b91c1c;'}">${a.condition || 'Baik'}</span>
        </td>
        <td style="vertical-align: top; font-size: 7.5pt; padding: 4px 5px;">
          <div style="font-weight: 500;">${a.storageLocation || '-'}</div>
        </td>
        <td style="text-align: center; vertical-align: top; padding: 4px 2px;">
          <span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 7pt; font-weight: bold; border: 1px solid #cbd5e1; background: #f8fafc;">
            ${a.status || 'Aktif'}
          </span>
        </td>
        <td style="vertical-align: top; font-size: 7.2pt; padding: 4px 4px; text-align: center;">
          ${a.fileData ? '<span style="color: #0284c7; font-weight: bold;">Digital</span>' : '-'}
        </td>
      </tr>
    `).join('');

  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 8.5pt; color: #000; background: #fff; width: 100%; padding: 0 5px;">
      <!-- Kop Instansi Dual Logo -->
      ${renderOfficialKopHTML(config, true)}
      
      <!-- Judul Laporan ANRI -->
      <div style="text-align: center; margin: 12px 0 14px 0;">
        <h2 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          DAFTAR PERTELAAN ARSIP & INVENTARISASI DOKUMEN
        </h2>
        <div style="font-size: 9.5pt; margin-top: 3px; font-family: Arial, sans-serif; font-weight: bold; color: #1e293b;">
          Kategori: <u>${categoryLabel}</u> | Status Retensi: <u>${statusLabel}</u>
        </div>
        <div style="font-size: 8pt; color: #475569; margin-top: 1px; font-family: Arial, sans-serif;">
          Kurun Waktu: ${periodStr} • Total: ${archives.length} Berkas / Dokumen
        </div>
      </div>

      <!-- Tabel Daftar Pertelaan Standar ANRI -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8pt; font-family: Arial, sans-serif;" border="1">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold; color: #0f172a;">
            <th style="padding: 5px 3px; width: 26px;">No.</th>
            <th style="padding: 5px 4px; width: 55px;">Kode Klasifikasi</th>
            <th style="padding: 5px 4px; width: 75px; text-align: left;">Nomor Berkas</th>
            <th style="padding: 5px 6px; text-align: left;">Indeks / Uraian Informasi Berkas</th>
            <th style="padding: 5px 4px; width: 65px;">Kurun Waktu</th>
            <th style="padding: 5px 3px; width: 50px;">Bentuk</th>
            <th style="padding: 5px 3px; width: 50px;">Jumlah</th>
            <th style="padding: 5px 3px; width: 48px;">Kondisi</th>
            <th style="padding: 5px 4px; width: 85px; text-align: left;">Lokasi Simpan Fisik</th>
            <th style="padding: 5px 3px; width: 50px;">Status</th>
            <th style="padding: 5px 3px; width: 45px;">Ket.</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 6.8pt; font-style: italic; text-align: center; color: #64748b;">
            <th style="padding: 2px;">(1)</th>
            <th style="padding: 2px;">(2)</th>
            <th style="padding: 2px;">(3)</th>
            <th style="padding: 2px;">(4)</th>
            <th style="padding: 2px;">(5)</th>
            <th style="padding: 2px;">(6)</th>
            <th style="padding: 2px;">(7)</th>
            <th style="padding: 2px;">(8)</th>
            <th style="padding: 2px;">(9)</th>
            <th style="padding: 2px;">(10)</th>
            <th style="padding: 2px;">(11)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <table style="width: 100%; margin-top: 25px; border: none; font-size: 9pt; font-family: Arial, sans-serif; page-break-inside: avoid;" class="avoid-break">
        <tr style="border: none;">
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Mengetahui / Mengesahkan,</div>
            <div style="font-weight: bold; margin-top: 2px;">Kepala ${config.schoolName}</div>
            <div style="height: 48px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.headmaster || 'Kepala Sekolah'}</div>
            <div>NIP. ${config.headmasterNip || '-'}</div>
          </td>
          <td style="width: 10%; border: none;"></td>
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Kediri, ${todayStr}</div>
            <div style="font-weight: bold; margin-top: 2px;">Penata Arsip & Administrasi TU</div>
            <div style="height: 48px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.adminName || 'Penata Arsip'}</div>
            <div>NIP. ${config.adminNip || '-'}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generates and downloads PDF for Daftar Pertelaan Arsip Dokumen (Landscape A4, 11-column ANRI format)
 */
export function exportArchiveReportPDF(
  archives: Archive[],
  categoryFilter?: string,
  statusFilter?: string,
  startDate?: string,
  endDate?: string,
  cfg?: SchoolConfig
): void {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

  const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n');
  const periodStr = startDate && endDate
    ? `${format(new Date(startDate), 'dd MMM yyyy', { locale: id })} s.d. ${format(new Date(endDate), 'dd MMM yyyy', { locale: id })}`
    : 'Semua Kurun Waktu';
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const categoryLabel = categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'Semua' ? categoryFilter : 'Semua Kategori';
  const statusLabel = statusFilter && statusFilter !== 'all' && statusFilter !== 'Semua' ? statusFilter : 'Semua Status';

  // Kop Dinas with Dual Logos
  drawPdfKopHeader(doc, config, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('DAFTAR PERTELAAN ARSIP & INVENTARISASI DOKUMEN', 148.5, 35.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Kategori: ${categoryLabel} | Status: ${statusLabel} | Kurun Waktu: ${periodStr} (${archives.length} Berkas)`, 148.5, 40, { align: 'center' });

  const tableColumn = [
    'No.',
    'Kode',
    'No. Berkas',
    'Indeks / Uraian Informasi Berkas',
    'Tanggal',
    'Bentuk',
    'Jumlah',
    'Kondisi',
    'Lokasi Simpan Fisik',
    'Status',
    'Ket.'
  ];

  const tableRows = archives.map((a, idx) => [
    idx + 1,
    a.classificationCode || '-',
    a.referenceNumber || '-',
    `${a.title}${a.description ? '\n' + a.description : ''}`,
    format(new Date(a.date), 'dd/MM/yyyy'),
    a.developmentLevel || 'Asli',
    a.amount || '1 Berkas',
    a.condition || 'Baik',
    a.storageLocation || '-',
    a.status || 'Aktif',
    a.fileData ? 'Digital' : '-'
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 26 },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 12, halign: 'center' }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${doc.getNumberOfPages()} • Daftar Pertelaan Arsip - ${config.schoolName}`, 283, 202, { align: 'right' });
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const sigY = finalY > 165 ? 165 : finalY;

  if (finalY > 170) {
    doc.addPage();
  }

  const curPageY = finalY > 170 ? 22 : sigY;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui / Mengesahkan,', 55, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Kepala ${config.schoolName}`, 55, curPageY + 4.5, { align: 'center' });
  doc.text(config.headmaster || 'Kepala Sekolah', 55, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${config.headmasterNip || '-'}`, 55, curPageY + 25.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text(`Kediri, ${todayStr}`, 240, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Penata Arsip & Administrasi TU', 240, curPageY + 4.5, { align: 'center' });
  doc.text(config.adminName || 'Penata Arsip', 240, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${config.adminNip || '-'}`, 240, curPageY + 25.5, { align: 'center' });

  const safeCategory = categoryLabel.replace(/[\/\\:]/g, '_');
  doc.save(`Daftar_Pertelaan_Arsip_${safeCategory}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

/**
 * Generates official HTML for Rekapitulasi Eksekutif / Statistik Persuratan & Kearsipan
 */
export function generateRekapSummaryHTML(
  letters: Letter[],
  archives: Archive[],
  year: string,
  cfg?: SchoolConfig
): string {
  const config = cfg || getSchoolConfig();
  const kopLines = config.schoolKop.toUpperCase().split('\n');
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });

  const inboxLetters = letters.filter(l => l.type === 'inbox');
  const outboxLetters = letters.filter(l => l.type === 'outbox');

  // Group letters by month
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthlyData = months.map((monthName, mIdx) => {
    const inCount = inboxLetters.filter(l => new Date(l.date).getMonth() === mIdx).length;
    const outCount = outboxLetters.filter(l => new Date(l.date).getMonth() === mIdx).length;
    const archCount = archives.filter(a => new Date(a.date).getMonth() === mIdx).length;
    return {
      month: monthName,
      inCount,
      outCount,
      totalLetters: inCount + outCount,
      archCount
    };
  });

  // Group archives by category
  const categories = Array.from(new Set(archives.map(a => a.category || 'Lainnya')));
  const categoryStats = categories.map(cat => ({
    name: cat,
    count: archives.filter(a => (a.category || 'Lainnya') === cat).length
  })).sort((a, b) => b.count - a.count);

  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; color: #000; background: #fff; width: 100%;">
      <!-- Kop Rekapitulasi Dual Logo -->
      ${renderOfficialKopHTML(config, false)}
      
      <div style="text-align: center; margin: 12px 0 16px 0;">
        <h2 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase;">
          REKAPITULASI & STATISTIK PERSURATAN DAN KEARSIPAN
        </h2>
        <div style="font-size: 10pt; margin-top: 4px; font-family: Arial, sans-serif;">
          Tahun Anggaran / Periode: <strong>${year}</strong>
        </div>
      </div>

      <!-- Ringkasan Kartu / Totals -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: Arial, sans-serif;" border="1">
        <tr style="background-color: #f8fafc; text-align: center; font-weight: bold;">
          <th style="padding: 8px; width: 25%; background-color: #eff6ff;">Surat Masuk</th>
          <th style="padding: 8px; width: 25%; background-color: #f0fdf4;">Surat Keluar</th>
          <th style="padding: 8px; width: 25%; background-color: #fdf4ff;">Total Surat</th>
          <th style="padding: 8px; width: 25%; background-color: #f0fdfa;">Total Arsip Dokumen</th>
        </tr>
        <tr style="text-align: center; font-size: 14pt; font-weight: bold;">
          <td style="padding: 10px; color: #1d4ed8;">${inboxLetters.length} Berkas</td>
          <td style="padding: 10px; color: #15803d;">${outboxLetters.length} Berkas</td>
          <td style="padding: 10px; color: #7e22ce;">${letters.length} Berkas</td>
          <td style="padding: 10px; color: #0f766e;">${archives.length} Dokumen</td>
        </tr>
      </table>

      <!-- Tabel Rincian Bulanan -->
      <h3 style="font-size: 10pt; font-weight: bold; font-family: Arial, sans-serif; margin: 12px 0 6px 0;">
        A. Rekapitulasi Alur Surat & Arsip Bulanan (${year})
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; font-family: Arial, sans-serif;" border="1">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="padding: 5px; width: 35px;">No.</th>
            <th style="padding: 5px; text-align: left;">Bulan</th>
            <th style="padding: 5px; width: 100px;">Surat Masuk</th>
            <th style="padding: 5px; width: 100px;">Surat Keluar</th>
            <th style="padding: 5px; width: 110px;">Sub Total Surat</th>
            <th style="padding: 5px; width: 120px;">Arsip Ditambahkan</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyData.map((m, idx) => `
            <tr>
              <td style="text-align: center; padding: 4px;">${idx + 1}</td>
              <td style="padding: 4px 8px; font-weight: 500;">${m.month}</td>
              <td style="text-align: center; padding: 4px;">${m.inCount}</td>
              <td style="text-align: center; padding: 4px;">${m.outCount}</td>
              <td style="text-align: center; padding: 4px; font-weight: bold;">${m.totalLetters}</td>
              <td style="text-align: center; padding: 4px;">${m.archCount}</td>
            </tr>
          `).join('')}
          <tr style="background-color: #f8fafc; font-weight: bold; text-align: center;">
            <td colspan="2" style="padding: 6px; text-align: right;">TOTAL:</td>
            <td style="padding: 6px;">${inboxLetters.length}</td>
            <td style="padding: 6px;">${outboxLetters.length}</td>
            <td style="padding: 6px; color: #7e22ce;">${letters.length}</td>
            <td style="padding: 6px; color: #0f766e;">${archives.length}</td>
          </tr>
        </tbody>
      </table>

      <!-- Tabel Rincian Arsip Berdasarkan Kategori -->
      <h3 style="font-size: 10pt; font-weight: bold; font-family: Arial, sans-serif; margin: 16px 0 6px 0;">
        B. Komposisi Arsip Berdasarkan Kategori Dokumen
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; font-family: Arial, sans-serif;" border="1">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="padding: 5px; width: 35px;">No.</th>
            <th style="padding: 5px; text-align: left;">Kategori Arsip</th>
            <th style="padding: 5px; width: 130px;">Jumlah Berkas</th>
            <th style="padding: 5px; width: 130px;">Persentase</th>
          </tr>
        </thead>
        <tbody>
          ${categoryStats.map((c, idx) => {
            const pct = archives.length > 0 ? ((c.count / archives.length) * 100).toFixed(1) : '0';
            return `
              <tr>
                <td style="text-align: center; padding: 4px;">${idx + 1}</td>
                <td style="padding: 4px 8px; font-weight: 500;">${c.name}</td>
                <td style="text-align: center; padding: 4px; font-weight: bold;">${c.count} Dokumen</td>
                <td style="text-align: center; padding: 4px;">${pct}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <table style="width: 100%; margin-top: 25px; border: none; font-size: 9.5pt; font-family: Arial, sans-serif; page-break-inside: avoid;">
        <tr style="border: none;">
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Mengetahui,</div>
            <div style="font-weight: bold; margin-top: 2px;">Kepala Sekolah</div>
            <div style="height: 45px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.headmaster}</div>
            <div>NIP. ${config.headmasterNip}</div>
          </td>
          <td style="width: 10%; border: none;"></td>
          <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
            <div>Kediri, ${todayStr}</div>
            <div style="font-weight: bold; margin-top: 2px;">Penata Arsip & Administrasi TU</div>
            <div style="height: 45px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${config.adminName}</div>
            <div>NIP. ${config.adminNip}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generates and downloads PDF for Rekapitulasi & Statistik Eksekutif (Portrait A4)
 */
export function exportRekapSummaryPDF(
  letters: Letter[],
  archives: Archive[],
  year: string,
  cfg?: SchoolConfig
): void {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait A4

  const kopLines = config.schoolKop.toUpperCase().split('\n');
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: id });

  const inboxLetters = letters.filter(l => l.type === 'inbox');
  const outboxLetters = letters.filter(l => l.type === 'outbox');

  // Kop Dinas with Dual Logos
  drawPdfKopHeader(doc, config, false);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REKAPITULASI & STATISTIK PERSURATAN DAN KEARSIPAN', 105, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tahun Anggaran / Periode: ${year}`, 105, 41, { align: 'center' });

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 45, 180, 16, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 45, 180, 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Surat Masuk', 37.5, 49, { align: 'center' });
  doc.text('Surat Keluar', 82.5, 49, { align: 'center' });
  doc.text('Total Surat', 127.5, 49, { align: 'center' });
  doc.text('Total Arsip', 172.5, 49, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text(`${inboxLetters.length}`, 37.5, 56, { align: 'center' });
  doc.setTextColor(21, 128, 61);
  doc.text(`${outboxLetters.length}`, 82.5, 56, { align: 'center' });
  doc.setTextColor(126, 34, 206);
  doc.text(`${letters.length}`, 127.5, 56, { align: 'center' });
  doc.setTextColor(15, 118, 110);
  doc.text(`${archives.length}`, 172.5, 56, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Section A
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`A. Rekapitulasi Alur Surat & Arsip Bulanan (${year})`, 15, 67);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthlyRows = months.map((m, idx) => {
    const inCount = inboxLetters.filter(l => new Date(l.date).getMonth() === idx).length;
    const outCount = outboxLetters.filter(l => new Date(l.date).getMonth() === idx).length;
    const archCount = archives.filter(a => new Date(a.date).getMonth() === idx).length;
    return [
      idx + 1,
      m,
      inCount,
      outCount,
      inCount + outCount,
      archCount
    ];
  });

  monthlyRows.push([
    '',
    'TOTAL',
    inboxLetters.length,
    outboxLetters.length,
    letters.length,
    archives.length
  ]);

  autoTable(doc, {
    head: [['No.', 'Bulan', 'Surat Masuk', 'Surat Keluar', 'Sub Total', 'Arsip Masuk']],
    body: monthlyRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 34, halign: 'center' }
    }
  });

  const finalY1 = (doc as any).lastAutoTable.finalY + 8;

  // Section B
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('B. Komposisi Arsip Berdasarkan Kategori Dokumen', 15, finalY1);

  const categories = Array.from(new Set(archives.map(a => a.category || 'Lainnya')));
  const categoryStats = categories.map(cat => ({
    name: cat,
    count: archives.filter(a => (a.category || 'Lainnya') === cat).length
  })).sort((a, b) => b.count - a.count);

  const categoryRows = categoryStats.map((c, idx) => [
    idx + 1,
    c.name,
    `${c.count} Dokumen`,
    archives.length > 0 ? `${((c.count / archives.length) * 100).toFixed(1)}%` : '0%'
  ]);

  autoTable(doc, {
    head: [['No.', 'Kategori Dokumen Arsip', 'Jumlah Berkas', 'Persentase']],
    body: categoryRows,
    startY: finalY1 + 3,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 45, halign: 'center' }
    }
  });

  const finalY2 = (doc as any).lastAutoTable.finalY + 8;
  const sigY = finalY2 > 235 ? 235 : finalY2;

  if (finalY2 > 240) {
    doc.addPage();
  }

  const curPageY = finalY2 > 240 ? 25 : sigY;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 45, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', 45, curPageY + 4, { align: 'center' });
  doc.text(config.headmaster, 45, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${config.headmasterNip}`, 45, curPageY + 26, { align: 'center' });

  doc.text(`Kediri, ${todayStr}`, 165, curPageY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Penata Arsip & Administrasi TU', 165, curPageY + 4, { align: 'center' });
  doc.text(config.adminName, 165, curPageY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${config.adminNip}`, 165, curPageY + 26, { align: 'center' });

  doc.save(`Rekapitulasi_Persuratan_Kearsipan_${year}.pdf`);
}

/**
 * Creates QR Code Data URL for letter digital validation
 */
export async function generateLetterQRCode(letter: Letter): Promise<string> {
  const qrPayload = JSON.stringify({
    app: 'SPEGAMAIL SMPN 3 KRAS',
    no: letter.referenceNumber,
    perihal: letter.title,
    tgl: letter.date,
    tipe: letter.type,
    pengirim_tujuan: letter.senderOrRecipient,
    status: 'VERIFIED_VALID'
  });

  return await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 140,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

/**
 * Generates official letter PDF on-the-fly for any letter
 */
export async function generateOfficialLetterPDF(letter: Letter, cfg?: SchoolConfig): Promise<void> {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Draw official letterhead Kop
  drawPdfKopHeader(doc, config, false);

  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });

  // Right side date & city
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Kediri, ${formattedDocDate}`, 135, 43);

  // Left metadata (Nomor, Sifat, Lampiran, Hal)
  doc.text('Nomor', 15, 48);
  doc.text(':', 35, 48);
  doc.setFont('helvetica', 'bold');
  doc.text(letter.referenceNumber || '-', 38, 48);

  doc.setFont('helvetica', 'normal');
  doc.text('Sifat', 15, 54);
  doc.text(':', 35, 54);
  doc.text(letter.securityStyle || 'Biasa', 38, 54);

  doc.text('Lampiran', 15, 60);
  doc.text(':', 35, 60);
  doc.text(letter.attachment || '-', 38, 60);

  doc.text('Perihal', 15, 66);
  doc.text(':', 35, 66);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(letter.title || 'Surat Dinas', 85);
  doc.text(splitTitle, 38, 66);

  // Recipient / Sender (Right side)
  const isInbox = letter.type === 'inbox';
  doc.setFont('helvetica', 'normal');
  doc.text(isInbox ? 'Diterima Dari Yth :' : 'Kepada Yth :', 135, 54);
  doc.setFont('helvetica', 'bold');
  const splitRecipient = doc.splitTextToSize(letter.senderOrRecipient || 'Pihak Terkait', 60);
  doc.text(splitRecipient, 135, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('di -', 135, 60 + (splitRecipient.length * 5));
  doc.text('     Tempat', 135, 65 + (splitRecipient.length * 5));

  // Letter Body separator
  const bodyStartY = Math.max(78 + (splitTitle.length * 5), 88);
  doc.setDrawColor(220, 220, 220);
  doc.line(15, bodyStartY - 6, 195, bodyStartY - 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Dengan hormat,', 15, bodyStartY);

  const mainContent = letter.description || `Sehubungan dengan pelaksanaan kegiatan dinas dan tertib administrasi di lingkungan ${config.schoolName}, bersama surat ini kami sampaikan perihal ${letter.title}.`;
  const splitContent = doc.splitTextToSize(mainContent, 180);
  doc.text(splitContent, 15, bodyStartY + 7);

  const afterContentY = bodyStartY + 7 + (splitContent.length * 5.5) + 6;

  // Administrative detail box if any
  let nextY = afterContentY;
  if (letter.indexData || letter.code || letter.processingUnit) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, nextY, 180, 20, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN REGISTER ADMINISTRASI PERSURATAN:', 19, nextY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Indeks: ${letter.indexData || '-'}   • Kode: ${letter.code || '-'}   • No. Urut: ${letter.sequenceNumber || '-'}   • Kategori: ${letter.category || '-'}`, 19, nextY + 11);
    doc.text(`• Unit Pengolah: ${letter.processingUnit || 'Tata Usaha (TU)'}   • Kecepatan: ${letter.urgency || 'Biasa'}   • Penerima: ${letter.receivedBy || '-'}`, 19, nextY + 16);
    nextY += 25;
  }

  doc.setFontSize(10);
  doc.text('Demikian surat ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya kami sampaikan terima kasih.', 15, nextY);

  // Signature and QR verification
  const sigY = Math.max(nextY + 16, 215);

  // Add QR verification on left
  try {
    const qrData = await generateLetterQRCode(letter);
    doc.addImage(qrData, 'PNG', 20, sigY - 5, 24, 24);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text('DIGITAL VERIFIED', 20, sigY + 23);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Validitas SMPN 3 Kras', 20, sigY + 26.5);
    doc.setTextColor(0, 0, 0);
  } catch (e) {
    console.error(e);
  }

  // Signature on right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Kediri, ${formattedDocDate}`, 135, sigY);
  doc.text(`Kepala ${config.schoolName},`, 135, sigY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(config.headmaster, 135, sigY + 24);
  doc.setFont('helvetica', 'normal');
  if (config.headmasterNip) {
    doc.text(`NIP. ${config.headmasterNip}`, 135, sigY + 28);
  }

  const cleanRef = (letter.referenceNumber || 'Dinas').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Surat_Resmi_${cleanRef}.pdf`);
}

/**
 * Generates official letter HTML representation for printing and preview
 */
export async function generateOfficialLetterHTML(letter: Letter, cfg?: SchoolConfig, teachersList?: Teacher[]): Promise<string> {
  const config = cfg || getSchoolConfig();
  const hm = getHeadmasterDetails(teachersList, config);
  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });
  
  const qrUrl = await generateLetterQRCode(letter);
  const isInbox = letter.type === 'inbox';

  return `
    <div style="background: #ffffff; color: #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; line-height: 1.5; font-size: 11pt;">
      ${renderOfficialKopHTML(config, false)}

      <table style="width: 100%; border: none !important; margin-top: 10px; font-size: 11pt; border-collapse: collapse;">
        <tr style="border: none !important;">
          <td style="width: 58%; vertical-align: top; border: none !important; padding: 0;">
            <table style="width: 100%; border: none !important; border-collapse: collapse;">
              <tr style="border: none !important;">
                <td style="width: 75px; border: none !important; padding: 2px 0;">Nomor</td>
                <td style="width: 15px; border: none !important; padding: 2px 0;">:</td>
                <td style="font-weight: bold; border: none !important; padding: 2px 0; font-family: monospace; font-size: 11pt;">${letter.referenceNumber}</td>
              </tr>
              <tr style="border: none !important;">
                <td style="border: none !important; padding: 2px 0;">Sifat</td>
                <td style="border: none !important; padding: 2px 0;">:</td>
                <td style="border: none !important; padding: 2px 0;">${letter.securityStyle || 'Biasa'}</td>
              </tr>
              <tr style="border: none !important;">
                <td style="border: none !important; padding: 2px 0;">Lampiran</td>
                <td style="border: none !important; padding: 2px 0;">:</td>
                <td style="border: none !important; padding: 2px 0;">${letter.attachment || '-'}</td>
              </tr>
              <tr style="border: none !important;">
                <td style="vertical-align: top; border: none !important; padding: 2px 0;">Perihal</td>
                <td style="vertical-align: top; border: none !important; padding: 2px 0;">:</td>
                <td style="font-weight: bold; text-decoration: underline; border: none !important; padding: 2px 0;">${letter.title}</td>
              </tr>
            </table>
          </td>
          <td style="width: 42%; vertical-align: top; border: none !important; padding: 0 0 0 15px;">
            <div style="margin-bottom: 8px;">Kediri, ${formattedDocDate}</div>
            <div>${isInbox ? 'Diterima Dari Yth :' : 'Kepada Yth :'}</div>
            <div style="font-weight: bold; margin: 2px 0;">${letter.senderOrRecipient}</div>
            <div>di -</div>
            <div style="margin-left: 20px;">Tempat</div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 25px; text-align: justify; text-indent: 30px;">
        Dengan hormat,
      </div>

      <div style="margin-top: 10px; text-align: justify; line-height: 1.6; text-indent: 30px;">
        ${letter.description ? letter.description.replace(/\n/g, '<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') : `Sehubungan dengan pelaksanaan tugas kedinasan dan tertib administrasi di lingkungan ${config.schoolName}, bersama surat ini disampaikan perihal <b>${letter.title}</b>.`}
      </div>

      ${(letter.indexData || letter.code || letter.processingUnit) ? `
        <div style="margin: 18px 0; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: Arial, sans-serif; font-size: 8.5pt;">
          <div style="font-weight: bold; color: #0369a1; margin-bottom: 3px;">CATATAN REGISTER ADMINISTRASI SEKOLAH:</div>
          <div><b>Indeks:</b> ${letter.indexData || '-'} &nbsp;|&nbsp; <b>Kode:</b> ${letter.code || '-'} &nbsp;|&nbsp; <b>No. Urut:</b> ${letter.sequenceNumber || '-'} &nbsp;|&nbsp; <b>Kategori:</b> ${letter.category || '-'}</div>
          <div><b>Unit Pengolah:</b> ${letter.processingUnit || 'Tata Usaha (TU)'} &nbsp;|&nbsp; <b>Kecepatan:</b> ${letter.urgency || 'Biasa'} &nbsp;|&nbsp; <b>Penerima:</b> ${letter.receivedBy || '-'}</div>
        </div>
      ` : ''}

      <div style="margin-top: 15px; text-align: justify; text-indent: 30px;">
        Demikian surat ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya diucapkan terima kasih.
      </div>

      <table style="width: 100%; border: none !important; margin-top: 35px; border-collapse: collapse; page-break-inside: avoid;">
        <tr style="border: none !important;">
          <td style="width: 40%; vertical-align: top; border: none !important; padding: 0;">
            <div style="display: flex; align-items: center; gap: 10px; border: 1px solid #cbd5e1; padding: 6px; border-radius: 6px; width: fit-content; background: #fafafa;">
              <img src="${qrUrl}" alt="QR" style="width: 60px; height: 60px;" />
              <div style="font-family: Arial, sans-serif; font-size: 7.5pt; color: #475569;">
                <div style="font-weight: bold; color: #0284c7;">DIGITAL VERIFIED</div>
                <div>SMP NEGERI 3 KRAS</div>
                <div style="font-family: monospace; font-size: 6.5pt; color: #94a3b8;">${letter.referenceNumber}</div>
              </div>
            </div>
          </td>
          <td style="width: 20%; border: none !important;"></td>
          <td style="width: 40%; text-align: center; vertical-align: top; border: none !important; padding: 0;">
            <div>Kediri, ${formattedDocDate}</div>
            <div style="font-weight: bold; margin-top: 2px;">Kepala ${config.schoolName}</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 11.5pt;">${hm.name}</div>
            <div style="font-size: 9.5pt;">${hm.nip ? `NIP. ${hm.nip}` : (hm.rank ? `Pangkat: ${hm.rank}` : '')}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Downloads letter document anytime (direct PDF fileUrl or generated on-the-fly)
 */
export async function downloadLetterDocument(letter: Letter, cfg?: SchoolConfig): Promise<void> {
  // If the letter has a direct PDF data URI (e.g. generated by draft wizard or uploaded)
  if (letter.fileUrl && letter.fileUrl.startsWith('data:application/pdf')) {
    try {
      const fileName = letter.fileName || `Surat_Resmi_${(letter.referenceNumber || 'Dokumen').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const link = document.createElement('a');
      link.href = letter.fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (e) {
      console.warn('Failed direct fileUrl download, falling back to on-the-fly generator', e);
    }
  }

  // Otherwise, generate official letter document PDF on the fly
  await generateOfficialLetterPDF(letter, cfg);
}

/**
 * ==============================================================================
 * DRAF LETTER GENERATORS: SURAT PERMOHONAN & SURAT RESMI SEKOLAH SESUAI PILIHAN
 * ==============================================================================
 */

/**
 * 1. Generates HTML for Surat Permohonan (Dari Guru / Wali Murid ke Kepala Sekolah)
 */
export function generateSuratPermohonanHTML(letter: Letter, cfg?: SchoolConfig): string {
  const config = cfg || getSchoolConfig();
  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });
  
  const applicantName = letter.applicantName || letter.receivedBy?.split('(')[0]?.trim() || 'Pemohon';
  const applicantPhone = letter.applicantPhone || '-';
  const applicantRole = letter.applicantRole === 'guru' ? 'Guru / Tenaga Pendidik' : (letter.applicantRole === 'wali' ? 'Orang Tua / Wali Murid' : 'Pemohon');
  
  return `
    <div style="background: #ffffff; color: #000000; padding: 25px 30px; font-family: 'Times New Roman', Times, serif; line-height: 1.6; font-size: 11pt; max-width: 800px; margin: 0 auto;">
      
      <!-- Tanggal & Lokasi Surat Permohonan -->
      <table style="width: 100%; border: none !important; border-collapse: collapse; margin-bottom: 15px;">
        <tr style="border: none !important;">
          <td style="width: 55%; vertical-align: top; border: none !important; padding: 0;">
            <div style="font-weight: bold; color: #0f766e; font-size: 9.5pt; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              [ SURAT PERMOHONAN PENGAJUAN ]
            </div>
            <table style="font-size: 11pt; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 0; width: 75px;">Nomor</td>
                <td style="padding: 2px 0; width: 12px;">:</td>
                <td style="padding: 2px 0; font-family: monospace; color: #475569;">- (Permohonan Mandiri)</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Lampiran</td>
                <td style="padding: 2px 0;">:</td>
                <td style="padding: 2px 0;">1 (Satu) Berkas Pengajuan</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; vertical-align: top;">Perihal</td>
                <td style="padding: 2px 0; vertical-align: top;">:</td>
                <td style="padding: 2px 0; font-weight: bold; text-decoration: underline;">
                  Permohonan Penerbitan ${letter.title}
                </td>
              </tr>
            </table>
          </td>
          <td style="width: 45%; vertical-align: top; text-align: right; border: none !important; padding: 0;">
            <div style="margin-bottom: 12px; font-size: 11pt;">Kediri, ${formattedDocDate}</div>
            <div style="text-align: left; display: inline-block; font-size: 11pt;">
              <div>Kepada Yth.</div>
              <div style="font-weight: bold; margin: 2px 0;">Kepala ${config.schoolName}</div>
              <div>di -</div>
              <div style="margin-left: 20px;">Tempat</div>
            </div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 20px; text-align: justify;">
        Dengan hormat,
      </div>

      <div style="margin-top: 8px; text-align: justify; text-indent: 30px;">
        Saya yang bertanda tangan di bawah ini:
      </div>

      <table style="width: 100%; margin: 10px 0 15px 30px; font-size: 11pt; border-collapse: collapse; border: none !important;">
        <tr style="border: none !important;">
          <td style="width: 180px; padding: 3px 0; border: none !important;">Nama Lengkap</td>
          <td style="width: 15px; padding: 3px 0; border: none !important;">:</td>
          <td style="font-weight: bold; padding: 3px 0; border: none !important;">${applicantName}</td>
        </tr>
        <tr style="border: none !important;">
          <td style="padding: 3px 0; border: none !important;">Status / Peran</td>
          <td style="padding: 3px 0; border: none !important;">:</td>
          <td style="padding: 3px 0; border: none !important;">${applicantRole}</td>
        </tr>
        <tr style="border: none !important;">
          <td style="padding: 3px 0; border: none !important;">No. Telepon / WhatsApp</td>
          <td style="padding: 3px 0; border: none !important;">:</td>
          <td style="padding: 3px 0; font-family: monospace; border: none !important; color: #047857; font-weight: bold;">${applicantPhone}</td>
        </tr>
      </table>

      <div style="text-align: justify; text-indent: 30px; margin-bottom: 10px;">
        Dengan ini bermaksud mengajukan permohonan kepada Bapak/Ibu Kepala ${config.schoolName} agar kiranya berkenan menerbitkan naskah surat dinas resmi perihal <b>"${letter.title}"</b> dengan uraian dan rincian data sebagai berikut:
      </div>

      <!-- Kotak Rincian Permohonan -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 18px; margin: 14px 0; font-size: 10.5pt; font-family: Arial, sans-serif; line-height: 1.55;">
        <div style="font-weight: bold; color: #0284c7; margin-bottom: 6px; text-transform: uppercase; font-size: 9pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          Rincian Informasi Pengajuan:
        </div>
        <div style="white-space: pre-wrap; color: #1e293b;">${letter.description || `Permohonan penerbitan dokumen ${letter.title} untuk tertib administrasi.`}</div>
      </div>

      <div style="text-align: justify; text-indent: 30px; margin-top: 15px;">
        Demikian surat permohonan ini saya ajukan dengan sebenar-benarnya dan penuh tanggung jawab. Besar harapan saya kiranya Bapak/Ibu Kepala Sekolah berkenan memproses serta menerbitkan surat dinas yang dimaksud.
      </div>
      <div style="text-align: justify; text-indent: 30px; margin-top: 6px;">
        Atas perhatian, bantuan, dan kebijaksanaan yang diberikan, saya sampaikan terima kasih.
      </div>

      <!-- Tanda Tangan Pemohon -->
      <table style="width: 100%; border: none !important; margin-top: 35px; border-collapse: collapse; page-break-inside: avoid;">
        <tr style="border: none !important;">
          <td style="width: 50%; border: none !important; padding: 0;"></td>
          <td style="width: 50%; text-align: center; border: none !important; padding: 0;">
            <div>Kediri, ${formattedDocDate}</div>
            <div style="margin-top: 4px;">Hormat saya,</div>
            <div style="font-style: italic; color: #64748b; font-size: 9.5pt;">Pemohon (${applicantRole})</div>
            <div style="height: 55px;"></div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 11.5pt;">${applicantName}</div>
            <div style="font-size: 9.5pt; color: #334155;">No. HP/WA: ${applicantPhone}</div>
          </td>
        </tr>
      </table>

    </div>
  `;
}

export interface SuratTugasParsed {
  dasar: string;
  name: string;
  nip: string;
  rank: string;
  position: string;
  purpose: string;
  day: string;
  dateStr: string;
  timeStr: string;
  location: string;
}

export function parseSuratTugasData(letter: Letter, teachersList?: Teacher[] | any[]): SuratTugasParsed {
  const desc = letter.description || '';
  
  // Extract Dasar - Default is strictly 'Perintah Kepala Sekolah'
  let dasar = 'Perintah Kepala Sekolah';
  const dasarMatch = desc.match(/Dasar\s*(?:Penugasan)?\s*:\s*([^\n\r]+(?:\n(?!\s*(?:Kepada|MEMERINTAHKAN|•|Untuk|Nama|NIP))[^\n\r]+)*)/i);
  if (dasarMatch && dasarMatch[1]) {
    const dVal = dasarMatch[1].trim();
    if (dVal) {
      dasar = dVal;
    }
  }

  // Extract Name
  let name = letter.applicantName || letter.receivedBy?.split('(')[0]?.trim() || '';
  const nameMatch = desc.match(/(?:Nama|Nama Lengkap|Nama Pendidik)\s*:\s*([^\n\r]+)/i);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }
  if (!name) name = 'Guru / Pegawai Yang Ditugaskan';

  // Extract NIP
  let nip = '-';
  const nipMatch = desc.match(/NIP\s*(?:\/\s*NUPTK)?\s*:\s*([^\n\r]+)/i);
  if (nipMatch && nipMatch[1]) {
    nip = nipMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  // Extract Pangkat / Gol
  let rank = 'Penata Muda / III/a';
  const rankMatch = desc.match(/(?:Pangkat\/Gol|Pangkat\s*\/\s*Golongan|Pangkat\/Gol\.Ruang)\s*:\s*([^\n\r]+)/i);
  if (rankMatch && rankMatch[1]) {
    rank = rankMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  // Extract Jabatan
  let position = 'Guru Mata Pelajaran';
  const posMatch = desc.match(/(?:Jabatan|Jabatan\/Unit|Jabatan Sekolah)\s*:\s*([^\n\r]+)/i);
  if (posMatch && posMatch[1]) {
    position = posMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  // Match from teachers database if available
  if (teachersList && teachersList.length > 0) {
    const matched = teachersList.find((t: any) => 
      t.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(t.name.toLowerCase())
    );
    if (matched) {
      if (!nip || nip === '-') nip = matched.nip || '-';
      if (rank === 'Penata Muda / III/a' && (matched.rankCategory || matched.rank)) {
        rank = matched.rankCategory || matched.rank;
      }
      if (position === 'Guru Mata Pelajaran' && (matched.position || matched.subject)) {
        position = matched.position || matched.subject;
      }
    }
  }

  // Extract Purpose / Uraian Tugas
  let purpose = letter.title.replace(/^(?:Permohonan\s+)?(?:Surat\s+)?(?:Perintah\s+)?(?:Tugas\s+)?(?:Guru\s+)?(?:-\s+)?/i, '').trim();
  const purposeMatch = desc.match(/(?:Untuk melaksanakan tugas kedinasan perihal|Terkait perihal|Tugas \/ Kegiatan|Untuk keperluan|Untuk\s*:)\s*"?([^"\n\r]+)"?/i);
  if (purposeMatch && purposeMatch[1]) {
    purpose = purposeMatch[1].trim();
  }
  if (!purpose) purpose = letter.title;

  // Extract Location
  let location = 'SMP Negeri 3 Kras / Tempat Kegiatan';
  const locMatch = desc.match(/(?:Tempat \/ Lokasi|Tempat Pelaksanaan|Tempat|Lokasi)\s*:\s*([^\n\r]+)/i);
  if (locMatch && locMatch[1]) {
    location = locMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  // Extract Dates & Time
  const docDateObj = letter.documentDate ? new Date(letter.documentDate) : (letter.date ? new Date(letter.date) : new Date());
  
  let day = format(docDateObj, 'EEEE', { locale: id });
  const dayMatch = desc.match(/Hari\s*:\s*([^\n\r]+)/i);
  if (dayMatch && dayMatch[1]) {
    day = dayMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  let dateStr = format(docDateObj, 'dd MMMM yyyy', { locale: id });
  const dateMatch = desc.match(/(?:Tanggal|Waktu \/ Tanggal|Waktu Pelaksanaan)\s*:\s*([^\n\r]+)/i);
  if (dateMatch && dateMatch[1]) {
    dateStr = dateMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  let timeStr = '08.00 WIB s.d Selesai';
  const timeMatch = desc.match(/Pukul\s*:\s*([^\n\r]+)/i);
  if (timeMatch && timeMatch[1]) {
    timeStr = timeMatch[1].replace(/^[•\-*\s]+/, '').trim();
  }

  return {
    dasar,
    name,
    nip,
    rank,
    position,
    purpose,
    day,
    dateStr,
    timeStr,
    location
  };
}

/**
 * 2. Generates HTML for Surat Resmi Sekolah Sesuai Draf yang Dipilih (Naskah Dinas Resmi Ber-KOP)
 */
export async function generateSuratDinasResmiHTML(letter: Letter, cfg?: SchoolConfig, teachersList?: Teacher[]): Promise<string> {
  const config = cfg || getSchoolConfig();
  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });
  
  const qrUrl = await generateLetterQRCode(letter);
  const templateType = letter.templateType || '';
  const isSuratTugas = templateType === 'guru_tugas' || templateType === 'surat-tugas' || letter.title.toLowerCase().includes('tugas');
  const headmaster = getHeadmasterDetails(teachersList, config);

  // KHUSUS FORMAT RESMI: SURAT PERINTAH TUGAS (Sesuai Standar Naskah Dinas Kedinasan Pemerintah Kabupaten Kediri)
  if (isSuratTugas) {
    const data = parseSuratTugasData(letter, teachersList);
    const refNum = letter.referenceNumber || `420.3/....../418.20.2.62.03/${new Date().getFullYear()}`;

    return `
      <div style="background: #ffffff; color: #000000; padding: 20px 25px; font-family: 'Times New Roman', Times, serif; line-height: 1.45; font-size: 11pt; max-width: 800px; margin: 0 auto;">
        
        <!-- KOP RESMI SEKOLAH -->
        ${renderOfficialKopHTML(config, false)}

        <!-- JUDUL SURAT PERINTAH TUGAS -->
        <div style="text-align: center; margin: 12px 0 16px 0;">
          <div style="font-size: 12.5pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px;">
            SURAT PERINTAH TUGAS
          </div>
          <div style="font-size: 11pt; margin-top: 2px;">
            Nomor : <span style="font-family: 'Times New Roman', Times, serif;">${refNum}</span>
          </div>
        </div>

        <!-- DASAR -->
        <table style="width: 100%; border: none !important; margin-bottom: 12px; font-size: 11pt; border-collapse: collapse;">
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Dasar</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0; text-align: justify;">
              ${data.dasar}
            </td>
          </tr>
        </table>

        <!-- MEMERINTAHKAN -->
        <div style="text-align: center; font-weight: bold; font-size: 11pt; margin: 14px 0 12px 0; letter-spacing: 0.5px;">
          MEMERINTAHKAN :
        </div>

        <!-- KEPADA SAUDARA -->
        <table style="width: 100%; border: none !important; margin-bottom: 14px; font-size: 11pt; border-collapse: collapse;">
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Kepada Saudara.</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0;"></td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Nama</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0; font-weight: bold;">${data.name}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">NIP</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0;">${data.nip}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Pangkat/Gol.Ruang</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0;">${data.rank}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Jabatan</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0;">${data.position}</td>
          </tr>
        </table>

        <!-- UNTUK -->
        <table style="width: 100%; border: none !important; margin-bottom: 12px; font-size: 11pt; border-collapse: collapse;">
          <tr style="border: none !important;">
            <td style="width: 25%; vertical-align: top; border: none !important; padding: 2px 0;">Untuk</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 72%; vertical-align: top; border: none !important; padding: 2px 0; text-align: justify;">
              ${data.purpose}
            </td>
          </tr>
        </table>

        <!-- RINCIAN WAKTU & TEMPAT UNTUK (MENJOROK SESUAI TATA LETAK RESMI) -->
        <table style="width: 100%; border: none !important; margin-bottom: 14px; font-size: 11pt; border-collapse: collapse;">
          <tr style="border: none !important;">
            <td style="width: 28%; border: none !important;"></td>
            <td style="width: 15%; vertical-align: top; border: none !important; padding: 2px 0;">Hari</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 54%; vertical-align: top; border: none !important; padding: 2px 0;">${data.day}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 28%; border: none !important;"></td>
            <td style="width: 15%; vertical-align: top; border: none !important; padding: 2px 0;">Tanggal</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 54%; vertical-align: top; border: none !important; padding: 2px 0;">${data.dateStr}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 28%; border: none !important;"></td>
            <td style="width: 15%; vertical-align: top; border: none !important; padding: 2px 0;">Pukul</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 54%; vertical-align: top; border: none !important; padding: 2px 0;">${data.timeStr}</td>
          </tr>
          <tr style="border: none !important;">
            <td style="width: 28%; border: none !important;"></td>
            <td style="width: 15%; vertical-align: top; border: none !important; padding: 2px 0;">Tempat</td>
            <td style="width: 3%; vertical-align: top; border: none !important; padding: 2px 0;">:</td>
            <td style="width: 54%; vertical-align: top; border: none !important; padding: 2px 0;">${data.location}</td>
          </tr>
        </table>

        <!-- PENUTUP -->
        <div style="margin-top: 14px; text-align: justify; line-height: 1.5;">
          Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.
        </div>

        <!-- TANDA TANGAN KEPALA SEKOLAH (DARI DEWAN GURU) & QR VALIDASI -->
        <table style="width: 100%; border: none !important; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
          <tr style="border: none !important;">
            <td style="width: 45%; vertical-align: top; border: none !important; padding: 0;">
              <div style="display: flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 6px; width: fit-content; background: #fafafa;">
                <img src="${qrUrl}" alt="QR Validasi" style="width: 46px; height: 46px;" />
                <div style="font-family: Arial, sans-serif; font-size: 7pt; color: #475569;">
                  <div style="font-weight: bold; color: #0284c7;">VERIFIKASI RESMI</div>
                  <div style="font-weight: bold;">SMP NEGERI 3 KRAS</div>
                  <div style="font-family: monospace; font-size: 6pt; color: #64748b;">${refNum}</div>
                </div>
              </div>
            </td>
            <td style="width: 10%; border: none !important;"></td>
            <td style="width: 45%; text-align: center; vertical-align: top; border: none !important; padding: 0;">
              <div>Kras, ${formattedDocDate}</div>
              <div style="font-weight: bold; margin-top: 2px;">${headmaster.title}</div>
              <div style="height: 50px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">${headmaster.name}</div>
              <div style="font-size: 9.5pt;">${headmaster.rank}</div>
              <div style="font-size: 9.5pt;">NIP. ${headmaster.nip}</div>
            </td>
          </tr>
        </table>

        <!-- CATATAN FOOTER -->
        <div style="margin-top: 25px; font-size: 9.5pt; color: #000000;">
          <div>Catatan :</div>
          <div style="margin-left: 10px;">- &nbsp;Harap melaporkan hasil kegiatan kepada Pimpinan / Kepala Sekolah.</div>
        </div>

      </div>
    `;
  }

  // Determine official title & structure based on selected draft
  let officialTitle = 'SURAT DINAS RESMI';
  let isUnderlinedTitle = true;

  if (templateType === 'wali_aktif' || templateType === 'aktif-belajar') {
    officialTitle = 'SURAT KETERANGAN SISWA AKTIF BELAJAR';
  } else if (templateType === 'guru_izin' || templateType === 'guru_cuti') {
    officialTitle = 'SURAT KETERANGAN IZIN / CUTI PEGAWAI';
  } else if (templateType === 'wali_pindah' || templateType === 'pindah-sekolah') {
    officialTitle = 'SURAT KETERANGAN PINDAH SEKOLAH';
  } else if (templateType === 'wali_kelakuan_baik' || templateType === 'kelakuan-baik') {
    officialTitle = 'SURAT KETERANGAN BERKELAKUAN BAIK';
  } else if (templateType === 'wali_dispensasi' || templateType === 'dispensasi-siswa') {
    officialTitle = 'SURAT DISPENSASI SISWA';
  } else if (templateType === 'guru_rekomendasi_lomba' || templateType === 'rekomendasi-beasiswa') {
    officialTitle = 'SURAT REKOMENDASI';
  } else if (letter.title) {
    officialTitle = letter.title.toUpperCase();
  }

  return `
    <div style="background: #ffffff; color: #000000; padding: 25px 30px; font-family: 'Times New Roman', Times, serif; line-height: 1.5; font-size: 11pt; max-width: 800px; margin: 0 auto;">
      
      <!-- KOP RESMI SEKOLAH DUAL LOGO -->
      ${renderOfficialKopHTML(config, false)}

      <!-- JUDUL SURAT RESMI & NOMOR REGISTER -->
      <div style="text-align: center; margin: 15px 0 20px 0;">
        <div style="font-size: 13pt; font-weight: bold; ${isUnderlinedTitle ? 'text-decoration: underline;' : ''} text-transform: uppercase; letter-spacing: 0.5px;">
          ${officialTitle}
        </div>
        <div style="font-size: 10.5pt; margin-top: 3px; font-family: 'Times New Roman', Times, serif;">
          Nomor : <span style="font-family: monospace; font-weight: bold;">${letter.referenceNumber || '421/DRAF/SMP.03/' + new Date().getFullYear()}</span>
        </div>
      </div>

      <!-- KONTEN SURAT DINAS RESMI -->
      <div style="text-align: justify; text-indent: 30px; line-height: 1.6;">
        Yang bertanda tangan di bawah ini Kepala ${config.schoolName}, Kabupaten Kediri, dengan ini menerangkan / memberikan keputusan sebagai berikut:
      </div>

      <div style="margin: 14px 0 14px 10px; line-height: 1.65;">
        ${letter.description ? letter.description.replace(/\n/g, '<br/>') : `Terkait penerbitan naskah surat dinas mengenai ${letter.title}, agar dapat dipergunakan sebagaimana mestinya.`}
      </div>

      ${letter.source === 'portal_guru_wali' || letter.applicantName ? `
        <div style="margin: 14px 0; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: Arial, sans-serif; font-size: 8.5pt;">
          <div style="font-weight: bold; color: #0284c7;">STATUS VERIFIKASI & LEGALITAS NASKAH:</div>
          <div style="color: #334155;">Diterbitkan berdasarkan pengajuan resmi oleh: <b>${letter.applicantName || 'Pemohon'}</b> (${letter.applicantRole === 'guru' ? 'Guru' : 'Wali Murid'}) - Status: <b>${letter.submissionStatus === 'approved' ? 'Telah Diverifikasi & Sah' : 'Draf Pengajuan Terdaftar'}</b>.</div>
        </div>
      ` : ''}

      <div style="margin-top: 14px; text-align: justify; text-indent: 30px; line-height: 1.6;">
        Demikian surat dinas ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
      </div>

      <!-- TANDA TANGAN KEPALA SEKOLAH & QR VALIDASI -->
      <table style="width: 100%; border: none !important; margin-top: 35px; border-collapse: collapse; page-break-inside: avoid;">
        <tr style="border: none !important;">
          <td style="width: 45%; vertical-align: top; border: none !important; padding: 0;">
            <div style="display: flex; align-items: center; gap: 10px; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; width: fit-content; background: #fafafa;">
              <img src="${qrUrl}" alt="QR Validasi" style="width: 58px; height: 58px;" />
              <div style="font-family: Arial, sans-serif; font-size: 7.5pt; color: #475569;">
                <div style="font-weight: bold; color: #0284c7;">VERIFIKASI RESMI</div>
                <div style="font-weight: bold;">SMP NEGERI 3 KRAS</div>
                <div style="font-family: monospace; font-size: 6.5pt; color: #64748b;">${letter.referenceNumber}</div>
              </div>
            </div>
          </td>
          <td style="width: 10%; border: none !important;"></td>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none !important; padding: 0;">
            <div>Kediri, ${formattedDocDate}</div>
            <div style="font-weight: bold; margin-top: 2px;">${headmaster.title}</div>
            <div style="height: 55px;"></div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 11.5pt;">${headmaster.name}</div>
            <div style="font-size: 9.5pt;">${headmaster.rank}</div>
            <div style="font-size: 9.5pt;">NIP. ${headmaster.nip}</div>
          </td>
        </tr>
      </table>

    </div>
  `;
}

/**
 * 3. Generates Combined HTML (Surat Permohonan + Surat Resmi Sekolah)
 */
export async function generateCombinedDraftHTML(letter: Letter, cfg?: SchoolConfig, teachersList?: Teacher[]): Promise<string> {
  const permohonanHtml = generateSuratPermohonanHTML(letter, cfg);
  const resmiHtml = await generateSuratDinasResmiHTML(letter, cfg, teachersList);

  return `
    <div style="width: 100%; background: #ffffff; color: #000000;">
      <!-- HALAMAN 1: SURAT PERMOHONAN -->
      <div style="padding-bottom: 20px;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-family: Arial, sans-serif; font-size: 9pt; color: #166534; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
          <span>📄 HALAMAN 1: SURAT PERMOHONAN DARI PEMOHON (${(letter.applicantRole || 'Guru/Wali').toUpperCase()})</span>
          <span style="font-size: 8pt; font-weight: normal;">Arsip Pengajuan</span>
        </div>
        ${permohonanHtml}
      </div>

      <!-- PEMBATAS HALAMAN CETAK -->
      <div style="page-break-after: always; height: 1px; margin: 30px 0; border-bottom: 2px dashed #94a3b8; text-align: center; position: relative;">
        <span style="background: #ffffff; padding: 0 10px; font-size: 8.5pt; color: #64748b; font-family: Arial, sans-serif; position: relative; top: -10px;">
          --- BATAS HALAMAN CETAK DOKUMEN ---
        </span>
      </div>

      <!-- HALAMAN 2: SURAT DINAS RESMI SEKOLAH -->
      <div style="padding-top: 10px;">
        <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-family: Arial, sans-serif; font-size: 9pt; color: #1e40af; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
          <span>📜 HALAMAN 2: SURAT DINAS RESMI SEKOLAH SESUAI DRAF YANG DIPILIH</span>
          <span style="font-size: 8pt; font-weight: normal;">Naskah Resmi Sekolah</span>
        </div>
        ${resmiHtml}
      </div>
    </div>
  `;
}

/**
 * 4. Generates and Downloads PDF for Surat Permohonan (Single Page)
 */
export function generateSuratPermohonanPDF(letter: Letter, cfg?: SchoolConfig, saveDoc = true): jsPDF {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('p', 'mm', 'a4');
  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });

  const applicantName = letter.applicantName || letter.receivedBy?.split('(')[0]?.trim() || 'Pemohon';
  const applicantPhone = letter.applicantPhone || '-';
  const applicantRole = letter.applicantRole === 'guru' ? 'Guru / Tenaga Pendidik' : (letter.applicantRole === 'wali' ? 'Orang Tua / Wali Murid' : 'Pemohon');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text('SURAT PERMOHONAN PENGAJUAN', 15, 20);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Kediri, ${formattedDocDate}`, 140, 20);

  doc.text('Nomor', 15, 28);
  doc.text(':', 35, 28);
  doc.text('- (Permohonan Mandiri)', 38, 28);

  doc.text('Lampiran', 15, 34);
  doc.text(':', 35, 34);
  doc.text('1 (Satu) Berkas Pengajuan', 38, 34);

  doc.text('Perihal', 15, 40);
  doc.text(':', 35, 40);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(`Permohonan Penerbitan ${letter.title}`, 85);
  doc.text(splitTitle, 38, 40);

  // Recipient
  doc.setFont('helvetica', 'normal');
  doc.text('Kepada Yth :', 140, 28);
  doc.setFont('helvetica', 'bold');
  doc.text(`Kepala ${config.schoolName}`, 140, 34);
  doc.setFont('helvetica', 'normal');
  doc.text('di -', 140, 40);
  doc.text('     Tempat', 140, 45);

  const bodyStartY = Math.max(50 + (splitTitle.length * 5), 58);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, bodyStartY - 4, 195, bodyStartY - 4);

  doc.text('Dengan hormat,', 15, bodyStartY);
  doc.text('Saya yang bertanda tangan di bawah ini:', 15, bodyStartY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Nama Lengkap', 20, bodyStartY + 14);
  doc.text('Status / Peran', 20, bodyStartY + 20);
  doc.text('No. HP / WhatsApp', 20, bodyStartY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${applicantName}`, 65, bodyStartY + 14);
  doc.text(`:  ${applicantRole}`, 65, bodyStartY + 20);
  doc.text(`:  ${applicantPhone}`, 65, bodyStartY + 26);

  const introY = bodyStartY + 35;
  const introText = `Dengan ini mengajukan permohonan kepada Bapak/Ibu Kepala ${config.schoolName} agar kiranya berkenan menerbitkan naskah surat dinas resmi perihal "${letter.title}" dengan rincian data sebagai berikut:`;
  const splitIntro = doc.splitTextToSize(introText, 180);
  doc.text(splitIntro, 15, introY);

  // Rincian Box
  const boxY = introY + (splitIntro.length * 5.2) + 3;
  const splitDesc = doc.splitTextToSize(letter.description || letter.title, 170);
  const boxHeight = Math.max(splitDesc.length * 5 + 14, 28);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, boxY, 180, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('RINCIAN MAKSUD & DATA PENGAJUAN:', 19, boxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(splitDesc, 19, boxY + 11.5);
  doc.setTextColor(0, 0, 0);

  const closingY = boxY + boxHeight + 8;
  doc.setFontSize(10);
  const closingText = 'Demikian surat permohonan ini saya ajukan dengan sebenar-benarnya. Besar harapan saya kiranya Bapak/Ibu berkenan memproses dan menerbitkan surat yang dimaksud. Atas perhatian dan bantuannya disampaikan terima kasih.';
  const splitClosing = doc.splitTextToSize(closingText, 180);
  doc.text(splitClosing, 15, closingY);

  // Signature
  const sigY = Math.max(closingY + (splitClosing.length * 5) + 12, 225);
  doc.text(`Kediri, ${formattedDocDate}`, 140, sigY);
  doc.text('Hormat saya, Pemohon', 140, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(applicantName, 140, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`No. HP: ${applicantPhone}`, 140, sigY + 28);

  if (saveDoc) {
    const cleanTitle = (letter.title || 'Permohonan').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Surat_Permohonan_${cleanTitle}_${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }

  return doc;
}

/**
 * 5. Generates and Downloads PDF for Surat Dinas Resmi Sekolah Sesuai Draf
 */
export async function generateSuratDinasResmiPDF(letter: Letter, cfg?: SchoolConfig, saveDoc = true, teachersList?: Teacher[]): Promise<jsPDF> {
  const config = cfg || getSchoolConfig();
  const doc = new jsPDF('p', 'mm', 'a4');
  const headmaster = getHeadmasterDetails(teachersList, config);
  
  // Kop Resmi Sekolah
  drawPdfKopHeader(doc, config, false);

  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });

  const templateType = letter.templateType || '';
  const isSuratTugas = templateType === 'guru_tugas' || templateType === 'surat-tugas' || letter.title.toLowerCase().includes('tugas');

  if (isSuratTugas) {
    const data = parseSuratTugasData(letter, teachersList);
    const refNum = letter.referenceNumber || `420.3/....../418.20.2.62.03/${new Date().getFullYear()}`;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('SURAT PERINTAH TUGAS', 105, 45, { align: 'center' });
    const titleWidth = doc.getTextWidth('SURAT PERINTAH TUGAS');
    doc.line(105 - (titleWidth / 2), 46.2, 105 + (titleWidth / 2), 46.2);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Nomor : ${refNum}`, 105, 51, { align: 'center' });

    // Dasar
    doc.text('Dasar', 15, 60);
    doc.text(':', 55, 60);
    const splitDasar = doc.splitTextToSize(data.dasar, 135);
    doc.text(splitDasar, 58, 60);

    const afterDasarY = 60 + (splitDasar.length * 5) + 3;

    // Memerintahkan
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('MEMERINTAHKAN :', 105, afterDasarY, { align: 'center' });

    // Kepada Saudara
    const kpdY = afterDasarY + 7;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Kepada Saudara.', 15, kpdY);
    doc.text(':', 55, kpdY);

    doc.text('Nama', 15, kpdY + 6);
    doc.text(':', 55, kpdY + 6);
    doc.setFont('times', 'bold');
    doc.text(data.name, 58, kpdY + 6);

    doc.setFont('times', 'normal');
    doc.text('NIP', 15, kpdY + 12);
    doc.text(':', 55, kpdY + 12);
    doc.text(data.nip, 58, kpdY + 12);

    doc.text('Pangkat/Gol.Ruang', 15, kpdY + 18);
    doc.text(':', 55, kpdY + 18);
    doc.text(data.rank, 58, kpdY + 18);

    doc.text('Jabatan', 15, kpdY + 24);
    doc.text(':', 55, kpdY + 24);
    doc.text(data.position, 58, kpdY + 24);

    // Untuk
    const untukY = kpdY + 33;
    doc.text('Untuk', 15, untukY);
    doc.text(':', 55, untukY);

    const splitPurpose = doc.splitTextToSize(data.purpose, 135);
    doc.text(splitPurpose, 58, untukY);

    const detailsY = untukY + (splitPurpose.length * 5) + 3;

    // Menjorok Rincian Waktu & Tempat
    doc.text('Hari', 70, detailsY);
    doc.text(':', 95, detailsY);
    doc.text(data.day, 98, detailsY);

    doc.text('Tanggal', 70, detailsY + 6);
    doc.text(':', 95, detailsY + 6);
    doc.text(data.dateStr, 98, detailsY + 6);

    doc.text('Pukul', 70, detailsY + 12);
    doc.text(':', 95, detailsY + 12);
    doc.text(data.timeStr, 98, detailsY + 12);

    doc.text('Tempat', 70, detailsY + 18);
    doc.text(':', 95, detailsY + 18);
    const splitLoc = doc.splitTextToSize(data.location, 95);
    doc.text(splitLoc, 98, detailsY + 18);

    const penutupY = detailsY + 18 + (splitLoc.length * 5) + 4;
    doc.text('Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.', 15, penutupY);

    // Tanda Tangan & QR
    const sigY = Math.max(penutupY + 14, 215);

    try {
      const qrData = await generateLetterQRCode(letter);
      doc.addImage(qrData, 'PNG', 20, sigY - 5, 22, 22);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('VERIFIKASI RESMI', 20, sigY + 20);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('SMPN 3 Kras Kediri', 20, sigY + 23.5);
      doc.setTextColor(0, 0, 0);
    } catch (e) {
      console.error(e);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Kras, ${formattedDocDate}`, 135, sigY);
    doc.setFont('times', 'bold');
    doc.text(headmaster.title, 135, sigY + 5);
    doc.text(headmaster.name, 135, sigY + 24);
    const hmWidth = doc.getTextWidth(headmaster.name);
    doc.line(135, sigY + 25, 135 + hmWidth, sigY + 25);
    doc.setFont('times', 'normal');
    doc.text(headmaster.rank, 135, sigY + 29);
    if (headmaster.nip) {
      doc.text(`NIP. ${headmaster.nip}`, 135, sigY + 33);
    }

    // Catatan Footer
    doc.setFontSize(8.5);
    doc.setFont('times', 'normal');
    doc.text('Catatan :', 15, 273);
    doc.text('- Harap melaporkan hasil kegiatan kepada Pimpinan / Kepala Sekolah.', 15, 277.5);

    if (saveDoc) {
      const cleanRef = (refNum).replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Surat_Perintah_Tugas_${cleanRef}.pdf`);
    }

    return doc;
  }

  let officialTitle = 'SURAT DINAS RESMI';

  if (templateType === 'wali_aktif' || templateType === 'aktif-belajar') {
    officialTitle = 'SURAT KETERANGAN SISWA AKTIF BELAJAR';
  } else if (templateType === 'guru_izin' || templateType === 'guru_cuti') {
    officialTitle = 'SURAT KETERANGAN IZIN / CUTI PEGAWAI';
  } else if (templateType === 'wali_pindah' || templateType === 'pindah-sekolah') {
    officialTitle = 'SURAT KETERANGAN PINDAH SEKOLAH';
  } else if (templateType === 'wali_kelakuan_baik' || templateType === 'kelakuan-baik') {
    officialTitle = 'SURAT KETERANGAN BERKELAKUAN BAIK';
  } else if (templateType === 'wali_dispensasi' || templateType === 'dispensasi-siswa') {
    officialTitle = 'SURAT DISPENSASI SISWA';
  } else if (templateType === 'guru_rekomendasi_lomba' || templateType === 'rekomendasi-beasiswa') {
    officialTitle = 'SURAT REKOMENDASI';
  } else if (letter.title) {
    officialTitle = letter.title.toUpperCase();
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(officialTitle, 105, 45, { align: 'center' });
  doc.line(45, 46.5, 165, 46.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor: ${letter.referenceNumber || '421/DRAF/SMP.03/' + new Date().getFullYear()}`, 105, 51, { align: 'center' });

  doc.text(`Yang bertanda tangan di bawah ini Kepala ${config.schoolName}, menerangkan dengan sesungguhnya bahwa:`, 15, 62);

  const mainContent = letter.description || letter.title;
  const splitContent = doc.splitTextToSize(mainContent, 180);
  doc.text(splitContent, 15, 71);

  const afterContentY = 71 + (splitContent.length * 5.5) + 6;

  doc.text('Demikian surat dinas resmi ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', 15, afterContentY);

  // Signatures & QR
  const sigY = Math.max(afterContentY + 16, 215);

  try {
    const qrData = await generateLetterQRCode(letter);
    doc.addImage(qrData, 'PNG', 20, sigY - 5, 24, 24);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text('DIGITAL VERIFIED', 20, sigY + 23);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Validitas SMPN 3 Kras', 20, sigY + 26.5);
    doc.setTextColor(0, 0, 0);
  } catch (e) {
    console.error(e);
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Kediri, ${formattedDocDate}`, 135, sigY);
  doc.text(`${headmaster.title}`, 135, sigY + 5);
  doc.setFont('times', 'bold');
  doc.text(headmaster.name, 135, sigY + 24);
  doc.setFont('times', 'normal');
  doc.text(headmaster.rank, 135, sigY + 28);
  if (headmaster.nip) {
    doc.text(`NIP. ${headmaster.nip}`, 135, sigY + 32);
  }

  if (saveDoc) {
    const cleanRef = (letter.referenceNumber || officialTitle).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Surat_Resmi_${cleanRef}.pdf`);
  }

  return doc;
}

/**
 * 6. Generates and Downloads 2-Page PDF Package: Page 1 = Surat Permohonan, Page 2 = Surat Resmi Sekolah Sesuai Draf
 */
export async function generateCombinedDraftPDF(letter: Letter, cfg?: SchoolConfig, teachersList?: Teacher[]): Promise<void> {
  const config = cfg || getSchoolConfig();
  const doc = generateSuratPermohonanPDF(letter, config, false);
  const headmaster = getHeadmasterDetails(teachersList, config);

  // Add Page 2 for Surat Resmi
  doc.addPage();
  
  // Kop Resmi on Page 2
  drawPdfKopHeader(doc, config, false);

  const formattedDocDate = letter.documentDate 
    ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) 
    : format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });

  const templateType = letter.templateType || '';
  const isSuratTugas = templateType === 'guru_tugas' || templateType === 'surat-tugas' || letter.title.toLowerCase().includes('tugas');

  if (isSuratTugas) {
    const data = parseSuratTugasData(letter, teachersList);
    const refNum = letter.referenceNumber || `420.3/....../418.20.2.62.03/${new Date().getFullYear()}`;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('SURAT PERINTAH TUGAS', 105, 45, { align: 'center' });
    const titleWidth = doc.getTextWidth('SURAT PERINTAH TUGAS');
    doc.line(105 - (titleWidth / 2), 46.2, 105 + (titleWidth / 2), 46.2);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Nomor : ${refNum}`, 105, 51, { align: 'center' });

    // Dasar
    doc.text('Dasar', 15, 60);
    doc.text(':', 55, 60);
    const splitDasar = doc.splitTextToSize(data.dasar, 135);
    doc.text(splitDasar, 58, 60);

    const afterDasarY = 60 + (splitDasar.length * 5) + 3;

    // Memerintahkan
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('MEMERINTAHKAN :', 105, afterDasarY, { align: 'center' });

    // Kepada Saudara
    const kpdY = afterDasarY + 7;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Kepada Saudara.', 15, kpdY);
    doc.text(':', 55, kpdY);

    doc.text('Nama', 15, kpdY + 6);
    doc.text(':', 55, kpdY + 6);
    doc.setFont('times', 'bold');
    doc.text(data.name, 58, kpdY + 6);

    doc.setFont('times', 'normal');
    doc.text('NIP', 15, kpdY + 12);
    doc.text(':', 55, kpdY + 12);
    doc.text(data.nip, 58, kpdY + 12);

    doc.text('Pangkat/Gol.Ruang', 15, kpdY + 18);
    doc.text(':', 55, kpdY + 18);
    doc.text(data.rank, 58, kpdY + 18);

    doc.text('Jabatan', 15, kpdY + 24);
    doc.text(':', 55, kpdY + 24);
    doc.text(data.position, 58, kpdY + 24);

    // Untuk
    const untukY = kpdY + 33;
    doc.text('Untuk', 15, untukY);
    doc.text(':', 55, untukY);

    const splitPurpose = doc.splitTextToSize(data.purpose, 135);
    doc.text(splitPurpose, 58, untukY);

    const detailsY = untukY + (splitPurpose.length * 5) + 3;

    // Menjorok Rincian Waktu & Tempat
    doc.text('Hari', 70, detailsY);
    doc.text(':', 95, detailsY);
    doc.text(data.day, 98, detailsY);

    doc.text('Tanggal', 70, detailsY + 6);
    doc.text(':', 95, detailsY + 6);
    doc.text(data.dateStr, 98, detailsY + 6);

    doc.text('Pukul', 70, detailsY + 12);
    doc.text(':', 95, detailsY + 12);
    doc.text(data.timeStr, 98, detailsY + 12);

    doc.text('Tempat', 70, detailsY + 18);
    doc.text(':', 95, detailsY + 18);
    const splitLoc = doc.splitTextToSize(data.location, 95);
    doc.text(splitLoc, 98, detailsY + 18);

    const penutupY = detailsY + 18 + (splitLoc.length * 5) + 4;
    doc.text('Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.', 15, penutupY);

    // Tanda Tangan & QR
    const sigY = Math.max(penutupY + 14, 215);

    try {
      const qrData = await generateLetterQRCode(letter);
      doc.addImage(qrData, 'PNG', 20, sigY - 5, 22, 22);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('VERIFIKASI RESMI', 20, sigY + 20);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('SMPN 3 Kras Kediri', 20, sigY + 23.5);
      doc.setTextColor(0, 0, 0);
    } catch (e) {
      console.error(e);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Kras, ${formattedDocDate}`, 135, sigY);
    doc.setFont('times', 'bold');
    doc.text(headmaster.title, 135, sigY + 5);
    doc.text(headmaster.name, 135, sigY + 24);
    const hmWidth = doc.getTextWidth(headmaster.name);
    doc.line(135, sigY + 25, 135 + hmWidth, sigY + 25);
    doc.setFont('times', 'normal');
    doc.text(headmaster.rank, 135, sigY + 29);
    if (headmaster.nip) {
      doc.text(`NIP. ${headmaster.nip}`, 135, sigY + 33);
    }

    // Catatan Footer
    doc.setFontSize(8.5);
    doc.setFont('times', 'normal');
    doc.text('Catatan :', 15, 273);
    doc.text('- Harap melaporkan hasil kegiatan kepada Pimpinan / Kepala Sekolah.', 15, 277.5);

    const cleanRef = (refNum).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Paket_Lengkap_Surat_Tugas_${cleanRef}.pdf`);
    return;
  }

  let officialTitle = 'SURAT DINAS RESMI';

  if (templateType === 'wali_aktif' || templateType === 'aktif-belajar') {
    officialTitle = 'SURAT KETERANGAN SISWA AKTIF BELAJAR';
  } else if (templateType === 'guru_izin' || templateType === 'guru_cuti') {
    officialTitle = 'SURAT KETERANGAN IZIN / CUTI PEGAWAI';
  } else if (templateType === 'wali_pindah' || templateType === 'pindah-sekolah') {
    officialTitle = 'SURAT KETERANGAN PINDAH SEKOLAH';
  } else if (templateType === 'wali_kelakuan_baik' || templateType === 'kelakuan-baik') {
    officialTitle = 'SURAT KETERANGAN BERKELAKUAN BAIK';
  } else if (templateType === 'wali_dispensasi' || templateType === 'dispensasi-siswa') {
    officialTitle = 'SURAT DISPENSASI SISWA';
  } else if (templateType === 'guru_rekomendasi_lomba' || templateType === 'rekomendasi-beasiswa') {
    officialTitle = 'SURAT REKOMENDASI';
  } else if (letter.title) {
    officialTitle = letter.title.toUpperCase();
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(officialTitle, 105, 45, { align: 'center' });
  doc.line(45, 46.5, 165, 46.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor: ${letter.referenceNumber || '421/DRAF/SMP.03/' + new Date().getFullYear()}`, 105, 51, { align: 'center' });

  doc.text(`Yang bertanda tangan di bawah ini Kepala ${config.schoolName}, menerangkan dengan sesungguhnya bahwa:`, 15, 62);

  const mainContent = letter.description || letter.title;
  const splitContent = doc.splitTextToSize(mainContent, 180);
  doc.text(splitContent, 15, 71);

  const afterContentY = 71 + (splitContent.length * 5.5) + 6;
  doc.text('Demikian surat dinas resmi ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', 15, afterContentY);

  const sigY = Math.max(afterContentY + 16, 215);

  try {
    const qrData = await generateLetterQRCode(letter);
    doc.addImage(qrData, 'PNG', 20, sigY - 5, 24, 24);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text('DIGITAL VERIFIED', 20, sigY + 23);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Validitas SMPN 3 Kras', 20, sigY + 26.5);
    doc.setTextColor(0, 0, 0);
  } catch (e) {
    console.error(e);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Kediri, ${formattedDocDate}`, 135, sigY);
  doc.text(`Kepala ${config.schoolName},`, 135, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(config.headmaster, 135, sigY + 24);
  doc.setFont('helvetica', 'normal');
  if (config.headmasterNip) {
    doc.text(`NIP. ${config.headmasterNip}`, 135, sigY + 28);
  }

  const cleanTitle = (letter.title || 'Paket_Draf_Lengkap').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Paket_Lengkap_Permohonan_dan_Surat_Resmi_${cleanTitle}.pdf`);
}

