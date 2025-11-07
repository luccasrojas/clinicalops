import { queryOptions, useQuery } from '@tanstack/react-query';
import { invokeLambdaApi } from '@/lib/lambda-api';
import type { VersionHistoryResponse } from '../types/api';

export const getVersionHistory = (historyID: string, limit = 20) => {
  return invokeLambdaApi<VersionHistoryResponse>({
    functionName: 'get_version_history',
    payload: {
      pathParameters: {
        historyID,
      },
      queryStringParameters: {
        limit,
      },
    },
  });
};

export const getVersionHistoryQueryOptions = (historyID: string, limit = 20) =>
  queryOptions({
    queryKey: ['medical-record-versions', historyID, limit],
    enabled: !!historyID,
    queryFn: () => getVersionHistory(historyID, limit),
  });

export const useVersionHistory = (historyID: string, limit = 20, enabled = true) => {
  return useQuery({
    ...getVersionHistoryQueryOptions(historyID, limit),
    enabled: enabled && !!historyID,
  });
};
