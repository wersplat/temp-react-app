// Import jest-dom for better assertions
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.URL.createObjectURL which is used in FileUpload component
window.URL.createObjectURL = vi.fn(() => 'mock-url');
