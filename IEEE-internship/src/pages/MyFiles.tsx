import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import QRCode from 'qrcode';
import { getFilesByUser } from '../services/ipf5Services';
import { decryptFile } from '../services/cryptoUtils';

interface UserFile {
  cid: string;
  name: string;
  size: number;
  uploadDate: string;
  encrypted: boolean;
  fileType: string;
  hash: string;
  userName?: string;
  userId?: string;
  documentType?: string; // Add document type for QR generation
}

const MyFiles: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Decryption modal state
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (isSignedIn && user?.emailAddresses?.[0]?.emailAddress) {
      loadUserFiles();
    }
  }, [isSignedIn, user]);

  const loadUserFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (userEmail) {
        const userFiles = await getFilesByUser(userEmail);
        setFiles(userFiles);
      }
    } catch (err) {
      setError('Failed to load your files. Please try again.');
      console.error('Error loading user files:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: UserFile) => {
    try {
      // Check if file is encrypted
      if (file.encrypted) {
        // Open decryption modal for encrypted files
        setSelectedFile(file);
        setShowDecryptModal(true);
        return;
      }

      const docType = file.documentType || detectDocumentType(file.name);
      
      // For Aadhaar and PAN documents, get from backend API
      if (docType === 'aadhaar' || docType === 'pan') {
        await downloadFromBackend(file);
      } else {
        // For other documents, download directly from IPFS
        await downloadFromIPFS(file.cid, file.name);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const downloadEncryptedFile = async () => {
    if (!selectedFile || !decryptionKey.trim()) {
      alert('Please enter a decryption key.');
      return;
    }

    setIsDecrypting(true);

    try {
      // Fetch encrypted data from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${selectedFile.cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file: ${response.status} ${response.statusText}`);
      }
      
      const encryptedText = await response.text();
      
      // Decrypt the file data
      const decryptedData = decryptFile(encryptedText, decryptionKey.trim());
      
      // Convert data URL back to blob
      const byteCharacters = atob(decryptedData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: selectedFile.fileType });
      
      // Download the decrypted file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Close modal and reset state
      setShowDecryptModal(false);
      setSelectedFile(null);
      setDecryptionKey('');
      
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Failed to decrypt file. Please check your decryption key and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const closeDecryptModal = () => {
    setShowDecryptModal(false);
    setSelectedFile(null);
    setDecryptionKey('');
  };

  const downloadFromBackend = async (file: UserFile) => {
    try {
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) {
        alert('User email not found. Please sign in again.');
        return;
      }

      const response = await fetch('/api/download-secure-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          cid: file.cid,
          fileName: file.name,
          documentType: file.documentType || detectDocumentType(file.name)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download secure document');
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Backend download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to download ${file.documentType || 'secure'} document: ${errorMessage}`);
    }
  };

  const downloadFromIPFS = async (cid: string, filename: string) => {
    try {
      // Fetch the file as a blob from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('IPFS download failed:', error);
      throw error;
    }
  };

  // Generate and download QR code for document
  const downloadQRCode = async (file: UserFile) => {
    try {
      if (!file.hash) {
        alert('Document hash not available for QR generation.');
        return;
      }

      // Determine QR data format based on document type or filename
      let qrData = '';
      const docType = file.documentType || detectDocumentType(file.name);
      
      if (docType === 'aadhaar') {
        qrData = `aadhaar:${file.hash}`;
      } else if (docType === 'pan') {
        qrData = `pan:${file.hash}`;
      } else {
        // For other documents, use filename
        const cleanFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        qrData = `${cleanFileName}:${file.hash}`;
      }

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Download QR code as image
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${file.name}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('QR Code generation failed:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  // Detect document type from filename (basic detection)
  const detectDocumentType = (filename: string): string => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('aadhaar') || lowerName.includes('aadhar')) {
      return 'aadhaar';
    }
    if (lowerName.includes('pan')) {
      return 'pan';
    }
    return 'other';
  };

  // Get QR content for preview
  const getQRContent = (file: UserFile): string => {
    if (!file.hash) return 'Hash not available';
    
    const docType = file.documentType || detectDocumentType(file.name);
    
    if (docType === 'aadhaar') {
      return `aadhaar:${file.hash}`;
    } else if (docType === 'pan') {
      return `pan:${file.hash}`;
    } else {
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      return `${cleanFileName}:${file.hash}`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    return '📁';
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            Please sign in to view your uploaded files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_25%)] pointer-events-none" />
      
      <div className="relative z-0 pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                My Files
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your securely stored documents on IPFS
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Signed in as {user?.emailAddresses?.[0]?.emailAddress}</span>
              </div>
              <button
                onClick={loadUserFiles}
                disabled={loading}
                className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Loading your files...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Files Grid */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {files.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-300">No files uploaded yet</h3>
                  <p className="text-gray-500 mb-6">Start by uploading your first document to IPFS</p>
                  <a
                    href="/upload"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Upload Files
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.cid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:bg-gray-900/70 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                          <div>
                            <h3 className="font-semibold text-white truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </h3>
                            <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        {file.encrypted && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-purple-300">Encrypted</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Uploaded:</span>
                          <span className="text-gray-300">{formatDate(file.uploadDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Document Type:</span>
                          <span className="text-gray-300">
                            {file.documentType || detectDocumentType(file.name)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Hash:</span>
                          <span className="text-gray-300 font-mono text-xs truncate max-w-[120px]" title={file.hash}>
                            {file.hash ? `${file.hash.substring(0, 10)}...` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">CID:</span>
                          <span className="text-gray-300 font-mono text-xs truncate max-w-[120px]" title={file.cid}>
                            {file.cid}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">QR Content:</span>
                          <span className="text-gray-300 font-mono text-xs truncate max-w-[120px]" title={getQRContent(file)}>
                            {getQRContent(file).substring(0, 15)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadQRCode(file)}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5a3 3 0 013 3v6a1 1 0 01-1 1H4a1 1 0 01-1-1V7a3 3 0 013-3z" />
                          </svg>
                          📱 Download QR
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors relative"
                          title={`Download Original File ${
                            (file.documentType || detectDocumentType(file.name)) === 'aadhaar' || 
                            (file.documentType || detectDocumentType(file.name)) === 'pan' 
                              ? '(Secure Backend)' 
                              : '(IPFS)'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {/* Security indicator for Aadhaar/PAN */}
                          {((file.documentType || detectDocumentType(file.name)) === 'aadhaar' || 
                            (file.documentType || detectDocumentType(file.name)) === 'pan') && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(`https://gateway.pinata.cloud/ipfs/${file.cid}`)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                          title="Copy IPFS URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stats */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
                >
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{files.length}</div>
                    <div className="text-sm text-gray-400">Total Files</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {files.filter(f => f.encrypted).length}
                    </div>
                    <div className="text-sm text-gray-400">Encrypted</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
                    </div>
                    <div className="text-sm text-gray-400">Total Size</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {new Set(files.map(f => f.fileType)).size}
                    </div>
                    <div className="text-sm text-gray-400">File Types</div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Decryption Modal */}
      {showDecryptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Decrypt File</h3>
              <button
                onClick={closeDecryptModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-purple-300 font-medium">Encrypted File</span>
              </div>
              <p className="text-gray-300 font-medium">{selectedFile?.name}</p>
              <p className="text-gray-500 text-sm">{selectedFile && formatFileSize(selectedFile.size)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Decryption Key
              </label>
              <input
                type="password"
                value={decryptionKey}
                onChange={(e) => setDecryptionKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your decryption key"
                autoFocus
              />
              <p className="text-gray-500 text-xs mt-1">
                Enter the same encryption key you used when uploading this file.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDecryptModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={downloadEncryptedFile}
                disabled={isDecrypting || !decryptionKey.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isDecrypting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Decrypting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Decrypt & Download
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
