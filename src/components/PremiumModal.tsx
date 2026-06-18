import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Crown, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export function PremiumModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, setUserProfile } = useStore();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      if (userProfile) {
        await setUserProfile({
          ...userProfile,
          isPremium: true,
        });
        toast.success("Successfully upgraded to Premium! 🌟");
        onClose();
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-br from-ruru-navy-light to-[#3A3A25] p-8 text-white text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" disabled={isLoading}>
              <X size={24} />
            </button>
            <Crown size={48} className="mx-auto mb-4 text-[#E6D5B8]" />
            <h2 className="text-3xl font-brand mb-2">RuRu Premium</h2>
            <p className="text-[#E6D5B8] opacity-90">Unlock the full potential of AI pet care.</p>
          </div>

          <div className="p-8 space-y-6">
            <ul className="space-y-4">
              {[
                'Unlimited AI Symptom Analysis',
                'Advanced Medical Record Parsing',
                'Direct Messaging with Verified Vets',
                'Multi-Pet Management (Up to 5 pets)',
                'Priority Support'
              ].map((feature, i) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-ruru-navy-light shrink-0 mt-0.5" />
                  <span className="text-[#4A4A35] font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-ruru-navy/10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-ruru-navy/60 uppercase tracking-wider font-bold">Premium Trial</p>
                  <p className="text-3xl font-brand text-[#1A1A1A]">₹0<span className="text-lg text-ruru-navy/60">/mo</span></p>
                </div>
                <div className="bg-[#F5F5F0] px-3 py-1 rounded-full text-xs font-bold text-ruru-navy-light flex items-center gap-1">
                  <Sparkles size={12} /> 14-Day Free
                </div>
              </div>

              <button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-ruru-navy-light text-white py-4 rounded-[1.25rem] font-bold hover:bg-[#4A4A35] transition-colors shadow-lg shadow-ruru-navy-light/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Start Free Trial'}
              </button>
              <p className="text-center text-xs text-ruru-navy/60 mt-4">Payment integration on hold until trial success.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
