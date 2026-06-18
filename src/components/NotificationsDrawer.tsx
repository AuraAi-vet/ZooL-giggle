import { useState, useEffect, useRef } from 'react';
import { X, Bell, CheckCircle } from 'lucide-react';
import { subscribeToNotifications, markNotificationAsRead } from '../services/dbService';
import { auth } from '../lib/firebase';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unsubscribeRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    if (!auth.currentUser) return;

    try {
      unsubscribeRef.current = subscribeToNotifications(auth.currentUser.uid, (notifs) => {
        setNotifications(notifs);
      });
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-800">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-xl text-slate-900">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">No new notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all ${
                  notif.read ? 'bg-transparent border-slate-200/60 opacity-60' : 'bg-white border-blue-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {new Date(notif.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}