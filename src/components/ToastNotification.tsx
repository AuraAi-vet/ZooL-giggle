import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from 'lucide-react';

export default function ToastNotification({ message, isVisible, onClose }: { message: string, isVisible: boolean, onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-4 right-4 bg-slate-950 text-white px-4 py-3 rounded-full flex items-center gap-3 text-xs font-medium shadow-xl z-50"
        >
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
