'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Upload, Loader2, CheckCircle, XCircle, Pause } from 'lucide-react';
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

      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording_${timestamp}.webm`;

      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: blob.type || 'audio/webm',
      });

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

      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`;

      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      });

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

      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: file.type,
      });

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

      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`;

      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      });

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
      return 'Subiendo grabación a la nube...';
    }
    if (isProcessing) {
      if (processingStatus === 'pending') {
        return 'Preparando procesamiento...';
      }
      if (processingStatus === 'processing') {
        return 'La IA está analizando y estructurando la información clínica';
      }
    }
    if (isStopped) {
      return 'Grabación lista para procesar';
    }
    if (isRecording) {
      return 'Grabando consulta médica...';
    }
    if (isPaused) {
      return 'Grabación en pausa';
    }
    return 'Inicia una nueva grabación o sube un archivo de audio';
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl px-6"
      >
        <div className="flex flex-col items-center space-y-10">
          {/* Header with gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center space-y-3"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Nueva Historia Clínica
            </h1>
            <motion.p
              key={getStatusMessage()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base text-muted-foreground max-w-2xl"
            >
              {getStatusMessage()}
            </motion.p>
          </motion.div>

          {/* Main recording interface */}
          <div className="relative flex flex-col items-center">
            {/* Animated background effects */}
            <AnimatePresence>
              {isRecording && (
                <>
                  {/* Outer pulse ring */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{
                      width: '280px',
                      height: '280px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(20px)',
                    }}
                  />
                  {/* Middle pulse ring */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 0.4,
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                    style={{
                      width: '250px',
                      height: '250px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(15px)',
                    }}
                  />
                  {/* Inner glow */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.3, 1],
                    }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 rounded-full bg-teal-400"
                    style={{
                      width: '200px',
                      height: '200px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(30px)',
                      opacity: 0.5,
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Microphone button */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative z-10"
            >
              <motion.div
                className={`w-44 h-44 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden ${
                  isRecording
                    ? 'bg-gradient-to-br from-teal-500 via-teal-400 to-emerald-500'
                    : isPaused
                    ? 'bg-gradient-to-br from-amber-500 via-orange-400 to-amber-600'
                    : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800'
                }`}
                animate={
                  isRecording
                    ? {
                        boxShadow: [
                          '0 0 0 0 rgba(20, 184, 166, 0.7)',
                          '0 0 0 30px rgba(20, 184, 166, 0)',
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
                {/* Animated gradient overlay */}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
                <Mic
                  className={`w-20 h-20 relative z-10 ${
                    isRecording || isPaused ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                  }`}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Timer Display */}
          <AnimatePresence>
            {(isRecording || isPaused || isStopped) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="flex items-center space-x-4 bg-gradient-to-r from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                  <motion.div
                    className="text-5xl font-mono font-bold tabular-nums tracking-wider"
                    animate={isRecording ? { color: ['#14b8a6', '#10b981', '#14b8a6'] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="inline-block w-16 text-center">
                      {String(duration.hours).padStart(2, '0')}
                    </span>
                    <span className="text-teal-500">:</span>
                    <span className="inline-block w-16 text-center">
                      {String(duration.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-teal-500">:</span>
                    <span className="inline-block w-16 text-center">
                      {String(duration.seconds).padStart(2, '0')}
                    </span>
                  </motion.div>
                </div>
                <div className="flex items-center justify-center space-x-6 text-xs font-medium text-muted-foreground">
                  <span>Horas</span>
                  <span>Minutos</span>
                  <span>Segundos</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <AnimatePresence mode="wait">
              {!isRecording && !isPaused && !isStopped && !isUploading && !isProcessing && (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Iniciar Grabación
                  </Button>
                </motion.div>
              )}

              {(isRecording || isPaused) && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3"
                >
                  {isRecording && (
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                      className="border-2 hover:bg-amber-50 dark:hover:bg-amber-950 px-6 py-6"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </Button>
                  )}

                  {isPaused && (
                    <Button
                      onClick={resumeRecording}
                      size="lg"
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-6 py-6"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Reanudar
                    </Button>
                  )}

                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    size="lg"
                    className="shadow-lg px-6 py-6"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Detener
                  </Button>
                </motion.div>
              )}

              {isStopped && !isUploading && !isProcessing && (
                <motion.div
                  key="stopped"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3"
                >
                  <Button
                    onClick={() => {
                      clearBlobUrl();
                      setDuration({ hours: 0, minutes: 0, seconds: 0 });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 px-6 py-6"
                  >
                    Volver a Grabar
                  </Button>
                  <Button
                    onClick={handleUploadAndProcess}
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all px-8 py-6"
                  >
                    Transcribir a Historia Clínica
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-md"
              >
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subiendo archivo...</span>
                    <span className="text-2xl font-bold text-teal-600">{uploadProgress}%</span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-2xl space-y-6 max-w-lg backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="flex items-center space-x-4">
                  {processingStatus === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </motion.div>
                  ) : processingStatus === 'failed' ? (
                    <XCircle className="w-12 h-12 text-red-500" />
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-12 h-12 text-teal-500" />
                    </motion.div>
                  )}
                  <div className="flex-1">
                    <motion.p
                      key={processingStatus}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-lg font-semibold"
                    >
                      {processingStatus === 'pending' && 'Iniciando procesamiento...'}
                      {processingStatus === 'processing' && 'Procesando con IA...'}
                      {processingStatus === 'completed' && '¡Completado exitosamente!'}
                      {processingStatus === 'failed' && 'Error en el procesamiento'}
                    </motion.p>
                    {(processingStatus === 'pending' || processingStatus === 'processing') && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground mt-2"
                      >
                        {processingStatus === 'pending'
                          ? 'Preparando el audio para transcripción...'
                          : 'Transcribiendo audio y estructurando la nota clínica. Esto puede tomar 2-3 minutos.'}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Processing steps animation */}
                {processingStatus === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    {['Transcribiendo audio médico', 'Estructurando información', 'Generando nota clínica'].map(
                      (step, index) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="flex items-center space-x-3 text-sm"
                        >
                          <motion.div
                            className="w-2 h-2 rounded-full bg-teal-500"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
                          />
                          <span className="text-muted-foreground">{step}</span>
                        </motion.div>
                      )
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Upload Option */}
          {!isRecording && !isPaused && !isStopped && !isUploading && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex items-center justify-center space-x-3 px-6 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition-all duration-300 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              >
                <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  O subir archivo de audio desde el PC
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
