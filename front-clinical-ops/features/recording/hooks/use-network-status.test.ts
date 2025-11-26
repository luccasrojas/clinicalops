import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNetworkStatus } from './use-network-status'

describe('useNetworkStatus', () => {
  let originalNavigator: Navigator
  let originalLocalStorage: Storage

  beforeEach(() => {
    // Save original objects
    originalNavigator = global.navigator
    originalLocalStorage = global.localStorage

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true,
    })

    // Mock fetch for health check
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
      } as Response),
    )
  })

  afterEach(() => {
    // Restore original objects
    global.navigator = originalNavigator
    global.localStorage = originalLocalStorage
    vi.clearAllMocks()
  })

  it('should initialize with online status from navigator', async () => {
    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })
  })

  it('should initialize with offline status when navigator is offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
    })
  })

  it('should return connection type as unknown when Network Information API is not available', async () => {
    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.connectionType).toBe('unknown')
    })
  })

  it('should return effective type as 4g by default', async () => {
    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.effectiveType).toBe('4g')
    })
  })

  it('should identify slow connection when effectiveType is 2g or slow-2g', async () => {
    // Mock Network Information API with slow connection
    const connectionMock = {
      effectiveType: '2g',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(global.navigator, 'connection', {
      writable: true,
      value: connectionMock,
    })

    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.isSlowConnection).toBe(true)
    })
  })

  it('should persist online status to localStorage', async () => {
    const setItemSpy = vi.spyOn(global.localStorage, 'setItem')

    renderHook(() => useNetworkStatus())

    // Wait for debounce and initial health check
    await waitFor(
      () => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'clinicalops:network:last-status',
          expect.any(String),
        )
      },
      { timeout: 2000 },
    )
  })

  it('should handle health check failure by setting offline status', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(
      () => {
        expect(result.current.isOnline).toBe(false)
      },
      { timeout: 2000 },
    )
  })
})
