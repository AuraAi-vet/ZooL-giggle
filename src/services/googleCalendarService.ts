import { Appointment, Pet } from '../types';

export interface CalendarEventInput {
  title: string;
  description: string;
  startDateTime: string; // ISO format
  endDateTime: string;   // ISO format
  location?: string;
}

/**
 * Creates a new event in the user's primary Google Calendar.
 */
export const createCalendarEvent = async (accessToken: string, event: CalendarEventInput) => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const body = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    },
    location: event.location,
    reminders: {
      useDefault: true,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create Google Calendar event: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Lists upcoming event entries from the user's primary Google Calendar.
 */
export const listUpcomingCalendarEvents = async (accessToken: string) => {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch events from Google Calendar');
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Helper to construct an ISO string from appointment date and 24h/12h time format.
 */
export const getAppointmentDateTime = (dateStr: string, timeStr: string, durationMinutes = 30): { start: string; end: string } => {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Clean clean timeStr
  let hour = 9;
  let minute = 0;
  
  if (timeStr && timeStr.includes(':')) {
    const timeParts = timeStr.trim().split(/\s+/);
    const [hStr, mStr] = timeParts[0].split(':');
    hour = parseInt(hStr, 10);
    minute = parseInt(mStr, 10);
    
    if (timeParts[1]) {
      const meridiem = timeParts[1].toLowerCase();
      if (meridiem.includes('pm') && hour < 12) {
        hour += 12;
      } else if (meridiem.includes('am') && hour === 12) {
        hour = 0;
      }
    }
  }

  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
};
