/**
 * @file src/__tests__/setup.ts
 * @description Test setup and global configuration for Jest
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.test before any other code
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

beforeAll(() => {
  console.log('🧪 Test environment initialized');
});

afterAll(() => {
  console.log('✅ Tests completed');
});
