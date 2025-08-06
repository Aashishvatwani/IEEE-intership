import CryptoJS from "crypto-js";

export function encryptFile(file: File, secret: string): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      try {
        if (typeof reader.result === 'string') {
          const encrypted = CryptoJS.AES.encrypt(reader.result, secret).toString();
          resolve(encrypted);
        } else {
          reject(new Error('Failed to read file as string'));
        }
      } catch (error) {
        reject(new Error(`Encryption failed: ${error}`));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

export function decryptFile(encryptedData: string, secret: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secret);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedData) {
      throw new Error('Decryption failed - invalid secret or corrupted data');
    }
    
    return decryptedData;
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
}

export async function calculateSHA256(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return "0x" + Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    throw new Error(`Failed to calculate SHA256 hash: ${error}`);
  }
}

// Additional utility functions for better crypto operations

export function generateRandomSecret(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return secret;
}

export function validateFileSize(file: File, maxSizeInMB: number = 10): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export async function encryptFileWithMetadata(
  file: File, 
  secret: string
): Promise<{
  encryptedData: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  hash: string;
  timestamp: number;
}> {
  try {
    // Validate file
    if (!validateFileSize(file)) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Calculate hash
    const hash = await calculateSHA256(file);
    
    // Encrypt file
    const encryptedData = await encryptFile(file, secret);
    
    return {
      encryptedData,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hash,
      timestamp: Date.now()
    };
  } catch (error) {
    throw new Error(`Failed to encrypt file with metadata: ${error}`);
  }
}

export function decryptFileWithMetadata(
  encryptedData: string,
  secret: string,
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }
): { blob: Blob; fileName: string } {
  try {
    const decryptedData = decryptFile(encryptedData, secret);
    
    // Convert data URL back to blob
    const byteCharacters = atob(decryptedData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: metadata.fileType });
    
    return {
      blob,
      fileName: metadata.fileName
    };
  } catch (error) {
    throw new Error(`Failed to decrypt file with metadata: ${error}`);
  }
}
