import { api } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

type CreateHistoryFromRecordingRequest = {
  doctorID: string;
  recordingURL: string;
  patientID?: string;
};

type HistoryStatus = 'pending' | 'processing' | 'completed' | 'failed';

type MedicalHistory = {
  historyID: string;
  doctorID: string;
  recordingURL: string;
  status: HistoryStatus;
  createdAt: string;
  updatedAt: string;
  patientID?: string;
  errorMessage?: string;
};

type CreateHistoryFromRecordingResponse = {
  history: MedicalHistory;
  message: string;
};

export const createHistoryFromRecording = (
  data: CreateHistoryFromRecordingRequest
): Promise<CreateHistoryFromRecordingResponse> => {
  return api.post('/create-medical-history-from-recording', data);
};

export const useCreateHistoryFromRecording = () => {
  return useMutation({
    mutationFn: createHistoryFromRecording,
  });
};
