/**
 * Jest Test Setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.LOG_LEVEL = 'error';

// Mock timers if needed
// jest.useFakeTimers();

// Global test timeout
jest.setTimeout(30000);

// Clean up after tests
afterAll(async () => {
  // Add any cleanup logic here
});
