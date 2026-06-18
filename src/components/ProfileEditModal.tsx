import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  MapPin, 
  User, 
  Mail, 
  Activity 
} from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (profile: Partial<UserProfile>) => void;
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>(profile || {});

  useEffect(() => {
    if (profile) setEditedProfile(profile);
  }, [profile]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.8 });
        setEditedProfile({ ...editedProfile, image: compressedBase64 });
      } catch (error) {
        console.error('Failed to compress image', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/95 backdrop-blur-3xl w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-brand">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-32 h-32">
              <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-ruru-navy-light shadow-xl">
                <img src={editedProfile.image || 'https://picsum.photos/seed/user/200'} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-ruru-navy-light text-white rounded-[1.25rem] border-4 border-white flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="text-xs font-bold text-[#A8A29E] uppercase tracking-widest">Profile Picture</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ruru-navy/60 uppercase flex items-center gap-2">
                <User size={12} /> Full Name
              </label>
              <input 
                type="text" 
                value={editedProfile.name || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="w-full bg-[#F5F5F0] border-none rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-ruru-navy-light/20 outline-none transition-all"
                placeholder="Your Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ruru-navy/60 uppercase flex items-center gap-2">
                <Mail size={12} /> Email Address
              </label>
              <input 
                type="email" 
                value={editedProfile.email || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full bg-[#F5F5F0] border-none rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-ruru-navy-light/20 outline-none transition-all"
                placeholder="hello@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ruru-navy/60 uppercase flex items-center gap-2">
                <MapPin size={12} /> Location
              </label>
              <input 
                type="text" 
                value={editedProfile.location || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                className="w-full bg-[#F5F5F0] border-none rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-ruru-navy-light/20 outline-none transition-all"
                placeholder="Trivandrum, Kerala"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ruru-navy/60 uppercase flex items-center gap-2">
                <Activity size={12} /> Role
              </label>
              <select
                value={editedProfile.role || 'owner'}
                onChange={(e) => setEditedProfile({ ...editedProfile, role: e.target.value as any })}
                className="w-full bg-[#F5F5F0] border-none rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-ruru-navy-light/20 outline-none transition-all appearance-none"
              >
                <option value="owner">Pet Parent</option>
                <option value="vet">Veterinarian</option>
                <option value="provider">Service Provider</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              onClick={onClose}
              className="flex-1 flex items-center justify-center py-4 bg-white/95 backdrop-blur-3xl border-2 border-[#E5E5D5] rounded-[1.5rem] font-bold text-[#A8A29E] hover:bg-[#F5F5F0] transition-all"
            >
              Discard
            </button>
            <button 
              onClick={() => {
                onSave(editedProfile);
                onClose();
              }}
              className="flex-1 flex items-center justify-center py-4 bg-ruru-navy-light text-white rounded-[1.5rem] font-bold shadow-xl shadow-ruru-navy-light/20 hover:bg-[#4A4A35] active:scale-95 transition-all"
            >
              Save Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
