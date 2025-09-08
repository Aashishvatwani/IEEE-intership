# Document Verifier Backend

A robust backend service for document verification supporting Aadhaar, PAN, and Marksheet documents with OCR processing and blockchain integration.

## 🚀 Features

- **OCR Processing**: Extract text from PDF/Image documents using EasyOCR
- **Document Types**: Support for Aadhaar, PAN, and Marksheet verification
- **Enhanced Validation**: Cross-reference extracted data with database records
- **Suspicious Activity Detection**: Identify potentially fraudulent documents
- **IPFS Integration**: Process documents directly from IPFS CIDs
- **Comprehensive Logging**: Track all verification activities
- **Database Integration**: MongoDB for storing user records
- **RESTful API**: Clean API endpoints for frontend integration

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python 3.8+ with the following packages:
  - `easyocr`
  - `opencv-python`
  - `PyMuPDF`
  - `numpy`
- MongoDB (local or cloud)

## 🛠️ Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd document-verifier
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   pip install easyocr opencv-python PyMuPDF numpy
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

5. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

## 🗄️ Database Setup

1. **Start MongoDB** (if running locally)

2. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

   This will create sample users with Aadhaar and PAN numbers for testing.

## 🏃‍♂️ Running the Server

```bash
npm start
```

The server will start on `http://localhost:4000`

## 📡 API Endpoints

### Upload and Verify Document
```http
POST /upload
Content-Type: multipart/form-data
```

**File Upload:**
```bash
curl -X POST -F "document=@/path/to/document.pdf" http://localhost:4000/upload
```

**IPFS CID Verification:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"ipfsCID": "QmXXXXXX", "documentType": "aadhaar", "fileName": "aadhaar.pdf"}' \
  http://localhost:4000/upload
```

### Direct Aadhaar Verification
```http
POST /aadhaar
Content-Type: application/json

{
  "aadhaar_number": "1234 5678 9012"
}
```

### Direct PAN Verification
```http
POST /pan
Content-Type: application/json

{
  "pan_number": "ABCDE1234F"
}
```

### Generate QR Code Data
```http
POST /qr/generate
Content-Type: application/json

{
  "documentType": "aadhaar",
  "hash": "0x123...abc",
  "fileName": "document.pdf"
}
```

## 📊 Response Format

### Successful Verification
```json
{
  "success": true,
  "documentType": "aadhaar",
  "extracted": {
    "raw_text": "...",
    "document_type": "aadhaar",
    "aadhaar_number": "1234 5678 9012",
    "name": "John Doe",
    "dob": "01/01/1990",
    "gender": "Male"
  },
  "verification": {
    "valid": true,
    "message": "Aadhaar document verified successfully",
    "suspiciousActivity": false,
    "confidence": 0.95,
    "name": "John Doe",
    "dob": "01/01/1990",
    "gender": "Male",
    "fatherName": "Jane Doe"
  },
  "isIPFSFile": false,
  "processingTime": "2024-01-01T12:00:00.000Z"
}
```

### Suspicious Activity Detected
```json
{
  "success": true,
  "documentType": "aadhaar",
  "extracted": { ... },
  "verification": {
    "valid": false,
    "message": "Document verification failed due to data inconsistencies",
    "suspiciousActivity": true,
    "reason": "Name mismatch: Document shows 'John Smith', Database has 'John Doe'",
    "confidence": 0.3,
    "extractedData": { ... }
  }
}
```

## 🧪 Testing

### Sample Test Data

The seeded database includes these test records:

| Name | Aadhaar | PAN | DOB |
|------|---------|-----|-----|
| Rajesh Kumar | 1234 5678 9012 | ABCDE1234F | 15/08/1990 |
| Priya Sharma | 9876 5432 1098 | XYZAB5678C | 22/03/1985 |
| Arjun Patel | 5555 6666 7777 | DEFGH9012I | 10/12/1992 |
| Anita Singh | 1111 2222 3333 | PQRST3456U | 05/07/1988 |
| Kiran Reddy | 4444 5555 6666 | LMNOP7890Q | 18/09/1995 |

### Creating Test Documents

1. Create documents (PDF/Images) containing the above information
2. Upload through the API or frontend
3. Verify the response matches expected behavior

## 📝 Logging

The system maintains comprehensive logs:

- `logs/app.log` - All application activities
- `logs/error.log` - Error events only
- `logs/verification.log` - Document verification events
- `logs/suspicious.log` - Suspicious activity alerts

## 🔍 Document Validation Features

### Aadhaar Validation
- ✅ Format validation (12 digits)
- ✅ Database lookup
- ✅ Name similarity matching
- ✅ DOB cross-verification
- ✅ Gender validation

### PAN Validation  
- ✅ Format validation (5 letters + 4 digits + 1 letter)
- ✅ Database lookup
- ✅ Name similarity matching
- ✅ Father's name verification
- ✅ DOB cross-verification

### Marksheet Validation
- ✅ Roll number extraction
- ✅ Total marks extraction  
- ✅ Basic document integrity checks

## 🚨 Suspicious Activity Detection

The system flags documents as suspicious when:
- Database lookup fails
- Cross-field validation fails
- Name similarity < 70%
- Date format inconsistencies
- Invalid document format

## 🔧 Configuration

### Environment Variables

- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging verbosity

### File Upload Limits

- Supported formats: PDF, JPG, PNG
- File size limit: Configured in multer settings
- Temporary file cleanup: Automatic

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **File Upload**: Direct file upload from frontend forms
2. **IPFS Verification**: Process documents stored on IPFS
3. **Real-time Feedback**: Comprehensive response data
4. **Error Handling**: Detailed error messages for debugging

## 📈 Performance Considerations

- **OCR Processing**: CPU-intensive, consider scaling for production
- **File Storage**: Temporary files are automatically cleaned up
- **Database Queries**: Indexed on aadhaar_number and pan_number
- **Logging**: Rotated logs recommended for production

## 🔒 Security Features

- Input validation and sanitization
- File type restrictions
- Temporary file cleanup
- Suspicious activity logging
- No sensitive data in logs

## 🛠️ Development

### Adding New Document Types

1. Update `documentValidation.js` with new validation logic
2. Enhance `ocr.py` for new document patterns
3. Add specific database models if needed
4. Update API documentation

### Custom Validation Rules

Modify the validation functions in `services/documentValidation.js` to add:
- Custom similarity thresholds
- Additional field validations
- Business-specific rules

## 📞 Support

For issues and questions:
1. Check the logs in the `logs/` directory
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Review API endpoint documentation
