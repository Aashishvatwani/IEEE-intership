import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import QRCode from 'qrcode';
import { uploadToIPFS, testPinataConnection } from '../services/ipf5Services';
import { encryptFile, calculateSHA256 } from '../services/cryptoUtils';
import { storeDocument, isMetaMaskAvailable, isWalletConnected } from '../services/blockchainService';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  cid?: string;
  hash?: string;
  encrypted: boolean;
  uploadDate: Date;
  status: 'uploading' | 'detecting-type' | 'auto-detected' | 'awaiting-type' | 'verifying' | 'verified' | 'verification-failed' | 'success' | 'error' | 'completed';
  error?: string;
  progress?: number;
  documentType?: 'aadhaar' | 'pan' | 'other';
  verificationData?: any;
  qrCodeUrl?: string;
}



const Upload: React.FC = () => {
  const { user, isSignedIn } = useUser()        ;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [encryptFiles, setEncryptFiles] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [useBlockchain, setUseBlockchain] = useState(true); // Enabled by default for development
  const [pinataConnected, setPinataConnected] = useState<boolean | null>(null);
  const [walletConnected, setWalletConnected] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Test Pinata connection and check wallet on component mount
  React.useEffect(() => {
    testConnection();
    checkWalletConnection();
  }, []);

  const testConnection = async () => {
    try {
      const connected = await testPinataConnection();
      setPinataConnected(connected);
    } catch (error) {
      setPinataConnected(false);
    }
  };

  const checkWalletConnection = async () => {
    try {
      const { isMetaMaskAvailable, isWalletConnected } = await import('../services/blockchainService');
      if (isMetaMaskAvailable()) {
        const connected = await isWalletConnected();
        setWalletConnected(connected);
      } else {
        setWalletConnected(false);
      }
    } catch (error) {
      setWalletConnected(false);
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
    console.log('Upload started with blockchain toggle:', useBlockchain);
    console.log('Wallet connected:', walletConnected);
    
    // Validate encryption settings
    if (encryptFiles && (!encryptionKey.trim() || encryptionKey.length < 8)) {
      alert('Please enter an encryption key (minimum 8 characters) when encryption is enabled.');
      return;
    }
    
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
          if (!encryptionKey.trim()) {
            throw new Error('Encryption key is required when encryption is enabled');
          }
          
          if (encryptionKey.length < 8) {
            throw new Error('Encryption key must be at least 8 characters long');
          }
          
          const encryptedData = await encryptFile(file, encryptionKey.trim());
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

        // Update file with CID and set to detecting type
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, cid, hash, status: 'detecting-type' as const, progress: 85 }
            : f
        ));

        // Automatically detect document type using OCR
        try {
          const typeResponse = await fetch('http://localhost:4000/upload/detect-type', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ipfsCID: cid,
              fileName: file.name
            }),
          });

          const typeResult = await typeResponse.json();

          if (typeResult.success && typeResult.documentType && typeResult.documentType !== 'unknown') {
            // Auto-detected document type successfully
            const detectedType = typeResult.documentType as 'aadhaar' | 'pan' | 'other';
            
            setFiles(prev => prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, documentType: detectedType, status: 'auto-detected' as const, progress: 95 }
                : f
            ));

            // If it's Aadhaar or PAN, automatically proceed with verification
            if (detectedType === 'aadhaar' || detectedType === 'pan') {
              console.log('🎯 Auto-detected document type, triggering verification:', { detectedType, fileId: uploadedFile.id });
              
              // Use the state update callback to get the current file data
              setFiles(prev => {
                const currentFile = prev.find(f => f.id === uploadedFile.id);
                if (currentFile && currentFile.cid) {
                  // Trigger verification with current file data
                  setTimeout(() => handleDocumentTypeSelection(uploadedFile.id, detectedType, currentFile), 0);
                }
                return prev; // Don't change state, just use it to get current data
              });
            } else {
              console.log('📄 Other document type detected, marking as completed:', detectedType);
              // For 'other' documents, mark as completed
              setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, status: 'completed' as const, progress: 100 }
                  : f
              ));
            }
          } else {
            // Auto-detection failed, fall back to manual selection
            setFiles(prev => prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, status: 'awaiting-type' as const, progress: 90 }
                : f
            ));
          }
        } catch (typeError) {
          console.error('Document type detection failed:', typeError);
          // Fall back to manual type selection
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'awaiting-type' as const, progress: 90 }
              : f
          ));
        }

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

  // Handle document type selection and verification
  const handleDocumentTypeSelection = async (fileId: string, documentType: 'aadhaar' | 'pan' | 'other', fileData?: UploadedFile) => {
    console.log('🔍 Starting document verification for:', { fileId, documentType });
    
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, documentType, status: 'verifying' as const, progress: 95 }
        : f
    ));

    // Use provided fileData or find from current state
    const file = fileData || files.find(f => f.id === fileId);
    if (!file || !file.cid) {
      console.error('❌ File or CID not found for verification:', { 
        fileId, 
        hasFileData: !!fileData,
        fileData: fileData,
        hasFile: !!file,
        file: file,
        hasCid: !!file?.cid,
        filesCount: files.length,
        allFiles: files.map(f => ({ id: f.id, name: f.name, cid: f.cid }))
      });
      return;
    }
    
    console.log('📄 File details for verification:', { 
      name: file.name, 
      cid: file.cid, 
      documentType 
    });

    if (documentType === 'aadhaar' || documentType === 'pan') {
      try {
        console.log('🚀 Sending verification request to backend...', {
          ipfsCID: file.cid,
          documentType,
          fileName: file.name
        });
        
        // Send file to backend for verification
        const response = await fetch('http://localhost:4000/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ipfsCID: file.cid,
            documentType: documentType,
            fileName: file.name
          }),
        });

        console.log('📨 Backend response status:', response.status);
        const result = await response.json();
        console.log('📋 Backend verification result:', result);

        if (result.success && result.verification.valid) {
          // Verification successful
          console.log('✅ Document verification successful!');
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'verified' as const, 
                  progress: 98,
                  verificationData: result
                }
              : f
          ));

          // Now store on blockchain if enabled
          await handleBlockchainStorage(fileId, file);
        } else {
          // Verification failed
          console.log('❌ Document verification failed:', result.verification?.message);
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'verification-failed' as const, 
                  error: result.verification?.message || 'Document verification failed',
                  progress: 0
                }
              : f
          ));
        }
      } catch (error) {
        console.error('💥 Error during verification:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'verification-failed' as const, 
                error: 'Failed to verify document: ' + (error instanceof Error ? error.message : 'Unknown error'),
                progress: 0
              }
            : f
        ));
      }
    } else {
      // For 'other' type, skip verification but still generate QR and proceed to blockchain
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'verified' as const, progress: 98 }
          : f
      ));
      
      // Go directly to blockchain storage (which will generate QR) - Use state callback
      setFiles(prev => {
        const currentFile = prev.find(f => f.id === fileId);
        if (currentFile && currentFile.cid && currentFile.hash) {
          setTimeout(() => handleBlockchainStorage(fileId, currentFile), 0);
        }
        return prev;
      });
    }
  };

  // Handle blockchain storage
  const handleBlockchainStorage = async (fileId: string, fileData?: UploadedFile) => {
    const startTime = performance.now();
    console.log('🔗 Starting blockchain storage process...');
    
    // Use provided fileData or find from current state
    const file = fileData || files.find(f => f.id === fileId);
    if (!file || !file.cid || !file.hash) {
      console.error('❌ Missing file data for blockchain storage:', { 
        fileId, 
        hasFileData: !!fileData,
        fileData: fileData,
        hasFile: !!file, 
        file: file,
        hasCid: !!file?.cid, 
        hasHash: !!file?.hash,
        filesCount: files.length,
        allFiles: files.map(f => ({ id: f.id, name: f.name, cid: f.cid, hash: f.hash }))
      });
      return;
    }

    console.log('📄 File ready for blockchain storage:', { 
      name: file.name, 
      cid: file.cid.substring(0, 20) + '...', 
      hash: file.hash.substring(0, 20) + '...',
      documentType: file.documentType 
    });

    // Generate QR code for ALL documents (encrypted or not) - Start timing
    let qrCodeUrl = '';
    if (file.documentType && file.hash) {
      const qrStartTime = performance.now();
      console.log('🎨 Generating QR code...');
      qrCodeUrl = await generateQRCode(file.documentType, file.hash, file.name);
      const qrEndTime = performance.now();
      console.log(`✅ QR code generated in ${(qrEndTime - qrStartTime).toFixed(2)}ms`);
    }

    if (useBlockchain) {
      try {
        const blockchainStartTime = performance.now();
        console.log('🔗 Attempting to store document on blockchain...');
        console.log('📋 Blockchain storage details:', { cid: file.cid, hash: file.hash });
        
        const receipt = await storeDocument(file.cid, file.hash);
        const blockchainEndTime = performance.now();
        
        console.log('✅ Document stored on blockchain successfully:', {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          timeElapsed: `${(blockchainEndTime - blockchainStartTime).toFixed(2)}ms`
        });
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'success' as const, progress: 100, qrCodeUrl }
            : f
        ));
        
        const totalTime = performance.now() - startTime;
        console.log(`🏁 Total blockchain storage process completed in ${totalTime.toFixed(2)}ms`);
      } catch (error) {
        const errorTime = performance.now() - startTime;
        console.error('❌ Blockchain storage failed after', `${errorTime.toFixed(2)}ms:`, error);
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'error' as const, 
                error: 'Blockchain storage failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
                progress: 90,
                qrCodeUrl
              }
            : f
        ));
      }
    } else {
      console.log('⚠️ Blockchain disabled, skipping blockchain storage');
      // If blockchain is disabled, mark as success but still provide QR
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'success' as const, progress: 100, qrCodeUrl }
          : f
      ));
      
      const totalTime = performance.now() - startTime;
      console.log(`🏁 Non-blockchain process completed in ${totalTime.toFixed(2)}ms`);
    }
  };

  // Generate QR Code for encrypted documents
  const generateQRCode = async (documentType: string, hash: string, fileName: string): Promise<string> => {
    try {
      let qrData = '';
      let displayName = '';
      
      if (documentType === 'aadhaar') {
        qrData = `aadhaar:${hash}`;
        displayName = 'Aadhaar Document';
      } else if (documentType === 'pan') {
        qrData = `pan:${hash}`;
        displayName = 'PAN Document';
      } else {
        qrData = `${fileName}:${hash}`;
        displayName = fileName;
      }
      
      // Generate QR code with better settings for complex data
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300, // Larger size for better readability
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for complex data
      });
      
      // Create a canvas to add label and improve presentation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return qrCodeDataUrl;
      
      const qrImage = new Image();
      qrImage.onload = () => {
        // Set canvas size (QR code + space for text)
        canvas.width = 300;
        canvas.height = 380; // Extra space for text
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, 300, 300);
        
        // Add title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📄 Document Verification QR', 150, 325);
        
        // Add document name
        ctx.font = '14px Arial';
        ctx.fillText(displayName, 150, 345);
        
        // Add hash preview (first 16 chars)
        ctx.font = '10px monospace';
        ctx.fillText(`Hash: ${hash.substring(0, 16)}...`, 150, 365);
      };
      qrImage.src = qrCodeDataUrl;
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  };

  // Download QR Code
  const downloadQRCode = (qrCodeUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${fileName}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download original file from IPFS
  const downloadFile = async (cid: string, fileName: string, fileType: string) => {
    try {
      // Use Pinata gateway to fetch the file
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      
      // Fetch the file as blob
      const response = await fetch(ipfsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Ensure proper file extension
      const fileExtension = fileName.includes('.') 
        ? '' 
        : getFileExtension(fileType);
      
      link.download = `${fileName}${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Helper function to get file extension based on MIME type
  const getFileExtension = (mimeType: string): string => {
    const mimeToExt: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip'
    };
    
    return mimeToExt[mimeType] || '';
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
              
              {/* Encryption Key Input - Only show when encryption is enabled */}
              {encryptFiles && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-300">
                    Encryption Key
                  </label>
                  <input
                    type="password"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    placeholder="Enter a strong encryption key"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <div className="text-xs text-gray-500">
                    💡 <strong>Remember this key!</strong> You'll need it to decrypt your files later.
                  </div>
                  {encryptionKey.length > 0 && encryptionKey.length < 8 && (
                    <div className="text-xs text-yellow-400">
                      ⚠️ Key should be at least 8 characters for better security
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Blockchain Toggle */}
            <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative">
                  <div 
                    className={`w-12 h-6 rounded-full transition-all duration-300 ${
                      useBlockchain ? 'bg-gradient-to-r from-purple-500 to-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <motion.div 
                      className="w-5 h-5 bg-white rounded-full shadow-lg absolute top-0.5"
                      animate={{ x: useBlockchain ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <input
                    type="checkbox"
                    checked={useBlockchain}
                    onChange={(e) => setUseBlockchain(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {useBlockchain && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-white text-xs font-bold"
                      >
                        ⛓️
                      </motion.div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 font-medium">Store on Blockchain</span>
                    {walletConnected === false && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                        MetaMask Required
                      </span>
                    )}
                    {walletConnected === true && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        Wallet Connected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Create immutable blockchain record for verification
                    <div className="text-xs text-gray-500 mt-1">
                      📋 All documents get QR codes regardless of this setting
                      <br />
                      ⛓️ Enable this to also store document hashes on blockchain for extra security
                    </div>
                  </div>
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
                          {file.qrCodeUrl && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={file.qrCodeUrl} 
                                  alt="QR Code" 
                                  className="w-16 h-16 border border-gray-600 rounded"
                                />
                                <div>
                                  <div className="text-blue-400 text-xs font-medium">
                                    � Document QR Code
                                    {file.encrypted && <span className="text-yellow-400 ml-1">🔐</span>}
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <button
                                      onClick={() => downloadQRCode(file.qrCodeUrl!, file.name)}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                    >
                                      Download QR
                                    </button>
                                    <button
                                      onClick={() => downloadFile(file.cid!, file.name, file.type)}
                                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                    >
                                      Download File
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                QR contains: {file.documentType === 'aadhaar' ? 'aadhaar' : 
                                           file.documentType === 'pan' ? 'pan' : 
                                           file.name}:{file.hash?.substring(0, 10)}...
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {file.status === 'awaiting-type' && (
                        <div className="mt-2">
                          <div className="text-xs text-yellow-400 mb-2">Select document type:</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDocumentTypeSelection(file.id, 'aadhaar')}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Aadhaar
                            </button>
                            <button
                              onClick={() => handleDocumentTypeSelection(file.id, 'pan')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              PAN
                            </button>
                            <button
                              onClick={() => handleDocumentTypeSelection(file.id, 'other')}
                              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                              Other
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'verifying' && (
                        <div className="text-xs text-blue-400 mt-1">
                          Verifying document...
                        </div>
                      )}
                      
                      {file.status === 'verified' && (
                        <div className="text-xs text-green-400 mt-1">
                          Document verified ✅ - Processing blockchain storage...
                        </div>
                      )}
                      
                      {file.status === 'verification-failed' && (
                        <div className="text-xs text-red-400 mt-1">
                          Verification failed: {file.error}
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
                    {(file.status === 'uploading' || file.status === 'verifying' || file.status === 'detecting-type') && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    
                    {file.status === 'awaiting-type' && (
                      <div className="text-yellow-500 text-xl">⏳</div>
                    )}

                    {file.status === 'auto-detected' && (
                      <div className="text-green-500 text-xl">🔍</div>
                    )}

                    {file.status === 'completed' && (
                      <div className="text-blue-500 text-xl">📄</div>
                    )}
                    
                    {file.status === 'verified' && (
                      <div className="text-blue-500 text-xl">🔍</div>
                    )}
                    
                    {file.status === 'success' && (
                      <div className="text-green-500 text-xl">✅</div>
                    )}
                    
                    {(file.status === 'error' || file.status === 'verification-failed') && (
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
                <div className="text-gray-400">Verified</div>
                <div className="font-medium text-green-400">
                  {files.filter(f => f.status === 'success' || f.status === 'verified' || f.status === 'completed').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Failed</div>
                <div className="font-medium text-red-400">
                  {files.filter(f => f.status === 'error' || f.status === 'verification-failed').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Encrypted</div>
                <div className="font-medium text-yellow-400">
                  {files.filter(f => f.encrypted).length}
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
