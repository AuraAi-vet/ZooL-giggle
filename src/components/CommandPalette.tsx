import { useState, useEffect, useRef } from 'react';
import { Search, Command, Calendar, FileText, Settings, User } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface CommandPaletteProps {
  onNavigate: (view: 'dashboard' | 'settings' | 'inbox') => void;
  userRole: string | null;
}

export default function CommandPalette({ onNavigate, userRole }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search Results logic
  const actions = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <User className="w-4 h-4" />, action: () => onNavigate('dashboard') },
    { id: 'settings', label: 'Go to Settings', icon: <Settings className="w-4 h-4" />, action: () => onNavigate('settings') },
  ];

  if (userRole === 'role_vet_02') {
    actions.push({ id: 'clinical-tools', label: 'Open Clinical Tools', icon: <FileText className="w-4 h-4" />, action: () => { onNavigate('dashboard'); } });
  }
  
  if (userRole === 'role_owner_01') {
    actions.push({ id: 'book-appointment', label: 'Book new Appointment', icon: <Calendar className="w-4 h-4" />, action: () => { onNavigate('dashboard'); } });
  }

  const filteredActions = query 
    ? actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] transition-opacity" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 top-[15vh] z-[101] flex justify-center items-start pointer-events-none px-4">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-3xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto border border-white/50">
          <div className="flex items-center px-6 py-5 border-b border-slate-200/50">
            <Search className="w-6 h-6 text-sky-500 mr-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('search')}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 font-medium text-lg placeholder-slate-400 font-sans"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-mono ml-3 border border-slate-200">
              <Command className="w-3.5 h-3.5" />
              <span className="font-bold">K</span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-3">
            {filteredActions.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-medium">
                No results found for "<span className="text-slate-800">{query}</span>"
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="px-4 py-2 mt-2 leading-none text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Suggestions
                </div>
                {filteredActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-sky-50 rounded-2xl transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-sky-600 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.2)] rounded-xl transition-all">
                        {action.icon}
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-sky-700 text-sm">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
