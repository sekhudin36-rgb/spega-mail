import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  type User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { type Letter, type Archive, db } from './db';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

export const DEFAULT_DRIVE_FOLDER_ID = '1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy';

// Memory cache for OAuth access token
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  folderName: string;
}

export function getRootFolderId(): string {
  return localStorage.getItem('googleDriveFolderId') || DEFAULT_DRIVE_FOLDER_ID;
}

export function setRootFolderId(folderId: string) {
  const cleanId = extractFolderId(folderId);
  localStorage.setItem('googleDriveFolderId', cleanId);
  window.dispatchEvent(new Event('googleDriveConfigChanged'));
}

export function extractFolderId(input: string): string {
  if (!input) return DEFAULT_DRIVE_FOLDER_ID;
  const trimmed = input.trim();
  // If it's a full Google Drive URL like https://drive.google.com/drive/folders/1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy?hl=ID
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it has id= parameter
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return trimmed;
}

export function getDriveFolderUrl(folderId?: string): string {
  const id = folderId || getRootFolderId();
  return `https://drive.google.com/drive/folders/${id}`;
}

export function isAutoSyncEnabled(): boolean {
  return localStorage.getItem('googleDriveAutoSync') === 'true';
}

export function setAutoSyncEnabled(enabled: boolean) {
  localStorage.setItem('googleDriveAutoSync', String(enabled));
}

// Auth Listeners
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need fresh sign-in popup to get access token with drive scope
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan Access Token Google Drive dari autentikasi');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Login Google ditutup oleh pengguna.');
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      const blockedError = new Error('Jendela pop-up login Google diblokir oleh peramban (browser). Harap izinkan pop-up atau buka aplikasi di Tab Baru.');
      console.warn('Google Sign-in popup blocked:', blockedError.message);
      throw blockedError;
    }
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGoogleUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const signOutGoogleDrive = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

// Google Drive API Helpers
export async function verifyFolderAccess(folderId: string, token: string): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,capabilities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: errData.error?.message || `HTTP ${res.status}: Akses folder ditolak atau folder tidak ditemukan.` 
      };
    }
    const data = await res.json();
    return { success: true, name: data.name };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal terhubung ke Google Drive API' };
  }
}

/**
 * Find or create a subfolder by name inside a parent folder in Google Drive
 */
export async function findOrCreateFolder(folderName: string, parentFolderId: string, token: string): Promise<string> {
  // Query existing folders with same name inside parent
  const q = `name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
  
  const searchRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(`Gagal membuat subfolder "${folderName}": ${errData.error?.message || createRes.statusText}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Upload a binary blob or file into Google Drive multipart upload
 */
export async function uploadFileToDrive(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
  token: string,
  description?: string
): Promise<DriveUploadResult> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [parentFolderId],
    description: description || 'Dokumen diunggah dari SPEGA MAIL SMP Negeri 3 Kras'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(fileBlob);
  });

  const arrayBuffer = await fileDataPromise;

  const metadataPart = new Blob([
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`
  ], { type: 'text/plain' });

  const closePart = new Blob([closeDelimiter], { type: 'text/plain' });
  const multipartBody = new Blob([metadataPart, arrayBuffer, closePart], {
    type: `multipart/related; boundary=${boundary}`
  });

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(`Gagal mengunggah file "${fileName}": ${errData.error?.message || uploadRes.statusText}`);
  }

  const result = await uploadRes.json();
  return {
    id: result.id,
    name: result.name,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    folderName: parentFolderId
  };
}

/**
 * Determine folder name based on letter type and category
 */
export function getFolderCategoryForLetter(letter: Letter): string {
  if (letter.type === 'inbox') {
    return '📁 Surat Masuk';
  }
  
  // Outbox categorization
  if (letter.category) {
    if (letter.category.includes('SK') || letter.category.toLowerCase().includes('keputusan')) {
      return '📁 Surat Keputusan (SK)';
    }
    if (letter.category.includes('Tugas') || letter.title.toLowerCase().includes('tugas')) {
      return '📁 Surat Tugas';
    }
    if (letter.category.includes('Undangan') || letter.title.toLowerCase().includes('undangan')) {
      return '📁 Undangan Resmi';
    }
    if (letter.category.includes('Kepegawaian')) {
      return '📁 Kepegawaian';
    }
    if (letter.category.includes('Kesiswaan')) {
      return '📁 Kesiswaan';
    }
  }

  return '📁 Surat Keluar';
}

/**
 * Determine folder name for Archive item
 */
export function getFolderCategoryForArchive(archive: Archive): string {
  if (archive.category) {
    if (archive.category.includes('SK') || archive.title.toLowerCase().includes('sk ')) {
      return '📁 Surat Keputusan (SK)';
    }
    if (archive.category.includes('Keuangan') || archive.category.includes('BOS')) {
      return '📁 Laporan Keuangan';
    }
    if (archive.category.includes('Kepegawaian')) {
      return '📁 Arsip Kepegawaian';
    }
    if (archive.category.includes('Kurikulum')) {
      return '📁 Arsip Kurikulum';
    }
    if (archive.category.includes('Kesiswaan')) {
      return '📁 Arsip Kesiswaan';
    }
  }
  return '📁 Arsip Dokumen';
}

/**
 * Clean string for safe file naming
 */
function sanitizeFileName(str: string): string {
  if (!str) return 'Dokumen';
  return str
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace illegal filesystem characters with dash
    .replace(/\s+/g, '_')           // Replace spaces with underscore
    .replace(/-+/g, '-')            // Collapse multiple dashes
    .replace(/_+/g, '_')            // Collapse multiple underscores
    .slice(0, 80);                  // Limit length
}

/**
 * Format file name with exact date according to user requirement:
 * Example: `2026-08-15_Surat-Keluar_421.2-085-SMPN3-VIII-2026_Undangan-Rapat-Pleno.pdf`
 */
export function formatLetterFileName(letter: Letter, ext: 'pdf' | 'json' = 'pdf'): string {
  const datePart = letter.date ? letter.date.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
  const typePart = letter.type === 'inbox' ? 'Surat-Masuk' : 'Surat-Keluar';
  const refPart = sanitizeFileName(letter.referenceNumber || letter.sequenceNumber || 'No-Ref');
  const titlePart = sanitizeFileName(letter.title || 'Tanpa-Judul');

  return `${datePart}_${typePart}_${refPart}_${titlePart}.${ext}`;
}

/**
 * Format archive file name with exact date
 */
export function formatArchiveFileName(archive: Archive, ext: 'pdf' | 'json' = 'pdf'): string {
  const datePart = archive.date ? archive.date.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
  const categoryPart = sanitizeFileName(archive.category || 'Arsip');
  const refPart = sanitizeFileName(archive.referenceNumber || archive.classificationCode || 'Doc');
  const titlePart = sanitizeFileName(archive.title || 'Dokumen');

  return `${datePart}_${categoryPart}_${refPart}_${titlePart}.${ext}`;
}

/**
 * Generate official PDF Document for a Letter (Lembar Disposisi / Kartu Surat / Detail Surat Resmi)
 */
export function generateLetterPDFBlob(letter: Letter): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const schoolName = localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS';
  const schoolKop = localStorage.getItem('schoolKop') || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN';
  const schoolAddress = localStorage.getItem('schoolAddress') || 'Jalan Raya Jabang Kras, Kediri, Jawa Timur';
  const schoolContact = localStorage.getItem('schoolContact') || 'Telp: (0354) XXXXXX | Email: smpn3kras@example.com';
  const headmaster = localStorage.getItem('headmaster') || 'Drs. H. Ahmad Santoso, M.Pd.';
  const headmasterNip = localStorage.getItem('headmasterNip') || '196805141994031004';

  // Kop Surat
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const kopLines = schoolKop.split('\n');
  let yPos = 14;
  kopLines.forEach(line => {
    doc.text(line.trim(), 105, yPos, { align: 'center' });
    yPos += 5;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(schoolName.toUpperCase(), 105, yPos, { align: 'center' });
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(schoolAddress, 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text(schoolContact, 105, yPos, { align: 'center' });
  yPos += 3;

  // Double Line
  doc.setLineWidth(0.8);
  doc.line(15, yPos, 195, yPos);
  doc.setLineWidth(0.3);
  doc.line(15, yPos + 1, 195, yPos + 1);
  yPos += 7;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const isInbox = letter.type === 'inbox';
  const headerTitle = isInbox ? 'LEMBAR DISPOSISI & KENDALI SURAT MASUK' : 'KARTU KENDALI & REGISTRASI SURAT KELUAR';
  doc.text(headerTitle, 105, yPos, { align: 'center' });
  yPos += 6;

  // Metadata Table
  const formattedDate = letter.date ? format(new Date(letter.date), 'dd MMMM yyyy', { locale: localeId }) : '-';
  const dateFormattedDoc = letter.documentDate ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: localeId }) : formattedDate;

  const tableRows = [
    ['Nomor Urut / Index', letter.sequenceNumber || letter.indexData || '-', 'Kode Klasifikasi', letter.code || '-'],
    ['Nomor Surat', letter.referenceNumber || '-', 'Tanggal Surat', dateFormattedDoc],
    ['Tanggal Diterima/Dibuat', formattedDate, 'Tingkat Urgensi', `${letter.urgency || 'Biasa'} / ${letter.securityStyle || 'Biasa'}`],
    [isInbox ? 'Pengirim / Asal Surat' : 'Tujuan / Penerima', letter.senderOrRecipient || '-', 'Kategori Surat', letter.category || '-'],
    ['Ditujukan Kepada', letter.addressedTo || '-', 'Unit Pengolah', letter.processingUnit || '-'],
    ['Lampiran', letter.attachment || '1 Berkas', 'Penerima / Petugas TU', letter.receivedBy || '-']
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      3: { cellWidth: 45 }
    },
    body: tableRows
  });

  // @ts-ignore
  yPos = (doc as any).lastAutoTable.finalY + 4;

  // Ringkasan Perihal
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
    body: [
      [{ content: 'PERIHAL / ISI RINGKAS SURAT:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }],
      [{ content: `${letter.title}\n\n${letter.description || '-'}`, styles: { minCellHeight: 25 } }]
    ]
  });

  // @ts-ignore
  yPos = (doc as any).lastAutoTable.finalY + 4;

  if (isInbox) {
    // Instruksi Disposisi Kepala Sekolah
    autoTable(doc, {
      startY: yPos,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
      body: [
        [{ content: 'DISPOSISI / PETUNJUK KEPALA SEKOLAH:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }],
        [{ content: letter.disposition || '(  ) Tindak Lanjuti Segera      (  ) Tanggapi / Buat Balasan\n(  ) Koordinasikan               (  ) Simpan / Arsipkan\n(  ) Hadiri / Wakili             (  ) Lainnya ...................................', styles: { minCellHeight: 25 } }]
      ]
    });
    // @ts-ignore
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    yPos += 10;
  }

  // Tanda Tangan
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Kediri, ${currentDate}`, 145, yPos);
  yPos += 5;
  doc.text('Kepala SMP Negeri 3 Kras,', 145, yPos);
  yPos += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(headmaster, 145, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${headmasterNip}`, 145, yPos);

  return doc.output('blob');
}

/**
 * Upload a single Letter to Google Drive with automated categorization and date naming
 */
export async function uploadLetterToGoogleDrive(
  letter: Letter, 
  token: string, 
  parentFolderId?: string
): Promise<DriveUploadResult> {
  const rootId = parentFolderId || getRootFolderId();
  
  // Verify access first
  const check = await verifyFolderAccess(rootId, token);
  if (!check.success) {
    throw new Error(`Akses ke folder Google Drive utama gagal: ${check.error}`);
  }

  // 1. Determine subfolder by letter type
  const targetSubfolderName = getFolderCategoryForLetter(letter);
  const subfolderId = await findOrCreateFolder(targetSubfolderName, rootId, token);

  // 2. Generate PDF Blob
  const pdfBlob = generateLetterPDFBlob(letter);
  const fileName = formatLetterFileName(letter, 'pdf');

  // 3. Upload PDF to target subfolder
  const uploadResult = await uploadFileToDrive(
    pdfBlob,
    fileName,
    'application/pdf',
    subfolderId,
    token,
    `Surat ${letter.type === 'inbox' ? 'Masuk' : 'Keluar'}: ${letter.title} (${letter.referenceNumber || '-'})`
  );

  return {
    ...uploadResult,
    folderName: targetSubfolderName
  };
}

/**
 * Upload a single Archive Item to Google Drive with automated categorization
 */
export async function uploadArchiveToGoogleDrive(
  archive: Archive,
  token: string,
  parentFolderId?: string
): Promise<DriveUploadResult> {
  const rootId = parentFolderId || getRootFolderId();
  
  const targetSubfolderName = getFolderCategoryForArchive(archive);
  const subfolderId = await findOrCreateFolder(targetSubfolderName, rootId, token);

  // Generate Archive JSON or file
  const fileName = formatArchiveFileName(archive, 'json');
  const jsonBlob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });

  const uploadResult = await uploadFileToDrive(
    jsonBlob,
    fileName,
    'application/json',
    subfolderId,
    token,
    `Arsip Dokumen: ${archive.title} (${archive.referenceNumber || archive.classificationCode || '-'})`
  );

  return {
    ...uploadResult,
    folderName: targetSubfolderName
  };
}

/**
 * Backup the entire database to Google Drive (📁 Backup Database Sistem)
 */
export async function backupFullDatabaseToGoogleDrive(
  token: string,
  parentFolderId?: string
): Promise<DriveUploadResult> {
  const rootId = parentFolderId || getRootFolderId();
  const backupFolderId = await findOrCreateFolder('📁 Backup Database Sistem', rootId, token);

  const fullData = {
    appName: localStorage.getItem('appName') || 'SPEGA MAIL',
    schoolName: localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS',
    timestamp: new Date().toISOString(),
    teachers: await db.teachers.toArray(),
    students: await db.students.toArray(),
    letters: await db.letters.toArray(),
    archives: await db.archives.toArray()
  };

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const fileName = `${dateStr}_Backup_SPEGA_MAIL_Database.json`;
  const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });

  return await uploadFileToDrive(
    blob,
    fileName,
    'application/json',
    backupFolderId,
    token,
    `Cadangan lengkap database SPEGA MAIL tanggal ${dateStr}`
  );
}

/**
 * Batch Sync all letters to Google Drive
 */
export async function syncAllLettersToGoogleDrive(
  token: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const letters = await db.letters.toArray();
  const total = letters.length;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  const rootId = getRootFolderId();

  for (let i = 0; i < total; i++) {
    const letter = letters[i];
    if (onProgress) {
      onProgress(i + 1, total, `Mengunggah (${i + 1}/${total}): ${letter.title}`);
    }

    try {
      await uploadLetterToGoogleDrive(letter, token, rootId);
      success++;
    } catch (err: any) {
      failed++;
      errors.push(`${letter.title}: ${err.message}`);
    }
  }

  // Also do a full database backup as well
  try {
    if (onProgress) {
      onProgress(total, total, 'Membuat cadangan database ke Google Drive...');
    }
    await backupFullDatabaseToGoogleDrive(token, rootId);
  } catch (err: any) {
    console.error('Backup database failed:', err);
  }

  return { success, failed, errors };
}
