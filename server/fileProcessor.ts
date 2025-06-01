import fs from "fs";
import mammoth from "mammoth";

// Sanitize text to remove invalid UTF-8 sequences and control characters
export function sanitizeText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\uFFFD/g, '') // Remove replacement characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await extractTextFromPDF(filePath);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractTextFromDocx(filePath);

      case 'text/plain':
        return await extractTextFromTxt(filePath);

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${mimeType} file: ${error.message}`);
  }
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Using pdf-parse for better compatibility
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return sanitizeText(data.text);
  } catch (error) {
    // Fallback to pdfreader if pdf-parse fails
    try {
      return await extractTextFromPDFWithReader(filePath);
    } catch (fallbackError) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }
}

async function extractTextFromPDFWithReader(filePath: string): Promise<string> {
  const { PdfReader } = await import('pdfreader');
  
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    let text = '';
    let lastY = 0;
    
    reader.parseFileItems(filePath, (err: any, item: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!item) {
        // End of file
        resolve(sanitizeText(text));
        return;
      }
      
      if (item.text) {
        // Add line break if we're on a new line
        if (lastY && item.y !== lastY) {
          text += '\n';
        }
        text += item.text + ' ';
        lastY = item.y;
      }
    });
  });
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return sanitizeText(result.value);
}

async function extractTextFromTxt(filePath: string): Promise<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return sanitizeText(content);
}

export function validateFileType(mimeType: string): boolean {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return allowedMimes.includes(mimeType);
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}