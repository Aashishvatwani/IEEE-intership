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
if re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", raw_text.replace(" ", "")):
    doc_type = "aadhaar"
elif re.search(r"[A-Z]{5}\d{4}[A-Z]", raw_text) or "Income Tax Department" in raw_text:
    doc_type = "pan"
elif re.search(r"Roll\s*No|Total\s*Marks", raw_text, re.IGNORECASE):
    doc_type = "marksheet"
data["document_type"] = doc_type

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
            for j in range(i - 1, -1, -1):  # previous non-empty line
                line_text = results[j].strip()
                if line_text and not re.search(r"DOB|IDOB|Date", line_text, re.IGNORECASE):
                    data["name"] = line_text
                    break
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
