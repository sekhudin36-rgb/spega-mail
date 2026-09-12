import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  X, 
  Delete, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyAdminPin, loginAdminWithPin, getAdminPin } from '../lib/authHelper';
import { cn } from '../lib/utils';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  isTestMode?: boolean;
}

export default function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Akses Masuk Portal Admin TU',
  subtitle = 'Masukkan PIN keamanan untuk membuka dasbor manajemen surat & arsip sekolah',
  isTestMode = false
}: AdminPinModalProps) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 6 && !isSuccess) {
      setError('');
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (!isSuccess) {
      setError('');
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isSuccess) {
      setError('');
      setPin('');
    }
  };

  const handleSubmit = useCallback((currentPin: string = pin) => {
    if (!currentPin || currentPin.length < 4) {
      setError('PIN minimal terdiri dari 4 digit angka.');
      triggerShake();
      return;
    }

    if (isTestMode) {
      if (verifyAdminPin(currentPin)) {
        setIsSuccess(true);
        toast.success('Uji Coba Berhasil! PIN yang Anda masukkan cocok.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError('PIN yang Anda masukkan tidak cocok dengan pengaturan saat ini.');
        triggerShake();
      }
      return;
    }

    const result = loginAdminWithPin(currentPin);
    if (result.success) {
      setIsSuccess(true);
      toast.success(result.message);
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          onClose();
          navigate('/admin', { replace: true });
        }, 800);
      }
    } else {
      setError(result.message);
      triggerShake();
    }
  }, [pin, isTestMode, onClose, onSuccess, navigate]);

  const triggerShake = () => {
    setIsShaking(true);
    setPin('');
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  // Keyboard handler for desktop users
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPin(prev => {
          if (prev.length < 6 && !isSuccess) {
            return prev + e.key;
          }
          return prev;
        });
        setError('');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isSuccess, handleSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: isShaking ? [-10, 10, -8, 8, -4, 4, 0] : 0
          }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6 pt-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              {isSuccess ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>
            
            <h3 className="text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* PIN Indicators Display */}
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-inner">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full transition-all duration-200",
                      isSuccess
                        ? "bg-emerald-400 ring-4 ring-emerald-500/20 scale-110"
                        : isFilled
                        ? "bg-indigo-400 ring-4 ring-indigo-500/25 scale-110 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                        : "bg-slate-700/60 border border-slate-600/50"
                    )}
                  />
                );
              })}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg text-center"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-center"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>PIN Terverifikasi! Mengalihkan ke Dasbor...</span>
              </motion.div>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                disabled={isSuccess}
                className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}
            
            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isSuccess || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
            >
              Hapus
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              disabled={isSuccess}
              className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isSuccess || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pin.length < 4 || isSuccess}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg",
              pin.length >= 4 && !isSuccess
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 active:scale-[0.98]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            )}
          >
            <span>{isTestMode ? 'Uji Verifikasi PIN' : 'Buka Dasbor Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Bottom Actions & Hints */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col items-center gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400">
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>PIN Standar Sekolah: <b className="text-slate-200 font-mono">1234</b></span>
            </div>

            {!isTestMode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors underline font-medium"
              >
                Gunakan Login Username & Sandi Akun
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
