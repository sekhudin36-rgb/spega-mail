import { db, type Letter, type Teacher, type Student, type Archive, type SystemLog } from './db';
import { 
  getGoogleAccessToken, 
  getRootFolderId, 
  findOrCreateFolder, 
  uploadFileToDrive, 
  getGoogleUser, 
  signInWithGoogleDrive 
} from './googleDrive';

export const DRIVE_DB_FILENAME = 'SPEGA_MAIL_DATABASE.json';
export const DRIVE_DB_FOLDER_NAME = '📁 Database & Cadangan Cloud';

export interface DriveDatabaseMetadata {
  appName: string;
  schoolName: string;
  version: number;
  lastUpdated: string;
  deviceInfo: string;
  userEmail?: string;
  stats: {
    lettersCount: number;
    teachersCount: number;
    studentsCount: number;
    archivesCount: number;
  };
}

export interface DriveDatabasePayload {
  metadata: DriveDatabaseMetadata;
  letters: Letter[];
  teachers: Teacher[];
  students: Student[];
  archives: Archive[];
  systemLogs?: SystemLog[];
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Export current local Dexie database into a structured payload
 */
export async function exportDatabasePayload(): Promise<DriveDatabasePayload> {
  const letters = await db.letters.toArray();
  const teachers = await db.teachers.toArray();
  const students = await db.students.toArray();
  const archives = await db.archives.toArray();
  const systemLogs = await db.systemLogs.limit(50).toArray();

  const user = getGoogleUser();

  const payload: DriveDatabasePayload = {
    metadata: {
      appName: localStorage.getItem('appName') || 'SPEGA MAIL',
      schoolName: localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS',
      version: 2,
      lastUpdated: new Date().toISOString(),
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client',
      userEmail: user?.email || undefined,
      stats: {
        lettersCount: letters.length,
        teachersCount: teachers.length,
        studentsCount: students.length,
        archivesCount: archives.length,
      }
    },
    letters,
    teachers,
    students,
    archives,
    systemLogs
  };

  return payload;
}

/**
 * Import a database payload into local Dexie
 * mode: 'replace' will wipe local tables and insert from Drive
 * mode: 'merge' will intelligently update or insert new records without wiping
 */
export async function importDatabasePayload(
  payload: DriveDatabasePayload, 
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ letters: number; teachers: number; students: number; archives: number }> {
  if (!payload || !payload.letters) {
    throw new Error('Format data database Google Drive tidak valid atau berkas kosong.');
  }

  return await db.transaction('rw', [db.letters, db.teachers, db.students, db.archives, db.systemLogs], async () => {
    if (mode === 'replace') {
      await db.letters.clear();
      await db.teachers.clear();
      await db.students.clear();
      await db.archives.clear();

      if (payload.letters?.length) await db.letters.bulkAdd(payload.letters);
      if (payload.teachers?.length) await db.teachers.bulkAdd(payload.teachers);
      if (payload.students?.length) await db.students.bulkAdd(payload.students);
      if (payload.archives?.length) await db.archives.bulkAdd(payload.archives);
    } else {
      // Merge mode: Add or update records
      // Letters
      if (payload.letters?.length) {
        const existingLetters = await db.letters.toArray();
        const existingRefMap = new Map(existingLetters.map(l => [l.referenceNumber, l]));

        for (const remoteLetter of payload.letters) {
          if (remoteLetter.referenceNumber && existingRefMap.has(remoteLetter.referenceNumber)) {
            const localLetter = existingRefMap.get(remoteLetter.referenceNumber)!;
            // Update with remote letter data while keeping local ID
            await db.letters.update(localLetter.id as number, {
              ...remoteLetter,
              id: localLetter.id
            });
          } else {
            // New record
            const { id, ...letterData } = remoteLetter;
            await db.letters.add(letterData as Letter);
          }
        }
      }

      // Teachers
      if (payload.teachers?.length) {
        const existingTeachers = await db.teachers.toArray();
        const existingNipMap = new Map(existingTeachers.map(t => [t.nip, t]));

        for (const remoteTeacher of payload.teachers) {
          if (remoteTeacher.nip && existingNipMap.has(remoteTeacher.nip)) {
            const localTeacher = existingNipMap.get(remoteTeacher.nip)!;
            await db.teachers.update(localTeacher.id as number, {
              ...remoteTeacher,
              id: localTeacher.id
            });
          } else {
            const { id, ...teacherData } = remoteTeacher;
            await db.teachers.add(teacherData as Teacher);
          }
        }
      }

      // Students
      if (payload.students?.length) {
        const existingStudents = await db.students.toArray();
        const existingNisnMap = new Map(existingStudents.map(s => [s.nisn, s]));

        for (const remoteStudent of payload.students) {
          if (remoteStudent.nisn && existingNisnMap.has(remoteStudent.nisn)) {
            const localStudent = existingNisnMap.get(remoteStudent.nisn)!;
            await db.students.update(localStudent.id as number, {
              ...remoteStudent,
              id: localStudent.id
            });
          } else {
            const { id, ...studentData } = remoteStudent;
            await db.students.add(studentData as Student);
          }
        }
      }

      // Archives
      if (payload.archives?.length) {
        const existingArchives = await db.archives.toArray();
        const existingArchiveTitles = new Set(existingArchives.map(a => `${a.title}_${a.date}`));

        for (const remoteArchive of payload.archives) {
          const key = `${remoteArchive.title}_${remoteArchive.date}`;
          if (!existingArchiveTitles.has(key)) {
            const { id, ...archiveData } = remoteArchive;
            await db.archives.add(archiveData as Archive);
          }
        }
      }
    }

    // Log the sync event
    await db.systemLogs.add({
      timestamp: new Date().toISOString(),
      action: mode === 'replace' ? 'Pulihkan Database Penuh dari Google Drive' : 'Sinkronisasi / Gabung Database Google Drive',
      category: 'Sistem',
      level: 'success',
      user: getGoogleUser()?.email || 'Admin TU',
      details: `Database berhasil diperbarui dari Google Drive (${payload.letters?.length || 0} surat, ${payload.teachers?.length || 0} guru, ${payload.students?.length || 0} siswa).`
    });

    return {
      letters: payload.letters?.length || 0,
      teachers: payload.teachers?.length || 0,
      students: payload.students?.length || 0,
      archives: payload.archives?.length || 0
    };
  });
}

/**
 * Locate the database master file or historical backups in Google Drive
 */
export async function findDriveDatabaseFile(token: string, parentFolderId?: string): Promise<DriveFileInfo | null> {
  const rootId = parentFolderId || getRootFolderId();
  const dbFolderId = await findOrCreateFolder(DRIVE_DB_FOLDER_NAME, rootId, token);

  const query = `name = '${DRIVE_DB_FILENAME}' and '${dbFolderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mencari database di Google Drive (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  return null;
}

/**
 * List historical timestamped database backups in Google Drive
 */
export async function listDriveDatabaseBackups(token: string, parentFolderId?: string): Promise<DriveFileInfo[]> {
  const rootId = parentFolderId || getRootFolderId();
  const dbFolderId = await findOrCreateFolder(DRIVE_DB_FOLDER_NAME, rootId, token);

  const query = `'${dbFolderId}' in parents and mimeType = 'application/json' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,modifiedTime,size,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch and download database payload from a file in Google Drive
 */
export async function fetchDatabaseFromDrive(fileId: string, token: string): Promise<DriveDatabasePayload> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengunduh file database dari Google Drive (HTTP ${res.status})`);
  }

  const payload: DriveDatabasePayload = await res.json();
  return payload;
}

/**
 * Save / Update master database in Google Drive
 */
export async function saveDatabaseToGoogleDrive(
  token: string, 
  createHistoricalBackup: boolean = false
): Promise<{ fileId: string; webViewLink?: string; updatedAt: string }> {
  const rootId = getRootFolderId();
  const dbFolderId = await findOrCreateFolder(DRIVE_DB_FOLDER_NAME, rootId, token);

  const payload = await exportDatabasePayload();
  const jsonContent = JSON.stringify(payload, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

  // 1. Check if master file exists
  const existingFile = await findDriveDatabaseFile(token, rootId);

  let fileId = '';
  let webViewLink = '';

  if (existingFile) {
    // Update existing file via PATCH
    fileId = existingFile.id;
    const patchRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: jsonBlob
      }
    );

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal memperbarui file database di Google Drive (HTTP ${patchRes.status})`);
    }

    const patchData = await patchRes.json().catch(() => ({}));
    webViewLink = patchData.webViewLink || existingFile.webViewLink || '';
  } else {
    // Create new master file
    const uploadRes = await uploadFileToDrive(
      jsonBlob,
      DRIVE_DB_FILENAME,
      'application/json',
      dbFolderId,
      token,
      'Basis Data Utama Aplikasi Persuratan & Arsip (SPEGA MAIL) SMPN 3 Kras'
    );
    fileId = uploadRes.id;
    webViewLink = uploadRes.webViewLink || '';
  }

  // 2. Optionally create timestamped backup snapshot
  if (createHistoricalBackup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `${timestamp}_Snapshot_Database_SPEGA_MAIL.json`;
    await uploadFileToDrive(
      jsonBlob,
      backupName,
      'application/json',
      dbFolderId,
      token,
      `Snapshot Cadangan Database SPEGA MAIL pada ${new Date().toLocaleString('id-ID')}`
    ).catch(e => console.warn('Gagal membuat snapshot historical:', e));
  }

  // Update local storage sync tracker
  const nowIso = new Date().toISOString();
  localStorage.setItem('lastDriveDatabaseSync', nowIso);
  localStorage.setItem('driveDatabaseFileId', fileId);

  // Dispatch event for UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('driveDatabaseSynced', { detail: { updatedAt: nowIso, fileId } }));
  }

  return { fileId, webViewLink, updatedAt: nowIso };
}

/**
 * Debounce helper for background auto-sync
 */
let autoSyncTimer: any = null;

export function triggerBackgroundDriveDatabaseSync() {
  if (typeof window === 'undefined') return;
  const isAutoSync = localStorage.getItem('googleDriveAutoSync') !== 'false';
  if (!isAutoSync) return;

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }

  autoSyncTimer = setTimeout(async () => {
    try {
      const token = await getGoogleAccessToken();
      if (!token) return;

      console.info('[GoogleDriveDB] Menjalankan sinkronisasi database otomatis ke cloud...');
      await saveDatabaseToGoogleDrive(token, false);
      console.info('[GoogleDriveDB] Database Google Drive berhasil diperbarui secara otomatis.');
    } catch (err) {
      console.warn('[GoogleDriveDB] Background sync gagal (non-blocking):', err);
    }
  }, 2000);
}
