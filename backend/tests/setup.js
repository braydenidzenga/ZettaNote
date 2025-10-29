// Jest setup file
import { jest } from '@jest/globals';

// Mock uuid globally
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock mongoose to avoid database connections in tests
const MockSchema = jest.fn().mockImplementation(() => ({
  index: jest.fn(),
  pre: jest.fn(),
  virtual: jest.fn().mockReturnValue({
    get: jest.fn(),
  }),
  methods: {},
  statics: {},
}));

MockSchema.Types = {
  ObjectId: jest.fn().mockImplementation(() => 'mock-object-id'),
};

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  connection: {
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
  },
  Types: {
    ObjectId: jest.fn().mockImplementation(() => 'mock-object-id'),
  },
  Schema: MockSchema,
  model: jest.fn().mockReturnValue({}),
  models: {},
}));

// Mock the database connection functions
jest.mock('../src/config/database.js', () => ({
  connectDatabase: jest.fn().mockResolvedValue(),
  getDatabaseStatus: jest.fn().mockReturnValue({ status: 'connected' }),
}));

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    splat: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  addColors: jest.fn(),
}));

// Mock bcrypt for password hashing
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT functions
jest.mock('../src/utils/token.utils.js', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'mock-user-id' }),
}));

// Mock password validation
jest.mock('../src/utils/password.utils.js', () => ({
  validatePassword: jest.fn().mockReturnValue({ isValid: true }),
}));

// Mock validation utils
jest.mock('../src/utils/validator.utils.js', () => ({
  validate: jest.fn((schema, data) => {
    // Simulate validation logic
    if (!data.name || !data.email || !data.password) {
      return { isValid: false, message: 'Validation failed' };
    }
    if (data.email === 'invalid-email') {
      return { isValid: false, message: 'Invalid email format' };
    }
    if (data.password && data.password.length < 6) {
      return { isValid: false, message: 'Password too short' };
    }
    return { isValid: true, data };
  }),
  signupSchema: {},
  loginSchema: {},
  changePasswordSchema: {},
}));

// Mock User model
jest.mock('../src/models/User.model.js', () => {
  const MockUser = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-user-id',
    save: jest.fn().mockResolvedValue({
      _id: 'mock-user-id',
      ...data,
    }),
  }));

  MockUser.findOne = jest.fn().mockResolvedValue(null); // Simulate user doesn't exist
  MockUser.findById = jest.fn();

  return MockUser;
});
