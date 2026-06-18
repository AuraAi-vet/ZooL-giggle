export async function deriveKey(senderId: string, receiverId: string): Promise<CryptoKey> {
  const combined = [senderId, receiverId].sort().join(':') + ':zool-secret-salt';
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(combined),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('zool-chat-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(text: string, senderId: string, receiverId: string): Promise<{ cipher: string, iv: string }> {
  try {
    const key = await deriveKey(senderId, receiverId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );
    
    // Convert to base64
    const cipherArray = new Uint8Array(encrypted);
    let cipherString = '';
    for (let i = 0; i < cipherArray.length; i++) {
        cipherString += String.fromCharCode(cipherArray[i]);
    }
    const cipherBase64 = btoa(cipherString);
    
    let ivString = '';
    for (let i = 0; i < iv.length; i++) {
        ivString += String.fromCharCode(iv[i]);
    }
    const ivBase64 = btoa(ivString);
    
    return { cipher: cipherBase64, iv: ivBase64 };
  } catch (error) {
    console.error("Encryption failed:", error);
    return { cipher: text, iv: '' }; // fallback
  }
}

export async function decryptMessage(cipherBase64: string, ivBase64: string, senderId: string, receiverId: string): Promise<string> {
  try {
    if (!ivBase64) return cipherBase64; // Fallback for unencrypted messages
    
    const key = await deriveKey(senderId, receiverId);
    
    const ivString = atob(ivBase64);
    const iv = new Uint8Array(ivString.length);
    for (let i = 0; i < ivString.length; i++) {
        iv[i] = ivString.charCodeAt(i);
    }
    
    const cipherString = atob(cipherBase64);
    const cipher = new Uint8Array(cipherString.length);
    for (let i = 0; i < cipherString.length; i++) {
        cipher[i] = cipherString.charCodeAt(i);
    }
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Encrypted Message]";
  }
}
