// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Global test timeout
jest.setTimeout(30000);