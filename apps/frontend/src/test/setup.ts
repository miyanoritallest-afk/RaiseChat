import '@testing-library/jest-dom'

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// socket.io-client mock
vi.mock('@/lib/socket/socket.client', () => ({
  getSocket: vi.fn(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

// next/navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const React = require('react')
    return React.createElement('a', { href }, children)
  },
}))
