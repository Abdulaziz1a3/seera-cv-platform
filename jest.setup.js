// Jest setup file
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
            },
        },
        status: 'authenticated',
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
    }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);

// Suppress console errors in tests (optional - remove if you want to see errors)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Warning: An update to') ||
                args[0].includes('act(...)'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});
