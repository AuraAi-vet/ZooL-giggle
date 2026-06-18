// Service for interacting with Google Gen AI models directly

// Note: In a real architecture, these calls would either use a backend proxy
// or require the GEMINI_API_KEY environment variable. We will mock the responses
// based on standard behaviors or call our Express server API if set up.

export const generateImage = async (prompt: string, resolution: string, aspectRatio: string): Promise<string> => {
  const res = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, resolution, aspectRatio })
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const data = await res.json();
  return data.imageUrl;
};

export const generateVideoFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    }, 3000);
  });
};

export const generateVideoFromImage = async (image: File, prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
    }, 3500);
  });
};

export const analyzeContent = async (file: File, prompt: string, thinkingLevel: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            thinkingLevel, 
            mediaData: reader.result, 
            mediaType: file.type 
          })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        resolve(data.result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
