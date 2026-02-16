import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically unmount components after each test to prevent state leakage
afterEach(() => {
  cleanup();
});
