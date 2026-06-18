import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete Permanently",
  cancelText = "Keep Secure",
  type = 'danger'
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" id="confirmation-dialog-overlay">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1424]/40 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-[0_30px_70px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden flex flex-col justify-between"
            id="confirmation-dialog-pane"
          >
            {/* Top decorative hazard stripes highlighting clinical safety boundaries if danger */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
              type === 'danger' ? "from-red-500 to-rose-600" :
              type === 'warning' ? "from-[#C5A572] to-amber-500" : "from-blue-500 to-indigo-600"
            )} />

            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                  type === 'danger' ? "bg-rose-550/10 text-rose-600 border-rose-100" :
                  type === 'warning' ? "bg-[#C5A572]/10 text-[#C5A572] border-[#C5A572]/20" :
                  "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {type === 'danger' ? <Trash2 size={22} className="text-rose-500" /> : <AlertTriangle size={22} />}
                </div>
                <div>
                  <h3 className="text-xl font-brand text-[#0B1424] tracking-tight">{title}</h3>
                  <p className="text-[9px] font-black uppercase text-[#C5A572] tracking-[0.25em]">Clinical Security Protocal</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed font-brand">
                {message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-8">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all outline-none"
              >
                {cancelText}
              </button>
              <button
                onClick={async () => {
                  await onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 px-6 py-3.5 rounded-full font-bold text-[10px] uppercase tracking-widest text-white shadow-lg transition-all outline-none",
                  type === 'danger' ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/15" :
                  type === 'warning' ? "bg-[#0B1424] hover:bg-slate-800 text-[#C5A572] shadow-ruru-navy/15" :
                  "bg-blue-600 hover:bg-blue-550 shadow-blue-600/15"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
