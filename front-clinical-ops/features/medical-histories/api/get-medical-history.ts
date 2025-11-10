import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
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

type MedicalHistoryQueryKey = ['medical-history', string];

type MedicalHistoryQueryOptions = UseQueryOptions<
  SingleHistoryResponse,
  Error,
  SingleHistoryResponse,
  MedicalHistoryQueryKey
>;

export const getMedicalHistoryQueryOptions = (historyID: string) => {
  return queryOptions({
    queryKey: ['medical-history', historyID] as MedicalHistoryQueryKey,
    queryFn: () => getMedicalHistory(historyID),
    enabled: !!historyID,
  });
};

export const useMedicalHistory = (
  historyID: string,
  queryConfig?: Omit<MedicalHistoryQueryOptions, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...getMedicalHistoryQueryOptions(historyID),
    ...queryConfig,
  });
};
