import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, CheckCircle2, ChevronRight, Search, Activity, ExternalLink, BadgeCheck } from 'lucide-react';
import { Pet } from '../types';
import { toast } from 'sonner';

interface GovernmentPortalsViewProps {
  pets: Pet[];
  onESamrudhaSync: (petId: string, govId: string, insurance: string) => Promise<void>;
  onApplyLicense: (petId: string) => Promise<void>;
  onBack: () => void;
}

export function GovernmentPortalsView({ pets, onESamrudhaSync, onApplyLicense, onBack }: GovernmentPortalsViewProps) {
  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.id || '');
  const [govId, setGovId] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const currentPet = pets.find(p => p.id === selectedPet);

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !govId) {
      toast.error('Please select a pet and provide your e-Samrudha ID');
      return;
    }
    
    setIsSyncing(true);
    try {
      await onESamrudhaSync(selectedPet, govId, insuranceNumber);
      setGovId('');
      setInsuranceNumber('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfbf9]">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 pt-8 pb-4 px-6 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <h1 className="text-2xl font-brand font-bold text-slate-800">Govt &amp; Compliance</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Shield size={20} />
          </div>
        </div>
        <p className="text-slate-500 text-sm">Manage your municipal licenses and state health registries.</p>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-32">
        {pets.length > 0 ? (
          <>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BadgeCheck className="text-indigo-600" size={20} />
                <h2 className="text-lg font-bold text-slate-800">Kerala e-Samrudha Sync</h2>
              </div>
              
              <form onSubmit={handleSyncSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Pet</label>
                  <select 
                    value={selectedPet}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.name} {pet.eSamrudhaId ? '(Synced)' : ''}</option>
                    ))}
                  </select>
                </div>

                {currentPet?.eSamrudhaId ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={24} />
                    <div>
                      <h4 className="font-bold text-emerald-800 text-sm">Successfully Validated</h4>
                      <div className="text-xs text-emerald-600/80 mt-1 space-y-1">
                        <p>ID: {currentPet.eSamrudhaId}</p>
                        {currentPet.insuranceNumber && <p>Insurance: {currentPet.insuranceNumber}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">e-Samrudha ID</label>
                        <input
                          type="text"
                          value={govId}
                          onChange={(e) => setGovId(e.target.value)}
                          placeholder="Ex: KS-AHD-..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurance No. (Optional)</label>
                        <input
                          type="text"
                          value={insuranceNumber}
                          onChange={(e) => setInsuranceNumber(e.target.value)}
                          placeholder="Ex: INS-KER-..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-300"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSyncing || !govId}
                      className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold text-sm tracking-wide disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isSyncing ? 'Verifying with Portal...' : 'Link e-Samrudha Record'}
                      {!isSyncing && <ExternalLink size={16} />}
                    </button>
                  </>
                )}
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">Municipal Licensing</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                {pets.map(pet => (
                  <div key={pet.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        {pet.image ? (
                          <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{pet.name[0]}</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{pet.name}</p>
                        <p className="text-xs text-slate-500 font-medium">No Active License</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplyLicense(pet.id)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">Add a pet first to manage government compliance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GovernmentPortalsView;
