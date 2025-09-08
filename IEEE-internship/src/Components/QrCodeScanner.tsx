import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

interface QrCodeScannerProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScanResult, onClose }) => {
  const [qrInput, setQrInput] = useState('');
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<any>(null);

  useEffect(() => {
    if (scanMethod === 'camera' && videoRef.current && !qrScannerRef.current) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMethod]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current || qrScannerRef.current) return;
    
    try {
      setIsScanning(true);
      setCameraError('');
      
      // Check if we're on HTTPS or localhost
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        setCameraError('Camera requires HTTPS. Please use HTTPS or localhost for camera access.');
        setIsScanning(false);
        return;
      }

      // Request camera permission first
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setCameraError('No camera found on this device.');
        setIsScanning(false);
        return;
      }

      // Stop any existing scanner first
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      // Add a small delay to ensure previous scanner is fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          stopCamera();
          onScanResult(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: currentCamera, // Use selected camera
          maxScansPerSecond: 5,
        }
      );
      
      await qrScannerRef.current.start();
      
      // Get available cameras for switching
      const cameras = await QrScanner.listCameras(true);
      setAvailableCameras(cameras);
      if (cameras.length > 1) {
        console.log('Multiple cameras available:', cameras);
      }
      
    } catch (error: any) {
      console.error('Camera error:', error);
      let errorMessage = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.message.includes('https')) {
        errorMessage = 'Camera requires HTTPS. Please use HTTPS for camera access or use manual input.';
      }
      
      setCameraError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
    setCurrentCamera(newCamera);
    
    // Restart camera with new preference
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleManualInput = () => {
    if (qrInput.trim()) {
      onScanResult(qrInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Method Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScanMethod('camera')}
            className={`px-3 py-2 rounded text-sm ${scanMethod === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => {
              stopCamera();
              setScanMethod('manual');
            }}
            className={`px-3 py-2 rounded text-sm ${scanMethod === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            ⌨️ Manual
          </button>
        </div>

        <div className="space-y-4">
          {scanMethod === 'camera' ? (
            <div>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded border-2 border-gray-600"
                  playsInline
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-600 bg-opacity-80 text-white px-3 py-1 rounded">
                      📷 Scanning for QR code...
                    </div>
                  </div>
                )}
                
                {/* Camera switch button */}
                {availableCameras.length > 1 && isScanning && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80"
                    title={`Switch to ${currentCamera === 'environment' ? 'front' : 'back'} camera`}
                  >
                    🔄
                  </button>
                )}
              </div>
              
              {cameraError && (
                <div className="text-red-400 text-sm mt-2 p-3 bg-red-900/20 border border-red-500 rounded">
                  <div className="font-semibold mb-1">Camera Error:</div>
                  {cameraError}
                  {cameraError.includes('https') && (
                    <div className="mt-2 text-yellow-400">
                      <strong>Solutions:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Use localhost for development</li>
                        <li>Deploy with HTTPS for production</li>
                        <li>Use manual input as alternative</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-gray-300 text-sm mt-2">
                📱 Point your camera at a QR code to scan it automatically.
                {availableCameras.length > 1 && (
                  <div className="text-blue-400 mt-1">
                    Using {currentCamera === 'environment' ? 'back' : 'front'} camera. Click 🔄 to switch.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Enter QR Code Data Manually:
              </label>
              <input
                type="text"
                className="w-full bg-gray-800 text-white rounded p-3 border border-gray-700"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="aadhaar:0x1234... or pan:0x5678... or filename:0x9abc..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Format: documenttype:hash (e.g., aadhaar:0x1234abcd...)
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            {scanMethod === 'manual' && (
              <button
                onClick={handleManualInput}
                disabled={!qrInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium"
              >
                Verify QR Data
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500 rounded">
          <div className="text-blue-300 text-sm">
            <strong>How to use:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Camera:</strong> Point at QR code for automatic scanning</li>
              <li><strong>Manual:</strong> Copy and paste QR code data</li>
              <li>QR codes contain document verification information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;
