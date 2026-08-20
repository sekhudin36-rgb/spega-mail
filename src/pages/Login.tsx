import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, KeyRound, LogIn, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

export default function Login() {
  const [appName, setAppName] = useState('SPEGA MAIL');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setAppName(localStorage.getItem('appName') || 'SPEGA MAIL');
  }, []);

  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials against localStorage
    const savedUsername = localStorage.getItem('adminUsername') || 'admin';
    const savedPassword = localStorage.getItem('adminPassword') || '123456';
    
    if (username === savedUsername && password === savedPassword) {
      sessionStorage.setItem('isAuthenticated', 'true');
      navigate('/', { replace: true });
    } else {
      setError('Username atau kata sandi salah. Silakan coba lagi.');
    }
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

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Side: Branding & Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:w-1/2 flex-col items-center lg:items-start text-center lg:text-left hidden lg:flex"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-mono mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span>DATA ENGINE READY • v3.0</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-4">
            Sistem Persuratan & <br/>
            <span className="text-indigo-400">
              Arsip Digital SMPN 3 Kras
            </span>
          </h1>
          
          <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
            Manajemen agenda surat masuk, draf surat keluar, kartu kendali, dan pencetakan dokumen resmi terpusat.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Aman & Terenkripsi Lokal</h3>
                <p className="text-[11px] text-slate-400">Penyimpanan IndexedDB berkecepatan tinggi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ekspor & Cetak Instan</h3>
                <p className="text-[11px] text-slate-400">Kop surat resmi, tanda tangan, dan stempel digital</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md lg:w-full lg:max-w-[420px]"
        >
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-8 shadow-xl relative overflow-hidden">
            <div className="mb-6 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">{appName}</h2>
              </div>
              <p className="text-xs text-slate-400">Otentikasi Akun Tata Usaha & Kearsipan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Username</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                    placeholder="Username admin"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none" 
                    placeholder="••••••••"
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 mt-4"
              >
                <span>Masuk Sistem</span>
                <LogIn className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 inset-x-0 text-center z-10 hidden lg:block">
        <p className="text-sm text-slate-500">
          {appName} &copy; {new Date().getFullYear()} • Dibuat dengan sepenuh hati oleh <span className="text-slate-400 font-medium hover:text-sky-400 transition-colors">Khabibu Rohman</span>
        </p>
      </div>
    </div>
  );
}
