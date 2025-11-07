import { queryOptions, useQuery } from '@tanstack/react-query';
import { invokeLambdaApi } from '@/lib/lambda-api';
import type { MedicalRecordResponse } from '../types/api';

export const getMedicalRecord = (historyID: string) => {
  return invokeLambdaApi<MedicalRecordResponse>({
    functionName: 'get_medical_record',
    payload: {
      pathParameters: {
        historyID,
      },
    },
  });
};

export const getMedicalRecordQueryOptions = (historyID: string) =>
  queryOptions({
    queryKey: ['medical-record', historyID],
    enabled: !!historyID,
    queryFn: () => getMedicalRecord(historyID),
    staleTime: 1000 * 10,
  });

export const useMedicalRecord = (historyID: string) => {
  return useQuery(getMedicalRecordQueryOptions(historyID));
};
