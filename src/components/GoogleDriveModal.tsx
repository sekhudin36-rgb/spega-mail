import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  FolderSync, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  X, 
  HardDrive, 
  FileText,
  ShieldCheck,
  FolderTree,
  Sparkles
} from 'lucide-react';
import { 
  signInWithGoogleDrive, 
  getGoogleAccessToken, 
  getGoogleUser, 
  getRootFolderId, 
  getDriveFolderUrl, 
  uploadLetterToGoogleDrive, 
  uploadArchiveToGoogleDrive,
  syncAllLettersToGoogleDrive,
  formatLetterFileName,
  getFolderCategoryForLetter,
  type DriveUploadResult
} from '../lib/googleDrive';
import { type Letter, type Archive } from '../lib/db';
import toast from 'react-hot-toast';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLetter?: Letter | null;
  targetArchive?: Archive | null;
  selectedLetters?: Letter[];
  mode?: 'single' | 'batch' | 'syncAll';
  onSuccess?: () => void;
}

export default function GoogleDriveModal({
  isOpen,
  onClose,
  targetLetter,
  targetArchive,
  selectedLetters = [],
  mode = 'single',
  onSuccess
}: GoogleDriveModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 1,
    message: ''
  });
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [batchResults, setBatchResults] = useState<{ success: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getGoogleAccessToken().then(tok => {
        setToken(tok);
        setUser(getGoogleUser());
      });
      setUploadResult(null);
      setBatchResults(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        toast.success('Berhasil terhubung ke Google Drive');
        return res.accessToken;
      } else {
        toast('Login Google dibatalkan atau jendela ditutup', { icon: 'ℹ️' });
        return null;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal login dengan Google');
      toast.error(err.message || 'Gagal menghubungkan Google Drive');
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStartUpload = async () => {
    let activeToken = token;
    if (!activeToken) {
      activeToken = await handleSignIn();
      if (!activeToken) return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      if (mode === 'single' && targetLetter) {
        setUploadProgress({ current: 0, total: 1, message: 'Menyiapkan berkas PDF resmi...' });
        const res = await uploadLetterToGoogleDrive(targetLetter, activeToken);
        setUploadResult(res);
        toast.success(`Surat berhasil disimpan ke Google Drive (${res.folderName})`);
        if (onSuccess) onSuccess();
      } else if (mode === 'single' && targetArchive) {
        setUploadProgress({ current: 0, total: 1, message: 'Mengunggah arsip dokumen...' });
        const res = await uploadArchiveToGoogleDrive(targetArchive, activeToken);
        setUploadResult(res);
        toast.success(`Arsip berhasil disimpan ke Google Drive (${res.folderName})`);
        if (onSuccess) onSuccess();
      } else if (mode === 'batch' && selectedLetters.length > 0) {
        const total = selectedLetters.length;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < total; i++) {
          const l = selectedLetters[i];
          setUploadProgress({
            current: i + 1,
            total,
            message: `Mengunggah (${i + 1}/${total}): ${l.title}`
          });
          try {
            await uploadLetterToGoogleDrive(l, activeToken);
            successCount++;
          } catch (e) {
            failCount++;
          }
        }

        setBatchResults({ success: successCount, failed: failCount });
        toast.success(`${successCount} surat berhasil disimpan ke Google Drive`);
        if (onSuccess) onSuccess();
      } else if (mode === 'syncAll') {
        const res = await syncAllLettersToGoogleDrive(activeToken, (curr, tot, msg) => {
          setUploadProgress({ current: curr, total: tot, message: msg });
        });
        setBatchResults({ success: res.success, failed: res.failed });
        toast.success(`Sinkronisasi selesai! ${res.success} surat & backup tersimpan.`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah ke Google Drive');
      toast.error('Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const rootFolderId = getRootFolderId();
  const folderUrl = getDriveFolderUrl();

  // Preview target information
  let previewFolderName = '📁 Surat';
  let previewFileName = '';
  if (targetLetter) {
    previewFolderName = getFolderCategoryForLetter(targetLetter);
    previewFileName = formatLetterFileName(targetLetter, 'pdf');
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-lg p-6 bg-slate-900 border border-slate-700 shadow-2xl relative my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Simpan ke Google Drive</h3>
                <p className="text-xs text-slate-400">Kategorisasi otomatis & penamaan berformat tanggal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* Target Folder Info */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-sky-400" />
                  Folder Tujuan Utama:
                </span>
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  Buka di Drive <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                {rootFolderId}
              </p>
            </div>

            {/* Target Details Preview */}
            {mode === 'single' && targetLetter && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Subfolder Otomatis:</span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    {previewFolderName}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Nama Berkas Otomatis (Ada Tanggal):</span>
                  <p className="text-[11px] font-mono text-sky-300 break-all bg-black/40 p-2 rounded border border-slate-800">
                    {previewFileName}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{targetLetter.title}</span>
                </div>
              </div>
            )}

            {mode === 'batch' && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">Jumlah Surat Dipilih:</span>
                  <span className="font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                    {selectedLetters.length} Dokumen
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setiap surat akan diekspor menjadi berkas PDF resmi berpenamaan tanggal dan disimpan ke subfolder sesuai jenisnya (Surat Masuk, Surat Keluar, Surat Tugas, SK).
                </p>
              </div>
            )}

            {mode === 'syncAll' && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-sm text-sky-400 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Cadangkan Seluruh Data & Dokumen
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Semua arsip surat, guru, siswa, dan salinan basis data akan disinkronkan ke folder Google Drive Anda secara terstruktur.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Upload In Progress */}
            {isUploading && (
              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-300 font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    Sedang Mengunggah ke Google Drive...
                  </span>
                  <span className="text-slate-400 font-mono">
                    {uploadProgress.current} / {uploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-sky-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(uploadProgress.current / Math.max(uploadProgress.total, 1)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 truncate">{uploadProgress.message}</p>
              </div>
            )}

            {/* Success Result */}
            {uploadResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Berkas Berhasil Tersimpan!
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Nama Berkas:</span>
                    <span className="font-mono text-white text-[11px] truncate max-w-[240px]">
                      {uploadResult.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Subfolder:</span>
                    <span className="text-emerald-300 font-medium">{uploadResult.folderName}</span>
                  </div>
                </div>
                {uploadResult.webViewLink && (
                  <a
                    href={uploadResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button w-full flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500 text-white font-medium text-xs py-2 mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka Dokumen di Google Drive
                  </a>
                )}
              </div>
            )}

            {batchResults && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Operasi Selesai!
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">{batchResults.success}</strong> berkas berhasil diunggah ke Google Drive
                  {batchResults.failed > 0 && ` (${batchResults.failed} gagal)`}.
                </p>
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button w-full flex items-center justify-center gap-2 !bg-sky-600 hover:!bg-sky-500 text-white font-medium text-xs py-2 mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Folder di Google Drive
                </a>
              </div>
            )}

            {/* Auth status & actions */}
            {!token ? (
              <div className="pt-2 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  Hubungkan akun Google Anda untuk memberikan izin aplikasi mengunggah data ke Google Drive sekolah.
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white text-slate-800 font-medium text-sm hover:bg-slate-100 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                      Menghubungkan Akun...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="flex items-center gap-2">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-slate-700" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="text-[11px] leading-tight">
                    <p className="text-white font-medium truncate max-w-[180px]">{user?.displayName || 'Pengguna'}</p>
                    <p className="text-slate-400 truncate max-w-[180px]">{user?.email}</p>
                  </div>
                </div>

                {!uploadResult && !batchResults && (
                  <button
                    type="button"
                    onClick={handleStartUpload}
                    disabled={isUploading}
                    className="glass-button !bg-sky-600 hover:!bg-sky-500 text-white flex items-center gap-2 text-xs py-2 px-4 disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" /> Unggah Sekarang
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
