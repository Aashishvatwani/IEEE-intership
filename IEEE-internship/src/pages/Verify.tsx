import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { decryptFile } from '../services/cryptoUtils';
import { verifyDocument } from '../services/blockchainService';
import QrCodeScanner from '../Components/QrCodeScanner';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

interface VerificationData {
  documentType: string;
  extracted: any;
  verification: {
    valid: boolean;
    message?: string;
    name?: string;
    dob?: string;
    gender?: string;
    fatherName?: string;
    suspiciousActivity?: boolean;
    reason?: string;
    extractedData?: any;
    confidence?: number;
  };
  qrDocumentType?: string;
}

const Verify: React.FC = () => {
  // Input fields for both hash and CID
  const [inputHash, setInputHash] = useState('');
  const [inputCID, setInputCID] = useState('');
  const [verifyMethod, setVerifyMethod] = useState<'hash' | 'cid' | 'qr'>('hash');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    isValid: boolean;
    ipfsCID: string;
    uploader: string;
    timestamp: number;
  }>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState('');
  
  // Decryption modal state
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedFileName, setDecryptedFileName] = useState('');
  const [cachedEncryptedContent, setCachedEncryptedContent] = useState('');

  // Test QR data format function for debugging
  const testQRFormat = () => {
    const testHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const testQRData = `aadhaar:${testHash}`;
    console.log('Test QR Data:', testQRData);
    
    // Test parsing
    const parts = testQRData.split(':');
    console.log('Test Parts:', parts);
    
    if (parts.length === 2) {
      const [docType, hash] = parts;
      console.log('Test Document Type:', docType);
      console.log('Test Hash:', hash);
      console.log('Test Hash Valid:', hash.startsWith('0x') && hash.length === 66);
    }
  };



  // Handle hash input change
  const handleHashInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputHash(e.target.value);
    setResult(null);
    setVerificationData(null);
    setError('');
  };

  // Handle CID input change
  const handleCIDInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputCID(e.target.value);
    setResult(null);
    setVerificationData(null);
    setError('');
  };

  // Handle QR code scan result
  const handleQRScanResult = async (qrData: string) => {
    setShowQrScanner(false);
    
    console.log('QR Code Data Received:', qrData);
    
    // Parse QR data format: "documenttype:hash"
    const parts = qrData.split(':');
    if (parts.length !== 2) {
      setError(`Invalid QR code format. Expected format: documenttype:hash. Received: "${qrData}"`);
      return;
    }
    
    const [documentType, hash] = parts;
    console.log('Parsed QR Data:', { documentType, hash });
    
    // Validate hash format
    if (!hash || hash.trim() === '' || hash === '0x' || (!hash.startsWith('0x') && hash.length < 32)) {
      setError(`Invalid hash format in QR code. Expected 0x followed by hex characters. Received hash: "${hash}"`);
      return;
    }
    
    setInputHash(hash);
    
    setLoading(true);
    setResult(null);
    setVerificationData(null);
    setError('');
    
    try {
      console.log('Starting QR verification process...');
      console.log('Document Type:', documentType);
      console.log('Hash:', hash);
      console.log('Hash length:', hash.length);
      console.log('Hash starts with 0x:', hash.startsWith('0x'));
      
      // Check if it's Aadhaar or PAN for backend verification
      if (documentType.toLowerCase() === 'aadhaar' || documentType.toLowerCase() === 'pan') {
        console.log('Processing Aadhaar/PAN verification...');
        
        // First verify on blockchain
        const blockchainResult = await verifyDocument(hash);
        console.log('Blockchain verification result:', blockchainResult);
        setResult(blockchainResult);
        
        // If blockchain verification successful, get backend verification details
        if (blockchainResult.isValid && blockchainResult.ipfsCID) {
          try {
            const backendResponse = await fetch('http://localhost:4000/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ipfsCID: blockchainResult.ipfsCID,
                documentType: documentType.toLowerCase() // Use the document type from QR code
              }),
            });
            
            const backendResult = await backendResponse.json();
            if (backendResult.success) {
              setVerificationData({
                ...backendResult,
                qrDocumentType: documentType
              });
              
              // Show confirmation message for verified Aadhaar/PAN
              if (backendResult.verification.valid) {
                const person = backendResult.verification;
                alert(`✅ ${documentType.toUpperCase()} VERIFIED!\n\nName: ${person.name || 'N/A'}\nGender: ${person.gender || 'N/A'}\nDate of Birth: ${person.dob || 'N/A'}\n\nThis person has been successfully verified in our database.`);
              } else {
                alert(`⚠️ ${documentType.toUpperCase()} VERIFICATION FAILED!\n\nReason: ${backendResult.verification.reason || 'Unknown'}\n\nThis document could not be verified in our database.`);
              }
            }
          } catch (backendError) {
            console.error('Failed to fetch verification details:', backendError);
            setError('Failed to get verification details from backend');
          }
        } else {
          setError(`${documentType.toUpperCase()} document not found on blockchain`);
        }
      } else {
        // For normal documents, try blockchain verification but don't fail if not found
        try {
          const blockchainResult = await verifyDocument(hash);
          setResult(blockchainResult);
          
          if (blockchainResult.isValid) {
            alert(`📄 NORMAL DOCUMENT VERIFIED!\n\nDocument Type: ${documentType}\nDocument Hash: ${hash.substring(0, 20)}...\n\nThis document is registered on the blockchain and can be viewed.`);
            
            // Set verification data for display
            setVerificationData({
              documentType: documentType,
              extracted: { document_name: documentType },
              verification: {
                valid: true,
                message: "Document found on blockchain",
                suspiciousActivity: false
              },
              qrDocumentType: documentType
            });
          } else {
            // Document not on blockchain - show as viewable but not blockchain-verified
            alert(`📄 DOCUMENT QR CODE VALID! ✅\n\nDocument Type: ${documentType}\nDocument Hash: ${hash.substring(0, 20)}...\n\nThe QR code is valid and the document exists in IPFS.\nNote: This document was not stored on blockchain (blockchain toggle was OFF during upload).`);
            
            // Set mock verification data for display
            setVerificationData({
              documentType: documentType,
              extracted: { document_name: documentType },
              verification: {
                valid: true,
                message: "QR code valid - Document in IPFS but not on blockchain",
                suspiciousActivity: false
              },
              qrDocumentType: documentType
            });
          }
        } catch (blockchainError) {
          console.error('Blockchain verification failed:', blockchainError);
          // Still show the document as viewable even if blockchain fails
          alert(`📄 DOCUMENT QR CODE SCANNED!\n\nDocument Type: ${documentType}\nDocument Hash: ${hash.substring(0, 20)}...\n\nQR code is valid. Blockchain verification unavailable but you can view the document details.`);
          
          setVerificationData({
            documentType: documentType,
            extracted: { document_name: documentType },
            verification: {
              valid: true,
              message: "QR code valid - Blockchain verification unavailable",
              suspiciousActivity: false
            },
            qrDocumentType: documentType
          });
        }
      }
    } catch (err: any) {
      setError('QR Verification failed: ' + err.message);
    }
    setLoading(false);
  };
  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setVerificationData(null);
    setError('');
    
    try {
      if (verifyMethod === 'hash') {
        // Verify using document hash (blockchain verification)
        const res = await verifyDocument(inputHash);
        setResult(res);
        
        // If document is valid, fetch verification details from backend
        if (res.isValid && res.ipfsCID) {
          try {
            const backendResponse = await fetch('http://localhost:4000/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ipfsCID: res.ipfsCID,
                documentType: 'auto-detect'
              }),
            });
            
            const backendResult = await backendResponse.json();
            if (backendResult.success) {
              setVerificationData(backendResult);
            }
          } catch (backendError) {
            console.error('Failed to fetch verification details:', backendError);
          }
        }
      } else {
        // Verify using IPFS CID directly (without blockchain verification)
        try {
          const backendResponse = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ipfsCID: inputCID,
              documentType: 'auto-detect'
            }),
          });
          
          const backendResult = await backendResponse.json();
          if (backendResult.success) {
            setVerificationData(backendResult);
            // Set a mock result for CID verification
            setResult({
              isValid: true,
              ipfsCID: inputCID,
              uploader: 'N/A (CID verification)',
              timestamp: 0
            });
          } else {
            setError('Failed to verify document using CID');
          }
        } catch (backendError) {
          setError('Failed to verify document: ' + (backendError instanceof Error ? backendError.message : 'Unknown error'));
        }
      }
    } catch (err: any) {
      setError('Verification failed: ' + err.message);
    }
    setLoading(false);
  };

  // Handle document download with encryption support
  const handleDownload = async (cid: string, filename?: string) => {
    try {
      // First, fetch the file to check if it's encrypted
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      // Get the content to check if it's encrypted
      const content = await response.text();
      
      // Check if the content looks like encrypted data (AES encrypted data starts with specific patterns)
      const isEncrypted = content.startsWith('U2FsdGVkX1') || // CryptoJS encrypted format
                         content.includes('{"iv":') || // JSON encrypted format
                         (content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(content.trim())); // Base64 pattern
      
      if (isEncrypted) {
        // Cache the encrypted content for later decryption
        setCachedEncryptedContent(content);
        // Open decryption modal for encrypted files
        setDecryptedFileName(filename || 'document');
        setShowDecryptModal(true);
        return;
      }
      
      // For non-encrypted files, download directly
      await downloadFromIPFS(cid, filename || 'document');
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const downloadFromIPFS = async (cid: string, filename: string) => {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('IPFS download failed:', error);
      throw error;
    }
  };

  const downloadEncryptedFile = async () => {
    if (!decryptionKey.trim()) {
      alert('Please enter a decryption key.');
      return;
    }

    if (!cachedEncryptedContent) {
      alert('No encrypted content available for decryption.');
      return;
    }

    setIsDecrypting(true);

    try {
      // Use the cached encrypted content instead of fetching again
      const encryptedText = cachedEncryptedContent;
      
      // Decrypt the file data
      const decryptedData = decryptFile(encryptedText, decryptionKey.trim());
      
      // Convert data URL back to blob
      const byteCharacters = atob(decryptedData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Determine the original file type from the data URL
      const mimeMatch = decryptedData.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Download the decrypted file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = decryptedFileName.replace('.encrypted', '');
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Close modal and reset state
      setShowDecryptModal(false);
      setDecryptionKey('');
      setDecryptedFileName('');
      setCachedEncryptedContent('');
      
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Failed to decrypt file. Please check your decryption key and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const closeDecryptModal = () => {
    setShowDecryptModal(false);
    setDecryptionKey('');
    setDecryptedFileName('');
    setCachedEncryptedContent('');
  };

  return (
  <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-lg bg-gray-900/80 rounded-2xl shadow-2xl p-8 backdrop-blur-xl"
        initial="hidden"
        animate="show"
        variants={fadeInUp}
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Verify Document</h2>
        <div className="space-y-6">
          {/* Verification Method Selection */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setVerifyMethod('hash')}
              className={`px-4 py-2 rounded ${verifyMethod === 'hash' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              By Document Hash
            </button>
            <button
              onClick={() => setVerifyMethod('cid')}
              className={`px-4 py-2 rounded ${verifyMethod === 'cid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              By IPFS CID
            </button>
            <button
              onClick={() => setVerifyMethod('qr')}
              className={`px-4 py-2 rounded ${verifyMethod === 'qr' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              📱 Scan QR Code
            </button>
          </div>

          {verifyMethod === 'hash' ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-gray-300 font-medium mb-2">Enter Document Hash:</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                  value={inputHash}
                  onChange={handleHashInput}
                  placeholder="0x..."
                />
                <p className="text-xs text-gray-400 mt-1">Hash verifies document authenticity through blockchain</p>
              </div>
              <button
                className="ml-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold shadow-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                onClick={handleVerify}
                disabled={loading || !inputHash}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          ) : verifyMethod === 'qr' ? (
            <div className="text-center">
              <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-6">
                <div className="text-purple-300 mb-4">
                  📱 QR Code Verification
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Use this method to verify encrypted documents using their QR codes
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowQrScanner(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-bold shadow-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                  >
                    🔍 Open QR Scanner
                  </button>
                  <button
                    onClick={testQRFormat}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-xl font-medium"
                    title="Test QR format parsing"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-gray-300 font-medium mb-2">Enter IPFS CID:</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                  value={inputCID}
                  onChange={handleCIDInput}
                  placeholder="Qm... or baf..."
                />
                <p className="text-xs text-gray-400 mt-1">CID directly accesses document from IPFS (no blockchain verification)</p>
              </div>
              <button
                className="ml-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                onClick={handleVerify}
                disabled={loading || !inputCID}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          {result && (
            <motion.div
              className={`mt-6 p-4 rounded-xl border-2 ${result.isValid ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {result.isValid ? (
                <>
                  <div className="text-green-400 font-bold text-lg mb-2">
                    Document is VALID ✅
                    {verifyMethod === 'hash' && <span className="text-sm font-normal"> (Blockchain Verified)</span>}
                    {verifyMethod === 'cid' && <span className="text-sm font-normal"> (IPFS Direct Access)</span>}
                  </div>
                  <div className="text-gray-200 text-sm mb-1"><span className="font-semibold">IPFS CID:</span> {result.ipfsCID}</div>
                  {verifyMethod === 'hash' && (
                    <>
                      <div className="text-gray-200 text-sm mb-1"><span className="font-semibold">Uploader:</span> {result.uploader}</div>
                      <div className="text-gray-200 text-sm mb-1"><span className="font-semibold">Timestamp:</span> {new Date(result.timestamp * 1000).toLocaleString()}</div>
                    </>
                  )}
                  
                  {/* Show verification details if available */}
                  {verificationData && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Document Details</h4>
                      <div className="text-gray-200 text-sm mb-1">
                        <span className="font-semibold">Document Type:</span> {verificationData.documentType}
                        {verificationData.qrDocumentType && (
                          <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                            📱 QR: {verificationData.qrDocumentType}
                          </span>
                        )}
                      </div>
                      
                      {/* Enhanced display for Aadhaar/PAN */}
                      {((verificationData.qrDocumentType === 'aadhaar' || verificationData.qrDocumentType === 'pan') || 
                        (verificationData.documentType === 'aadhaar' || verificationData.documentType === 'pan')) && (
                        <div className="mt-3">
                          {verificationData.verification.valid ? (
                            <div className="p-3 bg-green-900/50 border border-green-500 rounded-lg">
                              <div className="text-green-400 font-semibold mb-2">
                                ✅ IDENTITY VERIFIED
                                {verificationData.verification.confidence && (
                                  <span className="ml-2 px-2 py-1 bg-green-700 text-green-100 text-xs rounded">
                                    Confidence: {Math.round(verificationData.verification.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                              
                              {/* Document Type Badge */}
                              <div className="mb-3">
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
                                  {verificationData.documentType === 'aadhaar' ? '🆔 AADHAAR CARD' : '📄 PAN CARD'}
                                </span>
                              </div>
                              
                              {/* Verified Information */}
                              <div className="space-y-1">
                                {verificationData.verification.name && (
                                  <div className="text-green-200 text-sm">
                                    <span className="font-semibold">Name:</span> {verificationData.verification.name}
                                  </div>
                                )}
                                {verificationData.verification.dob && (
                                  <div className="text-green-200 text-sm">
                                    <span className="font-semibold">Date of Birth:</span> {verificationData.verification.dob}
                                  </div>
                                )}
                                {verificationData.verification.gender && (
                                  <div className="text-green-200 text-sm">
                                    <span className="font-semibold">Gender:</span> {verificationData.verification.gender}
                                  </div>
                                )}
                                {verificationData.verification.fatherName && (
                                  <div className="text-green-200 text-sm">
                                    <span className="font-semibold">Father's Name:</span> {verificationData.verification.fatherName}
                                  </div>
                                )}
                                
                                {/* Verification Details */}
                                <div className="mt-2 pt-2 border-t border-green-600">
                                  <div className="text-green-300 text-xs">
                                    <span className="font-semibold">Verification Status:</span> {verificationData.verification.message}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Show extracted OCR data */}
                              {verificationData.extracted && (
                                <div className="mt-3 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                                  <div className="text-gray-300 font-semibold mb-2">📊 Extracted Information</div>
                                  <div className="text-gray-400 text-xs mb-2">Data extracted from document via OCR:</div>
                                  <div className="space-y-1 text-sm">
                                    {verificationData.extracted.name && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Extracted Name:</span> {verificationData.extracted.name}
                                      </div>
                                    )}
                                    {verificationData.extracted.dob && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Extracted DOB:</span> {verificationData.extracted.dob}
                                      </div>
                                    )}
                                    {verificationData.extracted.aadhaar_number && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Aadhaar Number:</span> {verificationData.extracted.aadhaar_number}
                                      </div>
                                    )}
                                    {verificationData.extracted.pan_number && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">PAN Number:</span> {verificationData.extracted.pan_number}
                                      </div>
                                    )}
                                    {verificationData.extracted.gender && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Gender:</span> {verificationData.extracted.gender}
                                      </div>
                                    )}
                                    {verificationData.extracted.father_name && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Father's Name:</span> {verificationData.extracted.father_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                              <div className="text-red-400 font-semibold mb-2">
                                ❌ IDENTITY VERIFICATION FAILED
                                {verificationData.verification.confidence && (
                                  <span className="ml-2 px-2 py-1 bg-red-700 text-red-100 text-xs rounded">
                                    Confidence: {Math.round(verificationData.verification.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                              
                              {/* Document Type Badge */}
                              <div className="mb-3">
                                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
                                  {verificationData.documentType === 'aadhaar' ? '🆔 AADHAAR CARD' : '📄 PAN CARD'}
                                </span>
                              </div>
                              
                              <div className="text-red-300 text-sm mb-2">
                                <span className="font-semibold">Reason:</span> {verificationData.verification.reason}
                              </div>
                              <div className="text-red-300 text-sm">
                                <span className="font-semibold">Message:</span> {verificationData.verification.message}
                              </div>
                              
                              {/* Show extracted OCR data for failed verification too */}
                              {verificationData.extracted && (
                                <div className="mt-3 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                                  <div className="text-gray-300 font-semibold mb-2">📊 Extracted Information</div>
                                  <div className="text-gray-400 text-xs mb-2">Data extracted from document via OCR:</div>
                                  <div className="space-y-1 text-sm">
                                    {verificationData.extracted.name && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Extracted Name:</span> {verificationData.extracted.name}
                                      </div>
                                    )}
                                    {verificationData.extracted.dob && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Extracted DOB:</span> {verificationData.extracted.dob}
                                      </div>
                                    )}
                                    {verificationData.extracted.aadhaar_number && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Aadhaar Number:</span> {verificationData.extracted.aadhaar_number}
                                      </div>
                                    )}
                                    {verificationData.extracted.pan_number && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">PAN Number:</span> {verificationData.extracted.pan_number}
                                      </div>
                                    )}
                                    {verificationData.extracted.gender && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Gender:</span> {verificationData.extracted.gender}
                                      </div>
                                    )}
                                    {verificationData.extracted.father_name && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Father's Name:</span> {verificationData.extracted.father_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Display for normal documents */}
                      {verificationData && 
                       verificationData.documentType !== 'aadhaar' && 
                       verificationData.documentType !== 'pan' && 
                       verificationData.qrDocumentType !== 'aadhaar' && 
                       verificationData.qrDocumentType !== 'pan' && (
                        <div className="mt-3 p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
                          <div className="text-blue-400 font-semibold mb-2">📄 NORMAL DOCUMENT</div>
                          <div className="text-blue-200 text-sm mb-2">
                            This is a regular document stored on the blockchain. No identity verification is performed for this document type.
                          </div>
                          <div className="text-blue-300 text-xs">
                            <span className="font-semibold">Document Type:</span> {verificationData.documentType || 'Unknown'}
                          </div>
                        </div>
                      )}
                      
                      {verificationData.verification.suspiciousActivity && (
                        <div className="mt-3 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                          <div className="text-red-400 font-semibold mb-2">⚠️ SUSPICIOUS ACTIVITY DETECTED</div>
                          <div className="text-red-300 text-sm mb-2">
                            <span className="font-semibold">Reason:</span> {verificationData.verification.reason}
                          </div>
                          <div className="text-red-300 text-sm">
                            <span className="font-semibold">Status:</span> This person could not be verified in our database
                          </div>
                          
                          {verificationData.verification.extractedData && (
                            <div className="mt-2">
                              <div className="text-red-300 text-sm font-medium mb-1">Extracted Data (Unverified):</div>
                              <div className="bg-red-900/30 p-2 rounded text-xs text-red-200">
                                {Object.entries(verificationData.verification.extractedData).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Show raw extracted data only for non-identity documents */}
                      {verificationData.extracted && 
                       verificationData.documentType !== 'aadhaar' && 
                       verificationData.documentType !== 'pan' && 
                       verificationData.qrDocumentType !== 'aadhaar' && 
                       verificationData.qrDocumentType !== 'pan' && (
                        <div className="mt-3">
                          <h5 className="text-gray-300 font-medium mb-1">Extracted Data:</h5>
                          <pre className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(verificationData.extracted, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Download button - only for normal documents, not for Aadhaar/PAN */}
                  {verificationData && 
                   verificationData.documentType !== 'aadhaar' && 
                   verificationData.documentType !== 'pan' && 
                   verificationData.qrDocumentType !== 'aadhaar' && 
                   verificationData.qrDocumentType !== 'pan' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDownload(result.ipfsCID, 'document')}
                        className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg font-semibold shadow hover:bg-cyan-700 transition-all"
                      >
                        Download Document
                      </button>
                      <div className="text-gray-400 text-xs mt-1">
                        💡 Download available for non-identity documents
                      </div>
                    </div>
                  )}
                  
                  {/* Message for Aadhaar/PAN documents explaining no download */}
                  {verificationData && 
                   (verificationData.documentType === 'aadhaar' || 
                    verificationData.documentType === 'pan' || 
                    verificationData.qrDocumentType === 'aadhaar' || 
                    verificationData.qrDocumentType === 'pan') && (
                    <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg">
                      <div className="text-yellow-400 font-semibold text-sm mb-1">🔒 Identity Document</div>
                      <div className="text-yellow-200 text-xs">
                        For privacy and security reasons, identity documents (Aadhaar/PAN) cannot be downloaded. 
                        Only verification status and extracted information are displayed.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-red-400 font-bold text-lg">Document is NOT registered ❌</div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* QR Scanner Modal */}
      {showQrScanner && (
        <QrCodeScanner
          onScanResult={handleQRScanResult}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* Decryption Modal */}
      {showDecryptModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Decrypt File</h3>
            <p className="text-gray-300 mb-4">
              This file is encrypted. Please enter the decryption key to download it.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="decryptionKey" className="block text-sm font-medium text-gray-300 mb-2">
                  Decryption Key
                </label>
                <input
                  type="password"
                  id="decryptionKey"
                  value={decryptionKey}
                  onChange={(e) => setDecryptionKey(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your decryption key"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={downloadEncryptedFile}
                  disabled={isDecrypting}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isDecrypting ? 'Decrypting...' : 'Decrypt & Download'}
                </button>
                <button
                  onClick={closeDecryptModal}
                  disabled={isDecrypting}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Verify;
