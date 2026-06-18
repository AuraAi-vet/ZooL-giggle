import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dog, Cat, AlertCircle, Loader2 } from 'lucide-react';
import { petProfileSchema, PetProfileInput } from '../schemas';
import { z } from 'zod';

interface AddPetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  onSubmit: (petData: PetProfileInput) => Promise<void>;
}

export default function AddPetDialog({ isOpen, onClose, onAdded, onSubmit }: AddPetDialogProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const petData = {
        name,
        species,
        breed,
        age: parseInt(age) || 0,
        weightKg: parseFloat(weightKg) || 0,
        trialModeActive: false
      };
      
      const validatedData = petProfileSchema.parse(petData);
      await onSubmit(validatedData);
      
      onAdded();
      onClose();
    } catch (err) {
      console.error("[AddPetDialog] Failed to add pet:", err);
      if (err instanceof z.ZodError) {
        setFormError((err as any).errors[0].message);
      } else if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          setFormError(`Database Error: ${parsed.error || 'Permission Denied or Network Error'}`);
        } catch {
          setFormError(err.message);
        }
      } else {
        setFormError("Failed to add pet profile. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pet-dialog-title"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 id="add-pet-dialog-title" className="text-xl font-bold text-slate-800">Add Pet Profile</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800 break-words">{formError}</p>
              </div>
            )}
            
            <div className="flex gap-4 mb-2" role="group" aria-label="Select Pet Species">
              <button
                type="button"
                onClick={() => setSpecies('Dog')}
                aria-pressed={species === 'Dog'}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  species === 'Dog' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Dog className="w-8 h-8" />
                <span className="font-bold">Dog</span>
              </button>
              <button
                type="button"
                onClick={() => setSpecies('Cat')}
                aria-pressed={species === 'Cat'}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  species === 'Cat' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Cat className="w-8 h-8" />
                <span className="font-bold">Cat</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pet-name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pet Name</label>
                <input 
                  type="text" 
                  id="pet-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="E.g., Remington"
                  required
                />
              </div>

              <div>
                <label htmlFor="pet-breed" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Breed</label>
                <input 
                  type="text" 
                  id="pet-breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="E.g., Labrador Retriever"
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="pet-age" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Age (Years)</label>
                  <input 
                    type="number" 
                    id="pet-age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="4"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="pet-weight" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Weight (Kg)</label>
                  <input 
                    type="number" 
                    id="pet-weight"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="28.5"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name}
              className="mt-4 flex items-center justify-center w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Pet Profile...
                </>
              ) : (
                'Save Pet Profile'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
