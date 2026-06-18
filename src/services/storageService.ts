import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import imageCompression from 'browser-image-compression';

/**
 * Resizes an image file to fit within 1280x720 using an HTML5 Canva element.
 */
const resizeImageWithCanvas = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxWidth = 1280;
        const maxHeight = 720;

        let ratio = 1;
        if (width > maxWidth || height > maxHeight) {
          ratio = Math.min(maxWidth / width, maxHeight / height);
        }

        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback to original file if context creation failed
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type || 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error("Failed to load pet image onto canvas"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("FileReader failed to process pet image"));
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file to Firebase Cloud Storage and returns its download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'pets/images')
 * @returns The download URL of the uploaded file
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // 1. Pre-process high-resolution pet photo to max of 1280x720 via HTML5 canvas
    const processedFile = await resizeImageWithCanvas(file);

    // 2. Compress image further before uploading to reduce storage costs
    const options = {
      maxSizeMB: 0.2, // Drastically reduced for cost optimization (200KB limit)
      maxWidthOrHeight: 800, // Reduced resolution
      useWebWorker: true,
      initialQuality: 0.7,
    };
    
    const compressedFile = await imageCompression(processedFile, options);
    
    const filename = `${Date.now()}_${compressedFile.name}`;
    const storageRef = ref(storage, `${path}/${filename}`);
    
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};
