'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeneratePresignedUrl } from '../api/generate-presigned-url';
import { useCreateHistoryFromRecording } from '../api/create-history-from-recording';
import { useHistoryStatus } from '../api/get-history-status';
import axios from 'axios';

type RecordingInterfaceProps = {
  doctorID: string;
  onComplete?: (historyID: string) => void;
  onError?: (error: string) => void;
};

export function RecordingInterface({
  doctorID,
  onComplete,
  onError,
}: RecordingInterfaceProps) {
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingHistoryID, setProcessingHistoryID] = useState<string | null>(null);

  const generatePresignedUrl = useGeneratePresignedUrl();
  const createHistory = useCreateHistoryFromRecording();
  const historyStatus = useHistoryStatus(processingHistoryID || '');

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      console.log('Recording stopped', { blobUrl, blob });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'recording') {
      interval = setInterval(() => {
        setDuration((prev) => {
          const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds + 1;
          return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Monitor processing status
  useEffect(() => {
    if (!historyStatus.data?.history) return;

    const history = historyStatus.data.history;

    if (history.status === 'completed' && onComplete) {
      setProcessingHistoryID(null);
      clearBlobUrl();
      setDuration({ hours: 0, minutes: 0, seconds: 0 });
      onComplete(history.historyID);
    } else if (history.status === 'failed' && onError) {
      setProcessingHistoryID(null);
      onError(history.errorMessage || 'Error al procesar la grabación');
    }
  }, [historyStatus.data, onComplete, onError, clearBlobUrl]);

  const handleStop = () => {
    stopRecording();
  };

  const handleUploadAndProcess = async () => {
    if (!mediaBlobUrl) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Fetch the blob from the URL
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording_${timestamp}.webm`;

      // Get pre-signed URL
      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: blob.type || 'audio/webm',
      });

      // Upload to S3 using pre-signed URL
      await axios.put(presignedData.uploadURL, blob, {
        headers: {
          'Content-Type': blob.type || 'audio/webm',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      setIsUploading(false);

      // Construct the recording URL
      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`;

      // Create medical history from recording (returns immediately with pending status)
      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      });

      // Start polling for status updates
      setProcessingHistoryID(result.history.historyID);
    } catch (error: any) {
      setIsUploading(false);
      const errorMessage = error.message || 'Error al procesar la grabación';
      if (onError) {
        onError(errorMessage);
      }
      console.error('Upload/Process error:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `upload_${timestamp}_${file.name}`;

      // Get pre-signed URL
      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: file.type,
      });

      // Upload to S3
      await axios.put(presignedData.uploadURL, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      setIsUploading(false);

      // Construct the recording URL
      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`;

      // Create medical history from recording (returns immediately with pending status)
      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      });

      // Start polling for status updates
      setProcessingHistoryID(result.history.historyID);
    } catch (error: any) {
      setIsUploading(false);
      const errorMessage = error.message || 'Error al subir el archivo';
      if (onError) {
        onError(errorMessage);
      }
      console.error('File upload error:', error);
    }
  };

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped' && mediaBlobUrl;
  const isProcessing = !!processingHistoryID;
  const processingStatus = historyStatus.data?.history?.status;

  const getStatusMessage = () => {
    if (isUploading) {
      return 'Subiendo grabación...';
    }
    if (isProcessing) {
      if (processingStatus === 'pending') {
        return 'Preparando procesamiento...';
      }
      if (processingStatus === 'processing') {
        return 'La IA está analizando la información para generar el documento. Este proceso puede tardar varios minutos.';
      }
    }
    if (isStopped) {
      return 'Grabación lista. Presione "Transcribir" para procesar.';
    }
    return 'Presione "Grabar" para iniciar o "Subir archivo" para cargar una grabación existente.';
  };

  return (
    <div className="flex min-h-[760px] w-full max-w-2xl flex-col px-8 py-16 text-center">
      <header className="flex w-full flex-col items-center gap-6">
        <h2 className="text-3xl font-semibold">Grabando Nueva Historia Clínica</h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {getStatusMessage()}
        </p>
      </header>

      <section className="flex flex-1 items-center justify-center">
        <div className="relative flex flex-col items-center gap-16">
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-500/20"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '200px',
                  height: '200px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-500/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
                style={{
                  width: '200px',
                  height: '200px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </>
          )}

          <motion.div
            className={`flex h-40 w-40 items-center justify-center rounded-full ${
              isRecording
                ? 'bg-teal-500'
                : isPaused
                ? 'bg-yellow-500'
                : 'bg-gray-200'
            }`}
            animate={
              isRecording
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(20, 184, 166, 0.4)',
                      '0 0 0 20px rgba(20, 184, 166, 0)',
                    ],
                  }
                : {}
            }
            transition={
              isRecording
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }
                : {}
            }
          >
            <Mic className="h-16 w-16 text-white" />
          </motion.div>

          <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-12 text-5xl font-mono">
              <span className="w-24 text-center">{String(duration.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="w-24 text-center">{String(duration.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="w-24 text-center">{String(duration.seconds).padStart(2, '0')}</span>
            </div>

            <div className="flex items-center justify-center gap-16 text-sm uppercase tracking-[0.3em] text-muted-foreground">
              <span>Horas</span>
              <span>Minutos</span>
              <span>Segundos</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-20 flex w-full flex-col items-center gap-12">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {!isRecording && !isPaused && !isStopped && (
            <Button
              onClick={startRecording}
              size="lg"
              className="bg-teal-500 hover:bg-teal-600"
              disabled={isUploading || isProcessing}
            >
              <Mic className="mr-2 h-5 w-5" />
              Iniciar Grabación
            </Button>
          )}

          {(isRecording || isPaused) && (
            <>
              {isRecording && (
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  <Square className="mr-2 h-5 w-5" />
                  Pausar
                </Button>
              )}

              {isPaused && (
                <Button
                  onClick={resumeRecording}
                  size="lg"
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Reanudar
                </Button>
              )}

              <Button onClick={handleStop} variant="destructive" size="lg">
                <Square className="mr-2 h-5 w-5" />
                Detener
              </Button>
            </>
          )}

          {isStopped && !isUploading && !isProcessing && (
            <>
              <Button onClick={() => clearBlobUrl()} variant="outline" size="lg">
                Volver a Grabar
              </Button>
              <Button
                onClick={handleUploadAndProcess}
                size="lg"
                className="bg-teal-500 hover:bg-teal-600"
              >
                Transcribir a Historia Clínica
              </Button>
            </>
          )}
        </div>

        {isUploading && (
          <div className="w-full max-w-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subiendo archivo...</span>
              <span className="text-sm font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <motion.div
                className="h-2 rounded-full bg-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 text-base">
              {processingStatus === 'completed' ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : processingStatus === 'failed' ? (
                <XCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              )}
              <span className="text-sm font-medium">
                {processingStatus === 'pending' && 'Iniciando procesamiento...'}
                {processingStatus === 'processing' && 'Procesando Historia Clínica...'}
                {processingStatus === 'completed' && '¡Completado!'}
                {processingStatus === 'failed' && 'Error en el procesamiento'}
              </span>
            </div>
            {(processingStatus === 'pending' || processingStatus === 'processing') && (
              <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                {processingStatus === 'pending'
                  ? 'Preparando el audio para transcripción...'
                  : 'Transcribiendo audio y generando nota clínica con IA. Esto puede tomar 2-3 minutos.'}
              </p>
            )}
          </div>
        )}

        {!isRecording && !isPaused && !isStopped && !isUploading && !isProcessing && (
          <div className="mt-14 border-t pt-8">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">O subir archivo de audio desde el PC</span>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </footer>
    </div>
  );
}
