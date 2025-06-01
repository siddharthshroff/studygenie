import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { 
  sanitizeText, 
  extractTextFromFile, 
  validateFileType, 
  getFileExtension, 
  estimateReadingTime 
} from '../server/fileProcessor';

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, 'testData');

describe('File Processor', () => {
  beforeAll(() => {
    // Create test data directory if it doesn't exist
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    
    // Create test text file
    const testTextContent = `This is a test document.
    
It contains multiple lines with various formatting.

Some lines have    extra    spaces   and	tabs.

This helps test text sanitization and extraction.`;
    
    fs.writeFileSync(path.join(TEST_DATA_DIR, 'test.txt'), testTextContent);
    
    // Create a simple PDF for testing (we'll mock this since creating real PDFs is complex)
    // The actual PDF extraction will be tested with mocked data
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const input = 'Hello\u0000World\u001F\u007F\u009F';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorld');
    });

    it('should remove replacement characters', () => {
      const input = 'Hello\uFFFDWorld';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorld');
    });

    it('should normalize whitespace', () => {
      const input = 'Hello    World\n\n\nTest\t\tData';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World Test Data');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '   Hello World   ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });
  });

  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      expect(validateFileType('application/pdf')).toBe(true);
    });

    it('should accept DOCX files', () => {
      expect(validateFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('should accept text files', () => {
      expect(validateFileType('text/plain')).toBe(true);
    });

    it('should reject unsupported file types', () => {
      expect(validateFileType('image/jpeg')).toBe(false);
      expect(validateFileType('application/json')).toBe(false);
      expect(validateFileType('video/mp4')).toBe(false);
    });

    it('should handle empty or invalid mime types', () => {
      expect(validateFileType('')).toBe(false);
      expect(validateFileType('invalid')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('file.docx')).toBe('docx');
      expect(getFileExtension('data.txt')).toBe('txt');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('my.file.name.pdf')).toBe('pdf');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('filename')).toBe('');
    });

    it('should return lowercase extensions', () => {
      expect(getFileExtension('FILE.PDF')).toBe('pdf');
      expect(getFileExtension('Document.DOCX')).toBe('docx');
    });
  });

  describe('estimateReadingTime', () => {
    it('should calculate reading time for short text', () => {
      const shortText = 'This is a short text with about ten words total.';
      const time = estimateReadingTime(shortText);
      expect(time).toBe(1); // Should round up to 1 minute
    });

    it('should calculate reading time for longer text', () => {
      const words = new Array(400).fill('word').join(' '); // 400 words
      const time = estimateReadingTime(words);
      expect(time).toBe(2); // 400 words ÷ 200 wpm = 2 minutes
    });

    it('should handle empty text', () => {
      expect(estimateReadingTime('')).toBe(0);
    });

    it('should handle text with only whitespace', () => {
      expect(estimateReadingTime('   \n\t  ')).toBe(0);
    });
  });

  describe('extractTextFromFile', () => {
    it('should extract text from plain text files', async () => {
      const filePath = path.join(TEST_DATA_DIR, 'test.txt');
      const result = await extractTextFromFile(filePath, 'text/plain');
      
      expect(result).toContain('This is a test document');
      expect(result).toContain('multiple lines');
      expect(result).toContain('text sanitization');
      // Check that whitespace is normalized
      expect(result).not.toMatch(/\s{2,}/); // No multiple spaces
    });

    it('should throw error for unsupported file types', async () => {
      const filePath = path.join(TEST_DATA_DIR, 'test.txt');
      
      await expect(
        extractTextFromFile(filePath, 'image/jpeg')
      ).rejects.toThrow('Unsupported file type: image/jpeg');
    });

    it('should throw error for non-existent files', async () => {
      const nonExistentPath = path.join(TEST_DATA_DIR, 'nonexistent.txt');
      
      await expect(
        extractTextFromFile(nonExistentPath, 'text/plain')
      ).rejects.toThrow();
    });

    it('should handle PDF extraction with mocked pdf-parse', async () => {
      // Mock pdf-parse module
      const mockPdfParse = jest.fn().mockResolvedValue({
        text: 'This is extracted PDF text with\u0000control\u001Fcharacters\uFFFD.'
      });
      
      // Mock the dynamic import
      jest.doMock('pdf-parse', () => ({
        default: mockPdfParse
      }));

      const filePath = path.join(TEST_DATA_DIR, 'test.txt'); // Use existing file for test
      const result = await extractTextFromFile(filePath, 'application/pdf');
      
      expect(result).toBe('This is extracted PDF text with control characters.');
      expect(mockPdfParse).toHaveBeenCalled();
    });

    it('should handle DOCX extraction errors gracefully', async () => {
      // Create a file that will cause mammoth to fail
      const invalidDocxPath = path.join(TEST_DATA_DIR, 'invalid.docx');
      fs.writeFileSync(invalidDocxPath, 'This is not a valid DOCX file');
      
      await expect(
        extractTextFromFile(invalidDocxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).rejects.toThrow();
    });
  });

  describe('PDF extraction error handling', () => {
    it('should provide meaningful error messages', async () => {
      const filePath = path.join(TEST_DATA_DIR, 'test.txt');
      
      // Mock pdf-parse to throw an error
      const mockPdfParse = jest.fn().mockRejectedValue(new Error('Invalid PDF format'));
      jest.doMock('pdf-parse', () => ({
        default: mockPdfParse
      }));

      // Mock pdfreader fallback to also fail
      jest.doMock('pdfreader', () => ({
        PdfReader: jest.fn().mockImplementation(() => ({
          parseFileItems: jest.fn((path, callback) => {
            callback(new Error('Fallback also failed'), null);
          })
        }))
      }));

      await expect(
        extractTextFromFile(filePath, 'application/pdf')
      ).rejects.toThrow('Failed to extract text from application/pdf file');
    });
  });

  describe('Text quality validation', () => {
    it('should preserve meaningful content while sanitizing', () => {
      const input = 'Research shows that 95% of students\u0000 improve with\u001F proper study methods.\n\nKey findings:\n• Method A: 85% success\n• Method B: 92% success';
      const result = sanitizeText(input);
      
      expect(result).toContain('95% of students improve');
      expect(result).toContain('Method A: 85% success');
      expect(result).toContain('Method B: 92% success');
      expect(result).not.toMatch(/[\u0000-\u001F]/); // No control characters
    });

    it('should handle unicode characters properly', () => {
      const input = 'Café résumé naïve Zürich 中文 العربية';
      const result = sanitizeText(input);
      expect(result).toBe('Café résumé naïve Zürich 中文 العربية');
    });
  });
});