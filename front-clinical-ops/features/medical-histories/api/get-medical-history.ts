import { queryOptions, useQuery } from '@tanstack/react-query';
import type { SingleHistoryResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const getMedicalHistory = (
  historyID: string
): Promise<SingleHistoryResponse> => {
  return invokeLambdaApi<SingleHistoryResponse>({
    functionName: 'get_medical_history',
    payload: {
      pathParameters: { historyID },
    },
  });
};

export const getMedicalHistoryQueryOptions = (historyID: string) => {
  return queryOptions({
    queryKey: ['medical-history', historyID],
    queryFn: () => getMedicalHistory(historyID),
    enabled: !!historyID,
  });
};

export const useMedicalHistory = (historyID: string, queryConfig?: any) => {
  return useQuery({
    ...getMedicalHistoryQueryOptions(historyID),
    ...queryConfig,
  });
};
