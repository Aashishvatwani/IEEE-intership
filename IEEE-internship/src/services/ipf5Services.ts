// IPFS Service using Pinata
// Install axios for HTTP requests: npm install axios

// Pinata API configuration
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

// Type definitions for Pinata responses
interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

// Removed unused interface

interface PinataListResponse {
  count: number;
  rows: Array<{
    id: string;
    ipfs_pin_hash: string;
    size: number;
    user_id: string;
    date_pinned: string;
    date_unpinned: string | null;
    metadata: {
      name: string;
      keyvalues: Record<string, any>;
    };
  }>;
}

// Get Pinata configuration
const getPinataConfig = () => {
  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;
  const jwt = import.meta.env.VITE_PINATA_JWT;

  if (!jwt && (!apiKey || !secretApiKey)) {
    throw new Error("Pinata API credentials not found. Please set VITE_PINATA_JWT or both VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY in your environment variables.");
  }

  // Prefer JWT over API key/secret if available
  const baseHeaders: Record<string, string> = jwt ? {
    'Authorization': `Bearer ${jwt}`
  } : {
    'pinata_api_key': apiKey,
    'pinata_secret_api_key': secretApiKey
  };

  return {
    apiKey,
    secretApiKey,
    jwt,
    headers: baseHeaders
  };
};

// Upload file to IPFS using Pinata
export async function uploadToIPFS(file: File, metadata?: { name?: string; keyvalues?: Record<string, any> }): Promise<string> {
  try {
    const config = getPinataConfig();
    const formData = new FormData();
    
    formData.append('file', file);
    
    if (metadata) {
      const pinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: metadata.keyvalues || {}
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    const pinataOptions = {
      cidVersion: 1
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    // Use API key/secret authentication instead of JWT for file uploads
    const headers: Record<string, string> = {
      'pinata_api_key': config.apiKey!,
      'pinata_secret_api_key': config.secretApiKey!
    };

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const result: PinataUploadResponse = await response.json();
    console.log(`File uploaded to IPFS with CID: ${result.IpfsHash}`);
    
    return result.IpfsHash;
  } catch (error) {
    throw new Error(`Failed to upload file to IPFS via Pinata: ${error}`);
  }
}

// Upload multiple files to IPFS
export async function uploadMultipleToIPFS(files: File[], folderName?: string): Promise<string> {
  try {
    const config = getPinataConfig();
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('file', file, `${index}-${file.name}`);
    });
    
    const pinataMetadata = {
      name: folderName || `batch-upload-${Date.now()}`,
      keyvalues: {
        fileCount: files.length.toString(),
        uploadedAt: new Date().toISOString()
      }
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: config.headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata batch upload failed: ${response.status} - ${errorText}`);
    }

    const result: PinataUploadResponse = await response.json();
    console.log(`${files.length} files uploaded to IPFS with CID: ${result.IpfsHash}`);
    
    return result.IpfsHash;
  } catch (error) {
    throw new Error(`Failed to upload files to IPFS via Pinata: ${error}`);
  }
}

// Retrieve file from IPFS using Pinata gateway
export async function retrieveFromIPFS(cid: string): Promise<Blob> {
  try {
    if (!isValidCID(cid)) {
      throw new Error('Invalid CID format');
    }

    const response = await fetch(`${PINATA_GATEWAY_URL}/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve file from IPFS. Status: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log(`Retrieved file from CID: ${cid}, Size: ${blob.size} bytes`);
    
    return blob;
  } catch (error) {
    throw new Error(`Failed to retrieve file from IPFS: ${error}`);
  }
}

// Get file info from Pinata
export async function getFileInfo(cid: string): Promise<{
  cid: string;
  size: number;
  name: string;
  datePinned: string;
  metadata?: Record<string, any>;
}> {
  try {
    const config = getPinataConfig();
    
    const response = await fetch(`${PINATA_API_URL}/data/pinList?hashContains=${cid}&status=pinned`, {
      method: 'GET',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info. Status: ${response.status}`);
    }

    const result: PinataListResponse = await response.json();
    
    if (result.rows.length === 0) {
      throw new Error('File not found in Pinata');
    }

    const fileData = result.rows[0];
    
    return {
      cid: fileData.ipfs_pin_hash,
      size: fileData.size,
      name: fileData.metadata.name,
      datePinned: fileData.date_pinned,
      metadata: fileData.metadata.keyvalues
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error}`);
  }
}

// Download file from IPFS
export async function downloadFromIPFS(cid: string, fileName?: string): Promise<Blob> {
  try {
    const blob = await retrieveFromIPFS(cid);
    
    // Trigger download in browser
    if (fileName && typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    return blob;
  } catch (error) {
    throw new Error(`Failed to download file from IPFS: ${error}`);
  }
}

// Generate IPFS gateway URLs
export function generateIPFSGatewayUrl(cid: string, fileName?: string): string {
  return fileName ? `${PINATA_GATEWAY_URL}/${cid}/${fileName}` : `${PINATA_GATEWAY_URL}/${cid}`;
}

export function generateIPFSUrl(cid: string): string {
  return `ipfs://${cid}`;
}

// Check if file exists on IPFS
export async function checkIPFSStatus(cid: string): Promise<{
  exists: boolean;
  accessible: boolean;
  size?: number;
}> {
  try {
    const response = await fetch(`${PINATA_GATEWAY_URL}/${cid}`, { method: 'HEAD' });
    
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      return {
        exists: true,
        accessible: true,
        size: contentLength ? parseInt(contentLength) : undefined
      };
    } else if (response.status === 404) {
      return { exists: false, accessible: false };
    } else {
      return { exists: true, accessible: false };
    }
  } catch (error) {
    console.error(`Error checking IPFS status: ${error}`);
    return { exists: false, accessible: false };
  }
}

// Validate CID format
export function isValidCID(cid: string): boolean {
  // Basic CID validation for both CIDv0 and CIDv1
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Regex = /^b[A-Za-z2-7]{58}$/;
  const cidV1Base32Regex = /^bafy[a-z2-7]{52}$/;
  
  return cidV0Regex.test(cid) || cidV1Regex.test(cid) || cidV1Base32Regex.test(cid);
}

// Unpin file from Pinata (remove from IPFS)
export async function unpinFile(cid: string): Promise<boolean> {
  try {
    const config = getPinataConfig();
    
    const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to unpin file. Status: ${response.status}`);
    }

    console.log(`File unpinned successfully: ${cid}`);
    return true;
  } catch (error) {
    console.error(`Failed to unpin file: ${error}`);
    return false;
  }
}

// Get Pinata account usage stats
export async function getStorageStats(): Promise<{
  totalPinSize: number;
  totalPins: number;
}> {
  try {
    const config = getPinataConfig();
    
    const response = await fetch(`${PINATA_API_URL}/data/userPinnedDataTotal`, {
      method: 'GET',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get storage stats. Status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      totalPinSize: result.pin_size_total,
      totalPins: result.pin_count
    };
  } catch (error) {
    console.error(`Failed to get storage stats: ${error}`);
    return { totalPinSize: 0, totalPins: 0 };
  }
}

// Get files by user email
export async function getFilesByUser(userEmail: string): Promise<Array<{
  cid: string;
  name: string;
  size: number;
  uploadDate: string;
  encrypted: boolean;
  fileType: string;
  hash: string;
  userName?: string;
  userId?: string;
}>> {
  try {
    const config = getPinataConfig();
    
    // Get all pinned files with metadata
    const response = await fetch(`${PINATA_API_URL}/data/pinList?status=pinned&includeCount=false`, {
      method: 'GET',
      headers: {
        'pinata_api_key': config.apiKey!,
        'pinata_secret_api_key': config.secretApiKey!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get file list. Status: ${response.status}`);
    }

    const result: PinataListResponse = await response.json();
    
    // Filter files by user email
    const userFiles = result.rows
      .filter(pin => pin.metadata?.keyvalues?.userEmail === userEmail)
      .map(pin => ({
        cid: pin.ipfs_pin_hash,
        name: pin.metadata?.keyvalues?.originalName || pin.metadata?.name || 'Unknown',
        size: parseInt(pin.metadata?.keyvalues?.fileSize || '0'),
        uploadDate: pin.metadata?.keyvalues?.uploadDate || pin.date_pinned,
        encrypted: pin.metadata?.keyvalues?.encrypted === 'true',
        fileType: pin.metadata?.keyvalues?.fileType || 'unknown',
        hash: pin.metadata?.keyvalues?.hash || '',
        userName: pin.metadata?.keyvalues?.userName,
        userId: pin.metadata?.keyvalues?.userId
      }))
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()); // Sort by newest first

    return userFiles;
  } catch (error) {
    console.error(`Failed to get files for user ${userEmail}: ${error}`);
    return [];
  }
}

// Get files by user ID (alternative method)
export async function getFilesByUserId(userId: string): Promise<Array<{
  cid: string;
  name: string;
  size: number;
  uploadDate: string;
  encrypted: boolean;
  fileType: string;
  hash: string;
  userName?: string;
  userEmail?: string;
}>> {
  try {
    const config = getPinataConfig();
    
    const response = await fetch(`${PINATA_API_URL}/data/pinList?status=pinned&includeCount=false`, {
      method: 'GET',
      headers: {
        'pinata_api_key': config.apiKey!,
        'pinata_secret_api_key': config.secretApiKey!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get file list. Status: ${response.status}`);
    }

    const result: PinataListResponse = await response.json();
    
    // Filter files by user ID
    const userFiles = result.rows
      .filter(pin => pin.metadata?.keyvalues?.userId === userId)
      .map(pin => ({
        cid: pin.ipfs_pin_hash,
        name: pin.metadata?.keyvalues?.originalName || pin.metadata?.name || 'Unknown',
        size: parseInt(pin.metadata?.keyvalues?.fileSize || '0'),
        uploadDate: pin.metadata?.keyvalues?.uploadDate || pin.date_pinned,
        encrypted: pin.metadata?.keyvalues?.encrypted === 'true',
        fileType: pin.metadata?.keyvalues?.fileType || 'unknown',
        hash: pin.metadata?.keyvalues?.hash || '',
        userName: pin.metadata?.keyvalues?.userName,
        userEmail: pin.metadata?.keyvalues?.userEmail
      }))
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return userFiles;
  } catch (error) {
    console.error(`Failed to get files for user ID ${userId}: ${error}`);
    return [];
  }
}

// Test Pinata connection
export async function testPinataConnection(): Promise<boolean> {
  try {
    const config = getPinataConfig();
    
    // Use API key/secret for testing authentication
    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'pinata_api_key': config.apiKey!,
        'pinata_secret_api_key': config.secretApiKey!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Pinata connection test failed: ${response.status} - ${await response.text()}`);
    }

    return response.ok;
  } catch (error) {
    console.error(`Pinata connection test failed: ${error}`);
    return false;
  }
}
