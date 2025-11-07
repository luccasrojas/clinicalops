import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateHistoryFromRecordingRequest,
  CreateHistoryFromRecordingResponse,
} from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const createHistoryFromRecording = (
  data: CreateHistoryFromRecordingRequest
): Promise<CreateHistoryFromRecordingResponse> => {
  return invokeLambdaApi<CreateHistoryFromRecordingResponse>({
    functionName: 'create_medical_history_from_recording',
    payload: {
      body: JSON.stringify(data),
    },
  });
};

export const useCreateHistoryFromRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHistoryFromRecording,
    onSuccess: () => {
      // Invalidate medical histories list to refetch
      queryClient.invalidateQueries({ queryKey: ['medical-histories'] });
    },
  });
};
