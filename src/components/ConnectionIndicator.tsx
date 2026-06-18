import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, CloudOff } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';

export default function ConnectionIndicator() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [lastSync, setLastSync] = useState(Date.now());
  const [isForcedOffline, setIsForcedOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(Date.now());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsubscribe = () => {};
    
    // Subscribe to a lightweight document to track active Firestore connection
    // We use includeMetadataChanges to track when data comes from the server vs cache
    if (auth.currentUser && !isForcedOffline) {
       unsubscribe = onSnapshot(
         doc(db, 'users', auth.currentUser.uid), 
         { includeMetadataChanges: true }, 
         (snapshot) => {
            if (!snapshot.metadata.fromCache) {
                // If it's not from cache, the connection to Firestore is actively working
                setIsOnline(true);
                setLastSync(Date.now());
            }
         }, 
         (error) => {
            console.warn("Connection indicator simulation fallback");
         }
       );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [isForcedOffline]);

  useEffect(() => {
    if (isForcedOffline) {
      disableNetwork(db).catch(console.error);
      setIsOnline(false);
    } else {
      enableNetwork(db).catch(console.error);
      if (typeof window !== 'undefined') setIsOnline(window.navigator.onLine);
    }
  }, [isForcedOffline]);

  const toggleOfflineMode = () => {
    setIsForcedOffline(!isForcedOffline);
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl shadow-sm border backdrop-blur-md transition-all ${isOnline ? 'bg-white/90 border-slate-200/60' : 'bg-slate-900 border-slate-800 text-white'}`}>
      <div className={`p-2 rounded-xl transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
        {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold ${isOnline ? 'text-slate-800' : 'text-slate-100'}`}>
            {isOnline ? 'Telemetry Sync Active' : 'Offline Persistence Mode'}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {isOnline ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ) : (
              <div className="flex items-center gap-1 text-amber-500">
                <Database className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Caching</span>
              </div>
            )}
          </div>
        </div>
        <p className={`text-xs font-medium mt-0.5 ${isOnline ? 'text-slate-500' : 'text-slate-400'}`}>
          {isOnline ? `Last updated: ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Reading charts from local cache...'}
        </p>
      </div>

      {/* Button to toggle offline mode for clinician testing */}
      <div className="pl-3 border-l border-slate-200/50 ml-1">
        <button
          onClick={toggleOfflineMode}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isForcedOffline ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'}`}
          title={isForcedOffline ? "Reconnect to Server" : "Force Offline Mode (Test Cache)"}
        >
          {isForcedOffline ? 'Reconnect' : <span className="flex items-center gap-1"><CloudOff className="w-3.5 h-3.5"/> Force Offline</span>}
        </button>
      </div>
    </div>
  );
}
