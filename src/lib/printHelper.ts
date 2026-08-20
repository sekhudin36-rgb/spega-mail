import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Letter, Archive } from './db';
import QRCode from 'qrcode';

/**
 * Built-in high-fidelity SVG Preset Logos
 * Left Logo: Official Tut Wuri Handayani / Logo Sekolah Crest
 * Right Logo: Official Dinas Pendidikan / Lambang Instansi Daerah
 */
export const DEFAULT_LEFT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="tutwuri_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="gold_flame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <!-- Outer Pentagon Shield -->
  <polygon points="50,4 94,36 77,88 23,88 6,36" fill="url(#tutwuri_bg)" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round" />
  <polygon points="50,9 89,38 74,83 26,83 11,38" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.9" />
  <!-- Wing & Flame (Tut Wuri Symbol) -->
  <path d="M50,18 C53,26 62,32 68,30 C64,36 57,39 50,44 C43,39 36,36 32,30 C38,32 47,26 50,18 Z" fill="url(#gold_flame)" stroke="#a16207" stroke-width="0.8" />
  <path d="M50,23 C52,29 59,34 64,33 C58,38 52,40 50,44 C48,40 42,38 36,33 C41,34 48,29 50,23 Z" fill="#ffffff" opacity="0.9" />
  <!-- Open Book -->
  <path d="M50,49 Q65,45 80,48 L80,68 Q65,65 50,70 Q35,65 20,68 L20,48 Q35,45 50,49 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
  <line x1="50" y1="49" x2="50" y2="70" stroke="#0f172a" stroke-width="1.5" />
  <line x1="28" y1="55" x2="44" y2="54" stroke="#0284c7" stroke-width="1" />
  <line x1="28" y1="60" x2="44" y2="59" stroke="#0284c7" stroke-width="1" />
  <line x1="56" y1="54" x2="72" y2="55" stroke="#0284c7" stroke-width="1" />
  <line x1="56" y1="59" x2="72" y2="60" stroke="#0284c7" stroke-width="1" />
  <!-- Lower Ribbon / Motto -->
  <path d="M22,76 Q50,71 78,76 L74,83 Q50,79 26,83 Z" fill="#facc15" stroke="#854d0e" stroke-width="0.8" />
  <text x="50" y="80.5" font-family="Arial, sans-serif" font-size="4.8" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="0.3">TUT WURI HANDAYANI</text>
</svg>
`)}`;

export const DEFAULT_RIGHT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="dinas_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="gold_star" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>
  <!-- Shield with Gold Border -->
  <path d="M50,4 C78,4 92,18 92,48 C92,72 68,90 50,96 C32,90 8,72 8,48 C8,18 22,4 50,4 Z" fill="url(#dinas_bg)" stroke="#f59e0b" stroke-width="3" />
  <path d="M50,9 C74,9 86,21 86,48 C86,68 65,84 50,89 C35,84 14,68 14,48 C14,21 26,9 50,9 Z" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.85" />
  <!-- Golden Star -->
  <polygon points="50,14 53,23 62,23 55,28 58,37 50,32 42,37 45,28 38,23 47,23" fill="url(#gold_star)" stroke="#78350f" stroke-width="0.7" />
  <!-- Circular Emblem / Ring -->
  <circle cx="50" cy="52" r="17" fill="#ffffff" stroke="#f59e0b" stroke-width="1.8" />
  <circle cx="50" cy="52" r="14" fill="#0284c7" />
  <!-- Inner Symbol (Torch / Education Light) -->
  <path d="M50,42 L52,47 L48,47 Z" fill="#ef4444" />
  <circle cx="50" cy="41" r="2.5" fill="#fbbf24" />
  <path d="M47,48 L53,48 L51,58 L49,58 Z" fill="#facc15" stroke="#78350f" stroke-width="0.5" />
  <!-- Padi & Kapas Arch -->
  <path d="M28,62 C26,45 32,32 44,27" fill="none" stroke="#fde047" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,2" />
  <path d="M72,62 C74,45 68,32 56,27" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,2" />
  <!-- Banner DINAS PENDIDIKAN -->
  <path d="M18,74 Q50,68 82,74 L78,82 Q50,77 22,82 Z" fill="#f59e0b" stroke="#78350f" stroke-width="0.8" />
  <text x="50" y="79" font-family="Arial, sans-serif" font-size="4.8" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="0.3">DINAS PENDIDIKAN</text>
</svg>
`)}`;

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
  leftLogo?: string;   // Logo Sekolah / Tut Wuri Handayani (Kiri)
  rightLogo?: string;  // Logo Dinas Pendidikan / Lambang Daerah (Kanan)
  showKopLogos?: boolean;
}

export function getSchoolConfig(): SchoolConfig {
  const savedAdmin = localStorage.getItem('adminName');
  const normalizedAdmin = (!savedAdmin || savedAdmin.toLowerCase().includes('sekhudin')) ? 'Admin' : savedAdmin;

  // Retrieve logos with fallback to default presets
  const leftLogo = localStorage.getItem('leftLogo') || localStorage.getItem('schoolLogoLeft') || localStorage.getItem('schoolLogo') || DEFAULT_LEFT_LOGO;
  const rightLogo = localStorage.getItem('rightLogo') || localStorage.getItem('schoolLogoRight') || DEFAULT_RIGHT_LOGO;
  const showKopLogos = localStorage.getItem('showKopLogos') !== 'false';

  return {
    schoolName: localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS',
    schoolKop: localStorage.getItem('schoolKop') || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN',
    address: localStorage.getItem('address') || localStorage.getItem('schoolAddress') || 'Jalan Raya Jabang Kras, Kediri, Jawa Timur 64172',
    phone: localStorage.getItem('phone') || '(0354) 771234',
    email: localStorage.getItem('email') || 'smpn3kras@kedirikab.go.id',
    headmaster: localStorage.getItem('headmaster') || 'Dr. Budi Santoso, M.Pd',
    headmasterNip: localStorage.getItem('headmasterNip') || '19800101 200501 1 001',
    adminName: normalizedAdmin,
    adminNip: localStorage.getItem('adminNip') || '19900202 201502 2 002',
    leftLogo,
    rightLogo,
    showKopLogos
  };
}

/**
 * Render official Indonesian School Letterhead / Kop Dinas with Dual Logos
 * Left: Logo Sekolah / Tut Wuri Handayani
 * Center: Nama Instansi & Sekolah
 * Right: Logo Dinas Pendidikan / Pemda
 */
export function renderOfficialKopHTML(config: SchoolConfig, isLandscape = true): string {
  const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n').filter(Boolean);
  const leftLogo = config.leftLogo || DEFAULT_LEFT_LOGO;
  const rightLogo = config.rightLogo || DEFAULT_RIGHT_LOGO;
  const showLogos = config.showKopLogos !== false;

  const logoH = isLandscape ? '65px' : '56px';
  const logoW = isLandscape ? '70px' : '60px';

  return `
    <div class="kop-container" style="border-bottom: 3.5px double #000000; padding-bottom: 8px; margin-bottom: 12px; position: relative; width: 100%;">
      <table style="width: 100%; border: none !important; border-collapse: collapse; margin: 0; background: transparent;">
        <tr style="border: none !important; background: transparent;">
          ${showLogos && leftLogo ? `
            <td style="width: ${logoW}; text-align: center; vertical-align: middle; border: none !important; padding: 0 8px 0 0;">
              <img src="${leftLogo}" alt="Logo Sekolah" style="max-height: ${logoH}; max-width: ${logoW}; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto;" />
            </td>
          ` : `<td style="width: 8px; border: none !important; padding: 0;"></td>`}
          
          <td style="text-align: center; vertical-align: middle; border: none !important; padding: 0 6px;">
            <div style="font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #000000;">
              ${kopLines.map(line => `<div style="font-size: ${isLandscape ? '11pt' : '10pt'}; font-weight: bold; line-height: 1.25; letter-spacing: 0.5px; margin: 0;">${line}</div>`).join('')}
              <div style="font-size: ${isLandscape ? '15pt' : '13.5pt'}; font-weight: bold; letter-spacing: 1px; margin: 3px 0 2px 0; line-height: 1.15;">${config.schoolName}</div>
              <div style="font-size: 8pt; font-weight: normal; font-family: Arial, Helvetica, sans-serif; line-height: 1.35; text-transform: none; color: #111111;">
                ${config.address} ${config.phone ? `• Telp: ${config.phone}` : ''} ${config.email ? `• Email: ${config.email}` : ''}
              </div>
            </div>
          </td>

          ${showLogos && rightLogo ? `
            <td style="width: ${logoW}; text-align: center; vertical-align: middle; border: none !important; padding: 0 0 0 8px;">
              <img src="${rightLogo}" alt="Logo Dinas" style="max-height: ${logoH}; max-width: ${logoW}; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto;" />
            </td>
          ` : `<td style="width: 8px; border: none !important; padding: 0;"></td>`}
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
  rightRole = 'Petugas Persuratan'
): string {
  return `
    <table style="width: 100%; border: none !important; margin-top: 30px; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; page-break-inside: avoid; border-collapse: collapse;">
      <tr style="border: none !important;">
        <td style="width: 45%; text-align: center; border: none !important; vertical-align: top; padding: 0;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold; margin-top: 2px;">${leftRole}</div>
          <div style="height: 55px;"></div>
          <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">${config.headmaster}</div>
          <div style="font-size: 9pt; color: #111;">NIP. ${config.headmasterNip}</div>
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
export async function generateOfficialLetterHTML(letter: Letter, cfg?: SchoolConfig): Promise<string> {
  const config = cfg || getSchoolConfig();
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
            <div style="font-weight: bold; text-decoration: underline; font-size: 11.5pt;">${config.headmaster}</div>
            <div style="font-size: 9.5pt;">NIP. ${config.headmasterNip}</div>
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

