/// <reference types="vite/client" />
export const logError = async (error: Error | string, context: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    await fetch(`${baseUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, timestamp: new Date().toISOString() })
    });
  } catch (e) {
    console.error('Failed to log error to server', e);
  }
};
