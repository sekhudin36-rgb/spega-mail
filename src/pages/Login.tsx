import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  KeyRound, 
  LogIn, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  User, 
  Phone, 
  Users, 
  Briefcase, 
  ChevronRight, 
  ArrowRight,
  Eye,
  EyeOff,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { addSystemLog } from '../lib/db';
import { loginAdminWithPin, getAdminPin } from '../lib/authHelper';

export default function Login() {
  const [appName, setAppName] = useState('SPEGA MAIL');
  const [activeTab, setActiveTab] = useState<'admin' | 'guru_wali'>('admin');
  
  // Admin form
  const [adminLoginMode, setAdminLoginMode] = useState<'pin' | 'credentials'>('pin');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Guru / Wali form
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantRole, setApplicantRole] = useState<'guru' | 'wali'>('guru');
  const [applicantExtra, setApplicantExtra] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    setAppName(localStorage.getItem('appName') || 'SPEGA MAIL');
  }, []);

  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  const isGuestAuthenticated = sessionStorage.getItem('isGuestAuthenticated') === 'true';

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (isGuestAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleAdminPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput || adminPinInput.length < 4) {
      setError('PIN minimal 4 digit angka.');
      return;
    }

    const result = loginAdminWithPin(adminPinInput);
    if (result.success) {
      toast.success(result.message);
      navigate('/admin', { replace: true });
    } else {
      setError(result.message);
      setAdminPinInput('');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials against localStorage
    const savedUsername = localStorage.getItem('adminUsername') || 'admin';
    const savedPassword = localStorage.getItem('adminPassword') || '123456';
    
    if (username === savedUsername && password === savedPassword) {
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', 'admin');
      
      addSystemLog({
        action: 'LOGIN_ADMIN',
        category: 'Keamanan',
        level: 'success',
        user: localStorage.getItem('adminName') || 'Admin TU',
        details: `Petugas Admin TU (${username}) berhasil masuk ke sistem persuratan.`,
        metadata: { client: navigator.userAgent }
      });

      toast.success('Login Admin Tata Usaha Berhasil!');
      navigate('/admin', { replace: true });
    } else {
      addSystemLog({
        action: 'LOGIN_GAGAL',
        category: 'Keamanan',
        level: 'warning',
        user: username || 'Tamu',
        details: `Percobaan login admin gagal dengan username: "${username}".`,
      });
      setError('Username atau kata sandi salah. Silakan coba lagi.');
    }
  };

  const handleGuruWaliLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      setError('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.trim().length < 9) {
      setError('Silakan masukkan Nomor HP / WhatsApp yang aktif.');
      return;
    }

    const sessionObj = {
      name: applicantName.trim(),
      phone: applicantPhone.trim(),
      role: applicantRole,
      extraInfo: applicantExtra.trim()
    };

    sessionStorage.setItem('applicantSession', JSON.stringify(sessionObj));
    sessionStorage.setItem('userRole', 'guru_wali');
    sessionStorage.setItem('isGuestAuthenticated', 'true');

    addSystemLog({
      action: 'LOGIN_PORTAL_MANDIRI',
      category: 'Keamanan',
      level: 'info',
      user: `${applicantName.trim()} (${applicantRole.toUpperCase()})`,
      details: `${applicantRole === 'guru' ? 'Guru' : 'Wali Murid'} masuk ke portal mandiri (HP: ${applicantPhone.trim()}).`,
      metadata: sessionObj
    });

    toast.success(`Selamat datang, ${sessionObj.name}! Mengarahkan ke Portal Draf Surat...`);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-sky-600/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[100px]" 
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Side: Branding & Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:w-1/2 flex-col items-center lg:items-start text-center lg:text-left hidden lg:flex"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-mono mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span>DATA PERSURATAN TERINTEGRASI • SMPN 3 KRAS</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-4">
            Sistem Persuratan & <br/>
            <span className="text-indigo-400">
              Arsip Digital Sekolah
            </span>
          </h1>
          
          <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
            Portal layanan terpadu: Pengajuan draf surat mandiri untuk Guru & Wali Murid, serta manajemen arsip naskah dinas resmi untuk Tata Usaha.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex items-center gap-3 text-slate-300 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Portal Guru & Wali Murid</h3>
                <p className="text-[11px] text-slate-400">Buat draf surat tugas, perizinan, keterangan siswa aktif, mutasi & langsung unduh PDF</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Khusus Akun Admin Tata Usaha</h3>
                <p className="text-[11px] text-slate-400">Penomoran register resmi, verifikasi draf masuk, disposisi, dan kearsipan</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Tabbed Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md lg:w-full lg:max-w-[440px]"
        >
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-7 shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="mb-5 relative z-10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{appName}</h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  SMPN 3 KRAS
                </span>
              </div>
            </div>

            {/* Portal Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 border border-slate-700/80 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setActiveTab('guru_wali'); setError(''); }}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'guru_wali'
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Guru & Wali</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('admin'); setError(''); }}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'admin'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin TU</span>
              </button>
            </div>

            {/* TAB 1: GURU & WALI LOGIN FORM */}
            {activeTab === 'guru_wali' && (
              <motion.form 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleGuruWaliLogin} 
                className="space-y-4 relative z-10"
              >
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                    Masuk dengan <b>Nama Lengkap</b> dan <b>Nomor HP</b> untuk langsung membuat draf surat resmi. Hasil draf otomatis masuk ke akun Admin TU.
                  </p>
                </div>

                {/* Role Switch: Guru vs Wali */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplicantRole('guru')}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5",
                      applicantRole === 'guru'
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>Guru / Tendik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicantRole('wali')}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5",
                      applicantRole === 'wali'
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Users className="w-3 h-3" />
                    <span>Wali Murid</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Nama Lengkap Anda <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                      placeholder={applicantRole === 'guru' ? "Nama lengkap & gelar (Contoh: Siti Aminah, S.Pd.)" : "Nama lengkap orang tua / wali"}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Nomor HP / WhatsApp Aktif <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input 
                      type="tel" 
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none font-mono" 
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {applicantRole === 'guru' ? "Mata Pelajaran / Unit (Opsional)" : "Nama Siswa & Kelas (Opsional)"}
                  </label>
                  <input 
                    type="text" 
                    value={applicantExtra}
                    onChange={(e) => setApplicantExtra(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                    placeholder={applicantRole === 'guru' ? "Contoh: Guru Matematika" : "Contoh: Ahmad Faiz (9A)"}
                  />
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-2"
                >
                  <span>Lanjut Buat Draf Surat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {/* TAB 2: ADMIN LOGIN FORM */}
            {activeTab === 'admin' && (
              <div className="space-y-4 relative z-10">
                {/* Admin Sub-mode Switcher: PIN vs Credentials */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setAdminLoginMode('pin'); setError(''); }}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      adminLoginMode === 'pin'
                        ? "bg-indigo-600/30 border border-indigo-500 text-indigo-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>PIN Cepat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdminLoginMode('credentials'); setError(''); }}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      adminLoginMode === 'credentials'
                        ? "bg-indigo-600/30 border border-indigo-500 text-indigo-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Username & Sandi</span>
                  </button>
                </div>

                {/* Sub-mode 1: PIN Login */}
                {adminLoginMode === 'pin' ? (
                  <motion.form
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAdminPinLogin}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                      <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                        Masukkan <b>PIN Keamanan Admin</b> untuk langsung membuka dasbor tata usaha.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block text-center">
                        PIN Otorisasi Admin
                      </label>
                      <div className="relative max-w-[240px] mx-auto">
                        <input
                          type={showPinInput ? "text" : "password"}
                          value={adminPinInput}
                          onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 text-center text-xl font-mono tracking-widest text-white font-bold placeholder:text-slate-600 outline-none"
                          placeholder="••••"
                          maxLength={6}
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPinInput(!showPinInput)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                          title={showPinInput ? "Sembunyikan PIN" : "Lihat PIN"}
                        >
                          {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 text-center mt-1">
                        Bawaan pabrik: <b className="text-slate-200 font-mono">1234</b> (diubah di Pengaturan)
                      </p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 text-center">
                            {error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 mt-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Buka Dasbor dengan PIN</span>
                    </button>
                  </motion.form>
                ) : (
                  /* Sub-mode 2: Username & Password Login */
                  <motion.form 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAdminLogin} 
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Username Petugas TU</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                          placeholder="Username admin (bawaan: admin)"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                          placeholder="•••••••• (bawaan: 123456)"
                          required
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }} 
                          animate={{ opacity: 1, height: 'auto', y: 0 }} 
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-xs text-rose-400">
                            <span>!</span>
                            <p>{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Masuk Akun Admin</span>
                      <LogIn className="w-4 h-4" />
                    </button>
                  </motion.form>
                )}
              </div>
            )}

            {/* Quick Access to Dedicated Letter Submission Portal */}
            <div className="mt-5 pt-4 border-t border-slate-700/80">
              <Link 
                to="/"
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 hover:from-emerald-950/60 hover:to-indigo-950/60 border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex items-center justify-between text-xs text-slate-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-emerald-300 group-hover:text-emerald-200">Portal 1: Layanan Draf Surat Mandiri</div>
                    <div className="text-[10px] text-slate-400">Halaman Utama Guru & Wali Murid SMPN 3 Kras</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <span>Buka</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 inset-x-0 text-center z-10 hidden lg:block">
        <p className="text-sm text-slate-500">
          {appName} &copy; {new Date().getFullYear()} • Layanan Tata Usaha & Persuratan SMPN 3 Kras
        </p>
      </div>
    </div>
  );
}

