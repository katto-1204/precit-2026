import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// ResizeObserver polyfill for Recharts ResponsiveContainer in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock;
}
