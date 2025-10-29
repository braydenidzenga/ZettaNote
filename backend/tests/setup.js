// Jest setup file
import { jest } from '@jest/globals';

// Mock uuid globally
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));
