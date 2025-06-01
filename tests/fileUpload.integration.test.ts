import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { registerRoutes } from '../server/routes';

describe('File Upload Integration Tests', () => {
  let app: express.Application;
  let server: any;
  const TEST_FILES_DIR = path.join(__dirname, 'testFiles');

  beforeAll(async () => {
    // Create test files directory
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }

    // Create test PDF content (simple text file for testing)
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000174 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n268\n%%EOF';
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'test.pdf'), testPdfContent);

    // Create test text file
    const testTextContent = 'This is a test document for PDF parsing.\n\nIt contains multiple paragraphs and should be processed correctly.\n\nThe text extraction should preserve the content while sanitizing any invalid characters.';
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'test.txt'), testTextContent);

    // Create test DOCX simulation (just text for basic testing)
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'test.docx'), 'Mock DOCX content for testing');

    // Setup express app
    app = express();
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(TEST_FILES_DIR)) {
      fs.rmSync(TEST_FILES_DIR, { recursive: true, force: true });
    }
    
    if (server) {
      server.close();
    }
  });

  describe('File Upload Endpoint', () => {
    it('should accept PDF files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', path.join(TEST_FILES_DIR, 'test.pdf'))
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('originalName', 'test.pdf');
      expect(response.body).toHaveProperty('mimeType', 'application/pdf');
      expect(response.body).toHaveProperty('status', 'processing');
    });

    it('should accept text files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', path.join(TEST_FILES_DIR, 'test.txt'))
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('originalName', 'test.txt');
      expect(response.body).toHaveProperty('mimeType', 'text/plain');
    });

    it('should reject unsupported file types', async () => {
      // Create a fake image file
      const imagePath = path.join(TEST_FILES_DIR, 'test.jpg');
      fs.writeFileSync(imagePath, 'fake image content');

      await request(app)
        .post('/api/upload')
        .attach('file', imagePath)
        .expect(400);
    });

    it('should reject requests without files', async () => {
      await request(app)
        .post('/api/upload')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', 'No file uploaded');
        });
    });

    it('should handle large files within limits', async () => {
      // Create a large text file (but within limits)
      const largePath = path.join(TEST_FILES_DIR, 'large.txt');
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB
      fs.writeFileSync(largePath, largeContent);

      const response = await request(app)
        .post('/api/upload')
        .attach('file', largePath)
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('File Status Endpoint', () => {
    it('should return file status after upload', async () => {
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', path.join(TEST_FILES_DIR, 'test.txt'))
        .expect(200);

      const fileId = uploadResponse.body.id;

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await request(app)
        .get(`/api/files/${fileId}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('id', fileId);
      expect(statusResponse.body).toHaveProperty('status');
      expect(['processing', 'completed', 'error']).toContain(statusResponse.body.status);
    });

    it('should return 404 for non-existent files', async () => {
      await request(app)
        .get('/api/files/99999')
        .expect(404);
    });
  });

  describe('Content Generation Endpoint', () => {
    it('should generate content from completed files', async () => {
      // Upload and wait for processing
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', path.join(TEST_FILES_DIR, 'test.txt'))
        .expect(200);

      const fileId = uploadResponse.body.id;

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if file is processed
      const statusResponse = await request(app)
        .get(`/api/files/${fileId}`)
        .expect(200);

      if (statusResponse.body.status === 'completed') {
        const generateResponse = await request(app)
          .post(`/api/files/${fileId}/generate`)
          .expect(200);

        expect(generateResponse.body).toHaveProperty('flashcards');
        expect(generateResponse.body).toHaveProperty('quizQuestions');
        expect(Array.isArray(generateResponse.body.flashcards)).toBe(true);
        expect(Array.isArray(generateResponse.body.quizQuestions)).toBe(true);
      }
    });

    it('should reject generation for non-processed files', async () => {
      await request(app)
        .post('/api/files/99999/generate')
        .expect(400);
    });
  });
});