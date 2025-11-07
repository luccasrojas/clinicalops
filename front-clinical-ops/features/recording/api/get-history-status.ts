import { queryOptions, useQuery } from '@tanstack/react-query';
import type { CreateHistoryFromRecordingResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const getHistoryStatus = (
  historyID: string
): Promise<CreateHistoryFromRecordingResponse> => {
  return invokeLambdaApi<CreateHistoryFromRecordingResponse>({
    functionName: 'get_medical_history',
    payload: {
      pathParameters: { historyID },
    },
  });
};

export const getHistoryStatusQueryOptions = (historyID: string) => {
  return queryOptions({
    queryKey: ['medical-history', historyID],
    queryFn: () => getHistoryStatus(historyID),
    enabled: !!historyID,
    refetchInterval: (query) => {
      // Refetch every 3 seconds if status is pending or processing
      const data = query.state.data;
      if (data?.history?.status === 'pending' || data?.history?.status === 'processing') {
        return 3000;
      }
      return false;
    },
  });
};

export const useHistoryStatus = (historyID: string) => {
  return useQuery(getHistoryStatusQueryOptions(historyID));
};
