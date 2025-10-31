import { webApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateHistoryFromRecordingRequest,
  CreateHistoryFromRecordingResponse,
} from '../types';

export const createHistoryFromRecording = (
  data: CreateHistoryFromRecordingRequest
): Promise<CreateHistoryFromRecordingResponse> => {
  return webApi.post('/medical-histories', data);
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
