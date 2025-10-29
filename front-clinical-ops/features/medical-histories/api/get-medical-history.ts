import { webApi } from '@/lib/api-client';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { SingleHistoryResponse } from '../types';

export const getMedicalHistory = (
  historyID: string
): Promise<SingleHistoryResponse> => {
  return webApi.get(`/medical-histories/${historyID}`);
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
