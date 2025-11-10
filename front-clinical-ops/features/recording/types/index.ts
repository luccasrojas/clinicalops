export type PresignedUrlRequest = {
  doctorID: string;
  fileName: string;
  contentType: string;
};

export type PresignedUrlResponse = {
  uploadURL: string;
  fileKey: string;
  expiresIn: number;
  bucketName: string;
};

export type CreateHistoryFromRecordingRequest = {
  doctorID: string;
  recordingURL: string;
  patientID?: string;
};

export type MedicalHistoryStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type CreateHistoryFromRecordingResponse = {
  history: {
    historyID: string;
    doctorID: string;
    patientID?: string;
    recordingURL: string;
    status: MedicalHistoryStatus;
    jsonData?: Record<string, unknown>;
    metaData?: Record<string, unknown>;
    transcription?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
};

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'uploading' | 'processing' | 'completed' | 'error';

export type RecordingState = {
  status: RecordingStatus;
  duration: number;
  blob: Blob | null;
  error: string | null;
};
