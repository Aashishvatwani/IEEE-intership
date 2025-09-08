import cv2
import easyocr
import sys
import re
import json
import numpy as np
import fitz  # PyMuPDF
from difflib import SequenceMatcher

file_path = sys.argv[1]

# --- Helper function for fuzzy keyword matching ---
def similar(a, b, threshold=0.6):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() > threshold

# --- If PDF → convert first page to image (in memory) ---
if file_path.lower().endswith(".pdf"):
    doc = fitz.open(file_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=300)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    if pix.n == 4:  # has alpha
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
    else:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
else:
    img = cv2.imread(file_path)

# --- Preprocessing (works for both image and PDF) ---
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.resize(gray, None, fx=1.3, fy=1.3, interpolation=cv2.INTER_CUBIC)
gray = cv2.bilateralFilter(gray, 9, 75, 75)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
sharpened = cv2.filter2D(gray, -1, kernel)
thresh = cv2.adaptiveThreshold(
    sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 11, 2
)

# --- OCR ---
reader = easyocr.Reader(['en'], verbose=False)
results = reader.readtext(thresh, detail=0)
raw_text = "\n".join(results)
data = {"raw_text": raw_text}

# --- Document Type Detection ---
doc_type = "unknown"

# Enhanced Aadhaar detection with multiple patterns
aadhaar_patterns = [
    r"\b\d{4}\s?\d{4}\s?\d{4}\b",  # Standard pattern with optional spaces
    r"\b\d{12}\b",  # 12 consecutive digits
    r"[0-9Oo]{4}\s*[0-9Oo]{4}\s*[0-9Oo]{4}",  # Pattern with O/o that OCR might confuse
    r"\d{4}\s*\d{4}\s*\d{4}",  # Basic pattern
]

# Check for Aadhaar patterns
for pattern in aadhaar_patterns:
    if re.search(pattern, raw_text.replace(" ", "")):
        doc_type = "aadhaar"
        break

# Also check for common Aadhaar keywords
if doc_type == "unknown":
    aadhaar_keywords = ["Government of India", "GOVERNMENT OF INDIA", "Unique Identification", "UIDAI"]
    for keyword in aadhaar_keywords:
        if keyword in raw_text:
            # If we find Aadhaar keywords and any 12-digit pattern, it's likely Aadhaar
            if re.search(r"\d{4}.*\d{4}.*\d{4}", raw_text):
                doc_type = "aadhaar"
                break

# PAN detection
if doc_type == "unknown":
    if re.search(r"[A-Z]{5}\d{4}[A-Z]", raw_text) or "Income Tax Department" in raw_text:
        doc_type = "pan"

# Marksheet detection
if doc_type == "unknown":
    if re.search(r"Roll\s*No|Total\s*Marks", raw_text, re.IGNORECASE):
        doc_type = "marksheet"

data["document_type"] = doc_type

# Debug output for troubleshooting
print(f"DEBUG: Detected document type: {doc_type}", file=sys.stderr)
print(f"DEBUG: Raw text sample: {raw_text[:200]}...", file=sys.stderr)

# --- Field Extraction ---
if doc_type == "aadhaar":
    aadhaar_match = re.search(r"(?<!\d)([0-9Oo]{4}\s*[0-9Oo]{4}\s*[0-9Oo]{4})(?!\d)", raw_text)
    if aadhaar_match:
        doc_type = "aadhaar"
        a = aadhaar_match.group().replace("O", "0").replace("o", "0")  # normalize
        a = re.sub(r"\s+", "", a)  # remove spaces
        data["aadhaar_number"] = f"{a[:4]} {a[4:8]} {a[8:]}"


    for i, line in enumerate(results):
        dob_match = re.search(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b", line)
        if dob_match:
            data["dob"] = dob_match.group()
            # Look for name in previous lines, but skip very short lines and common OCR artifacts
            for j in range(i - 1, -1, -1):  # previous non-empty line
                line_text = results[j].strip()
                # Skip if line is too short, contains only numbers/symbols, or common OCR artifacts
                if (line_text and 
                    len(line_text) > 2 and  # Must be longer than 2 characters
                    not re.search(r"DOB|IDOB|Date|^\d+$|^[A-Z]$|^[0-9A-Z]{1,2}$", line_text, re.IGNORECASE) and
                    not re.match(r"^[^a-zA-Z]*$", line_text)):  # Must contain letters
                    data["name"] = line_text
                    break
            break
    
    # If no name found using DOB method, try to find a name pattern
    if "name" not in data or len(data.get("name", "")) <= 2:
        for line in results:
            line_text = line.strip()
            # Look for lines that look like names (multiple words with letters)
            if (len(line_text) > 5 and 
                re.search(r"[a-zA-Z]", line_text) and  # Contains letters
                len(line_text.split()) >= 2 and  # Has at least 2 words
                not re.search(r"\d{4}\s*\d{4}\s*\d{4}|DOB|Date|Government|India|MALE|FEMALE", line_text, re.IGNORECASE)):
                data["name"] = line_text
                break

    gender = re.search(r"\b(FEMALE|MALE|Female|Male|male|female)\b", raw_text)
    if gender:
        data["gender"] = gender.group().capitalize()

elif doc_type == "pan":
    pan = re.search(r"[A-Z]{5}\d{4}[A-Z]", raw_text)
    if pan:
        data["pan_number"] = pan.group()

    for i, line in enumerate(results):
        if similar(line, "Name") or similar(line, "Iamo"):
            for j in range(i + 1, len(results)):
                line_text = results[j].strip()
                if line_text and not re.search(r"PAN|DOB|Date", line_text, re.IGNORECASE):
                    data["name"] = line_text
                    break
            break

    for i, line in enumerate(results):
        if similar(line, "Father's Name") or similar(line, "Fathcr's Namo"):
            for j in range(i + 1, len(results)):
                line_text = results[j].strip()
                if line_text and not re.search(r"PAN|DOB|Date", line_text, re.IGNORECASE):
                    data["father_name"] = line_text
                    break
            break

    for i, line in enumerate(results):
        if similar(line, "Date of Birth") or similar(line, "Datc ol Dlnth") or similar(line, "DOB"):
            for j in range(i + 1, len(results)):
                dob_match = re.search(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b", results[j])
                if dob_match:
                    data["dob"] = dob_match.group()
                    break
            break

elif doc_type == "marksheet":
    roll_match = re.search(r"Roll\s*No\.?\s*[:\-]?\s*(\w+)", raw_text, re.IGNORECASE)
    if roll_match:
        data["roll_number"] = roll_match.group(1)

    total_match = re.search(r"Total\s*Marks\s*[:\-]?\s*(\d+)", raw_text, re.IGNORECASE)
    if total_match:
        data["total_marks"] = total_match.group(1)

    for i, line in enumerate(results):
        if similar(line, "Name") or similar(line, "Naam"):
            for j in range(i + 1, len(results)):
                line_text = results[j].strip()
                if line_text:
                    data["name"] = line_text
                    break
            break

print(json.dumps(data, ensure_ascii=False))
