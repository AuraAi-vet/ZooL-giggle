import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  Plus, 
  Camera, 
  Calendar 
} from 'lucide-react';
import { HealthRecord, Pet } from '../types';
import { cn } from '../lib/utils';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HealthRecord;
  pets: Pet[];
  onSave: (record: HealthRecord) => void;
}

export function EditRecordModal({ isOpen, onClose, record, pets, onSave }: EditRecordModalProps) {
  const [editedRecord, setEditedRecord] = useState(record);

  useEffect(() => {
    setEditedRecord(record);
  }, [record]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-brand">Edit Health Record</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Pet</label>
            <select 
              value={editedRecord.petId}
              onChange={(e) => setEditedRecord({ ...editedRecord, petId: e.target.value })}
              className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light text-sm"
            >
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Record Title</label>
            <input 
              type="text" 
              value={editedRecord.title}
              onChange={(e) => setEditedRecord({ ...editedRecord, title: e.target.value })}
              className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light text-sm font-bold" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Type</label>
              <select 
                value={editedRecord.type}
                onChange={(e) => setEditedRecord({ ...editedRecord, type: e.target.value as any })}
                className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light text-sm"
              >
                <option value="vaccination">Vaccination</option>
                <option value="checkup">Checkup</option>
                <option value="medication">Medication</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Date</label>
              <input 
                type="date" 
                value={editedRecord.date}
                onChange={(e) => setEditedRecord({ ...editedRecord, date: e.target.value })}
                className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light text-sm" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Description</label>
            <textarea 
              value={editedRecord.description}
              onChange={(e) => setEditedRecord({ ...editedRecord, description: e.target.value })}
              className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light h-24 resize-none text-sm leading-relaxed" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ruru-navy/60 uppercase mb-1">Next Due Date</label>
            <input 
              type="date" 
              value={editedRecord.nextDueDate || ''}
              onChange={(e) => setEditedRecord({ ...editedRecord, nextDueDate: e.target.value })}
              className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light text-sm" 
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-[1.5rem]">
            <button 
              onClick={() => setEditedRecord({ ...editedRecord, reminderEnabled: !editedRecord.reminderEnabled })}
              className={cn(
                "w-10 h-6 rounded-full transition-all relative",
                editedRecord.reminderEnabled ? "bg-ruru-navy-light" : "bg-[#A8A29E]"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white/95 backdrop-blur-3xl rounded-full transition-all",
                editedRecord.reminderEnabled ? "left-5" : "left-1"
              )} />
            </button>
            <span className="text-xs font-bold text-ruru-navy-light">Enable Reminder</span>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] font-bold text-[#A8A29E] hover:bg-[#F5F5F0] transition-colors">Cancel</button>
            <button onClick={() => onSave(editedRecord)} className="flex-1 py-4 bg-ruru-navy-light text-white rounded-[1.5rem] font-bold hover:bg-[#4A4A35] transition-all shadow-lg shadow-ruru-navy-light/20">Save Changes</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
