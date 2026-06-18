import { HealthRecord, Pet } from '../types';
import { toast } from 'sonner';

const triggeredReminders = new Set<string>();

export const checkAndTriggerReminders = (records: HealthRecord[], pets: Pet[]) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  
  records.forEach(record => {
    if (record.reminderEnabled && record.nextDueDate) {
      if (triggeredReminders.has(record.id)) return;

      const dueDate = new Date(record.nextDueDate);
      const pet = pets.find(p => p.id === record.petId);
      
      // If due today or in the next 24 hours
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 1) {
        triggeredReminders.add(record.id);
        const title = `Health Reminder: ${record.title}`;
        const body = `${pet?.name || 'Your pet'} has a ${record.type} due on ${record.nextDueDate}.`;
        
        // Browser notification
        new Notification(title, {
          body,
          icon: '/logo.png'
        });
        
        // Also show a toast in case they are in the app
        toast.info(title, {
          description: body,
        });
      }
    }
  });
};
