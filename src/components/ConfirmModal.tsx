import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 shadow-red-500/20';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      default: return 'bg-accent-purple hover:bg-accent-purple/80 shadow-purple-500/20';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'danger': return 'text-red-500 bg-red-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-accent-purple bg-accent-purple/10';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-dark-primary/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm glass-card p-6 relative overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-3 rounded-full ${getIconStyles()}`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 glass-card hover:bg-white/10 text-white font-medium transition-all text-sm"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 text-white font-medium rounded-xl transition-all shadow-lg text-sm ${getVariantStyles()}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
