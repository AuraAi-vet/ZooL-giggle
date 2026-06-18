import { useStore } from '../store/useStore';

export const sendNotification = (title: string, message: string) => {
  const { addNotification } = useStore.getState();
  addNotification({
    title,
    message,
    type: 'system'
  });
};

export const scheduleReminder = (title: string, date: string) => {
  // In a real app, this would use Push API or a backend cron job
  console.log(`Reminder scheduled: ${title} for ${date}`);
};
