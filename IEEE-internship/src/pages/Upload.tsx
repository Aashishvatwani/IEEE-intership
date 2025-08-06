import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { uploadToIPFS, testPinataConnection } from '../services/ipf5Services';
import { encryptFile, calculateSHA256 } from '../services/cryptoUtils';
import { storeDocument } from '../services/blockchainService';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  cid?: string;
  hash?: string;
  encrypted: boolean;
  uploadDate: Date;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}



const Upload: React.FC = () => {
  const { user, isSignedIn } = useUser()        ;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [encryptFiles, setEncryptFiles] = useState(false);
  const [pinataConnected, setPinataConnected] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Test Pinata connection on component mount
  React.useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const connected = await testPinataConnection();
      setPinataConnected(connected);
    } catch (error) {
      setPinataConnected(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  // Show sign-in message if user is not authenticated
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
            Please sign in to upload and manage your documents securely.
          </p>
          <p className="text-sm text-gray-500">
            Your files will be associated with your account for easy retrieval.
          </p>
        </div>
      </div>
    );
  }

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      encrypted: encryptFiles,
      uploadDate: new Date(),
      status: 'uploading' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    uploadFiles(Array.from(selectedFiles), newFiles);
  };

  // Upload files to IPFS
  const uploadFiles = async (fileList: File[], uploadedFiles: UploadedFile[]) => {
    setIsUploading(true);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadedFile = uploadedFiles[i];

      try {
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress: 25 }
            : f
        ));

        let fileToUpload = file;
        let hash = await calculateSHA256(file);

        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress: 50 }
            : f
        ));

        // Encrypt file if option is enabled
        if (encryptFiles) {
          const encryptedData = await encryptFile(file, 'user-encryption-key');
          // Convert encrypted string to blob
          const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
          fileToUpload = new File([encryptedBlob], file.name + '.encrypted', {
            type: 'application/octet-stream'
          });
        }

        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress: 75 }
            : f
        ));

        // Upload to IPFS via Pinata
        const cid = await uploadToIPFS(fileToUpload, {
          name: file.name,
          keyvalues: {
            originalName: file.name,
            fileSize: file.size.toString(),
            fileType: file.type,
            encrypted: encryptFiles.toString(),
            hash,
            uploadDate: new Date().toISOString(),
            userEmail: user?.emailAddresses?.[0]?.emailAddress || 'anonymous',
            userId: user?.id || 'anonymous',
            userName: user?.fullName || user?.firstName || 'Anonymous User'
          }
        });

        // Store document info on blockchain
        await storeDocument(cid, hash);

        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, cid, hash, status: 'success' as const, progress: 100 }
            : f
        ));

      } catch (error) {
        console.error('Upload failed:', error);
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error', progress: 0 }
            : f
        ));
      }
    }

    setIsUploading(false);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelect({ 0: file, length: 1 } as any);
          }
        }, 'image/jpeg', 0.9);
      }
    }
    stopCamera();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.05),transparent_25%)] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          className="border-b border-gray-800/50 bg-black/50 backdrop-blur-xl sticky top-0 z-40"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  Upload Documents
                </h1>
                <p className="text-gray-400 mt-1">
                  Securely upload and encrypt your files on IPFS with blockchain verification
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Connection Status Card */}
          <motion.div 
            className="mb-8 p-6 rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  pinataConnected === true ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
                  pinataConnected === false ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
                }`}></div>
                <div>
                  <div className="font-semibold text-gray-200">IPFS Network Status</div>
                  <div className="text-sm text-gray-400">
                    Pinata Gateway: {
                      pinataConnected === true ? 'Connected & Ready' : 
                      pinataConnected === false ? 'Connection Failed' : 'Testing Connection...'
                    }
                  </div>
                </div>
              </div>
              <motion.button 
                onClick={testConnection}
                className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Test Connection
              </motion.button>
            </div>
          </motion.div>

          {/* Upload Options */}
          <motion.div 
            className="mb-8 p-6 rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Upload Configuration
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={encryptFiles}
                    onChange={(e) => setEncryptFiles(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                    encryptFiles 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-600 group-hover:border-gray-500'
                  }`}>
                    {encryptFiles && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full flex items-center justify-center text-white text-sm"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-200 font-medium">Enable File Encryption</span>
                  <div className="text-sm text-gray-400">Encrypt files with AES-256 before upload</div>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 overflow-hidden ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-900/30 to-gray-800/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.xlsx,.pptx"
            />
            
            <div className="relative z-10">
              <motion.div 
                className="text-8xl mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📁
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-200 mb-4">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Supports documents, images, videos and more. Maximum file size: 100MB per file.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-3 justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">📂</span>
                  {isUploading ? 'Uploading Files...' : 'Browse Files'}
                  {!isUploading && (
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  )}
                </motion.button>
                
                <motion.button
                  onClick={startCamera}
                  disabled={isUploading || showCamera}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-3 justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">📷</span>
                  Capture Photo
                </motion.button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Secure • Encrypted • Decentralized
                </span>
              </div>
            </div>
          </motion.div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Capture Photo</h3>
                <button
                  onClick={stopCamera}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  📸 Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-300">Uploaded Files</h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">
                      {file.type.startsWith('image/') ? '🖼️' : 
                       file.type.includes('pdf') ? '📄' : 
                       file.type.includes('video') ? '🎥' : '📁'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-300">{file.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatFileSize(file.size)} • {file.encrypted ? 'Encrypted' : 'Plain'}
                      </div>
                      
                      {file.status === 'success' && file.cid && (
                        <div className="text-xs text-green-400 mt-1">
                          CID: {file.cid.substring(0, 20)}...
                        </div>
                      )}
                      
                      {file.status === 'error' && (
                        <div className="text-xs text-red-400 mt-1">
                          Error: {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    
                    {file.status === 'success' && (
                      <div className="text-green-500 text-xl">✅</div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="text-red-500 text-xl">❌</div>
                    )}
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-400 text-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Statistics */}
        {files.length > 0 && (
          <div className="mt-8 p-4 border border-gray-700 rounded-lg bg-gray-900/50">
            <h4 className="font-semibold mb-2 text-gray-300">Upload Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Files</div>
                <div className="font-medium">{files.length}</div>
              </div>
              <div>
                <div className="text-gray-400">Successful</div>
                <div className="font-medium text-green-400">
                  {files.filter(f => f.status === 'success').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Failed</div>
                <div className="font-medium text-red-400">
                  {files.filter(f => f.status === 'error').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Total Size</div>
                <div className="font-medium">
                  {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Upload;
