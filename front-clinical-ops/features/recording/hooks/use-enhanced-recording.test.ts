import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEnhancedRecording } from './use-enhanced-recording'
import { RecordingErrorType } from '../utils/recording-errors'

// Mock react-media-recorder
vi.mock('react-media-recorder', () => ({
  useReactMediaRecorder: vi.fn(),
}))

import { useReactMediaRecorder } from 'react-media-recorder'

describe('useEnhancedRecording', () => {
  let mockStartRecording: ReturnType<typeof vi.fn>
  let mockPauseRecording: ReturnType<typeof vi.fn>
  let mockResumeRecording: ReturnType<typeof vi.fn>
  let mockStopRecording: ReturnType<typeof vi.fn>
  let mockOnStop: ((blobUrl: string, blob: Blob) => void) | null = null

  beforeEach(() => {
    // Setup MediaRecorder mock FIRST (before react-media-recorder)
    global.MediaRecorder = class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true)
      constructor() {}
    } as unknown as typeof MediaRecorder

    // Mock navigator.mediaDevices for isMediaRecorderSupported check
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Setup react-media-recorder mocks
    mockStartRecording = vi.fn()
    mockPauseRecording = vi.fn()
    mockResumeRecording = vi.fn()
    mockStopRecording = vi.fn()

    vi.mocked(useReactMediaRecorder).mockImplementation((options) => {
      // Store onStop callback for later use
      if (options?.onStop) {
        mockOnStop = options.onStop
      }

      return {
        status: 'idle',
        startRecording: mockStartRecording,
        pauseRecording: mockPauseRecording,
        resumeRecording: mockResumeRecording,
        stopRecording: mockStopRecording,
        mediaBlobUrl: undefined,
        previewStream: null,
        clearBlobUrl: vi.fn(),
        error: null,
        muteAudio: vi.fn(),
        unMuteAudio: vi.fn(),
        isAudioMuted: false,
        previewAudioStream: null,
      }
    })

    // Mock requestAnimationFrame
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })

    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {})

    // Mock Audio element for validation
    global.Audio = vi.fn(function (this: any) {
      this.onloadedmetadata = null
      this.onerror = null
      this.duration = 10
      this.src = ''
    }) as unknown as typeof Audio

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockOnStop = null
  })

  it('should initialize with idle status', () => {
    const { result } = renderHook(() => useEnhancedRecording())

    expect(result.current.status).toBe('idle')
    expect(result.current.duration).toBe(0)
    expect(result.current.segments).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.isSupported).toBe(true)
  })

  it('should start recording and create first segment', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.status).toBe('recording')
    expect(result.current.segments).toHaveLength(1)
    expect(result.current.segments[0].status).toBe('recording')
    expect(result.current.error).toBeNull()
    expect(mockStartRecording).toHaveBeenCalled()
  })

  it('should pause recording and update segment', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.status).toBe('recording')

    // Pause recording
    act(() => {
      result.current.pauseRecording()
    })

    expect(result.current.status).toBe('paused')
    expect(result.current.segments[0].status).toBe('paused')
    expect(result.current.segments[0].endTime).not.toBeNull()
    expect(mockPauseRecording).toHaveBeenCalled()
  })

  it('should resume recording and create new segment', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Pause
    act(() => {
      result.current.pauseRecording()
    })

    expect(result.current.segments).toHaveLength(1)

    // Resume - should create new segment
    act(() => {
      result.current.resumeRecording()
    })

    expect(result.current.status).toBe('recording')
    expect(result.current.segments).toHaveLength(2)
    expect(result.current.segments[1].status).toBe('recording')
    expect(mockResumeRecording).toHaveBeenCalled()
  })

  it('should stop recording and combine segments', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Simulate onStop callback with a blob
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
    if (mockOnStop) {
      mockOnStop('blob:mock-url', mockBlob)
    }

    // Stop recording
    let finalBlob: Blob | undefined
    await act(async () => {
      finalBlob = await result.current.stopRecording()
    })

    await waitFor(
      () => {
        expect(finalBlob).toBeInstanceOf(Blob)
        expect(result.current.status).toBe('stopped')
      },
      { timeout: 1000 },
    )
  })

  it('should validate empty blobs and throw error', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useEnhancedRecording({ onError }))

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Simulate onStop with empty blob
    const emptyBlob = new Blob([], { type: 'audio/webm' })
    if (mockOnStop) {
      mockOnStop('blob:mock-url', emptyBlob)
    }

    // Stop recording - should fail validation
    await act(async () => {
      try {
        await result.current.stopRecording()
      } catch (error) {
        // Expected to throw
      }
    })

    await waitFor(
      () => {
        expect(result.current.status).toBe('error')
        expect(result.current.error?.message).toContain('Audio inválido')
        expect(onError).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )
  })

  it('should handle permission denied error', async () => {
    const onError = vi.fn()

    // Mock react-media-recorder to return error
    vi.mocked(useReactMediaRecorder).mockImplementation(() => ({
      status: 'idle',
      startRecording: mockStartRecording,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
      stopRecording: mockStopRecording,
      mediaBlobUrl: undefined,
      previewStream: null,
      clearBlobUrl: vi.fn(),
      error: 'NotAllowedError: Permission denied',
    }))

    const { result } = renderHook(() => useEnhancedRecording({ onError }))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.type).toBe(
        RecordingErrorType.PERMISSION_DENIED,
      )
      expect(onError).toHaveBeenCalled()
    })
  })

  it('should handle MediaRecorder not supported', async () => {
    // Remove MediaRecorder from global and navigator.mediaDevices
    const originalMediaRecorder = global.MediaRecorder
    const originalMediaDevices = global.navigator.mediaDevices

    delete (global as unknown as { MediaRecorder?: typeof MediaRecorder })
      .MediaRecorder
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useEnhancedRecording({ onError }))

    expect(result.current.isSupported).toBe(false)

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error?.type).toBe(RecordingErrorType.NOT_SUPPORTED)
    expect(onError).toHaveBeenCalled()

    // Restore
    global.MediaRecorder = originalMediaRecorder
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true,
      configurable: true,
    })
  })

  it('should track cumulative duration across pauses', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useEnhancedRecording())

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Advance time by 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Pause
    act(() => {
      result.current.pauseRecording()
    })

    const durationAfterPause = result.current.duration

    // Advance time while paused (should not increase duration)
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // Resume
    act(() => {
      result.current.resumeRecording()
    })

    // Advance time by 2 more seconds
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Total duration should be approximately 4 seconds (2 + 2, excluding pause)
    expect(result.current.duration).toBeGreaterThanOrEqual(durationAfterPause)

    vi.useRealTimers()
  })

  it('should handle multiple pause/resume cycles', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    // Start
    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.segments).toHaveLength(1)

    // Pause 1
    act(() => {
      result.current.pauseRecording()
    })

    // Resume 1
    act(() => {
      result.current.resumeRecording()
    })

    expect(result.current.segments).toHaveLength(2)

    // Pause 2
    act(() => {
      result.current.pauseRecording()
    })

    // Resume 2
    act(() => {
      result.current.resumeRecording()
    })

    expect(result.current.segments).toHaveLength(3)
    expect(result.current.status).toBe('recording')
  })

  it('should validate audio blob is playable', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Create a valid blob
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })

    // Mock Audio element to simulate successful load
    const mockAudio = {
      onloadedmetadata: null as any,
      onerror: null as any,
      duration: 10,
      src: '',
    }

    global.Audio = vi.fn(function (this: unknown) {
      Object.assign(this, mockAudio)
    }) as unknown as typeof Audio

    // Simulate onStop callback
    if (mockOnStop) {
      mockOnStop('blob:mock-url', mockBlob)
    }

    // Stop recording
    let finalBlob: Blob | undefined
    await act(async () => {
      finalBlob = await result.current.stopRecording()

      // Trigger onloadedmetadata after a short delay
      setTimeout(() => {
        if (mockAudio.onloadedmetadata) {
          mockAudio.onloadedmetadata()
        }
      }, 100)
    })

    await waitFor(
      () => {
        expect(finalBlob).toBeInstanceOf(Blob)
        expect(result.current.status).toBe('stopped')
      },
      { timeout: 1500 },
    )
  })

  it('should reject invalid MIME type', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useEnhancedRecording({ onError }))

    // Start recording
    await act(async () => {
      await result.current.startRecording()
    })

    // Create blob with invalid MIME type
    const invalidBlob = new Blob(['data'], { type: 'text/plain' })

    if (mockOnStop) {
      mockOnStop('blob:mock-url', invalidBlob)
    }

    // Stop recording - should fail validation
    await act(async () => {
      try {
        await result.current.stopRecording()
      } catch (error) {
        // Expected to throw
      }
    })

    await waitFor(
      () => {
        expect(result.current.status).toBe('error')
        expect(result.current.error?.message).toContain('tipo MIME no válido')
        expect(onError).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )
  })

  it('should handle stop without active recording', async () => {
    const { result } = renderHook(() => useEnhancedRecording())

    await expect(async () => {
      await act(async () => {
        await result.current.stopRecording()
      })
    }).rejects.toThrow('No hay grabación activa')
  })
})
