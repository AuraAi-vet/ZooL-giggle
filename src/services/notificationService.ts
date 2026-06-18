import { useStore } from '../store/useStore';
import { HealthRecord } from '../types';

export const sendNotification = (title: string, message: string) => {
  const { addNotification } = useStore.getState();
  addNotification({
    title,
    message,
    type: 'system'
  });
};

export const scheduleReminder = (title: string, date: string) => {
  // Local state notification scheduler
  console.log(`Reminder scheduled: ${title} for ${date}`);
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export function sendPushNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options
    });
  }
}

// Service to check for upcoming vaccinations/checkups and trigger local notifications
export function checkRemindersAndNotify(records: HealthRecord[]) {
  const now = new Date();
  
  // Filter for reminders set within the next 48 hours that haven't been completed
  records.forEach(record => {
    if (record.reminderEnabled && record.nextDueDate) {
      const dueDate = new Date(record.nextDueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      // Notify if due within the next 48 hours and hasn't been notified yet 
      if (hoursDiff > 0 && hoursDiff <= 48) {
        const storageKey = `zool_notified_${record.id}`;
        if (!localStorage.getItem(storageKey)) {
          sendPushNotification(`Upcoming Health Reminder: ${record.type.toUpperCase()}`, {
            body: `Your companion needs a ${record.type} soon (${dueDate.toLocaleDateString()}). Notes: ${record.clinicalNotes || 'None'}`,
          });
          localStorage.setItem(storageKey, 'true');
        }
      }
    }
  });
}
