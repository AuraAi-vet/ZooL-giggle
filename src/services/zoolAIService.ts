// Service for interacting with Google Gen AI models directly

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

const pollVideoStatus = async (operationName: string): Promise<string> => {
  while (true) {
    const res = await fetch(`/api/gemini/video-status?operationName=${encodeURIComponent(operationName)}`);
    if (!res.ok) throw new Error((await res.json()).error);
    const operation = await res.json();

    if (operation.done) {
      if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed");
      }
      
      const response = operation.response;
      if (response && response.generatedVideos && response.generatedVideos.length > 0) {
        // Veo gives video in Base64 or video bytes array, usually video.videoBytes
        return `data:video/mp4;base64,${response.generatedVideos[0].video.videoBytes}`;
      }
      throw new Error("No video returned");
    }

    // Wait 5 seconds before polling again
    await new Promise(r => setTimeout(r, 5000));
  }
};

export const generateVideoFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
  const res = await fetch('/api/gemini/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio })
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const data = await res.json();
  
  if (!data.operationName) throw new Error("No operation name returned");
  return pollVideoStatus(data.operationName);
};

export const generateVideoFromImage = async (image: File, prompt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/gemini/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            imageBytes: (reader.result as string).split(',')[1],
            mimeType: image.type,
            aspectRatio: '16:9'
          })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        
        if (!data.operationName) throw new Error("No operation name returned");
        const videoUrl = await pollVideoStatus(data.operationName);
        resolve(videoUrl);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(image);
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
