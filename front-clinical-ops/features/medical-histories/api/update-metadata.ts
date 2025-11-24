import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateMetadataRequest, UpdateMedicalHistoryResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const updateMetadata = async (
  data: UpdateMetadataRequest
): Promise<UpdateMedicalHistoryResponse> => {
  // Get the current history to preserve jsonData
  const currentHistory = await invokeLambdaApi<{ history: { jsonData: Record<string, unknown> } }>({
    functionName: 'get_medical_history',
    payload: {
      queryStringParameters: {
        historyID: data.historyID,
      },
    },
  });

  // Update with current jsonData and new metaData
  return invokeLambdaApi<UpdateMedicalHistoryResponse>({
    functionName: 'update_medical_history',
    payload: {
      historyID: data.historyID,
      jsonData: currentHistory.history.jsonData,
      metaData: data.metaData,
    },
  });
};

export const useUpdateMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMetadata,
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
