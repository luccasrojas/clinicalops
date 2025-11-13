import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeLambdaApi } from '@/lib/lambda-api';
import type {
  RestoreVersionPayload,
  RestoreVersionResponse,
} from '../types/api';

export const restoreVersion = (data: RestoreVersionPayload) => {
  return invokeLambdaApi<RestoreVersionResponse>({
    functionName: 'restore_version',
    payload: data,
  });
};

export const useRestoreVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreVersion,
    onSuccess: (data) => {
      if (data.historyID) {
        queryClient.invalidateQueries({ queryKey: ['medical-record', data.historyID] });
        queryClient.invalidateQueries({ queryKey: ['medical-record-versions', data.historyID] });
      }
    },
  });
};
