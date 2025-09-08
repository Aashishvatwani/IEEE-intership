import QRCode from 'qrcode';

// Generate QR code with enhanced settings for better readability
export const generateQRCode = async (documentType: string, hash: string): Promise<string> => {
  try {
    // Create the QR content based on document type
    const qrContent = `${documentType}:${hash}`;
    
    // Generate QR code with high quality settings
    const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

// Generate QR code with label for download
export const generateQRCodeWithLabel = async (
  documentType: string, 
  hash: string, 
  fileName: string
): Promise<string> => {
  try {
    const qrContent = `${documentType}:${hash}`;
    
    // Create canvas for QR code with label
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }
    
    // Set canvas size to accommodate QR code and label
    canvas.width = 350;
    canvas.height = 380;
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    // Load QR code image
    const qrImage = new Image();
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
      qrImage.src = qrCodeDataURL;
    });
    
    // Draw QR code on canvas
    ctx.drawImage(qrImage, 25, 10, 300, 300);
    
    // Add label below QR code
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    // Document type label
    ctx.fillText(
      `${documentType.toUpperCase()} Document`, 
      canvas.width / 2, 
      335
    );
    
    // File name label (truncated if too long)
    ctx.font = '12px Arial';
    const truncatedFileName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
    ctx.fillText(
      truncatedFileName,
      canvas.width / 2,
      355
    );
    
    // Date label
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(
      `Generated: ${new Date().toLocaleDateString()}`,
      canvas.width / 2,
      370
    );
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('QR Code with label generation error:', error);
    // Fallback to basic QR code
    return generateQRCode(documentType, hash);
  }
};

export default generateQRCode;
