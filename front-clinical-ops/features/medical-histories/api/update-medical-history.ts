import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateMedicalHistoryRequest,
  UpdateMedicalHistoryResponse,
} from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const updateMedicalHistory = (
  data: UpdateMedicalHistoryRequest
): Promise<UpdateMedicalHistoryResponse> => {
  return invokeLambdaApi<UpdateMedicalHistoryResponse>({
    functionName: 'update_medical_history',
    payload: {
      body: JSON.stringify(data),
    },
  });
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
