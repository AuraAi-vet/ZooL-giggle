import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import { subscribeToActivityLogs } from '../services/dbService';
import { auth } from '../lib/firebase';
import { ActivityLog } from '../types';

export default function ActivityLogsComponent() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (auth.currentUser) {
      unsubscribe = subscribeToActivityLogs(auth.currentUser.uid, (fetchedLogs) => {
        setLogs(fetchedLogs);
        setIsLoading(false);
      });
    } else {
       setIsLoading(false);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col mt-8 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 md:p-8 flex flex-col mt-8 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
          <Activity className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-xl text-slate-800">Activity Logs</h2>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No recent activity found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{log.action}</p>
                <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-2">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
