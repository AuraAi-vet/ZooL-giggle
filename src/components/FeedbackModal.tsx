import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { type: 'issue' | 'feature' | 'bug' | 'general'; message: string }) => Promise<void>;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [type, setType] = useState<'general' | 'feature' | 'bug'>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ type, message });
      toast.success('Feedback submitted successfully!');
      setMessage('');
      onClose();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ruru-navy/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white/95 backdrop-blur-3xl w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden flex flex-col border border-ruru-navy/10"
        >
          {/* Header */}
          <div className="bg-[#FDFBF7] p-8 flex justify-between items-start shrink-0 relative overflow-hidden border-b border-ruru-navy/10">
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/95 backdrop-blur-3xl flex items-center justify-center text-ruru-navy border border-ruru-navy/10 shadow-sm shrink-0">
                <MessageSquare size={26} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A8A29E]">App Feedback</p>
                <h2 className="text-2xl font-brand tracking-tight text-ruru-navy">Share Your Thoughts</h2>
                <p className="text-ruru-navy/60 text-sm">Help us improve the clinical experience.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/95 backdrop-blur-3xl rounded-full text-[#A8A29E] hover:text-ruru-navy transition-colors relative z-10 shadow-sm border border-transparent hover:border-ruru-navy/10">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">Feedback Type</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setType('general')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-[1.5rem] border-2 transition-all gap-2",
                    type === 'general' 
                      ? "border-ruru-navy bg-ruru-navy text-white shadow-md" 
                      : "border-ruru-navy/10 bg-white/95 backdrop-blur-3xl text-ruru-navy/60 hover:border-ruru-navy/20"
                  )}
                >
                  <MessageSquare size={24} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">General<br className="hidden sm:block" /> Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('feature')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-[1.5rem] border-2 transition-all gap-2",
                    type === 'feature' 
                      ? "border-ruru-teal bg-ruru-teal text-white shadow-md" 
                      : "border-ruru-navy/10 bg-white/95 backdrop-blur-3xl text-ruru-navy/60 hover:border-ruru-teal/20 hover:text-ruru-teal"
                  )}
                >
                  <Lightbulb size={24} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Feature<br className="hidden sm:block" /> Idea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-[1.5rem] border-2 transition-all gap-2",
                    type === 'bug' 
                      ? "border-red-500 bg-red-500 text-white shadow-md" 
                      : "border-ruru-navy/10 bg-white/95 backdrop-blur-3xl text-ruru-navy/60 hover:border-red-500/20 hover:text-red-500"
                  )}
                >
                  <AlertTriangle size={24} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Report<br className="hidden sm:block" /> Bug</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'feature' ? "I'd love to see a feature that..." : type === 'bug' ? "I ran into a problem where..." : "I just wanted to say..."}
                className="w-full bg-[#FDFBF7] border border-ruru-navy/10 rounded-[1.5rem] px-5 py-4 h-32 focus:outline-none focus:border-ruru-navy text-sm transition-colors resize-none shadow-inner"
                required
              />
            </div>

            <div className="pt-2 border-t border-ruru-navy/10">
              <button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="w-full bg-ruru-navy text-white py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#1A1816] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#2D2A26]/20"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
