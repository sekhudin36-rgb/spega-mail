import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw, 
  FolderTree, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  X, 
  ShieldCheck, 
  Layers, 
  Clock, 
  HardDrive,
  Check,
  Calendar,
  FileCode,
  ArrowLeftRight
} from 'lucide-react';
import { 
  signInWithGoogleDrive, 
  getGoogleAccessToken, 
  getGoogleUser, 
  getRootFolderId, 
  getDriveFolderUrl,
  signOutGoogleDrive,
  switchGoogleDriveAccount
} from '../lib/googleDrive';
import { 
  saveDatabaseToGoogleDrive, 
  findDriveDatabaseFile, 
  fetchDatabaseFromDrive, 
  importDatabasePayload, 
  listDriveDatabaseBackups,
  exportDatabasePayload,
  DRIVE_DB_FILENAME,
  DRIVE_DB_FOLDER_NAME,
  type DriveFileInfo,
  type DriveDatabasePayload
} from '../lib/googleDriveDatabase';
import { db } from '../lib/db';
import toast from 'react-hot-toast';

interface GoogleDriveDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export default function GoogleDriveDatabaseModal({
  isOpen,
  onClose,
  onSyncComplete
}: GoogleDriveDatabaseModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Loading states
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Status & stats
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [createSnapshot, setCreateSnapshot] = useState(true);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  
  // Remote file info
  const [remoteMasterFile, setRemoteMasterFile] = useState<DriveFileInfo | null>(null);
  const [backupsList, setBackupsList] = useState<DriveFileInfo[]>([]);
  const [localStats, setLocalStats] = useState({ letters: 0, teachers: 0, students: 0, archives: 0 });

  useEffect(() => {
    if (isOpen) {
      // Check auth and stats
      getGoogleAccessToken().then(tok => {
        setToken(tok);
        setUser(getGoogleUser());
        if (tok) {
          checkRemoteStatus(tok);
        }
      });

      const savedLastSync = localStorage.getItem('lastDriveDatabaseSync');
      setLastSyncTime(savedLastSync);

      const savedAutoSync = localStorage.getItem('googleDriveAutoSync') !== 'false';
      setAutoSync(savedAutoSync);

      loadLocalStats();
    }
  }, [isOpen]);

  const loadLocalStats = async () => {
    try {
      const [l, t, s, a] = await Promise.all([
        db.letters.count(),
        db.teachers.count(),
        db.students.count(),
        db.archives.count()
      ]);
      setLocalStats({ letters: l, teachers: t, students: s, archives: a });
    } catch (e) {
      console.warn(e);
    }
  };

  const checkRemoteStatus = async (activeToken: string) => {
    setIsLoadingBackups(true);
    try {
      const file = await findDriveDatabaseFile(activeToken);
      setRemoteMasterFile(file);

      const backups = await listDriveDatabaseBackups(activeToken);
      setBackupsList(backups);
    } catch (err) {
      console.warn('Gagal memuat status remote database:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        toast.success(`Terhubung ke Google Drive (${res.user.email || 'Akun Google'})`);
        checkRemoteStatus(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal login Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setToken(null);
    setUser(null);
    setRemoteMasterFile(null);
    setBackupsList([]);
    toast.success('Koneksi Google Drive diputuskan');
  };

  const handleSwitchAccount = async () => {
    setIsAuthenticating(true);
    try {
      const res = await switchGoogleDriveAccount();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        toast.success(`Akun database berhasil diganti ke: ${res.user.displayName || res.user.email}`);
        await checkRemoteStatus(res.accessToken);
        await loadLocalStats();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengganti akun Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 1. Push Local Database to Google Drive
  const handlePushToDrive = async () => {
    let activeToken = token;
    if (!activeToken) {
      const res = await signInWithGoogleDrive();
      if (!res) return;
      activeToken = res.accessToken;
      setToken(activeToken);
      setUser(res.user);
    }

    setIsSyncingPush(true);
    try {
      const result = await saveDatabaseToGoogleDrive(activeToken, createSnapshot);
      setLastSyncTime(result.updatedAt);
      toast.success('Database berhasil disimpan & disinkronkan ke Google Drive!');
      await checkRemoteStatus(activeToken);
      await loadLocalStats();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan database ke Google Drive');
    } finally {
      setIsSyncingPush(false);
    }
  };

  // 2. Pull & Restore Database from Google Drive
  const handlePullFromDrive = async (targetFileId?: string) => {
    let activeToken = token;
    if (!activeToken) {
      const res = await signInWithGoogleDrive();
      if (!res) return;
      activeToken = res.accessToken;
      setToken(activeToken);
      setUser(res.user);
    }

    const fileId = targetFileId || remoteMasterFile?.id;
    if (!fileId) {
      toast.error('Belum ada berkas database tersimpan di Google Drive.');
      return;
    }

    setIsSyncingPull(true);
    try {
      const payload = await fetchDatabaseFromDrive(fileId, activeToken);
      const imported = await importDatabasePayload(payload, restoreMode);

      setLastSyncTime(new Date().toISOString());
      localStorage.setItem('lastDriveDatabaseSync', new Date().toISOString());

      toast.success(
        `Database berhasil dipulihkan! (${imported.letters} surat, ${imported.teachers} guru, ${imported.students} siswa)`,
        { duration: 5000 }
      );

      await loadLocalStats();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal memulihkan database dari Google Drive');
    } finally {
      setIsSyncingPull(false);
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('googleDriveAutoSync', String(checked));
    toast.success(checked ? 'Sinkronisasi otomatis diaktifkan' : 'Sinkronisasi otomatis dinonaktifkan');
  };

  if (!isOpen) return null;

  const rootFolderUrl = getDriveFolderUrl();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-2xl p-5 sm:p-6 bg-[#0F172A] border border-slate-700 shadow-2xl relative my-6 text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-900/40">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Database Cloud Google Drive
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    CLOUD SYNC
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pusat sinkronisasi & pencadangan data persuratan sekolah secara terpusat di Google Drive
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-5">
            {/* Account Status Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <Cloud className="w-5 h-5 text-sky-400" />
                  )}
                </div>
                <div className="min-w-0">
                  {token ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[300px]">
                          {user?.displayName || user?.email || 'Akun Google Terhubung'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          <Check className="w-2.5 h-2.5" /> Terhubung
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-300">Belum Terhubung ke Google Drive</span>
                      <p className="text-[11px] text-slate-400">Masuk untuk mengaktifkan sinkronisasi database cloud</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {token ? (
                  <>
                    <button
                      onClick={handleSwitchAccount}
                      disabled={isAuthenticating}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-sky-300 hover:text-white bg-sky-950/40 hover:bg-sky-900/60 border border-sky-600/40 transition flex items-center gap-1.5"
                      title="Ganti atau beralih ke akun Google lain untuk database"
                    >
                      {isAuthenticating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      )}
                      <span>Ganti Akun</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition"
                      title="Putuskan koneksi Google Drive saat ini"
                    >
                      Putuskan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isAuthenticating}
                    className="glass-button !bg-sky-600 hover:!bg-sky-500 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-semibold shadow-md"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghubungkan...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" /> Masuk dengan Google
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Local Stats & Last Sync Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block">Surat Terdaftar</span>
                <span className="text-base font-bold text-sky-400 font-mono">{localStats.letters}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block">Dewan Guru</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{localStats.teachers}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block">Peserta Didik</span>
                <span className="text-base font-bold text-purple-400 font-mono">{localStats.students}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block">Arsip Dokumen</span>
                <span className="text-base font-bold text-amber-400 font-mono">{localStats.archives}</span>
              </div>
            </div>

            {/* Sync Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* PUSH Button */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/30 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UploadCloud className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">Simpan ke Google Drive (Push)</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Unggah seluruh data lokal saat ini ke berkas master <code>{DRIVE_DB_FILENAME}</code> di Google Drive.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createSnapshot}
                      onChange={(e) => setCreateSnapshot(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500/30"
                    />
                    <span>Sertakan cadangan riwayat bertanggal</span>
                  </label>

                  <button
                    onClick={handlePushToDrive}
                    disabled={isSyncingPush}
                    className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-all disabled:opacity-50"
                  >
                    {isSyncingPush ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Database...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Simpan Sekarang ke Drive
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PULL Button */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DownloadCloud className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Tarik Data dari Drive (Pull)</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sinkronkan perangkat ini dengan data terbaru yang tersimpan di Google Drive sekolah.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Metode Pulihkan:</span>
                    <select
                      value={restoreMode}
                      onChange={(e: any) => setRestoreMode(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                    >
                      <option value="merge">Gabung Cerdas (Merge)</option>
                      <option value="replace">Timpa Penuh (Replace)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handlePullFromDrive()}
                    disabled={isSyncingPull || (!remoteMasterFile && !token)}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                  >
                    {isSyncingPull ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Mengambil Data...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4" /> Tarik & Terapkan Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-Sync & Cloud Location Settings */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sinkronisasi Otomatis Database
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Otomatis perbarui file database di Google Drive setiap kali ada surat masuk/keluar baru atau perubahan data
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  />
                  <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sinkronisasi Terakhir:</span>
                  <strong className="text-slate-200">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleString('id-ID') : 'Belum pernah'}
                  </strong>
                </div>

                <a
                  href={rootFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                >
                  <FolderTree className="w-3.5 h-3.5" /> Buka Folder Database di Drive <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Historical Backups on Google Drive */}
            {backupsList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" /> Cadangan Tersimpan di Google Drive ({backupsList.length})
                  </span>
                  <button
                    onClick={() => token && checkRemoteStatus(token)}
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Segarkan
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg divide-y divide-slate-800/60 bg-slate-950/40">
                  {backupsList.map((file) => (
                    <div key={file.id} className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-900 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-white font-medium truncate max-w-[240px] sm:max-w-[360px]">
                            {file.name}
                          </span>
                          {file.name === DRIVE_DB_FILENAME && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                              LIVE MASTER
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('id-ID') : '-'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePullFromDrive(file.id)}
                          disabled={isSyncingPull}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition"
                          title="Terapkan cadangan ini ke aplikasi"
                        >
                          Pulihkan
                        </button>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-sky-400"
                            title="Buka di Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Data disimpan dengan standar OAuth Google Workspace
            </span>
            <button
              onClick={onClose}
              className="glass-button text-xs px-4 py-1.5"
            >
              Selesai
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
