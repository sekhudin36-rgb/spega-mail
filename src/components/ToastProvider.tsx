import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ToastProvider() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      const id = Date.now() + Math.random();
      
      let type = 'info';
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('berhasil') || lowerMsg.includes('sukses') || lowerMsg.includes('disimpan')) type = 'success';
      else if (lowerMsg.includes('gagal') || lowerMsg.includes('kesalahan') || lowerMsg.includes('error') || lowerMsg.includes('rusak') || lowerMsg.includes('tidak valid') || lowerMsg.includes('kosong')) type = 'error';

      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : toast.type === 'error'
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-slate-800/90 border-sky-500/30 text-slate-100 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-sky-400 mt-0.5" />}
            <span className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
