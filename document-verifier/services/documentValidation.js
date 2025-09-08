import { verifyAadhaar } from "./aadhaarService.js";
import { verifyPAN } from "./panService.js";
import logger from "./logger.js";

/**
 * Enhanced document validation with suspicious activity detection
 */
export const validateDocument = async (extractedData, documentType) => {
  const validation = {
    valid: false,
    message: '',
    suspiciousActivity: false,
    reason: '',
    confidence: 0,
    extractedData: extractedData
  };

  logger.info("Starting document validation", { 
    documentType, 
    hasAadhaar: !!extractedData.aadhaar_number,
    hasPAN: !!extractedData.pan_number,
    hasName: !!extractedData.name
  });

  try {
    if (documentType === 'aadhaar') {
      return await validateAadhaar(extractedData, validation);
    } else if (documentType === 'pan') {
      return await validatePAN(extractedData, validation);
    } else if (documentType === 'marksheet') {
      return await validateMarksheet(extractedData, validation);
    } else {
      const reason = "Document type could not be determined from OCR";
      logger.warn("Unknown document type detected", { 
        documentType, 
        extractedFields: Object.keys(extractedData),
        reason 
      });
      validation.message = "Unknown document type";
      validation.reason = reason;
      validation.suspiciousActivity = true;
      return validation;
    }
  } catch (error) {
    logger.error("Document validation error", { 
      documentType, 
      error: error.message,
      stack: error.stack 
    });
    validation.message = "Validation error: " + error.message;
    validation.reason = "Technical error during validation";
    validation.suspiciousActivity = true;
    return validation;
  }
};

/**
 * Validate Aadhaar document
 */
const validateAadhaar = async (extractedData, validation) => {
  logger.info("Validating Aadhaar document", { aadhaarNumber: extractedData.aadhaar_number });

  // Check if Aadhaar number is present and valid format
  if (!extractedData.aadhaar_number) {
    const reason = "No Aadhaar number found in document during OCR processing";
    logger.warn("Aadhaar validation failed - missing number", { 
      reason,
      extractedFields: Object.keys(extractedData)
    });
    validation.message = "No Aadhaar number found in document";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  // Validate Aadhaar number format (12 digits)
  const aadhaarRegex = /^\d{4}\s\d{4}\s\d{4}$/;
  if (!aadhaarRegex.test(extractedData.aadhaar_number)) {
    const reason = `Invalid Aadhaar format: "${extractedData.aadhaar_number}" (expected: XXXX XXXX XXXX)`;
    logger.warn("Aadhaar validation failed - invalid format", { 
      aadhaarNumber: extractedData.aadhaar_number,
      reason
    });
    validation.message = "Invalid Aadhaar number format";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  // Verify against database
  logger.info("Checking Aadhaar in database", { aadhaarNumber: extractedData.aadhaar_number });
  const dbResult = await verifyAadhaar(extractedData.aadhaar_number);
  
  if (!dbResult) {
    const reason = `Aadhaar number "${extractedData.aadhaar_number}" not found in our database. This could indicate:
    1. Document is not registered in our system
    2. Aadhaar number was incorrectly extracted via OCR
    3. Document may be fraudulent or tampered`;
    
    logger.suspicious("Aadhaar not found in database", { 
      aadhaarNumber: extractedData.aadhaar_number,
      extractedName: extractedData.name,
      extractedDOB: extractedData.dob,
      reason: "Database lookup failed - no matching record"
    });
    
    validation.message = "Aadhaar number not found in database";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  logger.info("Aadhaar found in database, cross-verifying details", { 
    aadhaarNumber: extractedData.aadhaar_number,
    dbName: dbResult.name,
    extractedName: extractedData.name
  });
  // Cross-verify extracted data with database
  const inconsistencies = [];
  
  if (extractedData.name && dbResult.name) {
    const nameSimilarity = calculateSimilarity(extractedData.name, dbResult.name);
    if (nameSimilarity < 0.7) {
      const inconsistency = `Name mismatch: Document shows "${extractedData.name}", Database has "${dbResult.name}" (similarity: ${Math.round(nameSimilarity * 100)}%)`;
      inconsistencies.push(inconsistency);
      logger.warn("Aadhaar name mismatch detected", {
        aadhaarNumber: extractedData.aadhaar_number,
        extractedName: extractedData.name,
        databaseName: dbResult.name,
        similarity: nameSimilarity
      });
    }
  }

  if (extractedData.dob && dbResult.dob) {
    if (normalizeDate(extractedData.dob) !== normalizeDate(dbResult.dob)) {
      const inconsistency = `DOB mismatch: Document shows "${extractedData.dob}", Database has "${dbResult.dob}"`;
      inconsistencies.push(inconsistency);
      logger.warn("Aadhaar DOB mismatch detected", {
        aadhaarNumber: extractedData.aadhaar_number,
        extractedDOB: extractedData.dob,
        databaseDOB: dbResult.dob
      });
    }
  }

  if (extractedData.gender && dbResult.gender) {
    if (extractedData.gender.toLowerCase() !== dbResult.gender.toLowerCase()) {
      const inconsistency = `Gender mismatch: Document shows "${extractedData.gender}", Database has "${dbResult.gender}"`;
      inconsistencies.push(inconsistency);
      logger.warn("Aadhaar gender mismatch detected", {
        aadhaarNumber: extractedData.aadhaar_number,
        extractedGender: extractedData.gender,
        databaseGender: dbResult.gender
      });
    }
  }

  // Determine validation result
  if (inconsistencies.length > 0) {
    const reason = `Data inconsistencies found: ${inconsistencies.join('; ')}. This suggests document tampering or OCR errors.`;
    logger.suspicious("Aadhaar data inconsistencies detected", {
      aadhaarNumber: extractedData.aadhaar_number,
      inconsistencyCount: inconsistencies.length,
      inconsistencies,
      confidence: Math.max(0, 0.5 - (inconsistencies.length * 0.2))
    });
    
    validation.message = "Document verification failed due to data inconsistencies";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    validation.confidence = Math.max(0, 0.5 - (inconsistencies.length * 0.2));
  } else {
    logger.verification("Aadhaar document successfully verified", {
      aadhaarNumber: extractedData.aadhaar_number,
      verifiedName: dbResult.name,
      confidence: 0.95
    });
    
    validation.valid = true;
    validation.message = "Aadhaar document verified successfully";
    validation.confidence = 0.95;
    
    // Add verified data to response
    Object.assign(validation, dbResult);
  }

  return validation;
};

/**
 * Validate PAN document
 */
const validatePAN = async (extractedData, validation) => {
  logger.info("Validating PAN document", { panNumber: extractedData.pan_number });

  if (!extractedData.pan_number) {
    const reason = "No PAN number found in document during OCR processing";
    logger.warn("PAN validation failed - missing number", { 
      reason,
      extractedFields: Object.keys(extractedData)
    });
    validation.message = "No PAN number found in document";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  // Validate PAN format (5 letters, 4 digits, 1 letter)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panRegex.test(extractedData.pan_number)) {
    const reason = `Invalid PAN format: "${extractedData.pan_number}" (expected: ABCDE1234F format)`;
    logger.warn("PAN validation failed - invalid format", { 
      panNumber: extractedData.pan_number,
      reason
    });
    validation.message = "Invalid PAN number format";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  // Verify against database
  logger.info("Checking PAN in database", { panNumber: extractedData.pan_number });
  const dbResult = await verifyPAN(extractedData.pan_number);
  
  if (!dbResult) {
    const reason = `PAN number "${extractedData.pan_number}" not found in our database. This could indicate:
    1. PAN is not registered in our system
    2. PAN number was incorrectly extracted via OCR
    3. Document may be fraudulent or tampered`;
    
    logger.suspicious("PAN not found in database", { 
      panNumber: extractedData.pan_number,
      extractedName: extractedData.name,
      extractedFatherName: extractedData.father_name,
      reason: "Database lookup failed - no matching record"
    });
    
    validation.message = "PAN number not found in database";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    return validation;
  }

  logger.info("PAN found in database, cross-verifying details", { 
    panNumber: extractedData.pan_number,
    dbName: dbResult.name,
    extractedName: extractedData.name
  });
  // Cross-verify data
  const inconsistencies = [];
  
  if (extractedData.name && dbResult.name) {
    const nameSimilarity = calculateSimilarity(extractedData.name, dbResult.name);
    if (nameSimilarity < 0.7) {
      const inconsistency = `Name mismatch: Document shows "${extractedData.name}", Database has "${dbResult.name}" (similarity: ${Math.round(nameSimilarity * 100)}%)`;
      inconsistencies.push(inconsistency);
      logger.warn("PAN name mismatch detected", {
        panNumber: extractedData.pan_number,
        extractedName: extractedData.name,
        databaseName: dbResult.name,
        similarity: nameSimilarity
      });
    }
  }

  if (extractedData.father_name && dbResult.fatherName) {
    const fatherNameSimilarity = calculateSimilarity(extractedData.father_name, dbResult.fatherName);
    if (fatherNameSimilarity < 0.7) {
      const inconsistency = `Father's name mismatch: Document shows "${extractedData.father_name}", Database has "${dbResult.fatherName}" (similarity: ${Math.round(fatherNameSimilarity * 100)}%)`;
      inconsistencies.push(inconsistency);
      logger.warn("PAN father name mismatch detected", {
        panNumber: extractedData.pan_number,
        extractedFatherName: extractedData.father_name,
        databaseFatherName: dbResult.fatherName,
        similarity: fatherNameSimilarity
      });
    }
  }

  if (extractedData.dob && dbResult.dob) {
    if (normalizeDate(extractedData.dob) !== normalizeDate(dbResult.dob)) {
      const inconsistency = `DOB mismatch: Document shows "${extractedData.dob}", Database has "${dbResult.dob}"`;
      inconsistencies.push(inconsistency);
      logger.warn("PAN DOB mismatch detected", {
        panNumber: extractedData.pan_number,
        extractedDOB: extractedData.dob,
        databaseDOB: dbResult.dob
      });
    }
  }

  if (inconsistencies.length > 0) {
    const reason = `Data inconsistencies found: ${inconsistencies.join('; ')}. This suggests document tampering or OCR errors.`;
    logger.suspicious("PAN data inconsistencies detected", {
      panNumber: extractedData.pan_number,
      inconsistencyCount: inconsistencies.length,
      inconsistencies,
      confidence: Math.max(0, 0.5 - (inconsistencies.length * 0.2))
    });
    
    validation.message = "PAN document verification failed due to data inconsistencies";
    validation.reason = reason;
    validation.suspiciousActivity = true;
    validation.confidence = Math.max(0, 0.5 - (inconsistencies.length * 0.2));
  } else {
    logger.verification("PAN document successfully verified", {
      panNumber: extractedData.pan_number,
      verifiedName: dbResult.name,
      confidence: 0.95
    });
    
    validation.valid = true;
    validation.message = "PAN document verified successfully";
    validation.confidence = 0.95;
    
    // Add verified data to response
    Object.assign(validation, dbResult);
  }

  return validation;
};

/**
 * Validate Marksheet document
 */
const validateMarksheet = async (extractedData, validation) => {
  if (!extractedData.roll_number) {
    validation.message = "No roll number found in document";
    validation.reason = "Missing roll number";
    validation.suspiciousActivity = true;
    return validation;
  }

  // For marksheet, we'll do basic validation since we don't have a specific service
  validation.valid = true;
  validation.message = "Marksheet document processed successfully";
  validation.confidence = 0.8;
  
  // Add basic validation checks
  if (!extractedData.name) {
    validation.confidence -= 0.2;
    validation.reason = "Name not clearly extracted from marksheet";
  }
  
  if (!extractedData.total_marks) {
    validation.confidence -= 0.1;
    validation.reason = validation.reason ? validation.reason + "; Total marks not found" : "Total marks not found";
  }

  return validation;
};

/**
 * Calculate similarity between two strings (for name matching)
 */
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const normalize = (str) => str.toLowerCase().replace(/[^a-zA-Z]/g, '');
  const a = normalize(str1);
  const b = normalize(str2);
  
  if (a === b) return 1;
  
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  
  return matches / maxLength;
};

/**
 * Normalize date format for comparison
 */
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Handle different date formats: DD/MM/YYYY, DD-MM-YYYY, etc.
  const cleanDate = dateStr.replace(/[^\d]/g, '');
  if (cleanDate.length === 8) {
    // Assume DDMMYYYY format
    return `${cleanDate.substr(0,2)}/${cleanDate.substr(2,2)}/${cleanDate.substr(4,4)}`;
  }
  
  return dateStr;
};
