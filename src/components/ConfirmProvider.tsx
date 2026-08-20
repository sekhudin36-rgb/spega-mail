import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-sm p-0 overflow-hidden relative shadow-2xl"
            >
              <div className="p-6">
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-full shrink-0 ${
                    options.variant === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                    options.variant === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-sky-500/20 text-sky-400'
                  }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-medium text-white mb-1">
                      {options.title || 'Konfirmasi'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {options.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 border-t border-white/5 flex justify-end gap-3 shrink-0">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                >
                  {options.cancelLabel || 'Batal'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-colors ${
                    options.variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' :
                    options.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                    'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
                  }`}
                >
                  {options.confirmLabel || 'Ya, Lanjutkan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
