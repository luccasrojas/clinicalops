import { webApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateMedicalHistoryRequest,
  UpdateMedicalHistoryResponse,
} from '../types';

export const updateMedicalHistory = (
  data: UpdateMedicalHistoryRequest
): Promise<UpdateMedicalHistoryResponse> => {
  return webApi.put('/medical-histories', data);
};

export const useUpdateMedicalHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMedicalHistory,
    onSuccess: (data) => {
      // Invalidate and refetch medical histories list
      queryClient.invalidateQueries({ queryKey: ['medical-histories'] });
      // Update the specific history cache
      queryClient.setQueryData(
        ['medical-history', data.history.historyID],
        { history: data.history }
      );
    },
  });
};
