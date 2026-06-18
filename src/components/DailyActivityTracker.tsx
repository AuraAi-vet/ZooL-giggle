import { useState, useRef, useEffect } from 'react';
import { Activity, Plus, Mic, MicOff, CheckCircle, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useLanguage } from '../lib/i18n';

interface ActivityLog {
  id: string;
  type: string;
  duration: number; // minutes
  date: string; // YYYY-MM-DD
}

const INITIAL_DATA: ActivityLog[] = [
  { id: '1', type: 'Walk', duration: 30, date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0] },
  { id: '2', type: 'Play Session', duration: 15, date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0] },
  { id: '3', type: 'Walk', duration: 45, date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0] },
  { id: '4', type: 'Run', duration: 20, date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] },
  { id: '5', type: 'Walk', duration: 35, date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] },
  { id: '6', type: 'Play Session', duration: 25, date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0] },
  { id: '7', type: 'Walk', duration: 40, date: new Date().toISOString().split('T')[0] },
];

const ACTIVITY_TYPES = ['Walk', 'Run', 'Play Session', 'Training'];

// Web Speech API interfaces
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export default function DailyActivityTracker() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_DATA);
  const [isLogging, setIsLogging] = useState(false);
  const [newType, setNewType] = useState(ACTIVITY_TYPES[0]);
  const [newDuration, setNewDuration] = useState(15);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (finalTranscript) {
          parseTranscript(finalTranscript.toLowerCase());
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        // Map app language to BCP-47
        const langMap: Record<string, string> = {
          'en': 'en-US',
          'ml': 'ml-IN',
          'hi': 'hi-IN'
        };
        recognitionRef.current.lang = langMap[language] || 'en-US';
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const parseTranscript = (text: string) => {
    // Attempt to extract number
    const numbers = text.match(/\d+/);
    if (numbers && numbers[0]) {
      setNewDuration(parseInt(numbers[0], 10));
    } else {
      // Word numbers to num
      const wordToNum: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'fifteen': 15, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
        'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'दस': 10, 'पंद्रह': 15, 'बीस': 20, 'तीस': 30,
        'ഒന്ന്': 1, 'രണ്ട്': 2, 'മൂന്ന്': 3, 'അഞ്ച്': 5, 'പത്ത്': 10, 'പതിനഞ്ച്': 15, 'ഇരുപത്': 20, 'മുപ്പത്': 30
      };
      
      for (const [word, num] of Object.entries(wordToNum)) {
        if (text.includes(word)) {
          setNewDuration(num);
          break;
        }
      }
    }

    // Attempt to extract type
    if (text.includes('walk') || text.includes('നടത്തം') || text.includes('നടക്കുക') || text.includes('चलना') || text.includes('सैर')) {
      setNewType('Walk');
    } else if (text.includes('run') || text.includes('ഓട്ടം') || text.includes('ഓടുക') || text.includes('दौड़ना') || text.includes('दौड़')) {
      setNewType('Run');
    } else if (text.includes('play') || text.includes('കളി') || text.includes('കളിക്കുക') || text.includes('खेलना') || text.includes('खेल')) {
      setNewType('Play Session');
    } else if (text.includes('train') || text.includes('പരിശീലനം') || text.includes('प्रशिक्षण') || text.includes('ट्रेनिंग')) {
      setNewType('Training');
    }
  };

  const handleLogActivity = () => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      type: newType,
      duration: newDuration,
      date: new Date().toISOString().split('T')[0],
    };
    setLogs([...logs, newLog]);
    setIsLogging(false);
    setNewDuration(15);
    setNewType(ACTIVITY_TYPES[0]);
    setTranscript('');
  };

  // Group logs by day for the chart
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      totalDuration: 0,
    };
  });

  logs.forEach(log => {
    const day = last7Days.find(d => d.dateStr === log.date);
    if (day) {
      day.totalDuration += log.duration;
    }
  });

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 md:p-8 flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-slate-800">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-xl font-display flex items-center gap-2">
              Daily Activity
              {!isOnline && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-200" title="Offline. Data will sync when reconnected.">
                  <WifiOff className="w-3 h-3" /> Sync Pending
                </span>
              )}
            </h2>
          </div>
        </div>
        {!isLogging && (
          <button 
            onClick={() => setIsLogging(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Log
          </button>
        )}
      </div>

      {isLogging && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Log New Activity</h3>
            <button onClick={() => { setIsLogging(false); setTranscript(''); }} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
          </div>
          
          {/* Voice Command Section */}
          <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl">
             <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Voice Command</p>
                <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title={isListening ? "Stop listening" : "Start speaking ('e.g. 30 minute walk')"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
             </div>
             {transcript && (
               <p className="text-sm font-medium text-slate-700 italic border-l-2 border-emerald-500 pl-2 py-1 bg-slate-50">"{transcript}"</p>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={newType} 
              onChange={(e) => setNewType(e.target.value)}
              className="flex-1 p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex items-center gap-2 flex-1">
              <input 
                type="number" 
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Minutes"
              />
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap">min</span>
            </div>
            <button 
              onClick={handleLogActivity}
              className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
            >
              Save Details
            </button>
          </div>
        </div>
      )}

      <div className="h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
            <XAxis 
              dataKey="dayName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94A3B8' }} 
            />
            <Tooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.08)', fontWeight: 600, fontSize: '13px', color: '#0F172A' }}
              formatter={(value: number) => [`${value} min`, 'Duration']}
              labelStyle={{ color: '#64748B', marginBottom: '4px', fontSize: '12px' }}
            />
            <Bar dataKey="totalDuration" radius={[6, 6, 6, 6]} barSize={32}>
              {last7Days.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === last7Days.length - 1 ? '#10B981' : '#E2E8F0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-between items-center px-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weekly Goal</p>
        <p className="text-sm font-extrabold text-emerald-600">320 min</p>
      </div>
    </div>
  );
}
