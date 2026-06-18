import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import imageCompression from 'browser-image-compression';

/**
 * Uploads a file to Firebase Cloud Storage and returns its download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'pets/images')
 * @returns The download URL of the uploaded file
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // Compress image before uploading to reduce storage costs
    const options = {
      maxSizeMB: 0.2, // Drastically reduced for cost optimization (200KB limit)
      maxWidthOrHeight: 800, // Reduced resolution
      useWebWorker: true,
      initialQuality: 0.7,
    };
    
    const compressedFile = await imageCompression(file, options);
    
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
