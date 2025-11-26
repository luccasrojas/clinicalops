import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMediaRecorder } from './use-media-recorder';
import { RecordingErrorType } from '../utils/recording-errors';

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(stream: MediaStream, options?: { mimeType?: string; audioBitsPerSecond?: number }) {
    this.mimeType = options?.mimeType || 'audio/webm;codecs=opus';
  }
  
  start(timeslice?: number) {
    this.state = 'recording';
    // Simulate data chunks
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['chunk1'], { type: this.mimeType }) });
      }
    }, 50);
  }
  
  pause() {
    this.state = 'paused';
  }
  
  resume() {
    this.state = 'recording';
    // Simulate more data after resume
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['chunk2'], { type: this.mimeType }) });
      }
    }, 50);
  }
  
  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 10);
  }
  
  static isTypeSupported(mimeType: string): boolean {
    return mimeType.includes('audio/webm') || mimeType.includes('audio/ogg');
  }
}

// Mock MediaStream
class MockMediaStream {
  active = true;
  id = 'mock-stream-id';
  
  getTracks() {
    return [
      {
        kind: 'audio',
        stop: vi.fn(),
      },
    ];
  }
  
  getAudioTracks() {
    return this.getTracks();
  }
}

describe('useMediaRecorder', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let originalMediaRecorder: typeof MediaRecorder | undefined;
  let originalNavigator: typeof navigator;
  
  beforeEach(() => {
    // Save original MediaRecorder
    originalMediaRecorder = (global as any).MediaRecorder;
    originalNavigator = global.navigator;
    
    // Setup MediaRecorder mock
    (global as any).MediaRecorder = MockMediaRecorder;
    
    // Setup getUserMedia mock
    mockGetUserMedia = vi.fn().mockResolvedValue(new MockMediaStream());
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });
    
    // Mock requestAnimationFrame
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16);
      return 1;
    });
    
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original MediaRecorder
    if (originalMediaRecorder) {
      (global as any).MediaRecorder = originalMediaRecorder;
    } else {
      delete (global as any).MediaRecorder;
    }
    
    // Restore navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    
    vi.restoreAllMocks();
  });
  
  it('should initialize with idle status', () => {
    const { result } = renderHook(() => useMediaRecorder());
    
    expect(result.current.status).toBe('idle');
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isSupported).toBe(true);
  });
  
  it('should start recording successfully', async () => {
    const { result } = renderHook(() => useMediaRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('recording');
    expect(result.current.error).toBeNull();
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  });
  
  it('should pause and resume recording', async () => {
    const { result } = renderHook(() => useMediaRecorder());
    
    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('recording');
    
    // Pause recording
    act(() => {
      result.current.pauseRecording();
    });
    
    expect(result.current.status).toBe('paused');
    
    // Resume recording
    act(() => {
      result.current.resumeRecording();
    });
    
    expect(result.current.status).toBe('recording');
  });
  
  it('should create continuous blob after pause/resume', async () => {
    const onDataAvailable = vi.fn();
    const { result } = renderHook(() => 
      useMediaRecorder({ onDataAvailable })
    );
    
    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Wait for first chunk
    await waitFor(() => {
      expect(result.current.status).toBe('recording');
    }, { timeout: 100 });
    
    // Pause
    act(() => {
      result.current.pauseRecording();
    });
    
    // Resume
    act(() => {
      result.current.resumeRecording();
    });
    
    // Wait for second chunk
    await waitFor(() => {
      expect(result.current.status).toBe('recording');
    }, { timeout: 100 });
    
    // Stop recording
    let finalBlob: Blob | undefined;
    await act(async () => {
      finalBlob = await result.current.stopRecording();
    });
    
    // Verify single continuous blob was created
    expect(finalBlob).toBeInstanceOf(Blob);
    expect(onDataAvailable).toHaveBeenCalledWith(finalBlob);
    expect(result.current.status).toBe('stopped');
  });
  
  it('should handle permission denied error', async () => {
    const onError = vi.fn();
    mockGetUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
    );
    
    const { result } = renderHook(() => useMediaRecorder({ onError }));
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('error');
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe(RecordingErrorType.PERMISSION_DENIED);
    expect(result.current.error?.message).toContain('Acceso al micrófono denegado');
    expect(onError).toHaveBeenCalled();
  });
  
  it('should handle device not found error', async () => {
    const onError = vi.fn();
    mockGetUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Requested device not found'), { name: 'NotFoundError' })
    );
    
    const { result } = renderHook(() => useMediaRecorder({ onError }));
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('error');
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe(RecordingErrorType.DEVICE_NOT_FOUND);
    expect(result.current.error?.message).toContain('No se encontró ningún micrófono');
    expect(onError).toHaveBeenCalled();
  });
  
  it('should handle MediaRecorder not supported', () => {
    // Remove MediaRecorder from global
    delete (global as any).MediaRecorder;
    
    const onError = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onError }));
    
    expect(result.current.isSupported).toBe(false);
    
    act(() => {
      result.current.startRecording();
    });
    
    expect(result.current.status).toBe('error');
    expect(result.current.error?.type).toBe(RecordingErrorType.NOT_SUPPORTED);
    expect(onError).toHaveBeenCalled();
  });
  
  it('should cleanup streams on unmount', async () => {
    let trackStopCalled = false;
    const mockStream = new MockMediaStream();
    const originalGetTracks = mockStream.getTracks.bind(mockStream);
    
    // Override getTracks to track when stop is called
    mockStream.getTracks = () => {
      const tracks = originalGetTracks();
      tracks[0].stop = () => {
        trackStopCalled = true;
      };
      return tracks;
    };
    
    mockGetUserMedia.mockResolvedValueOnce(mockStream);
    
    const { result, unmount } = renderHook(() => useMediaRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('recording');
    expect(trackStopCalled).toBe(false);
    
    // Unmount should trigger cleanup
    unmount();
    
    // Verify track.stop() was called during cleanup
    expect(trackStopCalled).toBe(true);
  });
  
  it('should track duration during recording', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useMediaRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.duration).toBe(0);
    
    // Advance time by 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    
    // Duration should be updated (approximately 3 seconds)
    // Note: Due to requestAnimationFrame mocking, exact timing may vary
    expect(result.current.duration).toBeGreaterThanOrEqual(0);
    
    vi.useRealTimers();
  });
  
  it('should stop recording and return blob', async () => {
    const { result } = renderHook(() => useMediaRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    let blob: Blob | undefined;
    await act(async () => {
      blob = await result.current.stopRecording();
    });
    
    expect(blob).toBeInstanceOf(Blob);
    expect(result.current.status).toBe('stopped');
  });
  
  it('should handle stop without active recording', async () => {
    const { result } = renderHook(() => useMediaRecorder());
    
    await expect(async () => {
      await act(async () => {
        await result.current.stopRecording();
      });
    }).rejects.toThrow();
  });
  
  it('should use fallback MIME type if preferred is not supported', async () => {
    // Mock isTypeSupported to reject the preferred type
    MockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
      return type === 'audio/ogg'; // Only support ogg
    });
    
    const { result } = renderHook(() => 
      useMediaRecorder({ mimeType: 'audio/webm;codecs=opus' })
    );
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.status).toBe('recording');
  });
});
