import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, X, Upload as UploadIcon, CheckCircle, AlertCircle, Copy, Download, FileText, CreditCard, IdCard } from 'lucide-react';
import { generateQRCode, generateQRCodeWithLabel } from '../Components/QrCodeDisplay';
import { storeDocument, isMetaMaskAvailable, isWalletConnected } from '../services/blockchainService';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  encrypted: boolean;
  uploadDate: Date;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
  hash?: string;
  documentType?: string;
  qrCodeUrl?: string;
  blockchainTx?: any; // Changed from string to any to accept TransactionReceipt
}

const Upload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('other');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = Array.from(acceptedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      encrypted: Math.random() > 0.5, // Simulated encryption
      uploadDate: new Date(),
      status: 'uploading',
      progress: 0,
      documentType: selectedDocumentType
    }));

    setFiles(prev => [...prev, ...newFiles]);
    simulateUpload(newFiles);
  }, [selectedDocumentType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const simulateUpload = async (newFiles: UploadedFile[]) => {
    setIsUploading(true);
    
    for (const file of newFiles) {
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }

      // Simulate hash generation and completion
      const simulatedHash = Math.random().toString(36).substr(2, 64);
      
      // Generate QR code
      const qrCodeUrl = await generateQRCode(file.documentType!, simulatedHash);
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: 'completed', 
              hash: simulatedHash,
              qrCodeUrl: qrCodeUrl
            } 
          : f
      ));
    }
    
    setIsUploading(false);
  };

  const handleBlockchainStorage = async (file: UploadedFile) => {
    if (!file.hash) return;
    
    try {
      const txHash = await storeDocument(file.hash, file.name);
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, blockchainTx: txHash }
          : f
      ));
      alert(`Document stored on blockchain! Transaction: ${txHash}`);
    } catch (error) {
      console.error('Blockchain storage failed:', error);
      alert('Failed to store on blockchain. Please check your wallet connection.');
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const downloadQRCode = async (qrCodeUrl: string, fileName: string, file: UploadedFile) => {
    try {
      // Generate enhanced QR code with labels for download
      const enhancedQRCode = await generateQRCodeWithLabel(
        file.documentType || 'other',
        file.hash || '',
        fileName
      );
      
      const link = document.createElement('a');
      link.href = enhancedQRCode;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}-QR-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Enhanced QR code generation failed, using basic version:', error);
      // Fallback to basic QR code
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}-QR-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'aadhaar':
        return <IdCard className="w-5 h-5 text-blue-400" />;
      case 'pan':
        return <CreditCard className="w-5 h-5 text-green-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Secure Document Upload
          </h1>
          <p className="text-gray-400 text-lg">
            Upload your documents securely with blockchain verification and QR code generation
          </p>
        </div>

        {/* Document Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Document Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedDocumentType('aadhaar')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedDocumentType === 'aadhaar'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-400'
              }`}
            >
              <IdCard className="w-5 h-5" />
              <span className="font-medium">Aadhaar Card</span>
            </button>
            <button
              onClick={() => setSelectedDocumentType('pan')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedDocumentType === 'pan'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">PAN Card</span>
            </button>
            <button
              onClick={() => setSelectedDocumentType('other')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedDocumentType === 'other'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-400'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Other Document</span>
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-xl text-blue-400">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-xl text-gray-300 mb-2">
                Drag & drop your documents here, or click to select
              </p>
              <p className="text-gray-500">
                Supports: PDF, DOC, DOCX, PNG, JPG, JPEG
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {files.map(file => (
                <div key={file.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getDocumentIcon(file.documentType!)}
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {formatFileSize(file.size)} • {file.documentType?.toUpperCase() || 'OTHER'}
                          {file.encrypted && <span className="text-yellow-400 ml-1">🔐</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {file.status === 'failed' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{file.progress}% uploaded</p>
                    </div>
                  )}

                  {/* Hash Display */}
                  {file.status === 'completed' && file.hash && (
                    <div className="mt-3 space-y-3">
                      <div className="bg-gray-900 p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Document Hash:</span>
                          <button
                            onClick={() => copyHash(file.hash!)}
                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            <span>{copiedHash === file.hash ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-sm text-gray-400 break-all">{file.hash}</p>
                      </div>

                      {/* QR Code Display */}
                      {file.qrCodeUrl && (
                        <div className="bg-gray-900 p-4 rounded border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-blue-400 text-sm font-medium">
                              📋 Document QR Code
                              {file.encrypted && <span className="text-yellow-400 ml-1">🔐</span>}
                            </div>
                            <div className="text-gray-500 text-xs">
                              Contains: {file.documentType ? file.documentType.toUpperCase() : 'Document'} + Hash
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <img 
                              src={file.qrCodeUrl} 
                              alt="Document QR Code"
                              className="w-32 h-32 border border-gray-600 rounded bg-white p-2"
                            />
                            <div className="flex-1 space-y-2">
                              <button
                                onClick={() => downloadQRCode(file.qrCodeUrl!, file.name, file)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download Enhanced QR Code</span>
                              </button>
                              <p className="text-xs text-gray-500 text-center">
                                Downloads with labels and document info
                              </p>
                              <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                                <p className="text-gray-400 mb-1">QR Code Format:</p>
                                <p className="font-mono text-blue-300">
                                  {file.documentType}:{file.hash?.substring(0, 20)}...
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Blockchain Storage */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleBlockchainStorage(file)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                          disabled={!!file.blockchainTx}
                        >
                          <UploadIcon className="w-4 h-4" />
                          <span>
                            {file.blockchainTx ? 'Stored on Blockchain' : 'Store on Blockchain'}
                          </span>
                        </button>
                        {file.blockchainTx && (
                          <span className="text-green-400 text-sm">✓ Verified</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Statistics */}
        {files.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="font-medium text-gray-300 mb-1">Total Files</h4>
              <p className="text-2xl font-bold text-white">{files.length}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="font-medium text-gray-300 mb-1">Completed</h4>
              <p className="text-2xl font-bold text-green-400">
                {files.filter(f => f.status === 'completed').length}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="font-medium text-gray-300 mb-1">Total Size</h4>
              <p className="text-2xl font-bold text-blue-400">
                {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
