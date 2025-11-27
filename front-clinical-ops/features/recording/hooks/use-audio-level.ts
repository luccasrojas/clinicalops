import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that analyzes audio levels from a MediaStream in real-time
 * @param mediaStream - The MediaStream to analyze (typically from microphone)
 * @param isActive - Whether audio analysis should be active
 * @returns Normalized audio level between 0 and 1
 */
export function useAudioLevel(
  mediaStream: MediaStream | null,
  isActive: boolean,
): number {
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    // Feature detection for Web Audio API
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser')
      return
    }

    // Only proceed if we have a stream and should be active
    if (!mediaStream || !isActive) {
      return
    }

    try {
      // Create AudioContext and AnalyserNode
      const audioContext = new AudioContextClass()
      const analyser = audioContext.createAnalyser()

      // Configure analyser for optimal performance
      analyser.fftSize = 256 // Smaller FFT for better performance
      analyser.smoothingTimeConstant = 0.8 // Smooth out rapid changes

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Connect MediaStream to analyser
      const source = audioContext.createMediaStreamSource(mediaStream)
      source.connect(analyser)

      // Store references
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      // Function to calculate RMS (root mean square) of audio samples
      const calculateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) {
          return
        }

        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        // Calculate RMS
        let sum = 0
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const normalized = dataArrayRef.current[i] / 255 // Normalize to 0-1
          sum += normalized * normalized
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length)

        // Update state with normalized level
        setAudioLevel(rms)

        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(calculateAudioLevel)
      }

      // Start the animation loop
      calculateAudioLevel()
    } catch (error) {
      console.error('Error setting up audio analysis:', error)
    }

    // Cleanup function
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((error) => {
          console.error('Error closing AudioContext:', error)
        })
        audioContextRef.current = null
      }

      // Clear references
      analyserRef.current = null
      dataArrayRef.current = null

      // Reset audio level
      setAudioLevel(0)
    }
  }, [mediaStream, isActive])

  // Return 0 when not active or no stream available
  return mediaStream && isActive ? audioLevel : 0
}
