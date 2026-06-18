import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Calendar, FileText, Settings, User } from 'lucide-react';

interface CommandPaletteProps {
  onNavigate: (view: 'dashboard' | 'settings') => void;
  userRole: string | null;
}

export default function CommandPalette({ onNavigate, userRole }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 top-[15vh] z-[101] flex justify-center items-start pointer-events-none px-4">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-200">
          <div className="flex items-center px-4 py-4 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pets, tools, or commands..."
              className="flex-1 bg-transparent border-none outline-none text-slate-800 text-lg placeholder-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-mono ml-3">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredActions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions
                </div>
                {filteredActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        {action.icon}
                      </div>
                      <span className="font-semibold text-slate-800">{action.label}</span>
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
