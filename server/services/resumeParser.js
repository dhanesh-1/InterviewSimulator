const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract raw text from a PDF file
 */
async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extract raw text from a DOCX file
 */
async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
}

/**
 * Extract text from uploaded resume file (PDF or DOCX)
 */
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    return await extractFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    return await extractFromDOCX(filePath);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }
}

/**
 * Clean up uploaded file after processing
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File cleanup error:', err.message);
  }
}

module.exports = { extractText, cleanupFile };
