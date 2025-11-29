import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Note: @testing-library/jest-dom matchers are not needed for basic testing
// If you need DOM matchers, install @testing-library/jest-dom and use:
// import * as matchers from '@testing-library/jest-dom/vitest';
// expect.extend(matchers);

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
